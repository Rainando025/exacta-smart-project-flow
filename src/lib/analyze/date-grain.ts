/** Granularidades de data disponíveis para agrupar uma dimensão temporal. */
export const DATE_GRAINS = [
  "auto",
  "day",
  "week",
  "month",
  "monthYear",
  "quarter",
  "year",
  "weekday",
  "hour",
] as const;

export type DateGrain = (typeof DATE_GRAINS)[number];

export const DATE_GRAIN_LABELS: Record<DateGrain, string> = {
  auto: "Automático",
  day: "Dia",
  week: "Semana",
  month: "Mês",
  monthYear: "Mês/Ano",
  quarter: "Trimestre",
  year: "Ano",
  weekday: "Dia da semana",
  hour: "Hora",
};

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** Converte texto/número em Date, aceitando ISO, dd/mm/aaaa e serial do Excel. */
export function parseDateValue(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    if (v > 20000 && v < 60000) return new Date(Date.UTC(1899, 11, 30 + Math.floor(v)));
    return null;
  }
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  const br = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[ T](\d{1,2}):(\d{2}))?/.exec(s);
  if (br) {
    const [, d, m, y, hh, mm] = br;
    const year = Number(y!.length === 2 ? `20${y}` : y);
    const dt = new Date(year, Number(m) - 1, Number(d), Number(hh ?? 0), Number(mm ?? 0));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  if (!/^\d{4}-\d{2}(-\d{2})?/.test(s) && !/^\d{4}\/\d{2}/.test(s)) return null;
  const dt = new Date(s.length === 7 ? `${s}-01T00:00:00` : s.replace(" ", "T"));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function isDateLike(values: string[]): boolean {
  let ok = 0;
  let seen = 0;
  for (const v of values) {
    if (!v || v === "—") continue;
    seen++;
    if (parseDateValue(v)) ok++;
    if (seen > 60) break;
  }
  return seen > 0 && ok / seen > 0.85;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Rótulo do bucket para a data conforme a granularidade escolhida. */
export function formatGrain(date: Date, grain: Exclude<DateGrain, "auto">): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  switch (grain) {
    case "day":
      return `${pad(date.getDate())}/${pad(m + 1)}/${y}`;
    case "week": {
      const first = new Date(y, 0, 1);
      const week = Math.ceil(((date.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7);
      return `${y}-S${pad(week)}`;
    }
    case "month":
      return MONTHS[m] ?? String(m + 1);
    case "monthYear":
      return `${MONTHS[m]}/${y}`;
    case "quarter":
      return `${y}-T${Math.floor(m / 3) + 1}`;
    case "year":
      return String(y);
    case "weekday":
      return WEEKDAYS[date.getDay()] ?? "—";
    case "hour":
      return `${pad(date.getHours())}h`;
  }
}

/** Chave ordenável (cronológica) para o bucket. */
export function grainSortKey(date: Date, grain: Exclude<DateGrain, "auto">): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  switch (grain) {
    case "day":
      return `${y}${pad(m + 1)}${pad(date.getDate())}`;
    case "week":
      return `${y}${formatGrain(date, "week")}`;
    case "month":
      return pad(m + 1);
    case "monthYear":
      return `${y}${pad(m + 1)}`;
    case "quarter":
      return `${y}${Math.floor(m / 3) + 1}`;
    case "year":
      return String(y);
    case "weekday":
      return String(date.getDay());
    case "hour":
      return pad(date.getHours());
  }
}
