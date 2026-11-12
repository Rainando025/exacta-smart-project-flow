import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  CreditCard,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateCsvTemplate,
  parseFinancesCsv,
  type CsvParsedRow,
} from "@/lib/finances-helpers";

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: CsvParsedRow[]) => Promise<void>;
}

export function ImportCsvDialog({
  open,
  onOpenChange,
  onImport,
}: ImportCsvDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CsvParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "valid" | "error">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    try {
      const csvContent = generateCsvTemplate();
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "modelo_lancamentos_financas_exacta.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Modelo CSV baixado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar modelo CSV", { description: e?.message });
    }
  };

  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);

    try {
      const text = await selectedFile.text();
      const rows = parseFinancesCsv(text);

      if (rows.length === 0) {
        toast.warning("Nenhum dado válido encontrado no arquivo CSV.");
        setParsedRows([]);
      } else {
        setParsedRows(rows);
        const validCount = rows.filter((r) => r.isValid).length;
        toast.info(`${validCount} lançamento(s) identificado(s) na planilha.`);
      }
    } catch (e: any) {
      toast.error("Erro ao ler arquivo CSV", { description: e?.message });
      setParsedRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("Nenhum lançamento válido para importar.");
      return;
    }

    setImporting(true);
    try {
      await onImport(validRows);
      if (invalidCount > 0) {
        toast.success(`${validRows.length} lançamento(s) importado(s) com sucesso!`, {
          description: `${invalidCount} linha(s) com inconsistências foram ignoradas.`,
        });
      } else {
        toast.success(`${validRows.length} lançamento(s) importado(s) com sucesso!`);
      }
      handleReset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Erro ao salvar lançamentos importados", { description: e?.message });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setFilterMode("all");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  const displayedRows = parsedRows.filter((r) => {
    if (filterMode === "valid") return r.isValid;
    if (filterMode === "error") return !r.isValid;
    return true;
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleReset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 gap-5">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Importar Lançamentos via CSV
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Adicione múltiplos lançamentos de receitas e despesas de uma vez através de uma planilha.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step 1: Download Template */}
        <div className="p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Download className="size-3.5 text-primary" /> Passo 1: Obtenha o Modelo Padrão
            </h4>
            <p className="text-xs text-muted-foreground">
              Baixe a planilha de exemplo com as colunas certas. O campo <strong>valor</strong> já é o valor exato de cada parcela.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="text-xs gap-1.5 shrink-0 bg-background hover:bg-muted font-medium"
          >
            <Download className="size-3.5" /> Baixar Modelo CSV
          </Button>
        </div>

        {/* Step 2: Upload CSV */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Upload className="size-3.5 text-primary" /> Passo 2: Selecione o Arquivo Preenchido
          </h4>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void handleFileChange(e.target.files?.[0] || null)}
          />

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/30 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
            >
              <div className="p-2.5 rounded-full bg-muted text-muted-foreground">
                <Upload className="size-5" />
              </div>
              <p className="text-xs font-medium text-foreground">
                Clique aqui para selecionar seu arquivo CSV preenchido
              </p>
              <p className="text-[11px] text-muted-foreground">Formato suportado: .csv (separador por ponto e vírgula ou vírgula)</p>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <FileSpreadsheet className="size-4 text-emerald-500 shrink-0" />
                <span className="font-medium truncate">{file.name}</span>
                <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
              >
                <Trash2 className="size-3" /> Trocar
              </Button>
            </div>
          )}
        </div>

        {/* Step 3: Preview Table */}
        {loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p>Lendo e processando planilha...</p>
          </div>
        )}

        {!loading && parsedRows.length > 0 && (
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            {/* Toolbar com filtros e contadores */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-foreground">
                Pré-visualização dos Lançamentos ({parsedRows.length})
              </span>

              {/* Botões de Filtro */}
              <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    filterMode === "all"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos ({parsedRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("valid")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                    filterMode === "valid"
                      ? "bg-background text-emerald-600 shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  Válidos ({validCount})
                </button>
                {invalidCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterMode("error")}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                      filterMode === "error"
                        ? "bg-background text-destructive shadow-xs font-semibold"
                        : "text-destructive hover:bg-destructive/10"
                    }`}
                  >
                    <AlertCircle className="size-3 text-destructive" />
                    Com Erro ({invalidCount})
                  </button>
                )}
              </div>
            </div>

            {/* Banner de alerta detalhado caso haja inconsistências */}
            {invalidCount > 0 && (
              <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-destructive font-semibold text-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>
                      {invalidCount} linha(s) com erros identificadas (não serão importadas até a correção):
                    </span>
                  </div>
                  {filterMode !== "error" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterMode("error")}
                      className="h-6 px-2 text-[10px] border-destructive/30 text-destructive hover:bg-destructive/10 font-medium"
                    >
                      Filtrar apenas com erro
                    </Button>
                  )}
                </div>

                <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] pr-1 divide-y divide-destructive/10">
                  {parsedRows
                    .filter((r) => !r.isValid)
                    .map((r, i) => (
                      <div key={i} className="flex items-start gap-2 pt-1 first:pt-0">
                        <span className="font-semibold text-destructive shrink-0 bg-destructive/10 px-1 rounded text-[10px]">
                          Linha {r.rowNumber}
                        </span>
                        <span className="font-medium text-foreground truncate max-w-[180px]">
                          {r.title || "(sem título)"}
                        </span>
                        <span className="text-destructive font-medium">• {r.error}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Tabela de Lançamentos com diagnóstico */}
            <ScrollArea className="flex-1 max-h-[380px] border rounded-lg overflow-hidden bg-background">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-muted/60 border-b text-muted-foreground sticky top-0">
                  <tr>
                    <th className="p-2 font-medium w-12 text-center">Linha</th>
                    <th className="p-2 font-medium">Descrição</th>
                    <th className="p-2 font-medium">Status / Diagnóstico</th>
                    <th className="p-2 font-medium">Tipo</th>
                    <th className="p-2 font-medium">Custo</th>
                    <th className="p-2 font-medium">Categoria</th>
                    <th className="p-2 font-medium">Vencimento</th>
                    <th className="p-2 font-medium">Recorrência / Cartão</th>
                    <th className="p-2 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayedRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-muted-foreground text-xs">
                        Nenhum lançamento corresponde ao filtro selecionado.
                      </td>
                    </tr>
                  )}
                  {displayedRows.map((r, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-muted/20 transition ${
                        !r.isValid ? "bg-destructive/5" : ""
                      }`}
                    >
                      <td className="p-2 text-center text-muted-foreground font-mono text-[10px]">
                        {r.rowNumber}
                      </td>
                      <td className="p-2 font-medium truncate max-w-[150px]">{r.title}</td>

                      {/* Status / Diagnóstico */}
                      <td className="p-2">
                        {r.isValid ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium"
                          >
                            <CheckCircle2 className="size-2.5 mr-1" /> Válido
                          </Badge>
                        ) : (
                          <div className="space-y-0.5 max-w-[200px]">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-destructive/15 text-destructive border-destructive/40 font-semibold"
                            >
                              <AlertCircle className="size-2.5 mr-1 shrink-0" /> Inconsistente
                            </Badge>
                            <p className="text-[10px] text-destructive leading-tight font-medium">
                              {r.error}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="p-2 capitalize">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            r.type === "receita"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>

                      {/* Custo: Fixo ou Variável */}
                      <td className="p-2">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            r.costType === "fixo"
                              ? "bg-blue-500/10 text-blue-600 border border-blue-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {r.costType === "fixo" ? "Fixo" : "Variável"}
                        </span>
                      </td>

                      <td className="p-2 capitalize text-muted-foreground">{r.category}</td>

                      {/* Vencimento */}
                      <td className="p-2">
                        {r.type === "receita" ? (
                          <span className="text-muted-foreground/60 text-[10px]">
                            Sem vencimento (Receita)
                          </span>
                        ) : r.dueDate ? (
                          <span className="font-mono text-muted-foreground">{r.dueDate}</span>
                        ) : (
                          <span className="text-muted-foreground/60 italic text-[10px]">
                            Sem vencimento
                          </span>
                        )}
                      </td>

                      <td className="p-2">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          {r.isCreditCard && (
                            <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-purple-500/10 text-purple-600">
                              <CreditCard className="size-2.5" />
                              {r.cardName}{" "}
                              {r.installments > 1
                                ? `(${r.installments}x de ${r.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`
                                : ""}
                            </span>
                          )}
                          {r.recurring !== "none" && (
                            <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-blue-500/10 text-blue-600">
                              <Repeat className="size-2.5" />
                              {r.recurring === "monthly" ? "Mensal" : "Semanal"}
                            </span>
                          )}
                          {!r.isCreditCard && r.recurring === "none" && "-"}
                        </div>
                      </td>

                      <td
                        className={`p-2 text-right font-semibold font-mono ${
                          r.type === "receita" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {r.type === "receita" ? "+" : "-"}
                        {r.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={importing}
            className="text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmImport}
            disabled={validCount === 0 || importing}
            className="text-xs gap-1.5 bg-gradient-primary text-primary-foreground font-medium"
          >
            {importing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            Confirmar e Importar ({validCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

