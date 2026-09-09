import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AGG_LABELS, type Agg, type KpiSpec, type Field } from "@/lib/analyze/types";
import { RichColorPicker } from "@/components/ui/color-picker";

const NONE = "__none__";

export function KpiEditorDialog({
  open,
  onOpenChange,
  kpi,
  fields,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kpi: KpiSpec | null;
  fields: Field[];
  onSave: (kpi: KpiSpec) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState<KpiSpec | null>(null);

  useEffect(() => {
    if (kpi) {
      setDraft(kpi);
    } else {
      setDraft(null);
    }
  }, [kpi]);

  if (!draft) return null;

  const set = (patch: Partial<KpiSpec>) => setDraft((d) => (d ? { ...d, ...patch } : null));
  const numeric = fields.filter((f) => f.type === "number");

  const formatLabels: Record<NonNullable<KpiSpec["format"]>, string> = {
    compact: "Compacto (ex: 1,2M, 15k)",
    currency: "Moeda R$ Completo (ex: R$ 1.250,00)",
    currency_compact: "Moeda R$ Compacto (ex: R$ 1,2k)",
    percent: "Percentual (%)",
    decimal: "Decimal com milhar (ex: 1.250,00)",
    integer: "Número Inteiro (ex: 1.250)",
    none: "Sem formatação (1250)",
  };

  const accentColors = [
    { name: "Azul Neon", hex: "#3b82f6" },
    { name: "Verde Esmeralda", hex: "#10b981" },
    { name: "Roxo Violeta", hex: "#8b5cf6" },
    { name: "Âmbar Laranja", hex: "#f59e0b" },
    { name: "Rosa Crimson", hex: "#f43f5e" },
    { name: "Ciano Neon", hex: "#06b6d4" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Editar Card de KPI</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 text-sm">
          <div className="grid gap-2">
            <Label>Título / Rótulo</Label>
            <Input
              value={draft.label}
              onChange={(e) => set({ label: e.target.value })}
              placeholder="Ex: Faturamento Total"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Coluna do Dado</Label>
              <Select
                value={draft.field ?? NONE}
                onValueChange={(v) => set({ field: v === NONE ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Contagem de Linhas</SelectItem>
                  {(numeric.length ? numeric : fields).map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Cálculo / Operação</Label>
              <Select
                value={draft.agg}
                onValueChange={(v) => set({ agg: v as Agg })}
              >
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
          </div>

          <div className="grid gap-2">
            <Label>Formato de Exibição</Label>
            <Select
              value={draft.format ?? "compact"}
              onValueChange={(v) => set({ format: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(formatLabels) as Array<NonNullable<KpiSpec["format"]>>).map((f) => (
                  <SelectItem key={f} value={f}>
                    {formatLabels[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Decimais, Prefixo e Sufixo */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="grid gap-1">
              <Label className="text-xs">Casas Decimais</Label>
              <Select
                value={draft.decimalPlaces !== undefined ? String(draft.decimalPlaces) : "auto"}
                onValueChange={(v) => set({ decimalPlaces: v === "auto" ? undefined : Number(v) })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="0">0 (Sem decimais)</SelectItem>
                  <SelectItem value="1">1 casa (0,0)</SelectItem>
                  <SelectItem value="2">2 casas (0,00)</SelectItem>
                  <SelectItem value="3">3 casas (0,000)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label className="text-xs">Prefixo</Label>
              <Input
                className="h-8 text-xs"
                value={draft.prefix ?? ""}
                onChange={(e) => set({ prefix: e.target.value })}
                placeholder="ex: R$ "
              />
            </div>

            <div className="grid gap-1">
              <Label className="text-xs">Sufixo</Label>
              <Input
                className="h-8 text-xs"
                value={draft.suffix ?? ""}
                onChange={(e) => set({ suffix: e.target.value })}
                placeholder="ex: /mês"
              />
            </div>
          </div>

          {/* Cor de Destaque */}
          <div className="grid gap-1.5">
            <Label className="text-xs">Cor do Card (Destaque)</Label>
            <RichColorPicker
              value={draft.accentColor || "#3b82f6"}
              onChange={(c) => set({ accentColor: c })}
              compact
            />
          </div>

          <div className="border-t border-border/60 my-1 pt-3">
            <Label className="text-xs font-semibold text-muted-foreground">Filtro Local (Opcional)</Label>
            <p className="text-[10px] text-muted-foreground mb-2">
              Filtra os dados deste card isoladamente do resto do dashboard.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="text-xs">Coluna</Label>
                <Select
                  value={draft.filterField ?? NONE}
                  onValueChange={(v) => set({ filterField: v === NONE ? null : v, filterValue: v === NONE ? null : "" })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Nenhum</SelectItem>
                    {fields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {draft.filterField && (
                <div className="grid gap-2">
                  <Label className="text-xs">Valor do Filtro</Label>
                  <Input
                    className="h-8"
                    value={draft.filterValue ?? ""}
                    onChange={(e) => set({ filterValue: e.target.value })}
                    placeholder="Ex: Pago"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {onDelete ? (
            <Button
              variant="ghost"
              className="text-destructive text-xs"
              onClick={() => onDelete(draft.id)}
            >
              Remover Card
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onSave(draft);
                onOpenChange(false);
              }}
            >
              Salvar Card
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
