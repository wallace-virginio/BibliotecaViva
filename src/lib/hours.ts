/**
 * Parser leve para o subconjunto mais comum da tag `opening_hours` do OpenStreetMap,
 * ex.: "Mo-Fr 09:00-18:00; Sa 09:00-13:00". Formatos exóticos caem em `undefined`.
 */
export type DayHours = { day: number; ranges: [string, string][] }; // day: 0 = domingo

const DAY_CODES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function expandDays(spec: string): number[] {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const [a, b] = part.trim().split("-");
    const ia = DAY_CODES.indexOf(a);
    if (ia < 0) return [];
    if (!b) {
      out.add(ia);
      continue;
    }
    const ib = DAY_CODES.indexOf(b);
    if (ib < 0) return [];
    for (let i = ia; ; i = (i + 1) % 7) {
      out.add(i);
      if (i === ib) break;
    }
  }
  return [...out];
}

export function parseOpeningHours(raw?: string): DayHours[] | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (s === "24/7") return [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, ranges: [["00:00", "24:00"]] }));
  const week: DayHours[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, ranges: [] }));
  let any = false;
  for (const rule of s.split(";")) {
    const r = rule.trim();
    if (!r || /^PH/.test(r)) continue;
    const m = r.match(/^([A-Za-z,\- ]+?)\s+(off|closed|[\d:,\- ]+)$/);
    if (!m) {
      // regra só com horário → todos os dias
      const t = r.match(/^([\d:,\- ]+)$/);
      if (!t) return undefined;
      const ranges = parseRanges(t[1]);
      if (!ranges) return undefined;
      week.forEach((d) => (d.ranges = ranges));
      any = true;
      continue;
    }
    const days = expandDays(m[1].replace(/\s/g, ""));
    if (!days.length) return undefined;
    const ranges = /off|closed/.test(m[2]) ? [] : parseRanges(m[2]);
    if (!ranges) return undefined;
    days.forEach((d) => (week[d].ranges = ranges));
    any = true;
  }
  return any ? week : undefined;
}

function parseRanges(s: string): [string, string][] | undefined {
  const out: [string, string][] = [];
  for (const p of s.split(",")) {
    const m = p.trim().match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
    if (!m) return undefined;
    out.push([m[1].padStart(5, "0"), m[2].padStart(5, "0")]);
  }
  return out;
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function openStatus(week?: DayHours[], now = new Date()) {
  if (!week) return { known: false as const };
  const today = week[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const [a, b] of today.ranges) {
    if (mins >= toMin(a) && mins < toMin(b)) return { known: true as const, open: true, until: b };
  }
  const next = today.ranges.find(([a]) => toMin(a) > mins);
  return { known: true as const, open: false, opensAt: next?.[0] };
}

export function formatRanges(ranges: [string, string][]) {
  return ranges.length ? ranges.map(([a, b]) => `${a} – ${b}`).join(", ") : "Fechada";
}
