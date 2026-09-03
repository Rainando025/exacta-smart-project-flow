import type { Agg, ChartSpec, Dashboard, Field, Row } from "./types";
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

export function buildHeuristicDashboard(
  name: string,
  fields: Field[],
  sample: Row[],
  rowCount: number
): Dashboard {
  const numericFields = fields.filter((f) => f.type === "number");
  const dateFields = fields.filter((f) => f.type === "date");
  const categoricalFields = fields.filter((f) => f.type === "string");

  const kpis: Dashboard["kpis"] = [
    {
      id: "kpi-0",
      label: "Total de Registros",
      field: null,
      agg: "count",
      accent: 0,
      format: "compact",
    },
  ];

  let kpiIdx = 1;
  for (const numF of numericFields) {
    if (kpiIdx >= 4) break;
    if (/^id$/i.test(numF.name) || /_id$/i.test(numF.name)) continue;
    const isCurrency = /valor|preco|preço|custo|receita|total|faturamento/i.test(numF.name);
    kpis.push({
      id: `kpi-${kpiIdx}`,
      label: `Total de ${numF.name}`,
      field: numF.name,
      agg: "sum",
      accent: kpiIdx % 6,
      format: isCurrency ? "currency" : "compact",
    });
    kpiIdx++;
  }

  for (const catF of categoricalFields) {
    if (kpiIdx >= 5) break;
    if (/^id$/i.test(catF.name)) continue;
    kpis.push({
      id: `kpi-${kpiIdx}`,
      label: `${catF.name}s Distintos`,
      field: catF.name,
      agg: "distinct",
      accent: kpiIdx % 6,
      format: "compact",
    });
    kpiIdx++;
  }

  const charts: Dashboard["charts"] = [];
  let chartIdx = 0;

  const mainDate = dateFields[0];
  const mainNum = numericFields.find((f) => !/^id$/i.test(f.name)) ?? numericFields[0];
  const secondNum = numericFields.find((f) => f.name !== mainNum?.name && !/^id$/i.test(f.name));
  const mainCat = categoricalFields.find((f) => !/^id$/i.test(f.name)) ?? categoricalFields[0];
  const secondCat = categoricalFields.find((f) => f.name !== mainCat?.name && !/^id$/i.test(f.name));
  const thirdCat = categoricalFields.find(
    (f) => f.name !== mainCat?.name && f.name !== secondCat?.name && !/^id$/i.test(f.name)
  );

  // 1. Chart: Area Chart for Time Evolution
  if (mainDate) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Evolução Temporal por ${mainDate.name}`,
      type: "area",
      dimension: mainDate.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      span: 3,
      palette: 0,
    });
  }

  // 2. Chart: Bar Chart for Primary Ranking
  if (mainCat) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Distribuição por ${mainCat.name}`,
      type: "bar",
      dimension: mainCat.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 10,
      span: 3,
      palette: 1,
    });
  }

  // 3. Chart: Donut Chart for Percentage Share
  if (secondCat || mainCat) {
    const targetCat = secondCat ?? mainCat;
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Participação Relativa por ${targetCat.name}`,
      type: "donut",
      dimension: targetCat.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 6,
      span: 3,
      palette: 2,
    });
  }

  // 4. Chart: Horizontal Bar Chart (barH) for Top Items
  const descCat = categoricalFields.find(
    (f) => /descri/i.test(f.name) || /nome/i.test(f.name) || /produto/i.test(f.name) || /assunto/i.test(f.name)
  ) ?? thirdCat ?? categoricalFields[1];

  if (descCat) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Top Registros por ${descCat.name}`,
      type: "barH",
      dimension: descCat.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 10,
      span: 3,
      palette: 3,
    });
  }

  // 5. Chart: Stacked Bar Chart (Cross Analysis)
  if (mainCat && secondCat) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Análise Cruzada: ${mainCat.name} x ${secondCat.name}`,
      type: "stackedBar",
      dimension: mainCat.name,
      series: secondCat.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 8,
      span: 3,
      palette: 4,
    });
  }

  // 6. Chart: Line Chart for Secondary Metric Trends
  if (secondNum && mainCat) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Média de ${secondNum.name} por ${mainCat.name}`,
      type: "line",
      dimension: mainCat.name,
      measure: secondNum.name,
      agg: "avg",
      limit: 10,
      span: 3,
      palette: 5,
    });
  }

  // 7. Chart: Radar Chart for Multi-Dimensional Profile
  if (mainCat) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Matriz de Desempenho por ${mainCat.name}`,
      type: "radar",
      dimension: mainCat.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 6,
      span: 3,
      palette: 6,
    });
  }

  // 8. Chart: Funnel Chart for Volume Pipeline Stage
  if (secondCat || descCat) {
    const funnelCat = secondCat ?? descCat!;
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Funil Proporcional por ${funnelCat.name}`,
      type: "funnel",
      dimension: funnelCat.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 6,
      span: 3,
      palette: 7,
    });
  }

  // 9. Chart: Treemap for Block Proportions
  if (descCat || mainCat) {
    const treeCat = descCat ?? mainCat;
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Mapa Proporcional (Treemap) por ${treeCat.name}`,
      type: "treemap",
      dimension: treeCat.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 12,
      span: 3,
      palette: 8,
    });
  }

  // 10. Chart: Composed Chart for Combined Bars + Line
  if (mainCat && secondNum) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Volume x Média de ${secondNum.name}`,
      type: "composed",
      dimension: mainCat.name,
      measure: mainNum?.name ?? null,
      agg: "sum",
      limit: 8,
      span: 3,
      palette: 9,
    });
  }

  return {
    title: name,
    subtitle: `${rowCount.toLocaleString("pt-BR")} registros analisados`,
    kpis,
    charts,
    insights: [
      `Análise executiva concluída para a base "${name}" com ${rowCount.toLocaleString("pt-BR")} registros e ${fields.length} colunas mapeadas.`,
      mainCat ? `A categoria "${mainCat.name}" representa o principal eixo de segmentação dos dados.` : "",
      mainNum ? `A métrica "${mainNum.name}" foi selecionada como indicador primário de volume e valor.` : "",
      mainDate ? `Identificada variação temporal relevante ao longo do campo "${mainDate.name}".` : "",
    ].filter(Boolean),
  };
}
