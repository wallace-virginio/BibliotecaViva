import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Check, Copy, Download, Loader2, Lock, Play, Plug, Star, Trophy } from "lucide-react";
import { useState } from "react";
import { GithubIcon } from "@/components/BrandIcons";
import { CodeBlock, CountUp } from "@/components/common";
import { DashHeader } from "@/components/dashboard";
import { actions, useStore } from "@/lib/store";
import { useMounted } from "@/lib/hooks";
import { Badge, Button, buttonClass, Card, EmptyState, SectionHeader, Tabs } from "@/components/ui";
import { CONNECTORS, CONTRIBUTORS, OPEN_SOURCE_STATS, PROVIDER_EXAMPLE, SDKS } from "@/data/content";
import { cn, compactNumber, formatNumber } from "@/lib/utils";

export const Route = createFileRoute("/app/desenvolvedor")({
  head: () => ({
    meta: [
      { title: "Área do desenvolvedor — Biblioteca Viva" },
      { name: "description", content: "SDKs, API Playground, marketplace de conectores e open source. Integre a biblioteca da sua cidade criando um Provider." },
    ],
  }),
  component: Devs,
});

const ENDPOINTS = {
  books: {
    label: "GET /v1/books",
    param: "q",
    placeholder: "machado de assis",
    upstream: "Open Library",
    build: (v: string) => ({ url: `https://openlibrary.org/search.json?q=${encodeURIComponent(v)}&limit=3&fields=key,title,author_name,first_publish_year,cover_i`, init: undefined as RequestInit | undefined }),
  },
  libraries: {
    label: "GET /v1/libraries/nearby",
    param: "city",
    placeholder: "Recife",
    upstream: "Nominatim + Overpass",
    build: (v: string) => ({ url: `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v)}&format=jsonv2&limit=1`, init: undefined as RequestInit | undefined }),
  },
  geocode: {
    label: "GET /v1/geocode",
    param: "q",
    placeholder: "Biblioteca Mário de Andrade",
    upstream: "Nominatim",
    build: (v: string) => ({ url: `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v)}&format=jsonv2&limit=2`, init: undefined as RequestInit | undefined }),
  },
} as const;
type EndpointKey = keyof typeof ENDPOINTS;

