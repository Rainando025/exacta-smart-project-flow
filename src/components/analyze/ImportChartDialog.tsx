import { useState } from "react";
import {
  Download,
  FileCode,
  FolderPlus,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ScatterChart as ScatterChartIcon,
  Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { ChartSpec, ChartType, Field, Page } from "@/lib/analyze/types";

interface ImportChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: Field[];
  pages: Page[];
  activePageId: string | null;
  onImport: (charts: ChartSpec[]) => void;
}

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  type: ChartType;
  icon: typeof BarChart3;
  defaultAgg: "sum" | "count" | "avg";
  suggestDimensionType: "date" | "string" | "any";
  format?: "currency" | "compact" | "percent" | "integer";
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "temporal-line",
    name: "Evolução Temporal (Linha)",
    description: "Ideal para acompanhar tendências de faturamento, vendas ou registros ao longo do tempo.",
    type: "line",
    icon: LineChartIcon,
    defaultAgg: "sum",
    suggestDimensionType: "date",
    format: "currency",
  },
  {
    id: "category-pie",
    name: "Distribuição por Categoria (Pizza)",
    description: "Visualização proporcional das categorias mais expressivas do dataset.",
    type: "pie",
    icon: PieChartIcon,
    defaultAgg: "count",
    suggestDimensionType: "string",
    format: "compact",
  },
  {
    id: "top-barh",
    name: "Ranking Top 10 (Barra Horizontal)",
    description: "Destaque os principais itens (produtos, clientes, vendedores) em ordem decrescente.",
    type: "barH",
    icon: BarChart3,
    defaultAgg: "sum",
    suggestDimensionType: "string",
    format: "currency",
  },
  {
    id: "accumulated-area",
    name: "Desempenho Acumulado (Área)",
    description: "Acompanhamento volumétrico e preenchido de métricas acumuladas.",
    type: "area",
    icon: LineChartIcon,
    defaultAgg: "sum",
    suggestDimensionType: "date",
    format: "currency",
  },
  {
    id: "donut-distribution",
    name: "Divisão Percentual (Rosca)",
    description: "Gráfico de rosca elegante para participação percentual entre segmentos.",
    type: "donut",
    icon: PieChartIcon,
    defaultAgg: "count",
    suggestDimensionType: "string",
    format: "percent",
  },
  {
    id: "scatter-dispersion",
    name: "Análise de Dispersão (Scatter)",
    description: "Correlacione duas variáveis numéricas para identificar padrões ou anomalias.",
    type: "scatter",
    icon: ScatterChartIcon,
    defaultAgg: "avg",
    suggestDimensionType: "any",
    format: "compact",
  },
];

