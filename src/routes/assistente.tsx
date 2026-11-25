import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUp, CalendarDays, History, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BookCard, LibraryCard } from "@/components/common";
import { Badge } from "@/components/ui";
import { EVENTS, type PlatformEvent } from "@/data/content";
import { FEATURED_LIBRARIES, type Library } from "@/data/libraries";
import { booksBySubject, searchBooks, type Book } from "@/lib/api/openlibrary";
import { openStatus } from "@/lib/hours";
import { askAssistant, type AssistantPlan, type ChatTurn } from "@/lib/api/assistant";
import { deleteConversation, getConversation, listConversations, saveConversation, type ConversationSummary, type StoredMessage } from "@/lib/api/conversations";
import { useAuth } from "@/lib/auth";
import { FEATURES } from "@/lib/features";
import { actions } from "@/lib/store";
import { useLocation } from "@/lib/location";
import { cn } from "@/lib/utils";
import { messagesFor, useI18n, usePageTitle, type Locale } from "@/lib/i18n";
import { localeTag } from "@/lib/locale";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Peça uma indicação — Biblioteca Viva" },
      { name: "description", content: "Pergunte em linguagem natural e receba livros, bibliotecas e eventos sob medida." },
    ],
  }),
  component: Assistente,
});

type Answer = { text: string; books?: Book[]; libraries?: Library[]; events?: PlatformEvent[]; ai?: boolean; plan?: AssistantPlan };
type Msg = { role: "user"; text: string } | { role: "bot"; answer?: Answer };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const studySpots = () =>
  FEATURED_LIBRARIES.filter((l) => l.curations.includes("estudar") && l.rooms.available > 0)
    .sort((a, b) => Number(openStatus(b.hours).known && (openStatus(b.hours) as { open?: boolean }).open) - Number(openStatus(a.hours).known && (openStatus(a.hours) as { open?: boolean }).open))
    .slice(0, 3);

/**
 * Motor de intenções local (quando a IA não está disponível) + dados reais da Open Library.
 * Entende pedidos em português, inglês e espanhol e responde no idioma da tela.
 */
async function answer(q: string, lang: Locale): Promise<Answer> {
  const t = norm(q);
  const say = messagesFor(lang).ori.local;
  if (/inteligencia artificial|artificial intelligence|\bia\b|\bai\b|machine learning|aprendizado de maquina|aprendizaje automatico/.test(t)) {
    return {
      text: say.ai,
      books: await booksBySubject("artificial_intelligence", 6),
      events: EVENTS.filter((e) => e.category === "Curso" || e.category === "Hackathon"),
      libraries: FEATURED_LIBRARIES.filter((l) => l.curations.includes("maker")).slice(0, 3),
    };
  }
  if (/prova|matematica|calculo|algebra|vestibular|enem|exam|math|test\b|examen/.test(t)) {
    return {
      text: say.exam,
      books: await booksBySubject("mathematics", 6),
      libraries: studySpots(),
    };
  }
  if (/filh|crianca|infantil|anos\b|kids|child|year-old|hijo|nino/.test(t)) {
    return {
      text: say.kids,
      books: await booksBySubject("juvenile_fiction", 6),
      events: EVENTS.filter((e) => e.category === "Crianças"),
      libraries: FEATURED_LIBRARIES.filter((l) => l.curations.includes("criancas")).slice(0, 3),
    };
  }
  if (/silencio|estudar|sala|lugar|concentr|quiet|study|place to|tranquilo/.test(t)) {
    return {
      text: say.study,
      libraries: studySpots(),
    };
  }
  if (/clube|ficcao cientifica|sci-?fi|science fiction|ciencia ficcion|leitura em grupo|book club/.test(t)) {
    return {
      text: say.scifi,
      events: FEATURES.eventos ? EVENTS.filter((e) => e.category === "Clube de leitura") : undefined,
      books: await booksBySubject("science_fiction", 6),
    };
  }
  const res = await searchBooks(q, { limit: 6 });
  return {
    text: res.books.length
      ? say.found(res.total.toLocaleString(localeTag(lang)))
      : say.none,
    books: res.books,
  };
}

/** Transforma o plano da IA em cards com dados reais (Open Library, bibliotecas, agenda). */
async function fromPlan(plan: AssistantPlan): Promise<Answer> {
  let books: Book[] | undefined;
  if (plan.books?.query) books = (await searchBooks(plan.books.query, { limit: 6 }).catch(() => ({ books: [] as Book[] }))).books;
  if (!books?.length && plan.books?.subject) books = await booksBySubject(plan.books.subject, 6).catch(() => []);
  const libraries = plan.libraries ? (plan.libraries === "estudar" ? studySpots() : FEATURED_LIBRARIES.filter((l) => l.curations.includes(plan.libraries!)).slice(0, 3)) : undefined;
  // eventos ainda são de exemplo: não aparecem como card enquanto a agenda real não estiver conectada
  const events = FEATURES.eventos && plan.events ? EVENTS.filter((e) => (plan.events as string[]).includes(e.category)) : undefined;
  return { text: plan.reply, books, libraries, events, ai: true, plan };
}

