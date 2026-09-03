import { useMemo, useState } from "react";
import { AlertTriangle, Bell, Check, History, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { DEFAULT_NOTIFY_PREFS, type NotifyPrefs } from "@/lib/analyze/cloud";
import {
  ALERT_STATUS_LABELS,
  type AlertEvent,
  type AlertStatus,
  ALERT_OP_LABELS,
  OPS_WITHOUT_VALUE,
  describeRule,
  type AlertHit,
  type AlertOp,
  type AlertRule,
} from "@/lib/analyze/alerts";
import type { Field } from "@/lib/analyze/types";

export function AlertsDialog({
  open,
  fields,
  rules,
  hits,
  events,
  prefs,
  canEdit,
  onOpenChange,
  onChange,
  onEventsChange,
  onPrefsChange,
}: {
  open: boolean;
  fields: Field[];
  rules: AlertRule[];
  hits: AlertHit[];
  events: AlertEvent[];
  prefs: NotifyPrefs | null;
  canEdit: boolean;
  onOpenChange: (v: boolean) => void;
  onChange: (rules: AlertRule[]) => void;
  onEventsChange: (events: AlertEvent[]) => void;
  onPrefsChange: (prefs: NotifyPrefs) => void;
}) {
  const [name, setName] = useState("");
  const [field, setField] = useState("");
  const [op, setOp] = useState<AlertOp>("gt");
  const [value, setValue] = useState("");
  const [severity, setSeverity] = useState<"critical" | "warning">("critical");

  const firstField = fields[0]?.name ?? "";
  const selectedField = field || firstField;
  const needsValue = !OPS_WITHOUT_VALUE.includes(op);
  const p = prefs ?? DEFAULT_NOTIFY_PREFS;
  const setPrefs = (patch: Partial<NotifyPrefs>) => onPrefsChange({ ...p, ...patch });
  const setStatus = (id: string, status: AlertStatus) =>
    onEventsChange(
      events.map((e) => (e.id === id ? { ...e, status, resolvedAt: new Date().toISOString() } : e)),
    );
  const hitsByRule = useMemo(() => new Map(hits.map((h) => [h.rule.id, h] as const)), [hits]);

  const add = () => {
    if (!selectedField) return;
    const rule: AlertRule = {
      id: `alert-${Date.now()}`,
      name: name.trim() || describeRule({ field: selectedField, op, value } as AlertRule),
      field: selectedField,
      op,
      value: needsValue ? value.trim() : "",
      severity,
      minCount: 0,
      enabled: true,
    };
    onChange([...rules, rule]);
    setName("");
    setValue("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" /> Não conformidades e alertas
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="hits">
          <TabsList>
            <TabsTrigger value="hits">
              Ocorrências{hits.length ? ` (${hits.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-1 size-3.5" /> Histórico{events.length ? ` (${events.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="notify">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="hits" className="max-h-96 space-y-2 overflow-auto">
            {!hits.length && (
              <p className="text-sm text-muted-foreground">
                Nenhuma não conformidade encontrada nos dados filtrados no momento.
              </p>
            )}
            {hits.map((h) => (
              <div
                key={h.rule.id}
                className={`rounded-lg border p-3 text-sm ${
                  h.rule.severity === "critical"
                    ? "border-destructive/50 bg-destructive/10"
                    : "border-amber-500/40 bg-amber-500/10"
                }`}
              >
                <p className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="size-4" /> {h.rule.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {describeRule(h.rule)} · {h.count.toLocaleString("pt-BR")} de {h.total.toLocaleString("pt-BR")}{" "}
                  registros ({((h.count / Math.max(h.total, 1)) * 100).toFixed(1)}%)
                </p>
                {h.rows[0] && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    Ex.: {Object.entries(h.rows[0]).slice(0, 4).map(([k, v]) => `${k}: ${v ?? "—"}`).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="rules" className="space-y-3">
            {canEdit && (
              <div className="grid gap-2 rounded-lg border border-border bg-secondary/40 p-3 md:grid-cols-2">
                <Input
                  className="h-9 md:col-span-2"
                  placeholder="Nome do alerta (ex.: O.S. em atraso)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <select
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                  value={selectedField}
                  onChange={(e) => setField(e.target.value)}
                >
                  {fields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                  value={op}
                  onChange={(e) => setOp(e.target.value as AlertOp)}
                >
                  {(Object.keys(ALERT_OP_LABELS) as AlertOp[]).map((o) => (
                    <option key={o} value={o}>
                      {ALERT_OP_LABELS[o]}
                    </option>
                  ))}
                </select>
                {needsValue && (
                  <Input
                    className="h-9"
                    placeholder="Valor"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                )}
                <select
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as "critical" | "warning")}
                >
                  <option value="critical">Crítico</option>
                  <option value="warning">Atenção</option>
                </select>
                <Button size="sm" className="md:col-span-2" onClick={add} disabled={!selectedField}>
                  <Plus className="size-4" /> Criar regra
                </Button>
              </div>
            )}

            <div className="max-h-72 space-y-2 overflow-auto">
              {!rules.length && <p className="text-sm text-muted-foreground">Nenhuma regra definida ainda.</p>}
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3"
                >
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {describeRule(r)} · {r.severity === "critical" ? "Crítico" : "Atenção"}
                      {hitsByRule.has(r.id) ? ` · ${hitsByRule.get(r.id)?.count} ocorrências` : " · sem ocorrências"}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={r.enabled}
                        onCheckedChange={(v) =>
                          onChange(rules.map((x) => (x.id === r.id ? { ...x, enabled: v } : x)))
                        }
                        aria-label="Ativar regra"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Excluir regra"
                        onClick={() => onChange(rules.filter((x) => x.id !== r.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="max-h-96 space-y-2 overflow-auto">
            {!events.length && (
              <p className="text-sm text-muted-foreground">Nenhum alerta disparado até agora.</p>
            )}
            {events.map((e) => (
              <div key={e.id} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {e.ruleName}{" "}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                        e.status === "open"
                          ? "bg-destructive/20 text-destructive"
                          : e.status === "resolved"
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ALERT_STATUS_LABELS[e.status]}
                    </span>
                  </p>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setStatus(e.id, "resolved")}>
                      <Check className="size-3.5" /> Resolver
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(e.id, "ignored")}>
                      <X className="size-3.5" /> Ignorar
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.at).toLocaleString("pt-BR")} · {e.description} ·{" "}
                  {e.count.toLocaleString("pt-BR")} de {e.total.toLocaleString("pt-BR")} registros
                </p>
                {e.rows.slice(0, 3).map((r, i) => (
                  <p key={i} className="mt-1 truncate text-xs text-muted-foreground">
                    {Object.entries(r).slice(0, 4).map(([k, v]) => `${k}: ${v ?? "—"}`).join(" · ")}
                  </p>
                ))}
              </div>
            ))}
            {events.length > 0 && (
              <Button size="sm" variant="secondary" onClick={() => onEventsChange([])}>
                <Trash2 className="size-3.5" /> Limpar histórico
              </Button>
            )}
          </TabsContent>

          <TabsContent value="notify" className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-3">
              <div>
                <p className="text-sm font-medium">Receber notificações</p>
                <p className="text-xs text-muted-foreground">Ativa o envio por e-mail e webhook.</p>
              </div>
              <Switch checked={p.enabled} onCheckedChange={(v) => setPrefs({ enabled: v })} />
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-secondary/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Webhook</p>
                <Switch
                  checked={p.webhook_enabled}
                  onCheckedChange={(v) => setPrefs({ webhook_enabled: v })}
                />
              </div>
              <Input
                className="h-9"
                placeholder="https://exemplo.com/webhook"
                value={p.webhook_url ?? ""}
                onChange={(e) => setPrefs({ webhook_url: e.target.value })}
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-secondary/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">E-mail</p>
                <Switch checked={p.email_enabled} onCheckedChange={(v) => setPrefs({ email_enabled: v })} />
              </div>
              <Input
                className="h-9"
                type="email"
                placeholder="voce@empresa.com"
                value={p.email_to ?? ""}
                onChange={(e) => setPrefs({ email_to: e.target.value })}
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-secondary/40 p-3">
              <Label className="text-sm">Severidades notificadas</Label>
              <div className="flex gap-4">
                {(["critical", "warning"] as const).map((sev) => (
                  <label key={sev} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={p.severities.includes(sev)}
                      onChange={(e) =>
                        setPrefs({
                          severities: e.target.checked
                            ? [...p.severities, sev]
                            : p.severities.filter((x) => x !== sev),
                        })
                      }
                    />
                    {sev === "critical" ? "Crítico" : "Atenção"}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-secondary/40 p-3">
              <Label className="text-sm">Regras notificadas</Label>
              <p className="text-xs text-muted-foreground">
                Sem seleção, todas as regras notificam.
              </p>
              {rules.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.rule_ids.includes(r.id)}
                    onChange={(e) =>
                      setPrefs({
                        rule_ids: e.target.checked
                          ? [...p.rule_ids, r.id]
                          : p.rule_ids.filter((x) => x !== r.id),
                      })
                    }
                  />
                  {r.name}
                </label>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
