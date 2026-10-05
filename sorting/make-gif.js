// Usage: node sorting/make-gif.js bubble-sort  →  sorting/bubble-sort.gif
// The algorithm file must export a function that sorts the given array in place by swapping.
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

const data = [5, 1, 4, 2, 8, 3];

// --- Record what the algorithm does ---
// Two reads in a row = a comparison. Two writes that exchange two values = a swap.
const events = [];
let reads = [];
let writes = [];
let beforeWrites = null;

const isIndex = (key) => typeof key === 'string' && /^\d+$/.test(key);

const tracked = new Proxy(data, {
    get(target, key) {
        if (isIndex(key)) {
            reads.push(Number(key));
            if (reads.length === 2) {
                const [a, b] = [Math.min(...reads), Math.max(...reads)];
                const last = events[events.length - 1];
                const sameAsLast = last && last.type === 'compare' && last.a === a && last.b === b;
                if (a !== b && !sameAsLast) {
                    events.push({ type: 'compare', a, b, values: [...target] });
                }
                reads = [];
            }
        }
        return target[key];
    },
    set(target, key, value) {
        if (isIndex(key)) {
            if (writes.length === 0) beforeWrites = [...target];
            writes.push(Number(key));
            target[key] = value;
            if (writes.length === 2) {
                const [a, b] = writes;
                if (target[a] === beforeWrites[b] && target[b] === beforeWrites[a]) {
                    events.push({ type: 'swap', a: Math.min(a, b), b: Math.max(a, b), values: beforeWrites });
                }
                writes = [];
            }
            reads = [];
            return true;
        }
        target[key] = value;
        return true;
    },
});

const input = [...data];
sort(tracked);

// --- Draw ---
const BOX = 64;
const GAP = 12;
const MARGIN = 40;
const WIDTH = MARGIN * 2 + data.length * BOX + (data.length - 1) * GAP;
const HEIGHT = 240;
const BOX_Y = 120;
const ARC = 60;

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

const boxX = (i) => MARGIN + i * (BOX + GAP);

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

function clear() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

// Plain array, optionally with arrows over two indices.
function drawArray(values, pair) {
    clear();
    values.forEach((v, i) => drawBox(v, boxX(i), BOX_Y, pair && pair.includes(i)));
    if (pair) pair.forEach(drawArrow);
}

// Box a slides to b over the top, box b slides to a underneath. t goes 0 → 1.
function drawSwap(values, a, b, t) {
    clear();
    values.forEach((v, i) => {
        if (i !== a && i !== b) drawBox(v, boxX(i), BOX_Y, false);
    });
    const lift = Math.sin(Math.PI * t) * ARC;
    const xa = boxX(a) + (boxX(b) - boxX(a)) * t;
    const xb = boxX(b) + (boxX(a) - boxX(b)) * t;
    drawBox(values[a], xa, BOX_Y - lift, true);
    drawBox(values[b], xb, BOX_Y + lift * 0.5, true);
}

// --- Encode ---
const gif = GIFEncoder();

function addFrame(delay) {
    const { data: rgba } = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const palette = quantize(rgba, 64);
    gif.writeFrame(applyPalette(rgba, palette), WIDTH, HEIGHT, { palette, delay });
}

drawArray(input);
addFrame(1200);

const SWAP_STEPS = 10;
for (const e of events) {
    if (e.type === 'compare') {
        drawArray(e.values, [e.a, e.b]);
        addFrame(700);
    } else {
        for (let s = 1; s <= SWAP_STEPS; s++) {
            drawSwap(e.values, e.a, e.b, s / SWAP_STEPS);
            addFrame(50);
        }
    }
}

drawArray(data);
addFrame(2000);
gif.finish();

const out = path.join(__dirname, `${name}.gif`);
fs.writeFileSync(out, gif.bytes());
console.log(`${out} (${events.length} steps)`);
