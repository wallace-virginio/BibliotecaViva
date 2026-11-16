import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { CONTROLLER } from "@/lib/legal";
import { Container } from "./ui";

/** Layout de documento legal: título, versão, sumário e texto confortável de ler no celular. */
export function LegalPage({ title, version, intro, sections }: { title: string; version: string; intro: ReactNode; sections: { id: string; title: string; body: ReactNode }[] }) {
  const draft = CONTROLLER.name.startsWith("[");
  return (
    <Container className="max-w-3xl pt-20 pb-16 md:pt-32">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Documento legal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Versão {version.split("-").reverse().join("/")}</p>
      {draft && (
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-warning-soft p-4 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Documento em revisão: os dados do responsável marcados entre colchetes serão preenchidos antes do lançamento oficial.
        </p>
      )}
      <div className="mt-6 text-[15px] leading-relaxed text-muted-foreground">{intro}</div>
      <nav className="mt-8 rounded-2xl border bg-surface p-5" aria-label="Sumário">
        <p className="mb-2 text-sm font-semibold">Nesta página</p>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-muted-foreground hover:text-primary">{i + 1}. {s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight">{i + 1}. {s.title}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-1.5">{s.body}</div>
          </section>
        ))}
      </div>
      <p className="mt-14 border-t pt-6 text-sm text-muted-foreground">
        Dúvidas? Fale com o encarregado de dados: <a href={`mailto:${CONTROLLER.dpoEmail}`} className="text-primary">{CONTROLLER.dpoEmail}</a> ·{" "}
        <Link to="/app/configuracoes" search={{ aba: "privacidade" }} className="text-primary">Central de privacidade</Link>
      </p>
    </Container>
  );
}
