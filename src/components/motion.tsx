/**
 * Componentes de movimento (base: vitrine "free-code" do Não Codei), no tom da Biblioteca Viva:
 * calmos, editoriais, sempre com fallback estático para quem pede menos movimento.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "@/lib/hooks";
import { useReducedMotion, useScrollProgress } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ---------- 16 · Revelar palavra por palavra ---------- */
export function WordReveal({ text, className, delay = 0, step = 70 }: { text: string; className?: string; delay?: number; step?: number }) {
  const words = text.split(" ");
  return (
    <span className={cn("word-reveal", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="word-reveal-w" style={{ animationDelay: `${delay + i * step}ms` }}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/* ---------- 17 · Palavras que se alternam ---------- */
export function RotatingWords({ words, interval = 2600, className }: { words: string[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0);
  const [instant, setInstant] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setI((x) => x + 1), interval);
    return () => clearInterval(t);
  }, [interval, reduced]);
  // chegou na cópia da primeira palavra: volta ao início sem animação (ninguém percebe o pulo)
  useEffect(() => {
    if (i === words.length) {
      const t = setTimeout(() => {
        setInstant(true);
        setI(0);
        requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
      }, 700);
      return () => clearTimeout(t);
    }
  }, [i, words.length]);
  const list = [...words, words[0]];
  return (
    <span className={cn("relative inline-flex h-[1.15em] overflow-hidden align-bottom", className)}>
      <span className="sr-only">{words[0]}</span>
      <span
        aria-hidden
        className="flex flex-col"
        style={{ transform: `translateY(-${(i * 100) / list.length}%)`, transition: instant || reduced ? "none" : "transform 700ms var(--ease-out)" }}
      >
        {list.map((w, k) => (
          <span key={k} className="block h-[1.15em] leading-[1.15em] whitespace-nowrap">{w}</span>
        ))}
      </span>
    </span>
  );
}

/* ---------- 04 · Texto que se preenche com a rolagem ---------- */
export function TextFill({ text, className }: { text: string; className?: string }) {
  const [ref, p] = useScrollProgress<HTMLParagraphElement>({ start: 0.85, end: 0.35 });
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const head = p * (words.length + 3);
  return (
    <p ref={ref} className={cn("text-balance", className)}>
      {words.map((w, i) => {
        // zona de degradê de ~3 palavras em vez de acender de uma vez
        const o = reduced ? 1 : Math.min(1, Math.max(0.16, (head - i) / 3));
        return (
          <span key={i} style={{ opacity: o, transition: "opacity 120ms linear" }}>
            {w}{" "}
          </span>
        );
      })}
    </p>
  );
}

/* ---------- 18 · Odômetro ---------- */
export function Odometer({ value, compact, suffix = "", className }: { value: number; compact?: boolean; suffix?: string; className?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const text = (compact ? new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value) : value.toLocaleString("pt-BR")) + suffix;
  return (
    <span ref={ref} className={cn("inline-flex tabular-nums", className)} aria-label={text}>
      {text.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} aria-hidden className="relative inline-block h-[1.1em] overflow-hidden leading-[1.1em]">
            <span
              className="flex flex-col"
              style={{
                transform: `translateY(-${inView ? Number(ch) * 10 : 0}%)`,
                transition: `transform 1400ms var(--ease-out) ${i * 70}ms`,
              }}
            >
              {Array.from({ length: 10 }).map((_, d) => (
                <span key={d} className="h-[1.1em]">{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden>{ch}</span>
        ),
      )}
    </span>
  );
}

/* ---------- 26 · Anel de progresso ---------- */
export function ProgressRing({ value, size = 44, stroke = 4, className, children }: { value: number; size?: number; stroke?: number; className?: string; children?: ReactNode }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div ref={ref} className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }} role="img" aria-label={`${Math.round(v)}% lido`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={inView ? c * (1 - v / 100) : c}
          style={{ transition: "stroke-dashoffset 1200ms var(--ease-out)" }}
        />
      </svg>
      <span className="absolute text-[11px] font-semibold tabular-nums">{children ?? `${Math.round(v)}%`}</span>
    </div>
  );
}

/* ---------- 07 · Linha do tempo que se desenha ---------- */
export function DrawTimeline({ items }: { items: { key: string; marker?: ReactNode; content: ReactNode }[] }) {
  const [ref, p] = useScrollProgress<HTMLOListElement>({ start: 0.8, end: 0.45 });
  const reduced = useReducedMotion();
  const prog = reduced ? 1 : p;
  return (
    <ol ref={ref} className="relative pl-9">
      <span className="absolute top-1 bottom-1 left-[11px] w-0.5 rounded-full bg-border" aria-hidden />
      <span className="absolute top-1 left-[11px] w-0.5 origin-top rounded-full bg-primary" style={{ height: `calc((100% - 0.5rem) * ${prog})` }} aria-hidden />
      {items.map((it, i) => {
        const lit = prog >= (i + 0.35) / items.length;
        return (
          <li key={it.key} className="relative pb-6 last:pb-0">
            <span
              className={cn(
                "absolute top-1 -left-9 grid size-6 place-items-center rounded-full border-2 bg-background transition-all duration-500",
                lit ? "scale-100 border-primary text-primary" : "scale-75 border-border text-muted-foreground",
              )}
              aria-hidden
            >
              {it.marker ?? <span className={cn("size-2 rounded-full", lit ? "bg-primary" : "bg-border")} />}
            </span>
            <div className={cn("transition-all duration-700", lit ? "opacity-100" : "translate-y-2 opacity-40")}>{it.content}</div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- 02 · Galeria horizontal presa à rolagem (só telas grandes) ---------- */
export function HorizontalGallery({ title, children }: { title: ReactNode; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [x, setX] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const measure = () => {
      const t = track.current;
      if (!t) return;
      setDist(window.innerWidth >= 1024 && !reduced ? Math.max(0, t.scrollWidth - t.clientWidth) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [reduced, children]);

  useEffect(() => {
    if (!dist) return setX(0);
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = outer.current!.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
        setX(-p * dist);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [dist]);

  // sem distância (celular, ou menos movimento): vira uma faixa normal com rolagem lateral
  return (
    <div ref={outer} style={dist ? { height: `calc(100vh + ${dist}px)` } : undefined}>
      <div className={cn(dist && "sticky top-0 flex h-screen flex-col justify-center")}>
        {title}
        <div ref={track} className={cn("mt-5", dist ? "overflow-hidden" : "-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0")}>
          <div className="flex w-max gap-5 will-change-transform" style={{ transform: `translateX(${x}px)` }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 24 · Carregar mais ao chegar no fim ---------- */
export function LoadMoreSentinel({ onVisible, disabled }: { onVisible: () => void; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onVisible);
  cb.current = onVisible;
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && cb.current(), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [disabled]);
  return <div ref={ref} aria-hidden className="h-px" />;
}

/* ---------- 25 · Gráfico de barras que sobe ---------- */
export function BarChart({ values, labels, unit = "", className }: { values: number[]; labels: string[]; unit?: string; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const max = Math.max(...values);
  return (
    <div ref={ref} className={cn("flex h-48 items-end gap-2", className)} role="img" aria-label={labels.map((l, i) => `${l}: ${values[i]}${unit}`).join(", ")}>
      {values.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className={cn("text-[10px] text-muted-foreground tabular-nums transition-opacity duration-500", inView ? "opacity-100" : "opacity-0")} style={{ transitionDelay: `${300 + i * 60}ms` }}>
            {v}
          </span>
          <div
            className="w-full origin-bottom rounded-t-lg bg-gradient-primary"
            style={{ height: `${(v / max) * 100}%`, transform: `scaleY(${inView ? 1 : 0})`, transition: `transform 900ms var(--ease-out) ${i * 60}ms` }}
          />
          <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
