import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** Marca: livro aberto com um broto saindo das páginas — a biblioteca que cresce ("viva"). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft", className)}>
      <svg viewBox="0 0 32 32" className="size-[70%]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {/* páginas */}
        <path d="M4 10.5c3.6-1.3 7.6-1 12 1.6v14.4c-4.4-2.6-8.4-2.9-12-1.6V10.5Z" />
        <path d="M28 10.5c-3.6-1.3-7.6-1-12 1.6v14.4c4.4-2.6 8.4-2.9 12-1.6V10.5Z" />
        {/* broto */}
        <path d="M16 12.1V7.5" />
        <path d="M16 8.6c0-2.6 1.9-4.2 4.6-4.1-.1 2.6-1.9 4.2-4.6 4.1Z" fill="currentColor" stroke="none" className="text-accent" />
        <path d="M16 9.4c0-2.1-1.6-3.5-3.8-3.4.1 2.1 1.6 3.5 3.8 3.4Z" fill="currentColor" stroke="none" className="text-accent" />
      </svg>
    </span>
  );
}

export function Logo({ className, tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="Biblioteca Viva — início">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[19px] font-semibold tracking-tight text-foreground">
          Biblioteca <span className="text-primary italic">Viva</span>
        </span>
        {tagline && <span className="mt-1 hidden text-[10.5px] font-medium tracking-wide text-muted-foreground sm:block">Conectando pessoas ao conhecimento.</span>}
      </span>
    </Link>
  );
}
