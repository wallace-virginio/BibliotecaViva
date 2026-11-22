import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUp, BookHeart, BookOpen, CalendarDays } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BookCard, LibraryCard } from "@/components/common";
import { Badge } from "@/components/ui";
import { EVENTS, type PlatformEvent } from "@/data/content";
import { FEATURED_LIBRARIES, type Library } from "@/data/libraries";
import { booksBySubject, searchBooks, type Book } from "@/lib/api/openlibrary";
import { openStatus } from "@/lib/hours";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Peça uma indicação — Biblioteca Viva" },
      { name: "description", content: "Pergunte em linguagem natural e receba livros, bibliotecas e eventos sob medida." },
    ],
  }),
  component: Assistente,
});

const SUGGESTIONS = [
  "Quero aprender Inteligência Artificial.",
  "Tenho uma prova de matemática amanhã.",
  "Quero livros para meu filho de 8 anos.",
  "Preciso de um lugar silencioso para estudar hoje.",
  "Sugira um clube de leitura de ficção científica.",
];

type Answer = { text: string; books?: Book[]; libraries?: Library[]; events?: PlatformEvent[] };
type Msg = { role: "user"; text: string } | { role: "bot"; answer?: Answer };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const studySpots = () =>
  FEATURED_LIBRARIES.filter((l) => l.curations.includes("estudar") && l.rooms.available > 0)
    .sort((a, b) => Number(openStatus(b.hours).known && (openStatus(b.hours) as { open?: boolean }).open) - Number(openStatus(a.hours).known && (openStatus(a.hours) as { open?: boolean }).open))
    .slice(0, 3);

/**
 * Motor de intenções local + dados reais da Open Library.
 * Pode ser trocado por um LLM (ex.: Claude) mantendo o mesmo formato de resposta.
 */
async function answer(q: string): Promise<Answer> {
  const t = norm(q);
  if (/inteligencia artificial|\bia\b|machine learning|aprendizado de maquina/.test(t)) {
    return {
      text: "Ótima escolha! Separei livros introdutórios sobre IA, um curso gratuito esta semana e bibliotecas com laboratório maker para praticar.",
      books: await booksBySubject("artificial_intelligence", 6),
      events: EVENTS.filter((e) => e.category === "Curso" || e.category === "Hackathon"),
      libraries: FEATURED_LIBRARIES.filter((l) => l.curations.includes("maker")).slice(0, 3),
    };
  }
  if (/prova|matematica|calculo|algebra|vestibular|enem/.test(t)) {
    return {
      text: "Boa sorte na prova! Aqui estão livros de matemática para revisar e bibliotecas com salas de estudo livres agora. Dica: reserve uma sala para as próximas 2 horas.",
      books: await booksBySubject("mathematics", 6),
      libraries: studySpots(),
    };
  }
  if (/filh|crianca|infantil|anos\b|kids/.test(t)) {
    return {
      text: "Para uma criança de 8 anos, livros ilustrados e aventuras curtas funcionam muito bem. Também encontrei contação de histórias e bibliotecas com espaço infantil.",
      books: await booksBySubject("juvenile_fiction", 6),
      events: EVENTS.filter((e) => e.category === "Crianças"),
      libraries: FEATURED_LIBRARIES.filter((l) => l.curations.includes("criancas")).slice(0, 3),
    };
  }
  if (/silencio|estudar|sala|lugar|concentr/.test(t)) {
    return {
      text: "Encontrei lugares silenciosos com salas disponíveis hoje. Todos têm Wi-Fi e você pode reservar direto pelo app.",
      libraries: studySpots(),
    };
  }
  if (/clube|ficcao cientifica|sci-?fi|leitura em grupo/.test(t)) {
    return {
      text: "Há um clube de ficção científica lendo Duna nesta semana, além de outros clubes abertos. Separei também alguns clássicos do gênero.",
      events: EVENTS.filter((e) => e.category === "Clube de leitura"),
      books: await booksBySubject("science_fiction", 6),
    };
  }
  const res = await searchBooks(q, { limit: 6 });
  return {
    text: res.books.length
      ? `Encontrei ${res.total.toLocaleString("pt-BR")} resultados no acervo aberto. Estes são os mais relevantes:`
      : "Não encontrei nada exato. Que tal tentar com outras palavras ou explorar o mapa de bibliotecas?",
    books: res.books,
  };
}

function Assistente() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [msgs]);

  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    setInput("");
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "bot" }]);
    let a: Answer;
    try {
      a = await answer(q);
    } catch {
      a = { text: "Tive um problema para consultar o acervo agora. Tente novamente em instantes." };
    }
    setMsgs((m) => [...m.slice(0, -1), { role: "bot", answer: a }]);
    setBusy(false);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 pt-20 lg:min-h-screen lg:pt-24">
      {msgs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <span className="grid size-14 place-items-center rounded-xl bg-primary-soft text-primary">
            <BookHeart className="size-7" />
          </span>
          <h1 className="mt-6 text-3xl md:text-4xl">Peça uma indicação</h1>
          <p className="mt-2 max-w-md text-muted-foreground">Conte o que você quer aprender, ler ou fazer. A gente sugere livros, bibliotecas e eventos que combinam.</p>
          <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-2xl border bg-surface px-4 py-3.5 text-left text-sm transition hover:border-primary active:scale-[0.98]">
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-6 py-6">
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-gradient-primary px-4 py-3 text-sm text-primary-foreground">{m.text}</p>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground"><BookOpen className="size-4" /></span>
                <div className="min-w-0 flex-1 space-y-4">
                  {!m.answer ? (
                    <div className="flex gap-1 py-3">
                      {[0, 1, 2].map((d) => <span key={d} className="size-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d * 120}ms` }} />)}
                    </div>
                  ) : (
                    <>
                      <p className="animate-fade-in text-[15px] leading-relaxed">{m.answer.text}</p>
                      {!!m.answer.books?.length && (
                        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-6 sm:px-0">
                          {m.answer.books.slice(0, 6).map((b) => <BookCard key={b.id} book={b} className="w-28 shrink-0 sm:w-auto" />)}
                        </div>
                      )}
                      {!!m.answer.events?.length && (
                        <div className="space-y-2">
                          {m.answer.events.slice(0, 3).map((e) => (
                            <Link key={e.id} to="/eventos" className="flex items-center gap-3 rounded-2xl border bg-surface p-3 hover:border-primary">
                              <CalendarDays className="size-5 shrink-0 text-primary" />
                              <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.title}</span>
                              <Badge tone="primary">{e.date.toLocaleDateString("pt-BR", { weekday: "short" })} {e.time}</Badge>
                            </Link>
                          ))}
                        </div>
                      )}
                      {!!m.answer.libraries?.length && (
                        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
                          {m.answer.libraries.map((l) => <div key={l.slug} className="w-64 shrink-0 sm:w-auto"><LibraryCard lib={l} /></div>)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ),
          )}
          <div ref={end} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] mb-4 flex items-center gap-2 rounded-full border bg-surface p-1.5 pl-5 shadow-elevated lg:bottom-6"
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="O que você deseja aprender hoje?" className="h-11 min-w-0 flex-1 bg-transparent outline-none" />
        <button type="submit" disabled={!input.trim() || busy} className={cn("grid size-11 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground transition disabled:opacity-40")} aria-label="Enviar">
          <ArrowUp className="size-5" />
        </button>
      </form>
    </div>
  );
}
