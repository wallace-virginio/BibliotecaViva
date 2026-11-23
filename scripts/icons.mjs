// Gera TODOS os ícones a partir de um único desenho: site (PWA + favicon), base para iOS e Android
// (ícone adaptativo, ícones antigos e imagens da abertura). Rode com `npm run icons`.
//
// O desenho: um livro aberto (o acervo) de cuja lombada nasce um broto com duas folhas (o conhecimento
// que cresce — a biblioteca VIVA), sobre marrom couro de livro antigo com um brilho quente de luz de leitura.
// O verde das folhas contra o marrom é o que faz o ícone saltar na tela inicial do celular.
// Mantenha o mesmo desenho em src/components/app/AppIntro.tsx (animação de abertura do app).
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LEATHER = "#6B3D20"; // fundo (cor sólida do ícone adaptativo e da abertura)
const LEATHER_LIGHT = "#8A5530";
const LEATHER_DARK = "#4E2A14";

/** O símbolo, num quadro de 100×100. */
const MARK = `
  <defs><radialGradient id="glow"><stop offset="0" stop-color="#F7CE6A" stop-opacity=".42"/><stop offset=".55" stop-color="#F7CE6A" stop-opacity=".12"/><stop offset="1" stop-color="#F7CE6A" stop-opacity="0"/></radialGradient></defs>
  <circle cx="50" cy="50" r="48" fill="url(#glow)"/>
  <path d="M13 63c12-6.5 25-6.5 37 1v25c-12-7.5-25-7.5-37-1Z" fill="#D9BF94"/>
  <path d="M87 63c-12-6.5-25-6.5-37 1v25c12-7.5 25-7.5 37-1Z" fill="#D9BF94"/>
  <path d="M13 59c12-6.5 25-6.5 37 1v25c-12-7.5-25-7.5-37-1Z" fill="#FBF3E2"/>
  <path d="M87 59c-12-6.5-25-6.5-37 1v25c12-7.5 25-7.5 37-1Z" fill="#FFF8EA"/>
  <g stroke="#DCC7A2" stroke-width="1.6" stroke-linecap="round" fill="none">
    <path d="M20 66c8-3.2 16-3.2 24 .6"/><path d="M20 72c8-3.2 16-3.2 24 .6"/><path d="M20 78c8-3.2 16-3.2 24 .6"/>
    <path d="M80 66c-8-3.2-16-3.2-24 .6"/><path d="M80 72c-8-3.2-16-3.2-24 .6"/><path d="M80 78c-8-3.2-16-3.2-24 .6"/>
  </g>
  <path d="M50 60v25" stroke="#C9AE80" stroke-width="1.6"/>
  <path d="M50 60c0-10-.8-18 .6-30" stroke="#4E8C2C" stroke-width="3.6" stroke-linecap="round" fill="none"/>
  <path d="M50.2 45c-10.5.4-18-6.2-19.4-16.4 10.6-.6 18.2 5.6 19.4 16.4Z" fill="#6DB33F"/>
  <path d="M50.2 45c-6-3-11.5-8-14.8-13.6" stroke="#4E8C2C" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".7"/>
  <path d="M50.6 36.5c9-1 15.2-7.4 15.8-17 -9.4.2-15.8 6.4-15.8 17Z" fill="#8BCB52"/>
  <path d="M50.6 36.5c4.6-3.4 8.6-8.2 11.2-13.4" stroke="#4E8C2C" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".7"/>
  <circle cx="72" cy="17" r="2.6" fill="#F2C14E"/>`;

/** Livro fechado: primeiro quadro da animação de abertura (src/components/app/AppIntro.tsx). */
const COVER = `
  <rect x="35" y="56" width="30" height="34" rx="2.6" fill="#A86E3C"/>
  <rect x="35" y="56" width="4.5" height="34" rx="1.6" fill="#8A5530"/>
  <rect x="63.4" y="57.6" width="1.6" height="30.8" rx=".8" fill="#FBF3E2"/>
  <rect x="43" y="64" width="16" height="2.2" rx="1.1" fill="#F2C14E"/>
  <rect x="43" y="68.4" width="10" height="1.6" rx=".8" fill="#F2C14E" opacity=".6"/>`;

