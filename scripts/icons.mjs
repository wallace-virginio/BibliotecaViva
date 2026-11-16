// Gera os ícones do app (PWA + base para iOS/Android) a partir de um SVG.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const svg = (pad) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22C1F5"/><stop offset="1" stop-color="#0284D6"/></linearGradient></defs>
<rect width="512" height="512" rx="${pad ? 0 : 112}" fill="url(#g)"/>
<g transform="translate(${pad ? 136 : 96} ${pad ? 136 : 96}) scale(${pad ? 10 : 13.33})" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<path d="M4 5.5C4 4.7 4.7 4 5.5 4H10a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 1 4 16V5.5Z"/>
<path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H14a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 0 20 16V5.5Z"/>
<circle cx="17" cy="8" r="1.2" fill="#fff" stroke="none"/></g></svg>`);

mkdirSync("public/icons", { recursive: true });
mkdirSync("resources", { recursive: true });
for (const s of [192, 512]) await sharp(svg(false)).resize(s, s).png().toFile(`public/icons/icon-${s}.png`);
await sharp(svg(true)).resize(512, 512).png().toFile("public/icons/maskable-512.png");
await sharp(svg(false)).resize(1024, 1024).png().toFile("resources/icon.png");
console.log("icons ok");
