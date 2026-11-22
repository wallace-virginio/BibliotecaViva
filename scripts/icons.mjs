// Gera os ícones do app (PWA + base para iOS/Android) e o favicon a partir do símbolo da marca.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const BRAND = "#7A4E2D"; // marrom couro de livro antigo (--primary)
const OCHRE = "#C99A3E"; // ocre do broto (--accent)
const PAPER = "#F8F3E8"; // papel creme

const mark = `
<path d="M4 10.5c3.6-1.3 7.6-1 12 1.6v14.4c-4.4-2.6-8.4-2.9-12-1.6V10.5Z"/>
<path d="M28 10.5c-3.6-1.3-7.6-1-12 1.6v14.4c4.4-2.6 8.4-2.9 12-1.6V10.5Z"/>
<path d="M16 12.1V7.5"/>
<path d="M16 8.6c0-2.6 1.9-4.2 4.6-4.1-.1 2.6-1.9 4.2-4.6 4.1Z" fill="${OCHRE}" stroke="none"/>
<path d="M16 9.4c0-2.1-1.6-3.5-3.8-3.4.1 2.1 1.6 3.5 3.8 3.4Z" fill="${OCHRE}" stroke="none"/>`;

// pad=true: ícone "maskable" (área segura maior para recortes circulares do Android)
const svg = (pad, size = 512) => {
  const inner = pad ? 0.56 : 0.72;
  const scale = (size * inner) / 32;
  const off = (size - 32 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" rx="${pad ? 0 : size * 0.22}" fill="${BRAND}"/>
<g transform="translate(${off} ${off}) scale(${scale})" fill="none" stroke="${PAPER}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${mark}</g></svg>`;
};

mkdirSync("public/icons", { recursive: true });
mkdirSync("resources", { recursive: true });
for (const s of [192, 512]) await sharp(Buffer.from(svg(false))).resize(s, s).png().toFile(`public/icons/icon-${s}.png`);
await sharp(Buffer.from(svg(true))).resize(512, 512).png().toFile("public/icons/maskable-512.png");
await sharp(Buffer.from(svg(false))).resize(1024, 1024).png().toFile("resources/icon.png");
writeFileSync("public/favicon.svg", svg(false, 64));
console.log("icons ok");
