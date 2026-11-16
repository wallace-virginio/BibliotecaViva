/// <reference types="vite/client" />
import { HeadContent, Outlet, Scripts, createRootRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { initAppShell } from "@/lib/native";
import { AuthProvider } from "@/lib/auth";
import appCss from "@/styles.css?url";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";
import { NotFound } from "@/components/NotFound";
import { themeScript } from "@/components/ThemeToggle";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Biblioteca Viva — Conectando pessoas ao conhecimento" },
      {
        name: "description",
        content:
          "Plataforma aberta e colaborativa para descobrir bibliotecas, eventos, espaços de estudo e livros perto de você — em qualquer lugar do mundo.",
      },
      { name: "theme-color", content: "#00AEEF" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Biblioteca Viva" },
      { name: "format-detection", content: "telephone=no" },
      { property: "og:title", content: "Biblioteca Viva" },
      { property: "og:description", content: "Conectando pessoas ao conhecimento." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
    ],
    scripts: [{ children: themeScript }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <AuthProvider>
      <AppFrame />
    </AuthProvider>
  );
}

function AppFrame() {
  useEffect(() => {
    initAppShell();
  }, []);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isApp = pathname === "/app" || pathname.startsWith("/app/");
  const isFullscreen = pathname === "/mapa";
  // Leitor: tela cheia, sem navegação do app (como um app de leitura nativo).
  if (pathname.startsWith("/ler/")) return <Outlet />;
  if (isApp)
    return (
      <>
        <Outlet />
        <MobileTabBar />
      </>
    );
  return (
    <>
      <Navbar />
      <main className={isFullscreen ? "" : "min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"}>
        <Outlet />
      </main>
      {!isFullscreen && (
        <div className="hidden lg:block">
          <Footer />
        </div>
      )}
      <MobileTabBar />
    </>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
