/**
 * Sistema de movimento da Biblioteca Viva.
 * Inspirado na vitrine "free-code" do Não Codei (rolagem, física, texto, listas, dados, transição):
 * curva expo-out, JavaScript puro, sem bibliotecas, e tudo para quando a pessoa pede menos movimento.
 */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Curva usada em todo o app: entra rápido e assenta devagar. */
export const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Menos movimento: preferência do sistema OU o menu de acessibilidade do app. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-motion");
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const update = () => setReduced(prefersReducedMotion());
    update();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      mq.removeEventListener("change", update);
      mo.disconnect();
    };
  }, []);
  return reduced;
}

/**
 * Progresso contínuo de rolagem (0 → 1) de um elemento atravessando a tela.
 * É a "medida" que o CSS sozinho não dá: o efeito avança e volta junto com a rolagem.
 */
export function useScrollProgress<T extends HTMLElement>(opts: { start?: number; end?: number } = {}): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [p, setP] = useState(0);
  const { start = 0.85, end = 0.25 } = opts; // fração da altura da tela onde começa/termina
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let visible = false;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const from = vh * start;
      const to = vh * end - r.height;
      const v = (from - r.top) / (from - to);
      setP(Math.min(1, Math.max(0, v)));
    };
    const onScroll = () => {
      if (visible && !raf) raf = requestAnimationFrame(measure);
    };
    // só calcula enquanto o elemento está perto da tela (não gasta bateria à toa)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) measure();
    }, { rootMargin: "20% 0px" });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [start, end]);
  return [ref, p];
}

/**
 * FLIP (First, Last, Invert, Play): mede onde cada item estava, deixa o React mudar a lista,
 * mede de novo e anima a diferença. Itens que entram nascem com fade + escala.
 */
export function useFlip<T extends HTMLElement>(deps: unknown[]) {
  const container = useRef<T | null>(null);
  const prev = useRef(new Map<string, DOMRect>());
  useIsoLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-flip]"));
    const reduced = prefersReducedMotion();
    const next = new Map<string, DOMRect>();
    for (const el of items) {
      const key = el.dataset.flip!;
      const last = el.getBoundingClientRect();
      next.set(key, last);
      const first = prev.current.get(key);
      if (reduced || prev.current.size === 0) continue;
      if (first) {
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 520, easing: EASE_OUT });
      } else {
        el.animate([{ opacity: 0, transform: "scale(0.92)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: EASE_OUT });
      }
    }
    prev.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return container;
}

/**
 * Arrastar para deslizar (mouse), com inércia: continua andando ao soltar
 * e perde velocidade aos poucos (atrito 0,93 por quadro). No toque, o celular já faz isso sozinho.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false;
    let moved = false;
    let lastX = 0;
    let v = 0;
    let raf = 0;
    const glide = () => {
      if (Math.abs(v) < 0.4) return;
      el.scrollLeft -= v;
      v *= 0.93;
      raf = requestAnimationFrame(glide);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      moved = false;
      lastX = e.clientX;
      v = 0;
      cancelAnimationFrame(raf);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - lastX;
      if (Math.abs(dx) > 2) moved = true;
      lastX = e.clientX;
      v = dx;
      el.scrollLeft -= dx;
      if (moved) el.style.cursor = "grabbing";
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      el.style.cursor = "";
      if (!prefersReducedMotion()) raf = requestAnimationFrame(glide);
    };
    // depois de arrastar, o clique não abre o livro sem querer
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("dragstart", (e) => e.preventDefault());
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

/**
 * Botão elástico: segue o ponteiro com uma mola de verdade (velocidade + amortecimento)
 * e volta oscilando para o lugar quando o mouse sai.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.28) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, raf = 0;
    const tick = () => {
      // mola: força proporcional à distância, amortecida
      vx = (vx + (tx - x) * 0.18) * 0.72;
      vy = (vy + (ty - y) * 0.18) * 0.72;
      x += vx;
      y += vy;
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      if (Math.abs(vx) + Math.abs(vy) + Math.abs(tx - x) + Math.abs(ty - y) > 0.05) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const kick = () => {
      if (!raf && !prefersReducedMotion()) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * strength;
      ty = (e.clientY - (r.top + r.height / 2)) * strength;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [strength]);
  return ref;
}

/**
 * Confete com física simples (gravidade, giro, resistência do ar) desenhado numa tela temporária.
 * O laço para sozinho quando todos os papéis saem da tela.
 */
export function confetti(origin?: { x: number; y: number }) {
  if (typeof window === "undefined" || prefersReducedMotion()) return;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "2500" });
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  // cores da marca: couro, dourado, bordô, papel, verde de encadernação
  const colors = ["#7A4E2D", "#C99A3E", "#8E2F2A", "#EFE4CC", "#3F6B54", "#B5763C"];
  const ox = origin?.x ?? innerWidth / 2;
  const oy = origin?.y ?? innerHeight / 3;
  const parts = Array.from({ length: 110 }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 7 + Math.random() * 9;
    return {
      x: ox, y: oy, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      w: 6 + Math.random() * 6, h: 3 + Math.random() * 4,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
      c: colors[(Math.random() * colors.length) | 0],
    };
  });
  const step = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of parts) {
      p.vy += 0.28; // gravidade
      p.vx *= 0.985; // resistência do ar
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (p.y < innerHeight + 20) alive++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      ctx.restore();
    }
    if (alive) requestAnimationFrame(step);
    else canvas.remove();
  };
  requestAnimationFrame(step);
}

/** Onda no clique (estilo Android): nasce onde o dedo tocou. Ligada uma vez para o app inteiro. */
export function installRipple() {
  if (typeof window === "undefined") return () => {};
  const onDown = (e: PointerEvent) => {
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(".ripple");
    if (!target || prefersReducedMotion()) return;
    const r = target.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const dot = document.createElement("span");
    dot.className = "bv-ripple";
    Object.assign(dot.style, { width: `${size}px`, height: `${size}px`, left: `${e.clientX - r.left - size / 2}px`, top: `${e.clientY - r.top - size / 2}px` });
    target.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove());
  };
  document.addEventListener("pointerdown", onDown);
  return () => document.removeEventListener("pointerdown", onDown);
}