/** Mensagens da tela → formato guardado no histórico (só texto + o plano da IA para refazer os cards). */
const toStored = (msgs: Msg[]): StoredMessage[] =>
  msgs.flatMap((m): StoredMessage[] =>
    m.role === "user" ? [{ role: "user", content: m.text }] : m.answer ? [{ role: "assistant", content: m.answer.text, ...(m.answer.plan && { plan: m.answer.plan }) }] : [],
  );

function Assistente() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const { location } = useLocation();
  const auth = useAuth();
  // histórico (só com login): id da conversa aberta e situação do último salvamento
  const [convId, setConvId] = useState<string>();
  const [saved, setSaved] = useState<"ok" | "erro" | "desligado">();
  const [showHistory, setShowHistory] = useState(false);
  const { t, locale } = useI18n();
  usePageTitle(t.ori.metaTitle);

  const newConversation = () => {
    setMsgs([]);
    setConvId(undefined);
    setSaved(undefined);
    setShowHistory(false);
  };

  const openConversation = async (id: string) => {
    setShowHistory(false);
    setBusy(true);
    try {
      const c = await getConversation(id);
      const rebuilt: Msg[] = [];
      for (const m of c.messages) {
        if (m.role === "user") rebuilt.push({ role: "user", text: m.content });
        // os cards são refeitos com dados atuais (livros, bibliotecas, agenda) a partir do plano guardado
        else rebuilt.push({ role: "bot", answer: m.plan ? await fromPlan(m.plan) : { text: m.content } });
      }
      setMsgs(rebuilt);
      setConvId(c.id);
      setSaved("ok");
    } catch {
      setSaved("erro");
    }
    setBusy(false);
  };

  // chaves: no Chrome novo scrollIntoView() devolve uma Promise, e um efeito não pode devolver nada além de limpeza
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    setInput("");
    setBusy(true);
    // histórico para a IA (só o texto: perguntas e respostas anteriores)
    const history: ChatTurn[] = [
      ...msgs.flatMap((m): ChatTurn[] => (m.role === "user" ? [{ role: "user", content: m.text }] : m.answer ? [{ role: "assistant", content: m.answer.text }] : [])),
      { role: "user", content: q },
    ];
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "bot" }]);
    let a: Answer;
    try {
      const res = await askAssistant(history, location?.label, locale);
      // IA indisponível (sem internet, cota do dia, limite): assistente local, sem IA
      a = "plan" in res ? await fromPlan(res.plan) : await answer(q, locale);
      if ("error" in res && res.error === "limite") a.text = `${t.ori.rateLimited}${a.text}`;
    } catch {
      a = { text: t.ori.failed };
    }
    setMsgs((m) => [...m.slice(0, -1), { role: "bot", answer: a }]);
    actions.countOriChat(); // conquista "Oi, Ori!"
    setBusy(false);

    // guarda no histórico da pessoa (criptografado no servidor; só ela lê)
    if (auth.user) {
      const stored = toStored([...msgs, { role: "user", text: q }, { role: "bot", answer: a }]);
      saveConversation(convId, stored)
        .then((id) => {
          setConvId(id);
          setSaved("ok");
        })
        .catch((e: Error) => setSaved(e.message === "historico-desligado" ? "desligado" : "erro"));
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 pt-20 lg:min-h-screen lg:pt-24">
      {/* barra do histórico */}
      <div className="relative flex items-center justify-between gap-2 pt-3">
        {msgs.length > 0 ? (
          <button onClick={newConversation} className="flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-primary hover:bg-surface-2">
            <Plus className="size-4" /> {t.ori.newChat}
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={() => setShowHistory((v) => !v)}
          aria-expanded={showHistory}
          className="flex h-11 items-center gap-1.5 rounded-full border bg-surface px-3.5 text-sm font-medium hover:border-primary"
        >
          <History className="size-4" /> {t.ori.history}
        </button>
        {showHistory && <HistoryPanel loggedIn={!!auth.user} currentId={convId} onOpen={openConversation} onDeleted={(id) => id === convId && newConversation()} onClose={() => setShowHistory(false)} />}
      </div>

      {msgs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <img
            src="/ori/ori-256.webp"
            srcSet="/ori/ori-256.webp 1x, /ori/ori-512.webp 2x"
            alt={t.ori.alt}
            width={128}
            height={128}
            className="ori-float size-32 rounded-full object-cover shadow-elevated"
          />
          <h1 className="mt-6 text-3xl md:text-4xl">{t.ori.hello}</h1>
          <p className="mt-2 max-w-md text-muted-foreground">{t.ori.intro}</p>
          <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
            {t.ori.suggestions.map((s) => (
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
                <img src="/ori/ori-128.webp" alt="Ori" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover" />
                <div className="min-w-0 flex-1 space-y-4">
                  {!m.answer ? (
                    <div className="flex gap-1 py-3">
                      {[0, 1, 2].map((d) => <span key={d} className="size-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d * 120}ms` }} />)}
                    </div>
                  ) : (
                    <>
                      <p className="animate-fade-in text-[15px] leading-relaxed">{m.answer.text}</p>
                      {m.answer.ai && (
                        <p className="text-xs text-muted-foreground">{t.ori.aiNote}</p>
                      )}
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
                              <Badge tone="primary">{e.date.toLocaleDateString(localeTag(locale), { weekday: "short" })} {e.time}</Badge>
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
          {/* situação do histórico, discreta, depois da última resposta */}
          {!busy && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              {!auth.user ? (
                <>
                  <Link to="/entrar" search={{ redirect: "/assistente" }} className="font-medium text-primary underline-offset-2 hover:underline">
                    {t.ori.signIn}
                  </Link>
                  {t.ori.saveHint}
                </>
              ) : saved === "ok" ? (
                <>
                  <Lock className="size-3.5" /> {t.ori.saved}
                </>
              ) : saved === "desligado" ? (
                t.ori.historyOff
              ) : saved === "erro" ? (
                t.ori.saveError
              ) : null}
            </p>
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
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.ori.placeholder} className="h-11 min-w-0 flex-1 bg-transparent outline-none" />
        <button type="submit" disabled={!input.trim() || busy} className={cn("grid size-11 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground transition disabled:opacity-40")} aria-label={t.ori.send}>
          <ArrowUp className="size-5" />
        </button>
      </form>
    </div>
  );
}

/** Lista das conversas guardadas (só da pessoa logada). Tocar abre; a lixeira pede confirmação e apaga de vez. */
function HistoryPanel({
  loggedIn,
  currentId,
  onOpen,
  onDeleted,
  onClose,
}: {
  loggedIn: boolean;
  currentId?: string;
  onOpen: (id: string) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ConversationSummary[]>();
  const [state, setState] = useState<"carregando" | "ok" | "erro" | "desligado">("carregando");
  const [confirm, setConfirm] = useState<string>();
  const { t, locale } = useI18n();

  useEffect(() => {
    if (!loggedIn) return;
    const c = new AbortController();
    listConversations(c.signal)
      .then((list) => {
        setItems(list);
        setState("ok");
      })
      .catch((e: Error) => !c.signal.aborted && setState(e.message === "historico-desligado" ? "desligado" : "erro"));
    return () => c.abort();
  }, [loggedIn]);

  const remove = async (id: string) => {
    setConfirm(undefined);
    setItems((l) => l?.filter((x) => x.id !== id));
    await deleteConversation(id).catch(() => setState("erro"));
    onDeleted(id);
  };

  return (
    <div className="absolute top-full right-0 z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl border bg-surface p-2 shadow-elevated" role="dialog" aria-label={t.ori.historyDialog}>
      <div className="flex items-center justify-between px-2 py-1.5">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Lock className="size-3.5 text-primary" /> {t.ori.yourChats}
        </p>
        <button onClick={onClose} className="h-9 rounded-full px-3 text-sm text-muted-foreground hover:bg-surface-2">
          {t.common.close}
        </button>
      </div>
      {!loggedIn ? (
        <p className="px-2 pb-2 text-sm text-muted-foreground">
          <Link to="/entrar" search={{ redirect: "/assistente" }} className="font-medium text-primary">
            {t.ori.signIn}
          </Link>
          {t.ori.historyLoggedOut}
        </p>
      ) : state === "carregando" ? (
        <p className="flex items-center gap-2 px-2 pb-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {t.common.loading}
        </p>
      ) : state === "desligado" ? (
        <p className="px-2 pb-2 text-sm text-muted-foreground">{t.ori.historyOff}</p>
      ) : state === "erro" ? (
        <p className="px-2 pb-2 text-sm text-muted-foreground">{t.ori.historyError}</p>
      ) : !items?.length ? (
        <p className="px-2 pb-2 text-sm text-muted-foreground">{t.ori.historyEmpty}</p>
      ) : (
        <ul className="max-h-[55vh] overflow-y-auto">
          {items.map((c) => (
            <li key={c.id} className={cn("flex items-center gap-1 rounded-lg", c.id === currentId && "bg-surface-2")}>
              <button onClick={() => onOpen(c.id)} className="min-h-12 min-w-0 flex-1 px-2 py-1.5 text-left">
                <span className="block truncate text-sm font-medium">{c.titulo}</span>
                <span className="block text-xs text-muted-foreground">
                  {new Date(c.atualizada).toLocaleDateString(localeTag(locale), { day: "2-digit", month: "short" })} · {t.ori.messages(c.mensagens)}
                </span>
              </button>
              {confirm === c.id ? (
                <button onClick={() => remove(c.id)} className="h-9 shrink-0 rounded-full bg-danger px-3 text-xs font-semibold text-white">
                  {t.ori.delete}
                </button>
              ) : (
                <button onClick={() => setConfirm(c.id)} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-danger" aria-label={t.ori.deleteChat(c.titulo)}>
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
