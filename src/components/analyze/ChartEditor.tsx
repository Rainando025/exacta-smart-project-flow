import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AGG_LABELS, CHART_LABELS, CHART_TYPES, type Agg, type ChartSpec, type Field } from "@/lib/analyze/types";
import { Trash2, Plus } from "lucide-react";
import { DATE_GRAINS, DATE_GRAIN_LABELS, type DateGrain } from "@/lib/analyze/date-grain";

const NONE = "__none__";

const NEON_COLORS = [
  { name: "Azul Real", hex: "#2563eb" },
  { name: "Verde Esmeralda", hex: "#10b981" },
  { name: "Ciano Elétrico", hex: "#06b6d4" },
  { name: "Roxo Violeta", hex: "#8b5cf6" },
  { name: "Amarelo Âmbar", hex: "#f59e0b" },
  { name: "Rosa Executivo", hex: "#ec4899" },
  { name: "Laranja", hex: "#f97316" },
  { name: "Vermelho Coral", hex: "#ef4444" },
];

export function ChartEditor({
  spec,
  fields,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  spec: ChartSpec | null;
  fields: Field[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (spec: ChartSpec) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState<ChartSpec | null>(spec);
  
  // Rule editor local states
  const [newOp, setNewOp] = useState<"gt" | "gte" | "lt" | "lte" | "eq" | "between">("gt");
  const [newVal1, setNewVal1] = useState("");
  const [newVal2, setNewVal2] = useState("");
  const [newColor, setNewColor] = useState("#ff3232");

  useEffect(() => setDraft(spec), [spec]);
  if (!draft) return null;

  const set = (patch: Partial<ChartSpec>) => setDraft({ ...draft, ...patch });
  const numeric = fields.filter((f) => f.type === "number");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">Editar gráfico</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Tipo de gráfico</Label>
              <Select value={draft.type} onValueChange={(v) => set({ type: v as ChartSpec["type"] })}>
                <SelectTrigger>
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
            </div>

            <div className="grid gap-2">
              <Label>Agrupar por</Label>
              <Select value={draft.dimension} onValueChange={(v) => set({ dimension: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Tipo de data</Label>
              <Select
                value={draft.dateGrain ?? "auto"}
                onValueChange={(v) => set({ dateGrain: v as DateGrain })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_GRAINS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {DATE_GRAIN_LABELS[g]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Métrica</Label>
              <Select
                value={draft.measure ?? NONE}
                onValueChange={(v) => set({ measure: v === NONE ? null : v })}
              >
                <SelectTrigger>
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
            </div>

            <div className="grid gap-2">
              <Label>Cálculo</Label>
              <Select value={draft.agg} onValueChange={(v) => set({ agg: v as Agg })}>
                <SelectTrigger>
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
            </div>

            <div className="grid gap-2">
              <Label>Série (opcional)</Label>
              <Select
                value={draft.series ?? NONE}
                onValueChange={(v) => set({ series: v === NONE ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Nenhuma</SelectItem>
                  {fields.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Largura</Label>
              <Select value={String(draft.span ?? 1)} onValueChange={(v) => set({ span: Number(v) as 1 | 2 | 3 })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Pequeno</SelectItem>
                  <SelectItem value="2">Médio</SelectItem>
                  <SelectItem value="3">Largo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Máx. categorias</Label>
              <Input
                type="number"
                min={2}
                max={30}
                value={draft.limit ?? 12}
                onChange={(e) => set({ limit: Math.max(2, Number(e.target.value) || 12) })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Ordenação</Label>
              <Select value={draft.sort ?? "desc"} onValueChange={(v) => set({ sort: v as "asc" | "desc" | "none" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Maior para menor</SelectItem>
                  <SelectItem value="asc">Menor para maior</SelectItem>
                  <SelectItem value="none">Alfabética</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Ao clicar, detalhar em</Label>
              <Select
                value={draft.drillType ?? NONE}
                onValueChange={(v) => set({ drillType: v === NONE ? null : (v as ChartSpec["type"]) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Somente filtrar</SelectItem>
                  {CHART_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {CHART_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Detalhar agrupando por</Label>
              <Select
                value={draft.drillDimension ?? NONE}
                onValueChange={(v) => set({ drillDimension: v === NONE ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Mesma coluna</SelectItem>
                  {fields.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Number Formatting Section */}
        <div className="mx-6 border-t border-border/60 pt-3 pb-2 space-y-3">
          <Label className="text-xs font-bold text-foreground block">Formatação de Números do Gráfico</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label className="text-[11px] text-muted-foreground">Formato dos Valores</Label>
              <Select
                value={draft.format ?? "compact"}
                onValueChange={(v) => set({ format: v as any })}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacto (ex: 1,2M, 15k)</SelectItem>
                  <SelectItem value="currency">Moeda R$ (ex: R$ 1.250,00)</SelectItem>
                  <SelectItem value="currency_compact">Moeda R$ Compacto (ex: R$ 1,2k)</SelectItem>
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                  <SelectItem value="decimal">Decimal com milhar (ex: 1.250,00)</SelectItem>
                  <SelectItem value="integer">Inteiro com milhar (ex: 1.250)</SelectItem>
                  <SelectItem value="none">Sem formatação (1250)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label className="text-[11px] text-muted-foreground">Casas Decimais</Label>
              <Select
                value={draft.decimalPlaces !== undefined ? String(draft.decimalPlaces) : "auto"}
                onValueChange={(v) => set({ decimalPlaces: v === "auto" ? undefined : Number(v) })}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático</SelectItem>
                  <SelectItem value="0">0 (Sem decimais)</SelectItem>
                  <SelectItem value="1">1 casa (0,0)</SelectItem>
                  <SelectItem value="2">2 casas (0,00)</SelectItem>
                  <SelectItem value="3">3 casas (0,000)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label className="text-[11px] text-muted-foreground">Prefixo Personalizado</Label>
              <Input
                className="h-8 text-xs bg-background"
                value={draft.prefix ?? ""}
                onChange={(e) => set({ prefix: e.target.value })}
                placeholder="ex: R$ "
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[11px] text-muted-foreground">Sufixo Personalizado</Label>
              <Input
                className="h-8 text-xs bg-background"
                value={draft.suffix ?? ""}
                onChange={(e) => set({ suffix: e.target.value })}
                placeholder="ex: /mês"
              />
            </div>
          </div>
        </div>

        {/* Conditional Formatting Section */}
        <div className="mx-6 border-t border-border/60 pt-3 pb-2 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-foreground">Formatação Condicional</Label>
            <select
              value={draft.gradientEnabled ? "gradient" : (draft.colorRules?.length ? "rules" : "none")}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "gradient") {
                  set({
                    gradientEnabled: true,
                    colorRules: [],
                    gradientColors: draft.gradientColors || ["#ff3232", "#32ff32"],
                  });
                } else if (val === "rules") {
                  set({
                    gradientEnabled: false,
                    colorRules: draft.colorRules || [],
                  });
                } else {
                  set({
                    gradientEnabled: false,
                    colorRules: [],
                  });
                }
              }}
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none"
            >
              <option value="none">Paleta Padrão</option>
              <option value="gradient">Gradiente Dinâmico</option>
              <option value="rules">Regras de Limite (Threshold)</option>
            </select>
          </div>

          {/* If Gradient is active */}
          {draft.gradientEnabled && (
            <div className="grid grid-cols-2 gap-3 bg-secondary/20 p-3 rounded-lg text-xs">
              <div className="grid gap-1">
                <Label className="text-[10px]">Cor Mínima (Valores Baixos)</Label>
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
                  value={draft.gradientColors?.[0] || "#ff3232"}
                  onChange={(e) => set({ gradientColors: [e.target.value, draft.gradientColors?.[1] || "#32ff32"] })}
                >
                  {NEON_COLORS.map(c => <option key={c.hex} value={c.hex}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid gap-1">
                <Label className="text-[10px]">Cor Máxima (Valores Altos)</Label>
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
                  value={draft.gradientColors?.[1] || "#32ff32"}
                  onChange={(e) => set({ gradientColors: [draft.gradientColors?.[0] || "#ff3232", e.target.value] })}
                >
                  {NEON_COLORS.map(c => <option key={c.hex} value={c.hex}>{c.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* If Rules is active */}
          {!draft.gradientEnabled && (draft.colorRules !== undefined) && (
            <div className="space-y-2 bg-secondary/20 p-3 rounded-lg text-xs">
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {!draft.colorRules?.length && (
                  <p className="text-[11px] text-muted-foreground italic py-1">Nenhuma regra definida ainda.</p>
                )}
                {draft.colorRules?.map((r) => {
                  const opLabels: Record<string, string> = {
                    gt: "Maior que",
                    gte: "Maior ou igual a",
                    lt: "Menor que",
                    lte: "Menor ou igual a",
                    eq: "Igual a",
                    between: "Entre",
                  };
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-2 border-b border-border/40 py-1">
                      <span>
                        Valor {opLabels[r.op] || r.op}{" "}
                        <strong>{r.value1}</strong> {r.op === "between" ? `e ${r.value2}` : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="size-3.5 rounded-full border border-border" style={{ backgroundColor: r.color }} />
                        <button
                          onClick={() => set({ colorRules: draft.colorRules ? draft.colorRules.filter(x => x.id !== r.id) : [] })}
                          className="text-muted-foreground hover:text-destructive transition p-0.5"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add rule form */}
              <div className="grid grid-cols-12 gap-1.5 items-end pt-2 border-t border-border/40">
                <div className="col-span-4">
                  <Label className="text-[9px]">Condição</Label>
                  <select
                    className="w-full h-8 rounded-md border border-input bg-background px-1.5 text-xs focus:outline-none"
                    value={newOp}
                    onChange={(e) => setNewOp(e.target.value as any)}
                  >
                    <option value="gt">Maior que (&gt;)</option>
                    <option value="gte">Maior ou igual (&ge;)</option>
                    <option value="lt">Menor que (&lt;)</option>
                    <option value="lte">Menor ou igual (&le;)</option>
                    <option value="eq">Igual a (=)</option>
                    <option value="between">Entre</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label className="text-[9px]">Val 1</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs p-1"
                    value={newVal1}
                    onChange={(e) => setNewVal1(e.target.value)}
                  />
                </div>
                {newOp === "between" ? (
                  <div className="col-span-2">
                    <Label className="text-[9px]">Val 2</Label>
                    <Input
                      type="number"
                      className="h-8 text-xs p-1"
                      value={newVal2}
                      onChange={(e) => setNewVal2(e.target.value)}
                    />
                  </div>
                ) : null}
                <div className={newOp === "between" ? "col-span-3" : "col-span-4"}>
                  <Label className="text-[9px]">Cor</Label>
                  <select
                    className="w-full h-8 rounded-md border border-input bg-background px-1 text-xs focus:outline-none"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                  >
                    {NEON_COLORS.map(c => <option key={c.hex} value={c.hex}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (newVal1 === "") return;
                      const rule = {
                        id: `rule-${Date.now()}`,
                        op: newOp,
                        value1: Number(newVal1),
                        ...(newOp === "between" ? { value2: Number(newVal2) } : {}),
                        color: newColor,
                      };
                      set({
                        colorRules: [...(draft.colorRules || []), rule],
                      });
                      setNewVal1("");
                      setNewVal2("");
                    }}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>



        <DialogFooter className="gap-2 sm:justify-between">
          {onDelete ? (
            <Button variant="ghost" className="text-destructive" onClick={() => onDelete(draft.id)}>
              Remover
            </Button>
          ) : (
            <span />
          )}
          <Button
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
