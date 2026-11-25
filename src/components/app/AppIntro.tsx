import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

/**
 * Animação de abertura (app e site).
 *
 * Conta a ideia da marca em ~2,5s e termina exatamente no ícone (scripts/icons.mjs):
 *  1. um livro fechado (o mesmo da abertura nativa do Android, para emendar sem pulo);
 *  2. o livro abre: a capa some e as páginas se desdobram a partir da lombada;
 *  3. raízes saem da base do broto e se espalham pelas páginas — e viram as linhas do texto
 *     (a planta se alimenta do conhecimento do livro);
 *  4. o caule sobe e as folhas se abrem;
 *  5. o Sol (o ponto dourado) acende com raios e a luz quente se espalha;
 *  6. o nome aparece e tudo se desfaz na tela inicial. Um toque pula a animação.
 *
 * Vai no HTML base (shell), então aparece na primeira pintura, antes do JavaScript.
 */

/**
 * Site: a abertura aparece só na primeira página de cada visita (sessionStorage), sempre quando o site foi
 * instalado na tela inicial (PWA, como um app) e nunca para quem pediu menos movimento. Roda no <head>,
 * antes da primeira pintura, para a camada nem chegar a aparecer quando é para pular.
 */
export const introSkipScript = `(function(){try{var d=document.documentElement;var pwa=window.matchMedia('(display-mode: standalone)').matches;var calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!pwa&&(calm||sessionStorage.getItem('bv-intro-seen')))d.classList.add('bv-intro-skip');sessionStorage.setItem('bv-intro-seen','1');}catch(e){}})();`;

/** Linhas do texto das páginas, desenhadas DA LOMBADA PARA FORA (é por onde as raízes avançam). */
const LINES_LEFT = ["M44 66.6C36 62.8 28 62.8 20 66", "M44 72.6C36 68.8 28 68.8 20 72", "M44 78.6C36 74.8 28 74.8 20 78"];
const LINES_RIGHT = ["M56 66.6C64 62.8 72 62.8 80 66", "M56 72.6C64 68.8 72 68.8 80 72", "M56 78.6C64 74.8 72 74.8 80 78"];
/** Raízes: da base do caule até o começo de cada linha (somem no fim, deixando só as linhas, como no ícone). */
const ROOTS = [
  "M50 61C48 62 46 64 44 66.6",
  "M50 61C52 62 54 64 56 66.6",
  "M50 63C48 66 46 69 44 72.6",
  "M50 63C52 66 54 69 56 72.6",
  "M50 65C48 70 46 74 44 78.6",
  "M50 65C52 70 54 74 56 78.6",
];
const RAYS = Array.from({ length: 8 }, (_, i) => i * 45);

