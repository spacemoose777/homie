import sharp from "sharp";
import { writeFileSync } from "fs";

// House SVG — clean roof, chimney, rectangular door, two windows
// Drawn on a 100×100 canvas, rendered at target sizes
function makeSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF9A5C"/>
      <stop offset="100%" stop-color="#FF6B6B"/>
    </linearGradient>
    <!-- Rounded square clip -->
    <clipPath id="rounded">
      <rect width="100" height="100" rx="22" ry="22"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="100" height="100" rx="22" ry="22" fill="url(#bg)"/>

  <!-- House body + roof as a single white path -->
  <g clip-path="url(#rounded)" fill="white">
    <!-- Roof (triangle pointing up) -->
    <polygon points="50,14 82,44 18,44"/>

    <!-- Chimney -->
    <rect x="62" y="18" width="8" height="16" rx="1"/>

    <!-- Walls -->
    <rect x="22" y="43" width="56" height="36" rx="2"/>

    <!-- Door (rectangular, centred, sits on bottom edge) -->
    <rect x="42" y="59" width="16" height="20" rx="2" fill="#FF8C6B"/>

    <!-- Left window -->
    <rect x="27" y="51" width="12" height="10" rx="2" fill="#FF8C6B"/>

    <!-- Right window -->
    <rect x="61" y="51" width="12" height="10" rx="2" fill="#FF8C6B"/>
  </g>
</svg>`;
}

async function generate(svgStr, outPath) {
  const buf = Buffer.from(svgStr);
  await sharp(buf).png().toFile(outPath);
  console.log("wrote", outPath);
}

await generate(makeSvg(192), "public/icons/icon-192.png");
await generate(makeSvg(512), "public/icons/icon-512.png");
await generate(makeSvg(512), "public/icons/icon-maskable.png");
