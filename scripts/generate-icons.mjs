/**
 * Generates PWA icons (192, 512, maskable) as PNG files.
 * No extra dependencies — uses only Node.js built-ins (zlib).
 * Run once: node scripts/generate-icons.mjs
 */

import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

// ─── CRC32 ───────────────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ─── PNG chunk builder ───────────────────────────────────────────────────────
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

// ─── Core PNG encoder ────────────────────────────────────────────────────────
function encodePNG(pixels, width, height) {
  // pixels: Uint8Array of RGBA values, row-major
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // adaptive filtering
  ihdrData[12] = 0; // no interlace

  // Build raw scanlines (filter byte 0 = None, then RGBA pixels)
  const scanlineSize = 1 + width * 4;
  const raw = Buffer.allocUnsafe(height * scanlineSize);
  for (let y = 0; y < height; y++) {
    raw[y * scanlineSize] = 0; // filter type: None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * scanlineSize + 1 + x * 4;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const compressed = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    PNG_SIG,
    pngChunk("IHDR", ihdrData),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ─── Icon painter ────────────────────────────────────────────────────────────
function paintIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  const coral   = [0xff, 0x6b, 0x6b]; // #FF6B6B
  const yellow  = [0xff, 0xd9, 0x3d]; // #FFD93D
  const white   = [0xff, 0xff, 0xff];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // Rounded square background with gradient (coral → yellow)
      const radius = size * 0.22;
      const cx = size / 2, cy = size / 2;
      const dx = Math.abs(x - cx + 0.5), dy = Math.abs(y - cy + 0.5);

      // Round-rect SDF
      const qx = Math.max(dx - (size / 2 - radius), 0);
      const qy = Math.max(dy - (size / 2 - radius), 0);
      const dist = Math.sqrt(qx * qx + qy * qy) - radius;

      if (dist > 0) {
        // Outside — transparent
        pixels[i] = pixels[i + 1] = pixels[i + 2] = pixels[i + 3] = 0;
        continue;
      }

      // Gradient: top-left coral → bottom-right yellow
      const t = (x + y) / (size * 2);
      const bg = [
        Math.round(coral[0] + (yellow[0] - coral[0]) * t),
        Math.round(coral[1] + (yellow[1] - coral[1]) * t),
        Math.round(coral[2] + (yellow[2] - coral[2]) * t),
      ];

      // Draw white house silhouette
      const nx = x / size, ny = y / size; // normalised coords 0..1
      let isHouse = false;

      // Roof triangle (peak at 0.5, 0.22 — base at 0.15..0.85, 0.52)
      const roofLeft = 0.15, roofRight = 0.85, roofPeak = 0.22, roofBase = 0.52;
      if (ny >= roofPeak && ny <= roofBase) {
        const roofProgress = (ny - roofPeak) / (roofBase - roofPeak);
        const roofEdgeLeft = 0.5 - (0.5 - roofLeft) * roofProgress;
        const roofEdgeRight = 0.5 + (roofRight - 0.5) * roofProgress;
        if (nx >= roofEdgeLeft && nx <= roofEdgeRight) isHouse = true;
      }

      // Body rectangle (0.25..0.75 x, 0.50..0.80 y)
      if (nx >= 0.25 && nx <= 0.75 && ny >= 0.50 && ny <= 0.80) isHouse = true;

      // Chimney (0.58..0.68 x, 0.18..0.38 y)
      if (nx >= 0.58 && nx <= 0.68 && ny >= 0.18 && ny <= 0.38) isHouse = true;

      // Door cutout (0.40..0.60 x, 0.62..0.80 y) — make it the bg colour
      if (nx >= 0.40 && nx <= 0.60 && ny >= 0.62 && ny <= 0.80) isHouse = false;

      // Small heart inside door area (centred at 0.50, 0.56)
      const hx = (nx - 0.50) * size * 0.6;
      const hy = (ny - 0.56) * size * 0.6;
      const heartR = size * 0.04;
      // two-circle heart SDF
      const d1 = Math.sqrt((hx + heartR) ** 2 + hy ** 2) - heartR;
      const d2 = Math.sqrt((hx - heartR) ** 2 + hy ** 2) - heartR;
      const dRotated = Math.sqrt(hx ** 2 + (hy - heartR * 1.2) ** 2) - heartR * 1.2;
      if (d1 < 0 || d2 < 0 || dRotated < 0) isHouse = true;

      const colour = isHouse ? white : bg;
      pixels[i]     = colour[0];
      pixels[i + 1] = colour[1];
      pixels[i + 2] = colour[2];
      pixels[i + 3] = 255;
    }
  }

  return pixels;
}

// ─── Generate & write ────────────────────────────────────────────────────────
mkdirSync("public/icons", { recursive: true });

for (const size of [192, 512]) {
  const pixels = paintIcon(size);
  const png = encodePNG(pixels, size, size);
  writeFileSync(`public/icons/icon-${size}.png`, png);
  console.log(`✓ public/icons/icon-${size}.png  (${(png.length / 1024).toFixed(1)} KB)`);
}

// maskable — same art but bg fills the full square (no transparency)
const maskablePixels = paintIcon(512);
// make all transparent pixels white for maskable safe-zone
for (let i = 0; i < maskablePixels.length; i += 4) {
  if (maskablePixels[i + 3] === 0) {
    maskablePixels[i] = maskablePixels[i + 1] = maskablePixels[i + 2] = 0xff;
    maskablePixels[i + 3] = 255;
  }
}
const maskablePng = encodePNG(maskablePixels, 512, 512);
writeFileSync("public/icons/icon-maskable.png", maskablePng);
console.log(`✓ public/icons/icon-maskable.png  (${(maskablePng.length / 1024).toFixed(1)} KB)`);
