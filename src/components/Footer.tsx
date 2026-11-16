import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { GithubIcon as Github, InstagramIcon as Instagram, LinkedinIcon as Linkedin, YoutubeIcon as Youtube } from "./BrandIcons";
import { Logo } from "./Logo";
import { Container } from "./ui";

const COLS = [
  {
    title: "Plataforma",
    links: [
      { to: "/descobrir", label: "Descobrir" },
      { to: "/acervo", label: "Acervo" },
      { to: "/eventos", label: "Eventos" },
      { to: "/salas", label: "Salas de estudo" },
      { to: "/assistente", label: "Biblioteca Viva AI" },
    ],
  },
  {
    title: "Comunidade",
    links: [
      { to: "/comunidade", label: "Clubes e grupos" },
      { to: "/roadmap", label: "Roadmap" },
      { to: "/sobre", label: "Manifesto" },
    ],
  },
  {
    title: "Para bibliotecas",
    links: [
      { to: "/entrar", label: "Cadastrar biblioteca" },
      { to: "/app/admin", label: "Painel da biblioteca" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t bg-surface-2/60">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">Transformando bibliotecas em centros de conhecimento.</p>
          <a href="mailto:ola@bibliotecaviva.org" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <Mail className="size-4" /> ola@bibliotecaviva.org
          </a>
          <div className="flex gap-2">
            {[Github, Linkedin, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" aria-label="Rede social" className="grid size-9 place-items-center rounded-full border bg-surface text-muted-foreground transition hover:border-primary hover:text-primary">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        {COLS.map((c) => (
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
          © {new Date().getFullYear()} Biblioteca Viva · Projeto open source sob licença MIT ·{" "}
          <Link to="/privacidade" className="hover:text-foreground">Privacidade</Link> ·{" "}
          <Link to="/termos" className="hover:text-foreground">Termos de Uso</Link>
        </p>
        <p>
          Dados: OpenStreetMap, Open Library, Wikimedia Commons, Nominatim.
        </p>
      </Container>
    </footer>
  );
}
