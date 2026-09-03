import type { Agg, ChartSpec, Field, Row } from "./types";
import { formatGrain, grainSortKey, isDateLike, parseDateValue, type DateGrain } from "./date-grain";

export function inferFields(rows: Row[]): Field[] {
  const names = new Set<string>();
  rows.slice(0, 200).forEach((r) => Object.keys(r).forEach((k) => names.add(k)));
  return Array.from(names).map((name) => {
    let num = 0;
    let date = 0;
    let seen = 0;
    for (const r of rows.slice(0, 200)) {
      const v = r[name];
      if (v === null || v === undefined || v === "") continue;
      seen++;
      if (typeof v === "number" || (typeof v === "string" && isNumeric(v))) num++;
      else if (typeof v === "string" && !Number.isNaN(Date.parse(v)) && /\d{4}|\/|-/.test(v)) date++;
    }
    const type = seen === 0 ? "string" : num / seen > 0.8 ? "number" : date / seen > 0.8 ? "date" : "string";
    return { name, type } as Field;
  });
}

function isNumeric(v: string) {
  const s = v.trim().replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".").replace(/[R$€%]/g, "");
  return s !== "" && !Number.isNaN(Number(s));
}

export function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return 0;
  const s = v.trim().replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".").replace(/[R$€%]/g, "");
  const n = Number(s);
  return Number.isNaN(n) ? 0 : n;
}

function reduceAgg(values: unknown[], agg: Agg): number {
  if (agg === "count") return values.length;
  if (agg === "distinct") return new Set(values.map((v) => String(v))).size;
  const nums = values.map(toNumber);
  if (!nums.length) return 0;
  switch (agg) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "avg":
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "min":
      return Math.min(...nums);
    case "max":
      return Math.max(...nums);
    default:
      return 0;
  }
}

export function aggregateKpi(
  rows: Row[],
  field: string | null,
  agg: Agg,
  filter?: { field?: string | null | undefined; value?: string | null | undefined },
): number {
  const scoped =
    filter?.field && filter.value != null
      ? rows.filter((r) => String(r[filter.field as string] ?? "").toLowerCase() === String(filter.value).toLowerCase())
      : rows;
  if (!field || agg === "count") return agg === "count" ? scoped.length : 0;
  return reduceAgg(
    scoped.map((r) => r[field]).filter((v) => v !== null && v !== undefined && v !== ""),
    agg,
  );
}

export type ChartDatum = { name: string; [key: string]: string | number };

export function buildChartData(rows: Row[], spec: ChartSpec): { data: ChartDatum[]; keys: string[] } {
  const dim = spec.dimension;
  const distinctVals = Array.from(new Set(rows.map((r) => String(r[dim] ?? ""))));
  const chosen = spec.dateGrain ?? "auto";
  const dateDim = chosen !== "auto" ? isDateLike(distinctVals) : distinctVals.length > 15 && isDateLike(distinctVals);
  const grain: Exclude<DateGrain, "auto"> = chosen === "auto" ? "monthYear" : chosen;

  const groups = new Map<string, Map<string, unknown[]>>();
  const order = new Map<string, string>();
  const seriesKeys = new Set<string>();
  const valueKey = spec.measure ?? "valor";

  for (const row of rows) {
    const gRaw = row[dim];
    let g = gRaw === null || gRaw === undefined || gRaw === "" ? "—" : String(gRaw);
    if (dateDim) {
      const d = parseDateValue(gRaw);
      if (d) {
        g = formatGrain(d, grain);
        order.set(g, grainSortKey(d, grain));
      }
    }
    const sKey = spec.series ? String(row[spec.series] ?? "—") : valueKey;
    seriesKeys.add(sKey);
    if (!groups.has(g)) groups.set(g, new Map());
    const inner = groups.get(g)!;
    if (!inner.has(sKey)) inner.set(sKey, []);
    inner.get(sKey)!.push(spec.measure ? row[spec.measure] : 1);
  }

  const keys = Array.from(seriesKeys).slice(0, 8);
  let data: ChartDatum[] = Array.from(groups.entries()).map(([name, inner]) => {
    const d: ChartDatum = { name };
    for (const k of keys) d[k] = round(reduceAgg(inner.get(k) ?? [], spec.agg));
    return d;
  });

  const timeLike =
    dateDim || ["line", "area", "stackedArea", "composed", "scatter"].includes(spec.type);
  const sort = spec.sort ?? (timeLike ? "none" : "desc");
  if (sort !== "none") {
    data.sort((a, b) => {
      const sa = keys.reduce((acc, k) => acc + Number(a[k] ?? 0), 0);
      const sb = keys.reduce((acc, k) => acc + Number(b[k] ?? 0), 0);
      return sort === "desc" ? sb - sa : sa - sb;
    });
  } else if (dateDim) {
    data.sort((a, b) => (order.get(String(a.name)) ?? "").localeCompare(order.get(String(b.name)) ?? ""));
  } else {
    data.sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR", { numeric: true }));
  }

  const limit = spec.limit ?? 10;
  if (data.length > limit) data = data.slice(0, limit);

  return { data, keys };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatNumber(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "M";
  if (Math.abs(n) >= 10_000) return (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function formatKpiValue(n: number, format?: "compact" | "currency" | "percent" | "decimal" | "none") {
  if (format === undefined || format === "compact") {
    return formatNumber(n);
  }
  switch (format) {
    case "currency":
      return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    case "percent":
      return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + "%";
    case "decimal":
      return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case "none":
    default:
      return n.toString();
  }
}
