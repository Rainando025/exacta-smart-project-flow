import type { Agg, ChartSpec, Dashboard, Field, NumberFormat, Row } from "./types";
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
  // Strip currency symbols, spaces, percent sign
  const stripped = v.trim().replace(/^[R$€\s]+|[\s€%]+$/g, "").trim();
  if (stripped === "") return false;
  // Detect Brazilian format: uses "." as thousands sep and "," as decimal
  // e.g. "1.234,56" or "1.234" (whole number with thousand dot)
  const brFormat = /^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(stripped);
  if (brFormat) return true;
  // International format: uses "," as thousands and "." as decimal
  // e.g. "1,234.56" or "1,234"
  const intFormat = /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(stripped);
  if (intFormat) return true;
  // Plain number (no separator)
  return stripped !== "" && !Number.isNaN(Number(stripped));
}

export function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return 0;
  // Strip currency symbols, leading/trailing spaces
  let s = v.trim().replace(/^[R$€\s]+|[\s€]+$/g, "").replace(/\s/g, "").trim();
  if (s === "") return 0;
  // Handle negative in parentheses: (100) -> -100
  if (s.startsWith("(") && s.endsWith(")")) s = "-" + s.slice(1, -1);
  // Strip trailing % sign
  const hasPercent = s.endsWith("%");
  if (hasPercent) s = s.slice(0, -1);
  // Detect Brazilian format: comma as decimal separator (e.g. 1.234,56 or 1234,56)
  const brFormat = /^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(s);
  const brWhole = /^-?\d{1,3}(\.\d{3})+$/.test(s); // e.g. "1.234" -> 1234
  if (brFormat || brWhole) {
    // It's Brazilian: remove dots (thousand sep) and replace comma with dot (decimal sep)
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // International or plain: remove commas as thousand seps
    const intFormat = /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s);
    if (intFormat) s = s.replace(/,/g, "");
    // else keep as-is (plain number)
  }
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

// Regex for field names that are IDs / temporal / geographic — should NOT be summed
const ID_TEMPORAL_REGEX = /^(id|ano|year|mes|m[eê]s|dia|day|week|semana|cod(igo)?|c[oó]d|cep|cpf|cnpj|rg|tel|fone|celular|zip|fax|not[ae]|pedido|nf|num(ero)?|n[uú]m)($|_|\s)/i;

/** Returns true when a field name looks like an identifier or temporal value that shouldn't be aggregated numerically */
export function isIdOrTemporalField(name: string): boolean {
  return ID_TEMPORAL_REGEX.test(name) || /^id$/i.test(name) || /_id$/i.test(name);
}

/**
 * Unified number formatting engine.
 * Supports: compact (1.2k / 1.2M), currency (R$ 1.250,00), currency_compact (R$ 1,2k),
 * percent (10,5%), decimal (custom decimals), integer, none (raw)
 */
export function formatNumberValue(
  n: number,
  opts: {
    format?: NumberFormat;
    decimalPlaces?: number;
    prefix?: string;
    suffix?: string;
  } = {}
): string {
  const { format = "compact", decimalPlaces, prefix = "", suffix = "" } = opts;
  const wrap = (v: string) => `${prefix}${v}${suffix}`;

  switch (format) {
    case "currency": {
      const decimals = decimalPlaces ?? 2;
      const formatted = Math.abs(n).toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return wrap(`${n < 0 ? "-" : ""}R$\u00a0${formatted}`);
    }
    case "currency_compact": {
      const abs = Math.abs(n);
      const sign = n < 0 ? "-" : "";
      if (abs >= 1_000_000)
        return wrap(`${sign}R$\u00a0${(abs / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`);
      if (abs >= 1_000)
        return wrap(`${sign}R$\u00a0${(abs / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`);
      return wrap(`${sign}R$\u00a0${abs.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`);
    }
    case "percent": {
      const decimals = decimalPlaces ?? 1;
      return wrap(n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + "%");
    }
    case "decimal": {
      const decimals = decimalPlaces ?? 2;
      return wrap(n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
    }
    case "integer":
      return wrap(Math.round(n).toLocaleString("pt-BR"));
    case "none":
      return wrap(String(n));
    case "compact":
    default: {
      const abs = Math.abs(n);
      if (abs >= 1_000_000)
        return wrap((n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: decimalPlaces ?? 1 }) + "M");
      if (abs >= 10_000)
        return wrap((n / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: decimalPlaces ?? 1 }) + "k");
      return wrap(n.toLocaleString("pt-BR", { maximumFractionDigits: decimalPlaces ?? 2 }));
    }
  }
}

/** Compact number format for chart axes (always short, no prefix/suffix) */
export function formatNumber(n: number, decimalPlaces?: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: decimalPlaces ?? 1 }) + "M";
  if (abs >= 10_000) return (n / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: decimalPlaces ?? 1 }) + "k";
  return n.toLocaleString("pt-BR", { maximumFractionDigits: decimalPlaces ?? 2 });
}

/** Legacy KPI format function — delegates to formatNumberValue */
export function formatKpiValue(
  n: number,
  format?: NumberFormat,
  decimalPlaces?: number,
  prefix?: string,
  suffix?: string
) {
  return formatNumberValue(n, { format: format ?? "compact", decimalPlaces, prefix, suffix });
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

  // Identify quantitative numeric fields (not IDs, codes, years, CEP etc.)
  const quantFields = numericFields.filter((f) => !isIdOrTemporalField(f.name));

  // Prioritise currency-like fields
  const currencyLike = (name: string) => /valor|preco|pre[çc]o|custo|receita|total|faturamento|salario|sal[aá]rio|lucro|despesa|pagamento|premi[ou]/i.test(name);
  const quantityLike = (name: string) => /quant(idade)?|qtd|qtde|count|amount|volume|unidade|un\b|pcs|kg|ton/i.test(name);

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
  for (const numF of quantFields) {
    if (kpiIdx >= 4) break;
    const isCurrency = currencyLike(numF.name);
    kpis.push({
      id: `kpi-${kpiIdx}`,
      label: `Total de ${numF.name}`,
      field: numF.name,
      agg: "sum",
      accent: kpiIdx % 6,
      format: isCurrency ? "currency" : quantityLike(numF.name) ? "integer" : "compact",
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
  const mainNum = quantFields.find((f) => currencyLike(f.name)) ?? quantFields[0];
  const secondNum = quantFields.find((f) => f.name !== mainNum?.name);
  const mainCat = categoricalFields.find((f) => !/^id$/i.test(f.name)) ?? categoricalFields[0];
  const secondCat = categoricalFields.find((f) => f.name !== mainCat?.name && !/^id$/i.test(f.name));
  const thirdCat = categoricalFields.find(
    (f) => f.name !== mainCat?.name && f.name !== secondCat?.name && !/^id$/i.test(f.name)
  );
  const mainNumFmt: "currency" | "compact" | "integer" = mainNum ? (currencyLike(mainNum.name) ? "currency" : quantityLike(mainNum.name) ? "integer" : "compact") : "compact";

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
      format: mainNumFmt,
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
      format: mainNumFmt,
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
