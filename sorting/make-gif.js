// Usage: node sorting/make-gif.js bubble-sort  →  sorting/bubble-sort.gif
// The algorithm file must export a function that sorts the given array in place
// (except merge-sort, whose steps are replayed here instead of recorded).
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

const name = process.argv[2];
if (!name) {
    console.error('Usage: node sorting/make-gif.js <algorithm>');
    process.exit(1);
}
const sort = require(`./${name}.js`);

// Algorithms that hold one value aside and shift others into the gap, instead of swapping.
const SHIFT_BASED = ['insertion-sort'];
const IS_MERGE = name === 'merge-sort';

const input = [5, 1, 4, 2, 8, 3];

// --- Record every read/write the algorithm makes on the array ---
const data = [...input];
const ops = [];
const isIndex = (key) => typeof key === 'string' && /^\d+$/.test(key);

const tracked = new Proxy(data, {
    get(target, key) {
        if (isIndex(key)) ops.push({ op: 'get', i: Number(key), v: target[key] });
        return target[key];
    },
    set(target, key, value) {
        if (isIndex(key)) ops.push({ op: 'set', i: Number(key), v: value });
        target[key] = value;
        return true;
    },
});

sort(tracked);

// --- Turn raw reads/writes into steps worth drawing ---

// Two reads in a row = a comparison. Two writes that exchange two values = a swap.
function swapEvents() {
    const values = [...input];
    const events = [];
    let reads = [];
    let writes = [];
    let before = null;

    for (const o of ops) {
        if (o.op === 'get') {
            reads.push(o.i);
            if (reads.length === 2) {
                const [a, b] = [Math.min(...reads), Math.max(...reads)];
                const last = events[events.length - 1];
                const sameAsLast = last && last.type === 'compare' && last.a === a && last.b === b;
                if (a !== b && !sameAsLast) events.push({ type: 'compare', a, b, values: [...values] });
                reads = [];
            }
        } else {
            if (writes.length === 0) before = [...values];
            writes.push(o.i);
            values[o.i] = o.v;
            if (writes.length === 2) {
                const [a, b] = writes;
                if (a !== b && values[a] === before[b] && values[b] === before[a]) {
                    events.push({ type: 'swap', a: Math.min(a, b), b: Math.max(a, b), values: before });
                }
                writes = [];
            }
            reads = [];
        }
    }
    return events;
}

// First read = lift the key. Each further read = compare with the key.
// A write copying the value just read = shift one cell. A write of the key = drop it into the gap.
function shiftEvents() {
    const events = [];
    let held = null;
    let prev = null;

    for (const o of ops) {
        if (o.op === 'get') {
            if (held === null) {
                held = o.v;
                events.push({ type: 'lift', i: o.i });
            } else if (!(prev && prev.op === 'get' && prev.i === o.i)) {
                events.push({ type: 'compare', j: o.i });
            }
        } else if (o.v === held) {
            events.push({ type: 'place', i: o.i });
            held = null;
        } else {
            events.push({ type: 'move', from: prev.i, to: o.i });
        }
        prev = o;
    }
    return events;
}

// --- Draw ---
const BOX = 64;
const GAP = 12;
const SPLIT_GAP = 28; // extra space between Merge Sort groups
const MARGIN = 40;
const N = input.length;
const rowWidth = (splitCount) => N * BOX + (N - 1) * GAP + splitCount * SPLIT_GAP;
const WIDTH = MARGIN * 2 + rowWidth(IS_MERGE ? N - 1 : 0);
const BOX_Y = 120;
const HELD_Y = BOX_Y - 100; // where a lifted key hovers
const ARC = 75; // enough for a moving box to clear the boxes it passes

// Merge Sort is drawn as a tree: one row per split level, root on top.
const midOf = (lo, hi) => lo + Math.floor((hi - lo) / 2);
const depthOf = (n) => (n <= 1 ? 0 : 1 + depthOf(n - Math.floor(n / 2)));
const TREE_TOP = 30;
const ROW_GAP = 110;
const treeY = (d) => TREE_TOP + d * ROW_GAP;
const HEIGHT = IS_MERGE ? treeY(depthOf(N)) + BOX + 60 : 300;

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// A split at b means a gap between index b - 1 and b. The row stays centered.
function xOf(i, splits) {
    let before = 0;
    for (const b of splits) if (b <= i) before++;
    return (WIDTH - rowWidth(splits.size)) / 2 + i * (BOX + GAP) + before * SPLIT_GAP;
}
const NO_SPLITS = new Set();
const boxX = (i) => xOf(i, NO_SPLITS);
const lerp = (from, to, t) => from + (to - from) * t;

