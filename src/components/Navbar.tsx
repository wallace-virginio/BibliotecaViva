import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { buttonClass } from "./ui";
import { useAuth } from "@/lib/auth";
import { LocationChip } from "./LocationSheet";
import { AccessibilityMenu } from "./AccessibilityMenu";
import { LanguageChoices, LanguageMenu } from "./LanguageMenu";
import { useT } from "@/lib/i18n";

const NAV = [
  { to: "/acervo", key: "acervo" },
  { to: "/ranking", key: "ranking" },
  { to: "/eventos", key: "eventos" },
  { to: "/salas", key: "salas" },
  { to: "/comunidade", key: "comunidade" },
  { to: "/sobre", key: "sobre" },
] as const;

const MORE = [
  { to: "/descobrir", key: "descobrir" },
  { to: "/assistente", key: "assistente" },
  { to: "/roadmap", key: "roadmap" },
  { to: "/privacidade", key: "privacidade" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const auth = useAuth();
  const t = useT();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("vt-static-header fixed inset-x-0 top-0 z-[1000] border-b bg-background pt-[env(safe-area-inset-top)] transition-shadow", scrolled && "shadow-soft", pathname === "/mapa" && "max-lg:hidden")}>
      <div
        className={cn(
          "mx-auto mt-0 flex h-14 lg:h-16 max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-8",
        )}
      >
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="link-grow rounded-full px-3.5 py-2 text-sm whitespace-nowrap text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {t.nav[n.key]}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <LocationChip className="max-w-[7.5rem] sm:max-w-[11rem]" />
          <LanguageMenu className="hidden sm:block" />
          <AccessibilityMenu />
          <ThemeToggle className="hidden sm:grid" />
          {auth.user ? (
            <Link to="/app" className="grid size-9 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground" aria-label={t.nav.meuEspaco}>
              {(auth.displayName || "?")[0]?.toUpperCase()}
            </Link>
          ) : (
            <Link to="/entrar" className={buttonClass("secondary", "sm", "hidden sm:inline-flex")}>
              {t.nav.entrar}
            </Link>
          )}
          <button
            className="grid size-10 place-items-center rounded-full hover:bg-surface-2 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={t.nav.maisOpcoes}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-4 mt-2 animate-fade-up rounded-3xl border glass p-3 shadow-elevated lg:hidden">
          {[...NAV, ...MORE].map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-[15px] font-medium hover:bg-surface-2"
            >
              {t.nav[n.key]}
            </Link>
          ))}
          <Link to={auth.user ? "/app" : "/entrar"} onClick={() => setOpen(false)} className={buttonClass("primary", "md", "mt-2 w-full")}>
            {auth.user ? t.nav.meuEspaco : t.nav.entrar}
          </Link>
          <LanguageChoices className="mt-3 sm:hidden" />
        </div>
      )}
    </header>
  );
}
