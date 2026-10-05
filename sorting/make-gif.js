// Usage: node sorting/make-gif.js bubble-sort  →  sorting/bubble-sort.gif
// The algorithm file must export a function that sorts the given array in place.
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
const MARGIN = 40;
const WIDTH = MARGIN * 2 + input.length * BOX + (input.length - 1) * GAP;
const HEIGHT = 300;
const BOX_Y = 120;
const HELD_Y = BOX_Y - 100; // where a lifted key hovers
const ARC = 75; // enough for a moving box to clear the boxes it passes

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

const boxX = (i) => MARGIN + i * (BOX + GAP);
const lerp = (from, to, t) => from + (to - from) * t;

function drawBox(value, x, y, highlight) {
    ctx.fillStyle = highlight ? '#fff4e0' : '#ffffff';
    ctx.strokeStyle = highlight ? '#f59e0b' : '#374151';
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, BOX, BOX);
    ctx.strokeRect(x, y, BOX, BOX);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + BOX / 2, y + BOX / 2);
}

function drawGap(i) {
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(boxX(i), BOX_Y, BOX, BOX);
    ctx.setLineDash([]);
}

function drawArrow(i) {
    const x = boxX(i) + BOX / 2;
    const top = BOX_Y - 60;
    const tip = BOX_Y - 10;
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, tip - 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 10, tip - 14);
    ctx.lineTo(x + 10, tip - 14);
    ctx.lineTo(x, tip);
    ctx.closePath();
    ctx.fill();
}

// skip: cells not drawn in the row (they are floating). gaps: cells drawn as an empty dashed box.
// floating: highlighted boxes drawn at free positions, on top of everything.
function drawScene(values, { arrows = [], gaps = [], skip = [], floating = [] } = {}) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    values.forEach((v, i) => {
        if (gaps.includes(i)) drawGap(i);
        else if (!skip.includes(i)) drawBox(v, boxX(i), BOX_Y, arrows.includes(i));
    });
    arrows.forEach(drawArrow);
    floating.forEach((f) => drawBox(f.value, f.x, f.y, true));
}

// --- Encode ---
const gif = GIFEncoder();

function addFrame(delay) {
    const { data: rgba } = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const palette = quantize(rgba, 64);
    gif.writeFrame(applyPalette(rgba, palette), WIDTH, HEIGHT, { palette, delay });
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

drawScene(input);
addFrame(1200);

const events = SHIFT_BASED.includes(name) ? shiftEvents() : swapEvents();
if (SHIFT_BASED.includes(name)) renderShifts(events);
else renderSwaps(events);

drawScene(data);
addFrame(2000);
gif.finish();

const out = path.join(__dirname, `${name}.gif`);
fs.writeFileSync(out, gif.bytes());
console.log(`${out} (${events.length} steps)`);