function drawBox(value, x, y, highlight, dim = false) {
    ctx.fillStyle = highlight ? '#fff4e0' : '#ffffff';
    ctx.strokeStyle = highlight ? '#f59e0b' : dim ? '#d1d5db' : '#374151';
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, BOX, BOX);
    ctx.strokeRect(x, y, BOX, BOX);
    ctx.fillStyle = dim ? '#9ca3af' : '#111827';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + BOX / 2, y + BOX / 2);
}

function drawGap(x, y) {
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(x, y, BOX, BOX);
    ctx.setLineDash([]);
}

// Arrow pointing at a box: from above (down) or from below (up).
function drawArrow(boxLeft, boxTop, fromBelow = false) {
    const x = boxLeft + BOX / 2;
    const dir = fromBelow ? -1 : 1;
    const tip = fromBelow ? boxTop + BOX + 10 : boxTop - 10;
    const tail = tip - dir * 50;
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, tail);
    ctx.lineTo(x, tip - dir * 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 10, tip - dir * 14);
    ctx.lineTo(x + 10, tip - dir * 14);
    ctx.lineTo(x, tip);
    ctx.closePath();
    ctx.fill();
}

function clear() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

// skip: cells not drawn (they are floating). gaps: cells drawn as an empty dashed box.
// floating: highlighted boxes at free positions, on top of everything.
function drawScene(values, { arrows = [], gaps = [], skip = [], floating = [] } = {}) {
    clear();
    values.forEach((v, i) => {
        if (gaps.includes(i)) drawGap(boxX(i), BOX_Y);
        else if (!skip.includes(i)) drawBox(v, boxX(i), BOX_Y, arrows.includes(i));
    });
    arrows.forEach((i) => drawArrow(boxX(i), BOX_Y));
    floating.forEach((f) => drawBox(f.value, f.x, f.y, true));
}

// --- Encode ---
const gif = GIFEncoder();
let frameCount = 0;

function addFrame(delay) {
    const { data: rgba } = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const palette = quantize(rgba, 64);
    gif.writeFrame(applyPalette(rgba, palette), WIDTH, HEIGHT, { palette, delay });
    frameCount++;
}

const STEPS = 10;
const COMPARE_DELAY = 700;

function animate(drawAt) {
    for (let s = 1; s <= STEPS; s++) {
        drawAt(s / STEPS);
        addFrame(50);
    }
}

function renderSwaps(events) {
    for (const e of events) {
        if (e.type === 'compare') {
            drawScene(e.values, { arrows: [e.a, e.b] });
            addFrame(COMPARE_DELAY);
        } else {
            // Box a goes over the top to b, box b goes underneath to a.
            animate((t) => {
                const lift = Math.sin(Math.PI * t) * ARC;
                drawScene(e.values, {
                    skip: [e.a, e.b],
                    floating: [
                        { value: e.values[e.a], x: lerp(boxX(e.a), boxX(e.b), t), y: BOX_Y - lift },
                        { value: e.values[e.b], x: lerp(boxX(e.b), boxX(e.a), t), y: BOX_Y + lift },
                    ],
                });
            });
        }
    }
}

function renderShifts(events) {
    const values = [...input];
    let gap = null;
    let held = null;

    for (const e of events) {
        if (e.type === 'lift') {
            held = values[e.i];
            gap = e.i;
            animate((t) => drawScene(values, {
                gaps: [gap],
                floating: [{ value: held, x: boxX(gap), y: lerp(BOX_Y, HELD_Y, t) }],
            }));
        } else if (e.type === 'compare') {
            drawScene(values, {
                gaps: [gap],
                arrows: [e.j],
                floating: [{ value: held, x: boxX(gap), y: HELD_Y }],
            });
            addFrame(COMPARE_DELAY);
        } else if (e.type === 'move') {
            // The bigger value slides right into the gap; the key hovers along above the new gap.
            animate((t) => drawScene(values, {
                gaps: [e.from, e.to],
                floating: [
                    { value: values[e.from], x: lerp(boxX(e.from), boxX(e.to), t), y: BOX_Y },
                    { value: held, x: lerp(boxX(e.to), boxX(e.from), t), y: HELD_Y },
                ],
            }));
            values[e.to] = values[e.from];
            gap = e.from;
        } else {
            animate((t) => drawScene(values, {
                gaps: [e.i],
                floating: [{ value: held, x: boxX(e.i), y: lerp(HELD_Y, BOX_Y, t) }],
            }));
            values[e.i] = held;
            gap = null;
            held = null;
        }
    }
}