export function ImportChartDialog({
  open,
  onOpenChange,
  fields,
  pages,
  activePageId,
  onImport,
}: ImportChartDialogProps) {
  const [activeTab, setActiveTab] = useState<"gallery" | "json" | "copy">("gallery");

  // Gallery state
  const [selectedPreset, setSelectedPreset] = useState<TemplatePreset>(TEMPLATE_PRESETS[0]);
  const [customTitle, setCustomTitle] = useState("");
  const [selectedDimension, setSelectedDimension] = useState<string>("");
  const [selectedMeasure, setSelectedMeasure] = useState<string>("");

  // JSON state
  const [jsonText, setJsonText] = useState("");

  // Copy state
  const [sourcePageId, setSourcePageId] = useState<string>("");
  const [selectedChartIds, setSelectedChartIds] = useState<string[]>([]);

  // Auto pick dimensions when preset changes or fields change
  const numericFields = fields.filter((f) => f.type === "number");
  const stringOrDateFields = fields.filter((f) => f.type === "string" || f.type === "date");

  const handleSelectPreset = (preset: TemplatePreset) => {
    setSelectedPreset(preset);
    setCustomTitle(preset.name);
    
    // Auto-suggest dimension
    if (preset.suggestDimensionType === "date") {
      const dateF = fields.find((f) => f.type === "date") || fields[0];
      if (dateF) setSelectedDimension(dateF.name);
    } else {
      const strF = stringOrDateFields[0] || fields[0];
      if (strF) setSelectedDimension(strF.name);
    }

    if (numericFields[0]) {
      setSelectedMeasure(numericFields[0].name);
    }
  };

  const handleImportPreset = () => {
    if (!selectedDimension) {
      toast.error("Selecione um campo para a Dimensão (Eixo X).");
      return;
    }

    const newChart: ChartSpec = {
      id: "chart-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title: customTitle.trim() || selectedPreset.name,
      type: selectedPreset.type,
      dimension: selectedDimension,
      measure: selectedMeasure || null,
      agg: selectedPreset.defaultAgg,
      span: 2,
      sort: "desc",
      limit: 10,
      format: selectedPreset.format || "compact",
    };

    onImport([newChart]);
    toast.success(`Gráfico "${newChart.title}" criado com sucesso!`);
    onOpenChange(false);
  };

  const handleImportJson = () => {
    if (!jsonText.trim()) {
      toast.error("Cole o código JSON do gráfico ou arquivo.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      const validCharts: ChartSpec[] = items.map((item, idx) => ({
        id: "chart-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substring(2, 5),
        title: item.title || `Gráfico Importado ${idx + 1}`,
        type: item.type || "bar",
        dimension: item.dimension || (fields[0]?.name ?? "Categoria"),
        measure: item.measure ?? null,
        agg: item.agg || "sum",
        series: item.series ?? null,
        limit: item.limit ?? 10,
        sort: item.sort || "desc",
        span: item.span || 2,
        palette: item.palette,
        format: item.format,
        decimalPlaces: item.decimalPlaces,
        prefix: item.prefix,
        suffix: item.suffix,
        showDataLabels: item.showDataLabels,
        colorRules: item.colorRules,
      }));

      if (validCharts.length === 0) {
        toast.error("Nenhum gráfico válido foi encontrado no JSON.");
        return;
      }

      onImport(validCharts);
      toast.success(`${validCharts.length} gráfico(s) importado(s) com sucesso!`);
      setJsonText("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao ler JSON: " + (err.message || "Formato inválido."));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setJsonText(text);
      }
    };
    reader.readAsText(file);
  };

  const sourcePage = pages.find((p) => p.id === sourcePageId);
  const otherPages = pages.filter((p) => p.id !== activePageId);

  const toggleChartSelection = (id: string) => {
    setSelectedChartIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCopyCharts = () => {
    if (!sourcePage) {
      toast.error("Selecione a página de origem.");
      return;
    }
    if (selectedChartIds.length === 0) {
      toast.error("Selecione ao menos um gráfico para copiar.");
      return;
    }

    const availableCharts = sourcePage.dashboard?.charts ?? [];
    const chartsToCopy = availableCharts.filter((c: ChartSpec) => selectedChartIds.includes(c.id));
    const newCharts: ChartSpec[] = chartsToCopy.map((c: ChartSpec) => ({
      ...c,
      id: "chart-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title: `${c.title} (Cópia)`,
    }));

    onImport(newCharts);
    toast.success(`${newCharts.length} gráfico(s) copiado(s) para esta página!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0 border-border bg-background">
        <DialogHeader className="p-5 pb-3 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Download className="w-5 h-5 text-primary" />
            Importar & Adicionar Gráfico
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Escolha um modelo pronto da galeria, importe uma estrutura via JSON ou copie visuais de outra página.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-5 pt-3 bg-muted/20 border-b border-border/40">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="gallery" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Galeria de Modelos
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-1.5 text-xs">
                <FileCode className="w-3.5 h-3.5" />
                JSON / Arquivo
              </TabsTrigger>
              <TabsTrigger value="copy" className="gap-1.5 text-xs">
                <FolderPlus className="w-3.5 h-3.5" />
                Copiar de Outra Página
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* TAB 1: GALERIA */}
            <TabsContent value="gallery" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEMPLATE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 relative ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-xs font-semibold text-foreground truncate">{preset.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-primary">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mapeamento de campos do modelo */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Configurar Mapeamento para "{selectedPreset.name}"
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1 block">Título do Gráfico</Label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={selectedPreset.name}
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1 block">Dimensão (Eixo X)</Label>
                    <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Selecione o campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((f) => (
                          <SelectItem key={f.name} value={f.name} className="text-xs">
                            {f.name} <span className="text-[10px] text-muted-foreground">({f.type})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1 block">Métrica (Eixo Y)</Label>
                    <Select value={selectedMeasure || "__count__"} onValueChange={(v) => setSelectedMeasure(v === "__count__" ? "" : v)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Selecione o campo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__count__" className="text-xs">
                          Contagem de Registros
                        </SelectItem>
                        {numericFields.map((f) => (
                          <SelectItem key={f.name} value={f.name} className="text-xs">
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button onClick={handleImportPreset} size="sm" className="gap-2 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    Gerar Gráfico na Página
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: JSON */}
            <TabsContent value="json" className="mt-0 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Cole o JSON do Gráfico</Label>
                  <label className="cursor-pointer text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                    <Download className="w-3.5 h-3.5" />
                    Carregar de arquivo (.json)
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`[\n  {\n    "title": "Vendas por Região",\n    "type": "bar",\n    "dimension": "Regiao",\n    "measure": "Vendas",\n    "agg": "sum",\n    "format": "currency"\n  }\n]`}
                  className="w-full h-44 p-3 rounded-lg border border-border bg-muted/20 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleImportJson} size="sm" className="gap-2 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  Importar Estrutura JSON
                </Button>
              </div>
            </TabsContent>

            {/* TAB 3: COPIAR DE OUTRA PÁGINA */}
            <TabsContent value="copy" className="mt-0 space-y-4">
              {otherPages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Não existem outras páginas com gráficos para copiar neste workspace.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Selecione a Página Origem</Label>
                    <Select value={sourcePageId} onValueChange={(v) => { setSourcePageId(v); setSelectedChartIds([]); }}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Escolha a página..." />
                      </SelectTrigger>
                      <SelectContent>
                        {otherPages.map((p) => {
                          const count = p.dashboard?.charts.length ?? 0;
                          return (
                            <SelectItem key={p.id} value={p.id} className="text-xs">
                              {p.name} ({count} gráfico{count !== 1 ? "s" : ""})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {sourcePage && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Gráficos disponíveis para cópia:</Label>
                      {(sourcePage.dashboard?.charts ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Esta página não possui gráficos.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                          {(sourcePage.dashboard?.charts ?? []).map((c: ChartSpec) => {
                            const isChecked = selectedChartIds.includes(c.id);
                            return (
                              <div
                                key={c.id}
                                onClick={() => toggleChartSelection(c.id)}
                                className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                  isChecked
                                    ? "border-primary bg-primary/10"
                                    : "border-border/60 hover:bg-muted/30"
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-semibold text-foreground truncate">{c.title}</div>
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    {c.type} • {c.dimension} {c.measure ? `• ${c.measure}` : ""}
                                  </div>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    isChecked
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-border"
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleCopyCharts}
                      disabled={!sourcePage || selectedChartIds.length === 0}
                      size="sm"
                      className="gap-2 text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Copiar Selecionado(s) ({selectedChartIds.length})
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
