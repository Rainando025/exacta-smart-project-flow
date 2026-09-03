import type { Row } from "./types";

export type AlertOp =
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "eq"
  | "neq"
  | "contains"
  | "empty"
  | "notEmpty";

export const ALERT_OP_LABELS: Record<AlertOp, string> = {
  gt: "maior que",
  gte: "maior ou igual a",
  lt: "menor que",
  lte: "menor ou igual a",
  eq: "igual a",
  neq: "diferente de",
  contains: "contém",
  empty: "está vazio",
  notEmpty: "está preenchido (não deveria)",
};

export const OPS_WITHOUT_VALUE: AlertOp[] = ["empty", "notEmpty"];

export type AlertSeverity = "critical" | "warning";

/** Regra de não conformidade definida pelo usuário sobre uma coluna da base. */
export type AlertRule = {
  id: string;
  name: string;
  field: string;
  op: AlertOp;
  value: string;
  severity: AlertSeverity;
  /** Dispara somente quando o número de linhas violando passar deste limite. */
  minCount?: number;
  enabled: boolean;
};

export type AlertHit = {
  rule: AlertRule;
  count: number;
  total: number;
  rows: Row[];
};

export type AlertStatus = "open" | "resolved" | "ignored";

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  open: "Em aberto",
  resolved: "Resolvido",
  ignored: "Ignorado",
};

/** Registro histórico de um disparo de alerta. */
export type AlertEvent = {
  id: string;
  ruleId: string;
  ruleName: string;
  description: string;
  severity: AlertSeverity;
  /** ISO date-time do disparo. */
  at: string;
  count: number;
  total: number;
  /** Amostra dos registros que violaram a regra. */
  rows: Row[];
  status: AlertStatus;
  resolvedAt?: string;
  resolvedBy?: string;
  note?: string;
};

/** Cria eventos de histórico para disparos ainda não registrados como abertos. */
export function buildAlertEvents(hits: AlertHit[], existing: AlertEvent[]): AlertEvent[] {
  const openByRule = new Map(existing.filter((e) => e.status === "open").map((e) => [e.ruleId, e] as const));
  const now = new Date().toISOString();
  const created: AlertEvent[] = [];
  for (const h of hits) {
    const open = openByRule.get(h.rule.id);
    if (open && open.count === h.count) continue;
    created.push({
      id: `ev-${h.rule.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ruleId: h.rule.id,
      ruleName: h.rule.name,
      description: describeRule(h.rule),
      severity: h.rule.severity,
      at: now,
      count: h.count,
      total: h.total,
      rows: h.rows.slice(0, 20),
      status: "open",
    });
  }
  return created;
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function rowViolates(rule: AlertRule, row: Row): boolean {
  const raw = row[rule.field];
  const text = raw === null || raw === undefined ? "" : String(raw).trim();
  switch (rule.op) {
    case "empty":
      return text === "";
    case "notEmpty":
      return text !== "";
    case "contains":
      return text.toLowerCase().includes(rule.value.trim().toLowerCase()) && rule.value.trim() !== "";
    case "eq":
      return text.toLowerCase() === rule.value.trim().toLowerCase();
    case "neq":
      return text.toLowerCase() !== rule.value.trim().toLowerCase();
    default: {
      const a = toNumber(raw);
      const b = toNumber(rule.value);
      if (a === null || b === null) return false;
      if (rule.op === "gt") return a > b;
      if (rule.op === "gte") return a >= b;
      if (rule.op === "lt") return a < b;
      return a <= b;
    }
  }
}

export function evaluateAlerts(rules: AlertRule[], rows: Row[]): AlertHit[] {
  const hits: AlertHit[] = [];
  for (const rule of rules) {
    if (!rule.enabled || !rule.field) continue;
    const matched = rows.filter((r) => rowViolates(rule, r));
    if (matched.length > (rule.minCount ?? 0)) {
      hits.push({ rule, count: matched.length, total: rows.length, rows: matched.slice(0, 50) });
    }
  }
  return hits.sort((a, b) => (a.rule.severity === b.rule.severity ? b.count - a.count : a.rule.severity === "critical" ? -1 : 1));
}

export function describeRule(rule: AlertRule): string {
  const op = ALERT_OP_LABELS[rule.op];
  return OPS_WITHOUT_VALUE.includes(rule.op)
    ? `${rule.field} ${op}`
    : `${rule.field} ${op} ${rule.value}`;
}