// Merge Sort builds new arrays with slice, so the proxy can't follow it.
// Replay the same recursion instead, drawn as a tree: one row per depth, root on top.
// Splitting copies a group down to the row below; merging picks values back up into the parent.
function renderMerge() {
    // Row d draws every split made above it, so groups of the same depth sit apart.
    const splitsAbove = [];
    (function collect(lo, hi, d) {
        if (hi - lo <= 1) return;
        for (let k = d + 1; k <= depthOf(N); k++) (splitsAbove[k] ??= new Set()).add(midOf(lo, hi));
        collect(lo, midOf(lo, hi), d + 1);
        collect(midOf(lo, hi), hi, d + 1);
    })(0, N, 0);
    const treeX = (i, d) => xOf(i, splitsAbove[d] ?? NO_SPLITS);

    // cells[d][i]: what row d shows at index i — null (nothing) or { value, style }.
    const cells = Array.from({ length: depthOf(N) + 1 }, () => Array(N).fill(null));
    input.forEach((value, i) => { cells[0][i] = { value, style: 'normal' }; });

    // arrows: [index, depth] pairs, drawn from below.
    function drawTree({ arrows = [], floating = [] } = {}) {
        clear();
        cells.forEach((row, d) => row.forEach((c, i) => {
            if (!c) return;
            if (c.style === 'gap') drawGap(treeX(i, d), treeY(d));
            else drawBox(c.value, treeX(i, d), treeY(d), c.style === 'highlight', c.style === 'dim');
        }));
        arrows.forEach(([i, d]) => drawArrow(treeX(i, d), treeY(d), true));
        floating.forEach((f) => drawBox(f.value, f.x, f.y, true));
    }

    function visit(lo, hi, d) {
        if (hi - lo <= 1) return;
        const mid = midOf(lo, hi);
        const range = Array.from({ length: hi - lo }, (_, k) => lo + k);
        const parent = cells[d];
        const child = cells[d + 1];

        // Split: the parent waits (dimmed) while its values drop down as two child groups.
        range.forEach((i) => { parent[i].style = 'dim'; });
        animate((t) => drawTree({
            floating: range.map((i) => ({
                value: parent[i].value,
                x: lerp(treeX(i, d), treeX(i, d + 1), t),
                y: lerp(treeY(d), treeY(d + 1), t),
            })),
        }));
        range.forEach((i) => { child[i] = { value: parent[i].value, style: 'normal' }; });

        visit(lo, mid, d + 1);
        visit(mid, hi, d + 1);

        // Merge: two pointers in the child row, the smaller value rises into the parent row.
        range.forEach((i) => { parent[i] = { value: null, style: 'gap' }; });
        let i = lo;
        let j = mid;
        for (const dst of range) {
            let src;
            if (i < mid && j < hi) {
                child[i].style = child[j].style = 'highlight';
                drawTree({ arrows: [[i, d + 1], [j, d + 1]] });
                addFrame(COMPARE_DELAY);
                child[i].style = child[j].style = 'normal';
                src = child[i].value <= child[j].value ? i++ : j++;
            } else {
                src = i < mid ? i++ : j++;
            }
            const value = child[src].value;
            child[src] = { value: null, style: 'gap' };
            animate((t) => drawTree({
                floating: [{
                    value,
                    x: lerp(treeX(src, d + 1), treeX(dst, d), t),
                    y: lerp(treeY(d + 1), treeY(d), t),
                }],
            }));
            parent[dst] = { value, style: 'normal' };
        }
        range.forEach((k) => { child[k] = null; });
    }

    drawTree();
    addFrame(1200);
    visit(0, N, 0);
    drawTree();
    addFrame(2000);
}

if (IS_MERGE) {
    renderMerge();
} else {
    drawScene(input);
    addFrame(1200);
    if (SHIFT_BASED.includes(name)) renderShifts(shiftEvents());
    else renderSwaps(swapEvents());
    drawScene(data);
    addFrame(2000);
}
gif.finish();

const out = path.join(__dirname, `${name}.gif`);
fs.writeFileSync(out, gif.bytes());
console.log(`${out} (${frameCount} frames)`);
