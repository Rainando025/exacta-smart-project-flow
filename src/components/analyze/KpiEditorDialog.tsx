import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AGG_LABELS, type Agg, type KpiSpec, type Field } from "@/lib/analyze/types";

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
    compact: "Compacto (ex: 1.2M, 15k)",
    currency: "MonetÃ¡rio (R$)",
    percent: "Percentual (%)",
    decimal: "Decimal (1.200,00)",
    none: "Sem formataÃ§Ã£o (1200000)",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Editar Card de KPI</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 text-sm">
          <div className="grid gap-2">
            <Label>TÃ­tulo / RÃ³tulo</Label>
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
              <Label>CÃ¡lculo / OperaÃ§Ã£o</Label>
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
            <Label>Formato de ExibiÃ§Ã£o</Label>
            <Select
              value={draft.format ?? "compact"}
              onValueChange={(v) => set({ format: v as "compact" | "currency" | "percent" | "decimal" | "none" })}
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