export function AppIntro({ variant = "app" }: { variant?: "app" | "site" }) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");
  // a animação só começa quando o app está pronto (até lá fica o livro fechado parado, igual à abertura
  // nativa): assim ela não "corre" escondida atrás da abertura do Android nem recomeça no meio
  const [run, setRun] = useState(false);
  const t = useT();

  useEffect(() => {
    if (document.documentElement.classList.contains("bv-intro-skip")) {
      setPhase("gone");
      return;
    }
    setRun(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const outAt = reduced ? 400 : variant === "site" ? 2500 : 2700;
    const t1 = setTimeout(() => setPhase("out"), outAt);
    const t2 = setTimeout(() => setPhase("gone"), outAt + 420);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [variant]);

  useEffect(() => {
    if (phase !== "out") return;
    const t = setTimeout(() => setPhase("gone"), 420);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;
  return (
    <div id="bv-intro" className={[run && "run", phase === "out" && "is-out"].filter(Boolean).join(" ") || undefined} aria-hidden="true" onClick={() => setPhase("out")}>
      <style>{CSS}</style>
      <svg viewBox="0 0 100 100" className="bvi-mark">
        <defs>
          <radialGradient id="bvi-glow">
            <stop offset="0" stopColor="#F7CE6A" stopOpacity=".42" />
            <stop offset=".55" stopColor="#F7CE6A" stopOpacity=".12" />
            <stop offset="1" stopColor="#F7CE6A" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* luz do Sol (acende no fim) */}
        <circle className="bvi-glow" cx="50" cy="50" r="48" fill="url(#bvi-glow)" />

        {/* páginas (se desdobram a partir da lombada) */}
        <g className="bvi-page bvi-left">
          <path d="M13 63c12-6.5 25-6.5 37 1v25c-12-7.5-25-7.5-37-1Z" fill="#D9BF94" />
          <path d="M13 59c12-6.5 25-6.5 37 1v25c-12-7.5-25-7.5-37-1Z" fill="#FBF3E2" />
        </g>
        <g className="bvi-page bvi-right">
          <path d="M87 63c-12-6.5-25-6.5-37 1v25c12-7.5 25-7.5 37-1Z" fill="#D9BF94" />
          <path d="M87 59c-12-6.5-25-6.5-37 1v25c12-7.5 25-7.5 37-1Z" fill="#FFF8EA" />
        </g>
        <path className="bvi-spine" d="M50 60v25" stroke="#C9AE80" strokeWidth="1.6" />

        {/* raízes → linhas do texto */}
        <g fill="none" strokeLinecap="round" strokeWidth="1.6">
          {ROOTS.map((d, i) => (
            <path key={d} className="bvi-root" style={{ animationDelay: `${0.62 + (i >> 1) * 0.08}s, 2.05s` }} pathLength={1} d={d} />
          ))}
          {[...LINES_LEFT, ...LINES_RIGHT].map((d, i) => (
            <path key={d} className="bvi-line" style={{ animationDelay: `${0.78 + (i % 3) * 0.08}s, 1.7s` }} pathLength={1} d={d} />
          ))}
        </g>

        {/* planta */}
        <path className="bvi-stem" pathLength={1} d="M50 60c0-10-.8-18 .6-30" stroke="#4E8C2C" strokeWidth="3.6" strokeLinecap="round" fill="none" />
        <g className="bvi-leaf bvi-leaf-l">
          <path d="M50.2 45c-10.5.4-18-6.2-19.4-16.4 10.6-.6 18.2 5.6 19.4 16.4Z" fill="#6DB33F" />
          <path d="M50.2 45c-6-3-11.5-8-14.8-13.6" stroke="#4E8C2C" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".7" />
        </g>
        <g className="bvi-leaf bvi-leaf-r">
          <path d="M50.6 36.5c9-1 15.2-7.4 15.8-17 -9.4.2-15.8 6.4-15.8 17Z" fill="#8BCB52" />
          <path d="M50.6 36.5c4.6-3.4 8.6-8.2 11.2-13.4" stroke="#4E8C2C" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".7" />
        </g>

        {/* o Sol */}
        <g className="bvi-rays" stroke="#F2C14E" strokeWidth="1.1" strokeLinecap="round">
          {RAYS.map((a) => (
            <line key={a} x1="72" y1="12.2" x2="72" y2="9.6" transform={`rotate(${a} 72 17)`} />
          ))}
        </g>
        <circle className="bvi-sun" cx="72" cy="17" r="2.6" fill="#F2C14E" />

        {/* livro fechado (primeiro quadro = abertura nativa do Android) */}
        <g className="bvi-cover">
          <rect x="35" y="56" width="30" height="34" rx="2.6" fill="#A86E3C" />
          <rect x="35" y="56" width="4.5" height="34" rx="1.6" fill="#8A5530" />
          <rect x="63.4" y="57.6" width="1.6" height="30.8" rx=".8" fill="#FBF3E2" />
          <rect x="43" y="64" width="16" height="2.2" rx="1.1" fill="#F2C14E" />
          <rect x="43" y="68.4" width="10" height="1.6" rx=".8" fill="#F2C14E" opacity=".6" />
        </g>
      </svg>
      <p className="bvi-name">
        Biblioteca <em>Viva</em>
      </p>
      <p className="bvi-tag">{t.intro.tagline}</p>
    </div>
  );
}

/*
 * Mesma posição/tamanho da abertura nativa: símbolo de 172.8px (72% de um ícone de 240dp) no centro exato.
 * Linha do tempo: capa 0–.45s · páginas .15–.75 · raízes .62–1.0 · linhas .78–1.25 · caule .9–1.4 ·
 * folhas 1.25–1.8 · Sol 1.55–2.2 · nome 1.95–2.4 · saída 2.5/2.7s.
 */
const CSS = `
#bv-intro{position:fixed;inset:0;z-index:5000;background:#6B3D20;color:#FBF3E2;cursor:pointer;
  transition:opacity .4s cubic-bezier(.16,1,.3,1),transform .4s cubic-bezier(.16,1,.3,1)}
#bv-intro::before{content:"";position:absolute;inset:0;opacity:0;animation:bvi-show .9s 1.6s ease-out forwards;
  background:radial-gradient(120% 80% at 50% 42%,#8A5530 0%,#6B3D20 55%,#4E2A14 100%)}
#bv-intro.is-out{opacity:0;transform:scale(1.04);pointer-events:none}
html.bv-intro-skip #bv-intro{display:none!important}
/* parada no 1º quadro (livro fechado) até o app ficar pronto e pôr .run */
#bv-intro:not(.run) *,#bv-intro:not(.run)::before{animation-play-state:paused!important}
/* rede de segurança: se o JavaScript não rodar, a camada some sozinha e o conteúdo aparece */
#bv-intro:not(.run){animation:bvi-safety .3s 8s forwards}
@keyframes bvi-safety{to{opacity:0;visibility:hidden}}
/* enquanto a abertura está na tela: sem efeito de transição de página (ele misturava a abertura com a tela de trás) */
html:has(#bv-intro) .vt-static-header,html:has(#bv-intro) .vt-static-tabbar{view-transition-name:none!important}
html:has(#bv-intro)::view-transition-old(*),html:has(#bv-intro)::view-transition-new(*){animation:none!important}
#bv-intro .bvi-mark{position:absolute;left:50%;top:50%;width:172.8px;height:172.8px;margin:-86.4px 0 0 -86.4px;overflow:visible}
#bv-intro .bvi-cover{transform-box:view-box;transform-origin:50px 73px;animation:bvi-cover .45s .05s cubic-bezier(.55,0,.75,.4) forwards}
#bv-intro .bvi-page{transform-box:view-box;transform-origin:50px 72px;transform:scaleX(.04);animation:bvi-unfold .62s .15s cubic-bezier(.16,1,.3,1) forwards}
#bv-intro .bvi-spine{opacity:0;animation:bvi-show .2s .2s forwards}
/* traço "escondido" antes do começo do caminho (dasharray 1 2 + offset 1.2): nem a ponta redonda aparece antes da hora */
#bv-intro .bvi-root,#bv-intro .bvi-line,#bv-intro .bvi-stem{stroke-dasharray:1 2;stroke-dashoffset:1.2}
#bv-intro .bvi-root{stroke:#7A8F34;animation:bvi-draw .38s cubic-bezier(.33,1,.68,1) forwards,bvi-hide .45s ease-in forwards}
#bv-intro .bvi-line{stroke:#7A8F34;animation:bvi-draw .45s cubic-bezier(.33,1,.68,1) forwards,bvi-ink .6s ease-out forwards}
#bv-intro .bvi-stem{animation:bvi-draw .5s .9s cubic-bezier(.33,1,.68,1) forwards}
#bv-intro .bvi-leaf{transform-box:fill-box;opacity:0;transform:scale(0);animation:bvi-leaf .6s cubic-bezier(.34,1.56,.64,1) forwards}
#bv-intro .bvi-leaf-l{transform-origin:100% 100%;animation-delay:1.25s}
#bv-intro .bvi-leaf-r{transform-origin:0% 100%;animation-delay:1.38s}
#bv-intro .bvi-glow{opacity:0;transform-box:fill-box;transform-origin:center;animation:bvi-glow .9s 1.6s ease-out forwards}
#bv-intro .bvi-sun{transform-box:fill-box;transform-origin:center;opacity:0;transform:scale(0);animation:bvi-sun .65s 1.55s cubic-bezier(.34,1.56,.64,1) forwards}
#bv-intro .bvi-rays{transform-box:view-box;transform-origin:72px 17px;opacity:0;animation:bvi-rays 1s 1.6s ease-out forwards}
#bv-intro .bvi-name,#bv-intro .bvi-tag{position:absolute;left:0;right:0;text-align:center}
#bv-intro .bvi-name{top:calc(50% + 100px);font-family:var(--font-serif,Georgia,serif);font-weight:600;font-size:28px;letter-spacing:-.01em;
  opacity:0;transform:translateY(10px);animation:bvi-up .5s 1.95s cubic-bezier(.16,1,.3,1) forwards}
#bv-intro .bvi-name em{color:#F2C14E}
#bv-intro .bvi-tag{top:calc(50% + 142px);font-size:13px;opacity:0;animation:bvi-tag .5s 2.1s ease-out forwards}
@keyframes bvi-cover{to{transform:scaleX(0);opacity:0}}
@keyframes bvi-unfold{to{transform:none}}
@keyframes bvi-show{to{opacity:1}}
@keyframes bvi-hide{to{opacity:0}}
@keyframes bvi-draw{to{stroke-dashoffset:0}}
@keyframes bvi-ink{to{stroke:#DCC7A2}}
@keyframes bvi-leaf{0%{opacity:0;transform:scale(0) rotate(-14deg)}60%{opacity:1}100%{opacity:1;transform:none}}
@keyframes bvi-glow{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes bvi-sun{0%{opacity:0;transform:scale(0)}55%{opacity:1;transform:scale(2)}100%{opacity:1;transform:none}}
@keyframes bvi-rays{0%{opacity:0;transform:scale(.4) rotate(0)}40%{opacity:1}100%{opacity:0;transform:scale(1.5) rotate(50deg)}}
@keyframes bvi-up{to{opacity:1;transform:none}}
@keyframes bvi-tag{to{opacity:.75}}
@media (prefers-reduced-motion:reduce){#bv-intro *,#bv-intro::before{animation-duration:.01s!important;animation-delay:0s!important}}
`;