const defs = `<defs><radialGradient id="bg" cx="50%" cy="38%" r="75%">
  <stop offset="0" stop-color="${LEATHER_LIGHT}"/><stop offset=".6" stop-color="${LEATHER}"/><stop offset="1" stop-color="${LEATHER_DARK}"/>
</radialGradient></defs>`;

/** Ícone completo (quadrado): fundo + símbolo. `markScale` = fração ocupada pelo símbolo; `radius` em fração. */
const fullIcon = (size, { markScale = 0.8, radius = 0.22 } = {}) => {
  const m = size * markScale;
  const off = (size - m) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${defs}
<rect width="${size}" height="${size}" rx="${size * radius}" fill="url(#bg)"/>
<g transform="translate(${off} ${off}) scale(${m / 100})">${MARK}</g></svg>`;
};

/** Camada da frente do ícone adaptativo (fundo transparente; o sistema recorta em círculo/gota/quadrado). */
const foreground = (size, art = MARK) => {
  const m = size * 0.72; // dentro da área segura (66%) do ícone adaptativo
  const off = (size - m) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><g transform="translate(${off} ${off}) scale(${m / 100})">${art}</g></svg>`;
};

const png = (svg, w, h, file) => sharp(Buffer.from(svg)).resize(w, h ?? w).png().toFile(file);

// ---------- site (PWA) ----------
mkdirSync("public/icons", { recursive: true });
mkdirSync("resources", { recursive: true });
for (const s of [192, 512]) await png(fullIcon(512), s, s, `public/icons/icon-${s}.png`);
await png(fullIcon(512, { markScale: 0.66, radius: 0 }), 512, 512, "public/icons/maskable-512.png");
await png(fullIcon(1024), 1024, 1024, "resources/icon.png");
await png(foreground(1024), 1024, 1024, "resources/icon-foreground.png");
writeFileSync("public/favicon.svg", fullIcon(64, { markScale: 0.9 }));

// ---------- Android ----------
const RES = "android/app/src/main/res";
if (existsSync(RES)) {
  const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(densities)) {
    const dir = join(RES, `mipmap-${d}`);
    mkdirSync(dir, { recursive: true });
    await png(fullIcon(512, { radius: 0.22 }), 48 * k, 48 * k, join(dir, "ic_launcher.png")); // Android 7 e anteriores
    await png(fullIcon(512, { radius: 0.5, markScale: 0.74 }), 48 * k, 48 * k, join(dir, "ic_launcher_round.png"));
    await png(foreground(432), 108 * k, 108 * k, join(dir, "ic_launcher_foreground.png")); // adaptativo (108dp)
    // abertura nativa (240dp): o livro fechado, igual ao 1º quadro da animação — emenda sem pulo
    await png(foreground(960, COVER), 240 * k, 240 * k, join(dir, "splash_cover.png"));
  }
  // abertura (aparelhos sem a SplashScreen API e fundo do plugin): marrom + símbolo no centro, mesmo tamanho de cada arquivo
  for (const dir of readdirSync(RES).filter((d) => d.startsWith("drawable"))) {
    const file = join(RES, dir, "splash.png");
    if (!existsSync(file)) continue;
    const { width, height } = await sharp(file).metadata();
    const m = Math.min(width, height) * 0.36;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${LEATHER}"/>
<g transform="translate(${(width - m) / 2} ${(height - m) / 2}) scale(${m / 100})">${COVER}</g></svg>`;
    await png(svg, width, height, file + ".tmp.png");
    renameSync(file + ".tmp.png", file);
  }
}
console.log("ícones gerados");
