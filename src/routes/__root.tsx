/// <reference types="vite/client" />
import { HeadContent, Outlet, Scripts, createRootRoute, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { initAppShell } from "@/lib/native";
import { installBackButton } from "@/lib/backButton";
import { IS_APP } from "@/lib/platform";
import { AppHeader } from "@/components/app/AppHeader";
import { AppIntro } from "@/components/app/AppIntro";
import { installRipple } from "@/lib/motion";
import { AuthProvider } from "@/lib/auth";
import { LocationProvider } from "@/lib/location";
import { LocationSheet } from "@/components/LocationSheet";
import appCss from "@/styles.css?url";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";
import { NotFound } from "@/components/NotFound";
import { themeScript } from "@/components/ThemeToggle";
import { a11yScript } from "@/components/AccessibilityMenu";

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
      { name: "theme-color", content: "#7A4E2D" },
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
    scripts: [{ children: themeScript }, { children: a11yScript }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <AppFrame />
        <LocationSheet />
      </LocationProvider>
    </AuthProvider>
  );
}

function AppFrame() {
  const router = useRouter();
  useEffect(() => {
    initAppShell();
    let removeBack = () => {};
    installBackButton(() => router.navigate({ to: "/" })).then((off) => (removeBack = off));
    const removeRipple = installRipple();
    return () => {
      removeBack();
      removeRipple();
    };
  }, [router]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isApp = pathname === "/app" || pathname.startsWith("/app/");
  const isFullscreen = pathname === "/mapa";
  // Leitor: tela cheia, sem navegação do app (como um app de leitura nativo).
  if (pathname.startsWith("/ler/")) return <Outlet />;
  // App de celular: cabeçalho simples + abas, sem menu nem rodapé de site.
  if (IS_APP)
    return (
      <>
        <AppHeader />
        <main id="conteudo" tabIndex={-1} className={isFullscreen ? "" : "min-h-dvh pb-[calc(4rem+env(safe-area-inset-bottom))]"}>
          <Outlet />
        </main>
        <MobileTabBar />
      </>
    );
  if (isApp)
    return (
      <>
        <Outlet />
        <MobileTabBar />
      </>
    );
  return (
    <>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Navbar />
      <main id="conteudo" tabIndex={-1} className={isFullscreen ? "" : "min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"}>
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
        {IS_APP && <AppIntro />}
        {children}
        <Scripts />
      </body>
    </html>
  );
}
