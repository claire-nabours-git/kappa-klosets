const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

const SIZE = 300;
const RADIUS = 20; // rounded corners

function crc32(buf) {
  const t = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = t[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length);
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([lb, tb, data, cb]);
}

function inHeart(x, y) {
  const cx = SIZE / 2, cy = SIZE / 2 + 10;
  const scale = 90;
  const nx = (x - cx) / scale;
  const ny = -(y - cy) / scale;
  return Math.pow(nx*nx + ny*ny - 1, 3) - nx*nx*ny*ny*ny <= 0;
}

function inRoundedRect(x, y) {
  if (x < RADIUS && y < RADIUS) return Math.hypot(x - RADIUS, y - RADIUS) <= RADIUS;
  if (x > SIZE - RADIUS && y < RADIUS) return Math.hypot(x - (SIZE - RADIUS), y - RADIUS) <= RADIUS;
  if (x < RADIUS && y > SIZE - RADIUS) return Math.hypot(x - RADIUS, y - (SIZE - RADIUS)) <= RADIUS;
  if (x > SIZE - RADIUS && y > SIZE - RADIUS) return Math.hypot(x - (SIZE - RADIUS), y - (SIZE - RADIUS)) <= RADIUS;
  return true;
}

const rows = [];
for (let y = 0; y < SIZE; y++) {
  const row = [0]; // filter byte
  for (let x = 0; x < SIZE; x++) {
    if (!inRoundedRect(x, y)) {
      row.push(0x1d, 0x25, 0x45, 0); // transparent outside corners
    } else if (inHeart(x, y)) {
      row.push(0xff, 0xff, 0xff, 0xff); // white heart
    } else {
      row.push(0x1d, 0x25, 0x45, 0xff); // navy background
    }
  }
  rows.push(...row);
}

const sig  = Buffer.from([137,80,78,71,13,10,26,10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
ihdr[8]=8; ihdr[9]=6; // 8-bit RGBA

const png = Buffer.concat([
  sig,
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', zlib.deflateSync(Buffer.from(rows))),
  pngChunk('IEND', Buffer.alloc(0)),
]);

const out = path.join(__dirname, 'public', 'touch-icon.png');
fs.writeFileSync(out, png);
console.log('Generated', out);
