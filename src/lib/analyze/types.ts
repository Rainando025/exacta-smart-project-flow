export type Cell = string | number | null;
export type Row = Record<string, Cell>;

export type FieldType = "number" | "string" | "date";
export type Field = { name: string; type: FieldType };

export const CHART_TYPES = [
  "bar",
  "barH",
  "stackedBar",
  "line",
  "area",
  "stackedArea",
  "pie",
  "donut",
  "radar",
  "radialBar",
  "scatter",
  "composed",
  "treemap",
  "funnel",
  "table",
] as const;

export type ChartType = (typeof CHART_TYPES)[number];

export const CHART_LABELS: Record<ChartType, string> = {
  bar: "Barras verticais",
  barH: "Barras horizontais",
  stackedBar: "Barras empilhadas",
  line: "Linhas",
  area: "Área",
  stackedArea: "Área empilhada",
  pie: "Pizza",
  donut: "Rosca",
  radar: "Radar",
  radialBar: "Barras radiais",
  scatter: "Dispersão",
  composed: "Combinado (barra + linha)",
  treemap: "Treemap",
  funnel: "Funil",
  table: "Tabela",
};

export type Agg = "sum" | "count" | "avg" | "min" | "max" | "distinct";

export const AGG_LABELS: Record<Agg, string> = {
  sum: "Soma",
  count: "Contagem",
  avg: "Média",
  min: "Mínimo",
  max: "Máximo",
  distinct: "Valores distintos",
};

export type ColorRule = {
  id: string;
  op: "gt" | "lt" | "eq" | "between";
  value1: number;
  value2?: number;
  color: string;
};

export type ChartSpec = {
  id: string;
  title: string;
  type: ChartType;
  dimension: string;
  measure: string | null;
  agg: Agg;
  series?: string | null;
  limit?: number;
  sort?: "desc" | "asc" | "none";
  span?: 1 | 2 | 3;
  palette?: number;
  /** Ao clicar em um item, abre este detalhamento (gráfico ou tabela). */
  drillType?: ChartType | null;
  drillDimension?: string | null;
  colorRules?: ColorRule[];
  gradientEnabled?: boolean;
  gradientColors?: [string, string];
  /** Granularidade quando a dimensão for uma data (dia, mês, trimestre, ano...). */
  dateGrain?: import("./date-grain").DateGrain;
};


export type KpiSpec = {
  id: string;
  label: string;
  field: string | null;
  agg: Agg;
  filterField?: string | null;
  filterValue?: string | null;
  accent?: string | number;
  format?: "compact" | "currency" | "percent" | "decimal" | "none";
};

export type Dashboard = {
  title: string;
  subtitle: string;
  kpis: KpiSpec[];
  charts: ChartSpec[];
  insights: string[];
};

export type Dataset = {
  name: string;
  fields: Field[];
  rows: Row[];
  sources?: string[];
};

/** Estado de filtros/visão que pode ser salvo e compartilhado. */
export type ViewState = {
  pageName?: string;
  hiddenCols: string[];
  filters: Record<string, string>;
  cross: { field: string; value: string } | null;
  orientation: "landscape" | "portrait";
};

export type SavedView = {
  id: string;
  name: string;
  createdAt: string;
  state: ViewState;
};

/** Anotação/comentário preso a um gráfico (ou à página, quando chartId = "page"). */
export type Annotation = {
  id: string;
  chartId: string;
  text: string;
  author?: string;
  createdAt: string;
};

export type Reminder = {
  id: string;
  title: string;
  datetime: string; // ISO string
  pageId: string;
  chartId?: string | null;
  triggered: boolean;
  completed: boolean;
};

/** Registro de importação, com snapshot para permitir voltar. */
export type ImportEntry = {
  id: string;
  at: string;
  mode: "create" | "append" | "replace";
  filename: string;
  rowCount: number;
  added?: number;
  duplicates?: number;
  /** Estado da base ANTES desta importação (ausente na criação). */
  previous?: Dataset;
};

/** Cada base importada vira uma página do sistema. */
export type Page = {
  id: string;
  name: string;
  icon: string;
  dataset: Dataset;
  dashboard: Dashboard | null;
  views?: SavedView[];
  annotations?: Annotation[];
  history?: ImportEntry[];
  reminders?: Reminder[];
  /** Regras de não conformidade/alertas desta página. */
  alerts?: import("./alerts").AlertRule[];
  /** Histórico de alertas disparados nesta página. */
  alertLog?: import("./alerts").AlertEvent[];
  /** Presente quando a página está publicada na nuvem e compartilhada. */
  cloud?: { role: "owner" | "editor" | "viewer"; ownerEmail?: string | null };
};