function Devs() {
  const devMode = useStore((s) => s.developerMode);
  const mounted = useMounted(); // a preferência fica no aparelho: só decide depois de hidratar
  if (!mounted) return <div className="skeleton h-64 rounded-3xl" />;
  if (!devMode)
    return (
      <EmptyState
        icon={<Lock className="size-6" />}
        title="Modo desenvolvedor desativado"
        description="Ative o modo desenvolvedor nas configurações da sua conta para acessar SDKs, API Playground e o marketplace de conectores."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => actions.setDeveloperMode(true)}>Ativar agora</Button>
            <Link to="/app/configuracoes" search={{ aba: "desenvolvedor" }} className={buttonClass("outline", "md")}>Ver configurações</Link>
          </div>
        }
      />
    );
  return (
    <>
      <DashHeader
        title="Área do desenvolvedor"
        description="Crie um Provider para conectar a biblioteca da sua cidade. SDKs em 6 linguagens, API aberta e uma comunidade que revisa seu código."
        action={<a href="https://github.com" target="_blank" rel="noreferrer" className={buttonClass("outline", "sm")}><GithubIcon className="size-4" /> GitHub</a>}
      />
      <div className="space-y-16 md:space-y-20">
        <section className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">O que é um Provider?</h2>
            <p className="mt-3 text-muted-foreground">Um Provider traduz o sistema de uma biblioteca (Koha, Pergamum, Sophia, uma planilha…) para o padrão aberto da Biblioteca Viva. Você implementa poucas funções — <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">catalog</code>, <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">events</code>, <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">rooms</code> — e a biblioteca aparece no mapa, na busca e no app.</p>
            <ol className="mt-6 space-y-3">
              {["Instale o SDK da sua linguagem", "Implemente defineProvider(...)", "Rode bv test para validar o contrato", "Publique com bv publish e abra um PR"].map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-soft-foreground">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <CodeBlock code={PROVIDER_EXAMPLE} title="providers/recife.ts" />
        </section>

        <section id="sdks" className="scroll-mt-24">
          <SectionHeader align="left" eyebrow="SDKs" title="Sua linguagem, seu jeito" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SDKS.map((s) => <SdkCard key={s.name} sdk={s} />)}
          </div>
        </section>

        <section>
          <SectionHeader align="left" eyebrow="API Playground" title="Requisições reais, respostas reais" description="Os endpoints públicos da Biblioteca Viva agregam fontes abertas. Experimente:" />
          <Playground />
        </section>

        <section>
          <SectionHeader align="left" eyebrow="Marketplace" title="Conectores da comunidade" />
          <Marketplace />
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Trophy className="size-6 text-primary" /> Leaderboard</h2>
            <Card className="mt-5 divide-y">
              {CONTRIBUTORS.map((c, i) => (
                <div key={c.handle} className="flex items-center gap-3 p-4">
                  <span className="w-5 text-sm font-semibold text-muted-foreground">{i + 1}</span>
                  <span className={cn("grid size-9 place-items-center rounded-full text-xs font-semibold text-on-image", `bg-cover-${(i % 8) + 1}`)}>{c.name.split(" ").map((n) => n[0]).join("")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">@{c.handle} · {c.city}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold tabular-nums">{formatNumber(c.commits)} commits</p>
                    <p className="text-muted-foreground">{c.connectors} conectores</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>
          <div className="rounded-3xl bg-code-bg p-6 text-code-fg md:p-8">
            <p className="flex items-center gap-2 text-sm text-code-muted"><GithubIcon className="size-4" /> Open source · MIT</p>
            <h2 className="mt-2 text-2xl font-semibold">Métricas do projeto</h2>
            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-glass-border bg-glass-border sm:grid-cols-3">
              {OPEN_SOURCE_STATS.map((s) => (
                <div key={s.label} className="bg-code-bg p-5">
                  <p className="text-2xl font-semibold"><CountUp value={s.value} /></p>
                  <p className="mt-1 text-xs text-code-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function SdkCard({ sdk }: { sdk: (typeof SDKS)[number] }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card className="card-hover flex flex-col p-5">
      <div className="flex items-center gap-3">
        <span className={cn("grid size-11 place-items-center rounded-2xl text-sm font-bold text-on-image", sdk.color)}>{sdk.name.slice(0, 2)}</span>
        <div>
          <p className="font-semibold">SDK {sdk.name}</p>
          <p className="text-xs text-muted-foreground">{sdk.lang} · <Download className="inline size-3" /> {compactNumber(sdk.downloads)}</p>
        </div>
      </div>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(sdk.install);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-code-bg px-3.5 py-3 text-left font-mono text-xs text-code-fg"
      >
        <span className="truncate">$ {sdk.install}</span>
        {copied ? <Check className="size-4 shrink-0 text-code-string" /> : <Copy className="size-4 shrink-0 text-code-muted" />}
      </button>
    </Card>
  );
}

function Playground() {
  const [ep, setEp] = useState<EndpointKey>("books");
  const [value, setValue] = useState("");
  const [state, setState] = useState<{ loading?: boolean; status?: number; ms?: number; body?: string }>({});
  const cfg = ENDPOINTS[ep];

  const run = async () => {
    const v = value || cfg.placeholder;
    setState({ loading: true });
    const t0 = performance.now();
    try {
      let { url } = cfg.build(v);
      let res = await fetch(url);
      let json = await res.json();
      if (ep === "libraries" && json[0]) {
        const { lat, lon } = json[0];
        url = "https://overpass-api.de/api/interpreter";
        res = await fetch(url, { method: "POST", body: new URLSearchParams({ data: `[out:json][timeout:20];nwr["amenity"="library"]["name"](around:4000,${lat},${lon});out center tags 5;` }) });
        const o = await res.json();
        json = { city: v, center: { lat: +lat, lon: +lon }, libraries: o.elements.map((e: { id: number; tags: Record<string, string>; lat?: number; lon?: number; center?: { lat: number; lon: number } }) => ({ id: `osm-${e.id}`, name: e.tags.name, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon, opening_hours: e.tags.opening_hours ?? null })) };
      }
      if (ep === "books") json = { total: json.numFound, items: json.docs.map((d: { key: string; title: string; author_name?: string[]; first_publish_year?: number; cover_i?: number }) => ({ id: d.key.replace("/works/", ""), title: d.title, authors: d.author_name, year: d.first_publish_year, cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null })) };
      setState({ status: res.status, ms: Math.round(performance.now() - t0), body: JSON.stringify(json, null, 2) });
    } catch (e) {
      setState({ status: 0, ms: Math.round(performance.now() - t0), body: JSON.stringify({ error: (e as Error).message }, null, 2) });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <Tabs value={ep} onChange={(v) => { setEp(v); setState({}); setValue(""); }} options={(Object.keys(ENDPOINTS) as EndpointKey[]).map((k) => ({ value: k, label: k }))} />
        <div className="mt-5 rounded-2xl bg-surface-2 p-4 font-mono text-xs">
          <span className="font-semibold text-success">GET</span> <span className="break-all">https://api.bibliotecaviva.org{cfg.label.replace("GET ", "")}?{cfg.param}={encodeURIComponent(value || cfg.placeholder)}</span>
        </div>
        <label className="mt-4 block text-xs font-medium text-muted-foreground">{cfg.param}</label>
        <div className="mt-1.5 flex gap-2">
          <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} placeholder={cfg.placeholder} className="h-11 min-w-0 flex-1 rounded-xl border bg-surface px-3 font-mono text-sm outline-none focus:border-primary" />
          <Button onClick={run} disabled={state.loading}>{state.loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Enviar</Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Fonte: {cfg.upstream} (dados abertos, sem chave de API).</p>
      </Card>
      <div className="overflow-hidden rounded-2xl border border-glass-border bg-code-bg">
        <div className="flex items-center justify-between border-b border-glass-border px-4 py-3 font-mono text-xs text-code-muted">
          <span>Resposta</span>
          {state.status !== undefined && (
            <span><span className={state.status === 200 ? "text-code-string" : "text-danger"}>{state.status || "ERR"}</span> · {state.ms} ms</span>
          )}
        </div>
        <pre className="h-80 overflow-auto p-4 font-mono text-xs leading-relaxed text-code-fg">{state.loading ? "Carregando…" : state.body ?? "// Clique em Enviar para fazer uma requisição real"}</pre>
      </div>
    </div>
  );
}

function Marketplace() {
  const [filter, setFilter] = useState<"Todos" | "Provider" | "Utilitário">("Todos");
  const installed = useStore((s) => s.devConnectors); // salvo de verdade (aparelho + conta)
  return (
    <>
      <Tabs value={filter} onChange={setFilter} options={[{ value: "Todos", label: "Todos" }, { value: "Provider", label: "Providers" }, { value: "Utilitário", label: "Utilitários" }]} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CONNECTORS.filter((c) => filter === "Todos" || c.kind === filter).map((c) => (
          <Card key={c.name} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground"><Plug className="size-5" /></span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3.5 fill-star text-star" /> {formatNumber(c.stars)}</span>
            </div>
            <p className="mt-4 flex items-center gap-1.5 font-mono text-sm font-medium">{c.name} {c.verified && <BadgeCheck className="size-4 text-primary" />}</p>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <Badge>{c.kind}</Badge>
              <Button size="sm" variant={installed.includes(c.name) ? "soft" : "outline"} onClick={() => actions.toggleConnector(c.name)}>
                {installed.includes(c.name) ? "Instalado ✓" : "Instalar"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
