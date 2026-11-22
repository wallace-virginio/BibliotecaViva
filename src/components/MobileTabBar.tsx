import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, CalendarDays, House, Map, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Início", icon: House, match: (p: string) => p === "/" },
  { to: "/mapa", label: "Mapa", icon: Map, match: (p: string) => p.startsWith("/mapa") || p.startsWith("/biblioteca") },
  { to: "/acervo", label: "Acervo", icon: BookOpen, match: (p: string) => p.startsWith("/acervo") || p.startsWith("/livro") },
  { to: "/eventos", label: "Eventos", icon: CalendarDays, match: (p: string) => p.startsWith("/eventos") },
  { to: "/app", label: "Perfil", icon: UserRound, match: (p: string) => p.startsWith("/app") || p.startsWith("/entrar") },
] as const;

/** Barra de abas inferior — navegação principal do app no celular. */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="vt-static-tabbar fixed inset-x-0 bottom-0 z-[1000] border-t glass pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navegação principal"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition active:scale-95",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-primary-soft")}>
                  <Icon className="size-[21px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
