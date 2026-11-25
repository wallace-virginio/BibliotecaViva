import { BookmarkCheck, BookmarkPlus, BookOpenCheck, Check, ChevronDown, Library } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { actions, SHELF_LABEL, useStore, type ShelfStatus } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { confetti } from "@/lib/motion";
import { buttonClass } from "./ui";

type BookRef = { id: string; title: string; author?: string; coverId?: number };

const ICON: Record<ShelfStatus, typeof BookmarkPlus> = { "quero-ler": BookmarkCheck, lendo: Library, lido: BookOpenCheck };

/** Botão compacto sobre a capa: um toque adiciona/remove "Quero ler". */
export function ShelfQuickToggle({ book, className }: { book: BookRef; className?: string }) {
  const status = useStore((s) => s.shelf[book.id]?.status);
  const t = useT();
  const Icon = status ? ICON[status] : BookmarkPlus;
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        actions.setShelf(book, status ? null : "quero-ler");
      }}
      className={cn(
        "grid size-8 place-items-center rounded-full shadow-card backdrop-blur transition active:scale-90",
        status ? "bg-primary text-primary-foreground" : "bg-surface/90 text-foreground hover:bg-surface",
        className,
      )}
      aria-label={status ? t.shelf.onShelf(t.shelf.labels[status]) : t.shelf.add}
      aria-pressed={!!status}
      title={status ? t.shelf.labels[status] : t.shelf.add}
    >
      <Icon className="size-4" />
    </button>
  );
}

/** Botão completo da página do livro: escolhe Quero ler / Lendo / Lido. */
export function ShelfMenuButton({ book }: { book: BookRef }) {
  const status = useStore((s) => s.shelf[book.id]?.status);
  const [open, setOpen] = useState(false);
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const Icon = status ? ICON[status] : BookmarkPlus;
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={buttonClass(status ? "soft" : "outline", "md")} aria-haspopup="menu" aria-expanded={open}>
        <Icon className="size-4" /> {status ? t.shelf.labels[status] : t.shelf.my} <ChevronDown className="size-3.5 opacity-60" />
      </button>
      {open && (
        <div role="menu" className="absolute top-12 left-0 z-30 w-52 animate-fade-in overflow-hidden rounded-2xl border bg-surface p-1.5 shadow-elevated">
          {(Object.keys(SHELF_LABEL) as ShelfStatus[]).map((st) => {
            const I = ICON[st];
            return (
              <button
                key={st}
                role="menuitemradio"
                aria-checked={status === st}
                onClick={(e) => {
                  actions.setShelf(book, st);
                  setOpen(false);
                  if (st === "lido" && status !== "lido") confetti({ x: e.clientX, y: e.clientY });
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-surface-2"
              >
                <I className="size-4 text-primary" /> <span className="flex-1">{t.shelf.labels[st]}</span>
                {status === st && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
          {status && (
            <button
              role="menuitem"
              onClick={() => {
                actions.setShelf(book, null);
                setOpen(false);
              }}
              className="mt-1 w-full rounded-xl border-t px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-surface-2"
            >
              {t.shelf.remove}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
