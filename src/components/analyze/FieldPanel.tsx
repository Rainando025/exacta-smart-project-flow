import { useMemo, useState } from "react";
import { Filter, Hash, Calendar, Type, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AGG_LABELS, CHART_LABELS, CHART_TYPES, type Agg, type ChartSpec, type Field, type Row } from "@/lib/analyze/types";

const NONE = "__none__";

function FieldIcon({ type }: { type: Field["type"] }) {
  const cls = "size-3.5 shrink-0 text-muted-foreground";
  if (type === "number") return <Hash className={cls} />;
  if (type === "date") return <Calendar className={cls} />;
  return <Type className={cls} />;
}

export function FieldPanel({
  fields,
  rows,
  visible,
  onToggleVisible,
  filters,
  onFilter,
  onCreate,
  onClose,
}: {
  fields: Field[];
  rows: Row[];
  visible: string[];
  onToggleVisible: (name: string) => void;
  filters: Record<string, string>;
  onFilter: (name: string, value: string | null) => void;
  onCreate: (spec: ChartSpec) => void;
  onClose: () => void;
}) {
  const numeric = fields.filter((f) => f.type === "number");
  const categorical = fields.filter((f) => f.type !== "number");
  const [dimension, setDimension] = useState(categorical[0]?.name ?? fields[0]?.name ?? "");
  const [measure, setMeasure] = useState<string>(NONE);
  const [agg, setAgg] = useState<Agg>("count");
  const [type, setType] = useState<ChartSpec["type"]>("bar");

  const values = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const f of categorical) {
      const set = new Set<string>();
      for (const r of rows) {
        const v = r[f.name];
        if (v === null || v === undefined || v === "") continue;
        set.add(String(v));
        if (set.size > 60) break;
      }
      map.set(f.name, Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR")));
    }
    return map;
  }, [categorical, rows]);

  return (
    <aside className="no-print panel flex h-[calc(100vh-6rem)] w-[300px] shrink-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <p className="label-eyebrow !text-foreground">Campos e anÃ¡lises</p>
        <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <section>
          <p className="label-eyebrow mb-2">Colunas visÃ­veis</p>
          <div className="space-y-1">
            {fields.map((f) => (
              <label
                key={f.name}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-accent/60"
              >
                <input
                  type="checkbox"
                  className="accent-[var(--neon-blue)]"
                  checked={visible.includes(f.name)}
                  onChange={() => onToggleVisible(f.name)}
                />
                <FieldIcon type={f.type} />
                <span className="truncate">{f.name}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <p className="label-eyebrow mb-2 flex items-center gap-1.5">
            <Filter className="size-3" /> Filtros
          </p>
          <div className="space-y-2">
            {categorical.slice(0, 8).map((f) => (
              <div key={f.name} className="grid gap-1">
                <Label className="text-[11px] text-muted-foreground">{f.name}</Label>
                <Select
                  value={filters[f.name] ?? NONE}
                  onValueChange={(v) => onFilter(f.name, v === NONE ? null : v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Todos</SelectItem>
                    {(values.get(f.name) ?? []).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="label-eyebrow mb-2">Nova anÃ¡lise</p>
          <div className="grid gap-2">
            <Select value={dimension} onValueChange={setDimension}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Agrupar por" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f.name} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={measure} onValueChange={setMeasure}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Contagem de registros</SelectItem>
                {(numeric.length ? numeric : fields).map((f) => (
                  <SelectItem key={f.name} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={agg} onValueChange={(v) => setAgg(v as Agg)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(AGG_LABELS) as Agg[]).map((a) => (
                  <SelectItem key={a} value={a}>
                    {AGG_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={(v) => setType(v as ChartSpec["type"])}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CHART_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              disabled={!dimension}
              onClick={() =>
                onCreate({
                  id: `chart-${Date.now()}`,
                  title: `${measure === NONE ? AGG_LABELS[agg] : `${AGG_LABELS[agg]} de ${measure}`} por ${dimension}`,
                  type,
                  dimension,
                  measure: measure === NONE ? null : measure,
                  agg,
                  series: null,
                  limit: 10,
                  span: 2,
                  palette: Math.floor(Math.random() * 6),
                })
              }
            >
              <Plus className="size-4" /> Criar anÃ¡lise
            </Button>
          </div>
        </section>
      </div>
    </aside>
  );
}


