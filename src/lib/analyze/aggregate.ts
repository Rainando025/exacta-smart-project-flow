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
  const currencyLike = (n: string) =>
    /valor|preco|pre[çc]o|custo|receita|total|faturamento|salario|sal[aá]rio|lucro|despesa|pagamento|premi[ou]/i.test(n);
  const quantityLike = (n: string) =>
    /quant(idade)?|qtd|qtde|count|amount|volume|unidade|un\b|pcs|kg|ton/i.test(n);
  const statusLike = (n: string) =>
    /status|fase|etapa|stage|funil|pipeline|situacao|situa[çc][aã]o|estado/i.test(n);

  const mainDate = dateFields[0];
  const mainNum = quantFields.find((f) => currencyLike(f.name)) ?? quantFields[0];
  const secondNum = quantFields.find((f) => f.name !== mainNum?.name);
  const mainCat =
    categoricalFields.find((f) => !/^id$/i.test(f.name) && !statusLike(f.name)) ??
    categoricalFields[0];
  const statusCat = categoricalFields.find((f) => statusLike(f.name));
  const secondCat = categoricalFields.find(
    (f) => f.name !== mainCat?.name && f.name !== statusCat?.name && !/^id$/i.test(f.name)
  );

  const isCurrency = mainNum ? currencyLike(mainNum.name) : false;
  const mainNumFmt: "currency" | "compact" | "integer" = mainNum
    ? isCurrency
      ? "currency"
      : quantityLike(mainNum.name)
        ? "integer"
        : "compact"
    : "compact";

  // KPIs Estratégicos
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
  for (const numF of quantFields.slice(0, 3)) {
    const isCur = currencyLike(numF.name);
    kpis.push({
      id: `kpi-${kpiIdx}`,
      label: isCur ? `Receita / Total ${numF.name}` : `Total de ${numF.name}`,
      field: numF.name,
      agg: "sum",
      accent: kpiIdx % 6,
      format: isCur ? "currency" : quantityLike(numF.name) ? "integer" : "compact",
    });
    kpiIdx++;

    // Se for financeiro, adiciona também a Média
    if (isCur && kpiIdx < 5) {
      kpis.push({
        id: `kpi-${kpiIdx}`,
        label: `Média de ${numF.name}`,
        field: numF.name,
        agg: "avg",
        accent: kpiIdx % 6,
        format: "currency",
      });
      kpiIdx++;
    }
  }

  // Se sobrou espaço de KPI, adiciona valores distintos da categoria principal
  if (kpiIdx < 5 && mainCat) {
    kpis.push({
      id: `kpi-${kpiIdx}`,
      label: `${mainCat.name}s Distintos`,
      field: mainCat.name,
      agg: "distinct",
      accent: kpiIdx % 6,
      format: "compact",
    });
    kpiIdx++;
  }

  // Estatísticas reais da amostra para gráficos e insights inteligentes
  const sampleValues = sample
    .map((r) => (mainNum ? Number(r[mainNum.name]) : null))
    .filter((v): v is number => v !== null && !isNaN(v));

  const totalSum = sampleValues.reduce((a, b) => a + b, 0);
  const avgVal = sampleValues.length ? totalSum / sampleValues.length : 0;
  const maxVal = sampleValues.length ? Math.max(...sampleValues) : 0;

  // Frequência de categorias no mainCat
  const catFreq: Record<string, number> = {};
  if (mainCat) {
    for (const r of sample) {
      const v = String(r[mainCat.name] || "Não especificado");
      catFreq[v] = (catFreq[v] || 0) + 1;
    }
  }
  const sortedCats = Object.entries(catFreq).sort((a, b) => b[1] - a[1]);
  const topCat = sortedCats[0];
  const topCatShare = topCat && sample.length ? ((topCat[1] / sample.length) * 100).toFixed(1) : null;
  const top3Count = sortedCats.slice(0, 3).reduce((acc, curr) => acc + curr[1], 0);
  const top3Share = sample.length ? ((top3Count / sample.length) * 100).toFixed(1) : null;

  const charts: Dashboard["charts"] = [];
  let chartIdx = 0;

  // 1. Gráfico de Evolução Temporal (SE houver data)
  if (mainDate) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Evolução Histórica por ${mainDate.name}`,
      type: "area",
      dimension: mainDate.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      span: 3,
      palette: 0,
      format: mainNumFmt,
    });
  }

  // 2. Gráfico de Ranking Principal (Barras)
  if (mainCat) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Top ${mainCat.name}s por ${mainNum?.name ?? "Volume"}`,
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

  // 3. Gráfico de Rosca (SE houver categoria de Status ou categoria com poucos itens)
  const donutTarget = statusCat ?? (sortedCats.length <= 7 && sortedCats.length >= 2 ? mainCat : secondCat);
  if (donutTarget) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Participação Proporcional por ${donutTarget.name}`,
      type: "donut",
      dimension: donutTarget.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 6,
      span: 3,
      palette: 2,
    });
  }

  // 4. Barras Horizontais para Detalhamento Secundário
  const barHTarget = secondCat ?? mainCat;
  if (barHTarget) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Distribuição Segmentada por ${barHTarget.name}`,
      type: "barH",
      dimension: barHTarget.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 10,
      span: 3,
      palette: 3,
      format: mainNumFmt,
    });
  }

  // 5. Gráfico Cruzado (StackedBar) quando houver duas categorias consistentes
  if (mainCat && (secondCat || statusCat)) {
    const crossTarget = secondCat ?? statusCat!;
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Cruzamento Analítico: ${mainCat.name} vs ${crossTarget.name}`,
      type: "stackedBar",
      dimension: mainCat.name,
      series: crossTarget.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 8,
      span: 3,
      palette: 4,
    });
  }

  // 6. Funil (SOMENTE se houver campo de status/etapa)
  if (statusCat) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Funil de Conversão / Status por ${statusCat.name}`,
      type: "funnel",
      dimension: statusCat.name,
      measure: mainNum?.name ?? null,
      agg: "count",
      limit: 8,
      span: 3,
      palette: 5,
    });
  }

  // 7. Gráfico Combinado (Composed: Volume vs Média) ou Linha de Tendência
  if (mainCat && secondNum) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Volume vs ${secondNum.name} por ${mainCat.name}`,
      type: "composed",
      dimension: mainCat.name,
      measure: mainNum?.name ?? null,
      agg: "sum",
      limit: 8,
      span: 3,
      palette: 6,
    });
  } else if (secondNum && mainCat) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Média de ${secondNum.name} por ${mainCat.name}`,
      type: "line",
      dimension: mainCat.name,
      measure: secondNum.name,
      agg: "avg",
      limit: 10,
      span: 3,
      palette: 6,
    });
  }

  // 8. Treemap para Blocos de Alta Densidade
  if (mainCat && sortedCats.length > 5) {
    charts.push({
      id: `chart-${chartIdx++}`,
      title: `Visão Hierárquica (Treemap) por ${mainCat.name}`,
      type: "treemap",
      dimension: mainCat.name,
      measure: mainNum?.name ?? null,
      agg: mainNum ? "sum" : "count",
      limit: 12,
      span: 3,
      palette: 7,
    });
  }

  // Insights Dinâmicos, Executivos e com Números Reais
  const insights: string[] = [
    `Volume Mapeado: Base consolidada com ${rowCount.toLocaleString("pt-BR")} registros e ${fields.length} colunas estruturadas para tomada de decisão.`,
  ];

  if (topCat && topCatShare) {
    insights.push(
      `Destaque em '${mainCat?.name}': O segmento '${topCat[0]}' lidera a representatividade com ${topCat[1]} ocorrências (${topCatShare}% da amostragem observada).`
    );
  }

  if (top3Share && Number(top3Share) > 40 && mainCat) {
    insights.push(
      `Concentração de Pareto: Os 3 maiores grupos de '${mainCat.name}' concentram ${top3Share}% do volume total, exigindo atenção prioritária da equipe.`
    );
  }

  if (mainNum && sampleValues.length > 0) {
    const fmtAvg = isCurrency
      ? `R$ ${avgVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : avgVal.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    const fmtMax = isCurrency
      ? `R$ ${maxVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : maxVal.toLocaleString("pt-BR");

    insights.push(
      `Métrica de Desempenho ('${mainNum.name}'): Média apurada de ${fmtAvg} por registro, com valor máximo atingindo ${fmtMax}.`
    );
  }

  if (mainDate) {
    insights.push(
      `Sazonalidade & Tempo: O campo '${mainDate.name}' permite acompanhar tendências temporais e identificar ciclos de crescimento ou retração.`
    );
  }

  insights.push(
    `Recomendação de Gestão: Utilize os filtros cruzados ao clicar nos gráficos para isolar anomalias e orientar ações corretivas nos pontos de menor rendimento.`
  );

  return {
    title: name,
    subtitle: `${rowCount.toLocaleString("pt-BR")} registros analisados`,
    kpis,
    charts,
    insights,
  };
}
