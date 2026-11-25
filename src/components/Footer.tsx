import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { GithubIcon as Github, InstagramIcon as Instagram, LinkedinIcon as Linkedin, YoutubeIcon as Youtube } from "./BrandIcons";
import { Logo } from "./Logo";
import { Container } from "./ui";
import { useT } from "@/lib/i18n";
import type { Messages } from "@/i18n/pt";

const cols = (t: Messages) => [
  {
    title: t.footer.plataforma,
    links: [
      { to: "/descobrir", label: t.nav.descobrir },
      { to: "/acervo", label: t.nav.acervo },
      { to: "/eventos", label: t.nav.eventos },
      { to: "/salas", label: t.footer.salasDeEstudo },
      { to: "/assistente", label: t.nav.assistente },
    ],
  },
  {
    title: t.footer.comunidade,
    links: [
      { to: "/comunidade", label: t.footer.clubes },
      { to: "/roadmap", label: t.nav.roadmap },
      { to: "/sobre", label: t.footer.manifesto },
    ],
  },
  {
    title: t.footer.paraBibliotecas,
    links: [
      { to: "/entrar", label: t.footer.cadastrar },
      { to: "/app/admin", label: t.footer.painel },
    ],
  },
];

export function Footer() {
  const t = useT();
  return (
    <footer className="border-t bg-surface-2/60">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{t.footer.tagline}</p>
          <a href="mailto:ola@bibliotecaviva.org" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <Mail className="size-4" /> ola@bibliotecaviva.org
          </a>
          <div className="flex gap-2">
            {[Github, Linkedin, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" aria-label={t.footer.social} className="grid size-9 place-items-center rounded-full border bg-surface text-muted-foreground transition hover:border-primary hover:text-primary">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        {cols(t).map((c) => (
          <div key={c.title}>
            <h4 className="mb-4 text-sm font-semibold">{c.title}</h4>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground transition hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="flex flex-col items-start justify-between gap-3 border-t py-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <p>
          © {new Date().getFullYear()} Biblioteca Viva · {t.footer.rights} ·{" "}
          <Link to="/privacidade" className="hover:text-foreground">{t.footer.privacidade}</Link> ·{" "}
          <Link to="/termos" className="hover:text-foreground">{t.footer.termos}</Link>
        </p>
        <p>
          {t.footer.dados}
        </p>
      </Container>
    </footer>
  );
}
