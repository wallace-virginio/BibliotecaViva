import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { geocode, type Place } from "@/lib/api/geo";
import { useDebounce } from "@/lib/hooks";
import { useLocation } from "@/lib/location";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

const QUICK = [
  { label: "São Paulo", lat: -23.5505, lon: -46.6333 },
  { label: "Rio de Janeiro", lat: -22.9068, lon: -43.1729 },
  { label: "Belo Horizonte", lat: -19.9167, lon: -43.9345 },
  { label: "Recife", lat: -8.0476, lon: -34.877 },
  { label: "Porto Alegre", lat: -30.0346, lon: -51.2177 },
  { label: "Brasília", lat: -15.7939, lon: -47.8828 },
];

/** "Onde você está?" — escolhido uma vez e usado em todo o app durante a sessão. */
export function LocationSheet() {
  const { sheetOpen, closeSheet, setLocation, locateWithGps, location } = useLocation();
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [gps, setGps] = useState<"idle" | "loading" | "denied">("idle");
  const debounced = useDebounce(q, 400);

  useEffect(() => {
    if (debounced.trim().length < 3) return setPlaces([]);
    const c = new AbortController();
    geocode(debounced, c.signal).then(setPlaces).catch(() => {});
    return () => c.abort();
  }, [debounced]);

  useEffect(() => {
    if (!sheetOpen) {
      setQ("");
      setGps("idle");
    }
  }, [sheetOpen]);

  if (!sheetOpen) return null;

  const pick = (label: string, lat: number, lon: number) => {
    setLocation({ label, lat, lon, source: "cidade" });
    closeSheet();
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-overlay sm:items-center sm:p-4" onClick={closeSheet} role="dialog" aria-modal="true" aria-labelledby="loc-title">
      <div
        className="w-full max-w-md animate-fade-up rounded-t-3xl bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-elevated sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="loc-title" className="text-xl">Onde você está?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Mostramos bibliotecas, livros disponíveis e eventos perto de você — não do outro lado do mundo.</p>
          </div>
          <button onClick={closeSheet} className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2" aria-label="Fechar">
            <X className="size-4" />
          </button>
        </div>

        <Button
          className="mt-5 w-full"
          size="lg"
          disabled={gps === "loading"}
          onClick={async () => {
            setGps("loading");
            try {
              await locateWithGps();
              closeSheet();
            } catch {
              setGps("denied");
            }
          }}
        >
          {gps === "loading" ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />} Usar minha localização
        </Button>
        {gps === "denied" && <p className="mt-2 text-xs text-danger">Não foi possível obter a localização. Escolha a cidade abaixo.</p>}

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> ou escolha a cidade <span className="h-px flex-1 bg-border" /></div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cidade ou bairro…"
            className="h-11 w-full rounded-xl border bg-surface pr-4 pl-10 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            aria-label="Buscar cidade"
          />
        </div>
        {places.length > 0 ? (
          <ul className="mt-2 max-h-56 overflow-y-auto rounded-xl border">
            {places.map((p) => (
              <li key={`${p.lat},${p.lon}`}>
                <button onClick={() => pick(p.name, p.lat, p.lon)} className="flex w-full items-start gap-2 px-4 py-3 text-left text-sm hover:bg-surface-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="line-clamp-2">{p.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK.map((c) => (
              <button
                key={c.label}
                onClick={() => pick(c.label, c.lat, c.lon)}
                className={cn("h-9 rounded-full border px-3.5 text-sm transition hover:border-primary", location?.label === c.label && "border-primary bg-primary-soft text-primary-soft-foreground")}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        <p className="mt-5 text-[11px] leading-snug text-muted-foreground">Fica salvo só neste aparelho, enquanto o app estiver aberto. Você pode trocar a qualquer momento no topo da tela.</p>
      </div>
    </div>
  );
}

/** Chip com a cidade atual, no topo do app. */
export function LocationChip({ className }: { className?: string }) {
  const { location, ask, ready } = useLocation();
  return (
    <button
      onClick={ask}
      className={cn("flex h-9 max-w-[11rem] items-center gap-1.5 rounded-full border bg-surface px-3 text-sm transition hover:border-primary", className)}
      aria-label={location ? `Localização: ${location.label}. Trocar` : "Definir localização"}
    >
      <MapPin className="size-4 shrink-0 text-primary" />
      <span className="truncate">{ready && location ? location.label : "Onde você está?"}</span>
    </button>
  );
}
