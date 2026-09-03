import { useState, useMemo } from "react";
import { Layers, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { Page, Dataset, Row, Field } from "@/lib/analyze/types";
import { pickIcon } from "@/components/analyze/PageTabs";
import { buildDataset } from "@/lib/analyze/parse-file";

export function MergeDatasetsDialog({
  open,
  onOpenChange,
  pages,
  activePage,
  onMerge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: Page[];
  activePage: Page | null;
  onMerge: (newPage: Page) => void;
}) {
  const [targetPageId, setTargetPageId] = useState<string>("");
  const [keyA, setKeyA] = useState<string>("");
  const [keyB, setKeyB] = useState<string>("");
  const [joinType, setJoinType] = useState<"left" | "inner">("left");
  const [selectedColsB, setSelectedColsB] = useState<Record<string, boolean>>({});
  const [newName, setNewName] = useState<string>("");

  const targetPage = useMemo(() => {
    return pages.find((p) => p.id === targetPageId) || null;
  }, [pages, targetPageId]);

  // Available pages to merge with
  const availablePages = useMemo(() => {
    if (!activePage) return [];
    return pages.filter((p) => p.id !== activePage.id);
  }, [pages, activePage]);

  // Set default values when target page changes
  useMemo(() => {
    if (availablePages.length && !targetPageId) {
      const first = availablePages[0];
      if (first) {
        setTargetPageId(first.id);
      }
    }
  }, [availablePages, targetPageId]);

  useMemo(() => {
    if (activePage && !keyA) {
      setKeyA(activePage.dataset.fields[0]?.name || "");
    }
  }, [activePage, keyA]);

  useMemo(() => {
    if (targetPage) {
      setKeyB(targetPage.dataset.fields[0]?.name || "");
      // Select all columns by default
      const cols: Record<string, boolean> = {};
      targetPage.dataset.fields.forEach((f) => {
        cols[f.name] = true;
      });
      setSelectedColsB(cols);
      
      if (activePage) {
        setNewName(`${activePage.name} + ${targetPage.name}`);
      }
    }
  }, [targetPage, activePage]);

  if (!activePage) return null;

  const handleMerge = () => {
    if (!targetPage || !keyA || !keyB || !newName.trim()) return;

    const datasetA = activePage.dataset;
    const datasetB = targetPage.dataset;
    
    const fieldsA = datasetA.fields;
    // Get fields from B that are checked (excluding the match key from B to prevent duplication)
    const fieldsBToMerge = datasetB.fields.filter(
      (f) => selectedColsB[f.name] && f.name !== keyB
    );

    // Resolve name collisions by adding page prefix if names match
    const colMapB: Record<string, string> = {};
    const namesA = new Set(fieldsA.map((f) => f.name));
    
    fieldsBToMerge.forEach((f) => {
      if (namesA.has(f.name)) {
        colMapB[f.name] = `${f.name}_${targetPage.name.substring(0, 10)}`;
      } else {
        colMapB[f.name] = f.name;
      }
    });

    const mergedRows: Row[] = [];

    // Group B rows by keyB string value for faster lookup
    const bGroups = new Map<string, Row[]>();
    datasetB.rows.forEach((r) => {
      const val = String(r[keyB] ?? "").trim().toLowerCase();
      if (!bGroups.has(val)) {
        bGroups.set(val, []);
      }
      bGroups.get(val)!.push(r);
    });

    datasetA.rows.forEach((rA) => {
      const valA = String(rA[keyA] ?? "").trim().toLowerCase();
      const matches = bGroups.get(valA) ?? [];

      if (matches.length === 0) {
        if (joinType === "left") {
          const newRow: Row = { ...rA };
          // fill columns of B with null
          Object.values(colMapB).forEach((colName) => {
            newRow[colName] = null;
          });
          mergedRows.push(newRow);
        }
      } else {
        matches.forEach((rB) => {
          const newRow: Row = { ...rA };
          Object.entries(colMapB).forEach(([oldName, newName]) => {
            newRow[newName] = rB[oldName] ?? null;
          });
          mergedRows.push(newRow);
        });
      }
    });

    // Construct new fields array
    const mergedFields: Field[] = [...fieldsA];
    fieldsBToMerge.forEach((f) => {
      mergedFields.push({ name: colMapB[f.name] || f.name, type: f.type });
    });

    const mergedDataset: Dataset = {
      name: newName,
      fields: mergedFields,
      rows: mergedRows,
      sources: Array.from(new Set([...(datasetA.sources || [datasetA.name]), targetPage.name])),
    };

    const newPage: Page = {
      id: `page-${Date.now()}`,
      name: newName.trim(),
      icon: pickIcon(newName),
      dataset: mergedDataset,
      dashboard: null,
      views: [],
      annotations: [],
      history: [
        {
          id: `imp-${Date.now()}`,
          at: new Date().toISOString(),
          mode: "create",
          filename: `Mescla de ${activePage.name} e ${targetPage.name}`,
          rowCount: mergedRows.length,
        },
      ],
    };

    onMerge(newPage);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Layers className="size-5 text-primary" /> Combinar Dados (VLOOKUP / JOIN)
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Tabela Base (Atual)</Label>
              <Input value={activePage.name} disabled className="bg-muted text-muted-foreground" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Tabela para Combinar</Label>
              {availablePages.length === 0 ? (
                <p className="text-xs text-amber-500 py-2">Importe mais arquivos para habilitar a combinação.</p>
              ) : (
                <select
                  value={targetPageId}
                  onChange={(e) => setTargetPageId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {availablePages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {targetPage && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Coluna Chave na Base Atual</Label>
                  <select
                    value={keyA}
                    onChange={(e) => setKeyA(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                  >
                    {activePage.dataset.fields.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Coluna Chave correspondente na outra Base</Label>
                  <select
                    value={keyB}
                    onChange={(e) => setKeyB(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                  >
                    {targetPage.dataset.fields.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Tipo de Combinação (Join)</Label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="joinType"
                      checked={joinType === "left"}
                      onChange={() => setJoinType("left")}
                      className="accent-primary"
                    />
                    <div>
                      <p className="font-semibold text-xs">Preservar Esquerda (Left Join)</p>
                      <p className="text-[11px] text-muted-foreground">Mantém todas as linhas da base atual e adiciona dados correspondentes.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="joinType"
                      checked={joinType === "inner"}
                      onChange={() => setJoinType("inner")}
                      className="accent-primary"
                    />
                    <div>
                      <p className="font-semibold text-xs">Apenas Correspondentes (Inner Join)</p>
                      <p className="text-[11px] text-muted-foreground">Retorna apenas as linhas com valores equivalentes em ambas as tabelas.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Colunas para Adicionar da Tabela Destino</Label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-border rounded-md p-3 bg-secondary/20">
                  {targetPage.dataset.fields
                    .filter((f) => f.name !== keyB)
                    .map((f) => (
                      <div key={f.name} className="flex items-center gap-2">
                        <Checkbox
                          id={`col-b-${f.name}`}
                          checked={!!selectedColsB[f.name]}
                          onCheckedChange={(checked) =>
                            setSelectedColsB((prev) => ({ ...prev, [f.name]: !!checked }))
                          }
                        />
                        <label
                          htmlFor={`col-b-${f.name}`}
                          className="text-xs truncate cursor-pointer select-none"
                        >
                          {f.name} <span className="text-[10px] text-muted-foreground">({f.type})</span>
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Nome da Nova Página</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Vendas e Clientes" />
              </div>

              <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground leading-relaxed">
                <Info className="size-4 shrink-0 text-primary mt-0.5" />
                <p>
                  A combinação criará uma <strong>nova página</strong> com a base consolidada. O motor de IA gerará 
                  automaticamente gráficos, KPIs e insights cruzados sobre as colunas combinadas!
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!targetPage || !keyA || !keyB || !newName.trim()}
          >
            <Plus className="size-4 mr-1" /> Combinar e Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
