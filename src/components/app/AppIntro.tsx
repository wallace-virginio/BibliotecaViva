import { useEffect, useState } from "react";

/**
 * Animação de abertura do app (celular).
 *
 * Vai no HTML base (shell), então já aparece na primeira pintura — antes do JavaScript — em cima do mesmo
 * marrom da abertura nativa do Android: não existe tela branca/preta entre o toque no ícone e o app.
 * O livro se abre, o broto cresce da lombada, as folhas abrem e o nome aparece; depois tudo some no Início.
 * O desenho é o mesmo do ícone (scripts/icons.mjs).
 */
export function AppIntro() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // a abertura nativa já mostrou o ícone: a parte animada é curta (~1,5s) para não atrasar quem quer usar o app
    const t1 = setTimeout(() => setPhase("out"), reduced ? 400 : 1500);
    const t2 = setTimeout(() => setPhase("gone"), reduced ? 700 : 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div id="bv-intro" className={phase === "out" ? "is-out" : undefined} aria-hidden="true">
      <style>{CSS}</style>
      <svg viewBox="0 0 100 100" className="bvi-mark">
        <defs>
          <radialGradient id="bvi-glow">
            <stop offset="0" stopColor="#F7CE6A" stopOpacity=".42" />
            <stop offset=".55" stopColor="#F7CE6A" stopOpacity=".12" />
            <stop offset="1" stopColor="#F7CE6A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="bvi-glow" cx="50" cy="50" r="48" fill="url(#bvi-glow)" />
        <g className="bvi-left">
          <path d="M13 63c12-6.5 25-6.5 37 1v25c-12-7.5-25-7.5-37-1Z" fill="#D9BF94" />
          <path d="M13 59c12-6.5 25-6.5 37 1v25c-12-7.5-25-7.5-37-1Z" fill="#FBF3E2" />
          <g stroke="#DCC7A2" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path d="M20 66c8-3.2 16-3.2 24 .6" />
            <path d="M20 72c8-3.2 16-3.2 24 .6" />
            <path d="M20 78c8-3.2 16-3.2 24 .6" />
          </g>
        </g>
        <g className="bvi-right">
          <path d="M87 63c-12-6.5-25-6.5-37 1v25c12-7.5 25-7.5 37-1Z" fill="#D9BF94" />
          <path d="M87 59c-12-6.5-25-6.5-37 1v25c12-7.5 25-7.5 37-1Z" fill="#FFF8EA" />
          <g stroke="#DCC7A2" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path d="M80 66c-8-3.2-16-3.2-24 .6" />
            <path d="M80 72c-8-3.2-16-3.2-24 .6" />
            <path d="M80 78c-8-3.2-16-3.2-24 .6" />
          </g>
        </g>
        <path d="M50 60v25" stroke="#C9AE80" strokeWidth="1.6" />
        <path className="bvi-stem" d="M50 60c0-10-.8-18 .6-30" stroke="#4E8C2C" strokeWidth="3.6" strokeLinecap="round" fill="none" />
        <g className="bvi-leaf bvi-leaf-l">
          <path d="M50.2 45c-10.5.4-18-6.2-19.4-16.4 10.6-.6 18.2 5.6 19.4 16.4Z" fill="#6DB33F" />
          <path d="M50.2 45c-6-3-11.5-8-14.8-13.6" stroke="#4E8C2C" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".7" />
        </g>
        <g className="bvi-leaf bvi-leaf-r">
          <path d="M50.6 36.5c9-1 15.2-7.4 15.8-17 -9.4.2-15.8 6.4-15.8 17Z" fill="#8BCB52" />
          <path d="M50.6 36.5c4.6-3.4 8.6-8.2 11.2-13.4" stroke="#4E8C2C" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".7" />
        </g>
        <circle className="bvi-spark" cx="72" cy="17" r="2.6" fill="#F2C14E" />
      </svg>
      <p className="bvi-name">
        Biblioteca <em>Viva</em>
      </p>
      <p className="bvi-tag">Conectando pessoas ao conhecimento.</p>
    </div>
  );
}

