import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { BookOpen, Building2, CalendarDays, Code2, Heart, House, Loader2, LogOut, Monitor, Settings, Ticket, UserRound, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConsentGate } from "@/components/ConsentGate";
import { LocationChip } from "@/components/LocationSheet";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { useAuth } from "@/lib/auth";
import { useUserStats } from "@/lib/userStats";
import { useStore } from "@/lib/store";
import { IS_APP } from "@/lib/platform";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Meu espaço — Biblioteca Viva" },
      { name: "description", content: "Seus livros, reservas, eventos, conquistas e comunidade." },
    ],
  }),
  component: AppLayout,
});

const NAV = [
  { to: "/app", label: "Início", icon: House, emoji: "🏠", exact: true },
  { to: "/app/livros", label: "Meus Livros", icon: BookOpen, emoji: "📚" },
  { to: "/app/favoritos", label: "Favoritos", icon: Heart, emoji: "❤️" },
  { to: "/app/reservas", label: "Reservas", icon: Ticket, emoji: "🎫" },
  { to: "/app/eventos", label: "Eventos", icon: CalendarDays, emoji: "📅" },
  { to: "/app/salas", label: "Salas", icon: Monitor, emoji: "💻" },
  { to: "/app/comunidade", label: "Comunidade", icon: Users, emoji: "👥" },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings, emoji: "⚙️" },
  { to: "/app/perfil", label: "Perfil", icon: UserRound, emoji: "👤" },
] as const;

function AppLayout() {
  const auth = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Área logada: sem sessão, vai para o login e volta para cá depois.
  if (auth.configured && auth.loading)
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  if (auth.configured && !auth.user)
    // durante a transição o pathname já pode ser /entrar: só redireciona a partir de /app
    return pathname.startsWith("/app") ? <Navigate to="/entrar" search={{ redirect: pathname }} replace /> : null;
  return <AppShell />;
}

function AppShell() {
  const auth = useAuth();
  const me = useUserStats();
  const initial = (me.name || "?")[0]?.toUpperCase();
  const counts = useStore((s) => ({ fav: s.favorites.length, res: s.reservations.length }));
  const devMode = useStore((s) => s.developerMode);
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-surface-2/60 px-3 py-5 lg:flex">
        <Logo className="px-3" />
        <nav className="mt-8 flex-1 space-y-0.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n }}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface hover:text-foreground"
              activeProps={{ className: "!bg-surface !text-foreground font-medium shadow-soft" }}
            >
              <span className="w-5 text-center">{n.emoji}</span>
              <span className="flex-1">{n.label}</span>
              {n.to === "/app/favoritos" && counts.fav > 0 && <span className="text-xs text-muted-foreground">{counts.fav}</span>}
              {n.to === "/app/reservas" && counts.res > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{counts.res}</span>}
            </Link>
          ))}
          <div className="my-4 border-t" />
          {devMode && (
            <Link to="/app/desenvolvedor" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground" activeProps={{ className: "!bg-surface !text-foreground font-medium shadow-soft" }}>
              <Code2 className="size-4" /> Desenvolvedor
            </Link>
          )}
          <Link to="/app/admin" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground" activeProps={{ className: "!bg-surface !text-foreground font-medium shadow-soft" }}>
            <Building2 className="size-4" /> Painel da biblioteca
          </Link>
        </nav>
        <div className="flex items-center gap-3 rounded-2xl border bg-surface p-3">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">{initial}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{me.fullName}</p>
            <p className="text-xs text-muted-foreground">{me.stats.streak ? `🔥 ${me.stats.streak} dias seguidos` : auth.user?.email ?? "Modo demonstração"}</p>
          </div>
          <ThemeToggle className="size-8" />
          {auth.user && (
            <button onClick={() => auth.signOut()} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-danger" aria-label="Sair">
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="min-w-0">
        {/* Cabeçalho + navegação em pílulas (celular, só no site — no app quem navega são as abas e o menu do Perfil) */}
        {!IS_APP && (
        <header className="sticky top-0 z-40 border-b glass pt-[env(safe-area-inset-top)] lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo />
            <div className="flex items-center gap-1">
              <LocationChip className="max-w-[8.5rem]" />
              <AccessibilityMenu />
              <ThemeToggle />
              <Link to="/app/perfil" className="grid size-9 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">{initial}</Link>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
            {[...NAV, { to: "/app/admin", label: "Biblioteca", emoji: "🏛" } as const, ...(devMode ? [{ to: "/app/desenvolvedor", label: "Desenvolvedor", emoji: "🧑‍💻" } as const] : [])].map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: "exact" in n }}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-surface px-3.5 text-sm"
                activeProps={{ className: "!border-transparent !bg-foreground !text-background font-medium" }}
              >
                <span>{n.emoji}</span> {n.label}
              </Link>
            ))}
          </nav>
        </header>
        )}
        <main
          className={
            IS_APP
              ? "mx-auto max-w-6xl px-4 pt-[calc(3.5rem+env(safe-area-inset-top)+1.25rem)] pb-6"
              : "mx-auto max-w-6xl px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:py-10"
          }
        >
          <Outlet />
          <ConsentGate />
        </main>
      </div>
    </div>
  );
}
