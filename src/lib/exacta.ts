export const PRIORITIES = [
  { value: "baixa", label: "Baixa", color: "var(--color-priority-low)" },
  { value: "media", label: "Média", color: "var(--color-priority-medium)" },
  { value: "alta", label: "Alta", color: "var(--color-priority-high)" },
  { value: "urgente", label: "Urgente", color: "var(--color-priority-urgent)" },
] as const;

export const STATUSES = [
  { value: "todo", label: "A fazer" },
  { value: "doing", label: "Em andamento" },
  { value: "review", label: "Revisão" },
  { value: "done", label: "Concluído" },
] as const;

export type Priority = typeof PRIORITIES[number]["value"];
export type Status = typeof STATUSES[number]["value"];

export function priorityColor(p: string) {
  return PRIORITIES.find((x) => x.value === p)?.color ?? "var(--color-muted-foreground)";
}
export function priorityLabel(p: string) {
  return PRIORITIES.find((x) => x.value === p)?.label ?? p;
}
export function statusLabel(s: string) {
  return STATUSES.find((x) => x.value === s)?.label ?? s;
}

export function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function isOverdue(d?: string | null, status?: string) {
  if (!d || status === "done") return false;
  return new Date(d) < new Date();
}