/*
 * Começa IDÊNTICO à abertura nativa (mesmo marrom, ícone de 240dp com o símbolo em 72% = 172.8px, no centro),
 * para emendar sem pulo; aí o símbolo "ganha vida": as páginas respiram, as folhas crescem e balançam,
 * a luz se espalha, o ponto dourado brilha e o nome sobe. Por fim tudo se desfaz no Início.
 */
const CSS = `
#bv-intro{position:fixed;inset:0;z-index:5000;background:#6B3D20;color:#FBF3E2;
  transition:opacity .38s cubic-bezier(.16,1,.3,1),transform .38s cubic-bezier(.16,1,.3,1)}
#bv-intro::before{content:"";position:absolute;inset:0;opacity:0;animation:bvi-fade .9s .1s ease-out forwards;
  background:radial-gradient(120% 80% at 50% 45%,#8A5530 0%,#6B3D20 55%,#4E2A14 100%)}
#bv-intro.is-out{opacity:0;transform:scale(1.04);pointer-events:none}
/* enquanto a abertura está na tela, cabeçalho e abas não "furam" a camada (efeito de transição de página) */
html:has(#bv-intro) .vt-static-header,html:has(#bv-intro) .vt-static-tabbar{view-transition-name:none!important}
#bv-intro .bvi-mark{position:absolute;left:50%;top:50%;width:172.8px;height:172.8px;margin:-86.4px 0 0 -86.4px;overflow:visible}
#bv-intro .bvi-left,#bv-intro .bvi-right{transform-box:view-box;transform-origin:50px 72px;animation:bvi-breathe .9s .15s ease-in-out both}
#bv-intro .bvi-right{animation-name:bvi-breathe-r}
#bv-intro .bvi-leaf{transform-box:fill-box;animation:bvi-leaf .9s cubic-bezier(.34,1.56,.64,1) both}
#bv-intro .bvi-leaf-l{transform-origin:100% 100%;animation-delay:.25s}
#bv-intro .bvi-leaf-r{transform-origin:0% 100%;animation-delay:.38s}
#bv-intro .bvi-glow{transform-box:fill-box;transform-origin:center;animation:bvi-glow 1.2s .2s ease-out both}
#bv-intro .bvi-spark{transform-box:fill-box;transform-origin:center;animation:bvi-spark .7s .6s ease-out both}
#bv-intro .bvi-name,#bv-intro .bvi-tag{position:absolute;left:0;right:0;text-align:center}
#bv-intro .bvi-name{top:calc(50% + 100px);font-family:var(--font-serif,Georgia,serif);font-weight:600;font-size:28px;letter-spacing:-.01em;
  opacity:0;transform:translateY(10px);animation:bvi-up .55s .55s cubic-bezier(.16,1,.3,1) forwards}
#bv-intro .bvi-name em{color:#F2C14E}
#bv-intro .bvi-tag{top:calc(50% + 142px);font-size:13px;opacity:0;animation:bvi-tag .5s .75s ease-out forwards}
@keyframes bvi-breathe{0%,100%{transform:none}45%{transform:rotate(-3deg) translateY(-1px)}}
@keyframes bvi-breathe-r{0%,100%{transform:none}45%{transform:rotate(3deg) translateY(-1px)}}
@keyframes bvi-leaf{0%{transform:none}35%{transform:scale(1.22) rotate(-8deg)}65%{transform:scale(1.08) rotate(4deg)}100%{transform:scale(1.12)}}
@keyframes bvi-glow{0%{transform:scale(1);opacity:1}60%{transform:scale(1.35);opacity:1}100%{transform:scale(1.25);opacity:.9}}
@keyframes bvi-fade{to{opacity:1}}
@keyframes bvi-spark{0%{transform:scale(1)}45%{transform:scale(2.2)}100%{transform:scale(1.3)}}
@keyframes bvi-up{to{opacity:1;transform:none}}
@keyframes bvi-tag{to{opacity:.75}}
@media (prefers-reduced-motion:reduce){#bv-intro *,#bv-intro::before{animation-duration:.01s!important;animation-delay:0s!important}}
`;
