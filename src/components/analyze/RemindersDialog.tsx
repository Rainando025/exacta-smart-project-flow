import { useState } from "react";
import { Bell, Calendar, Trash2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Page, Reminder } from "@/lib/analyze/types";

const NONE = "__none__";

export function RemindersDialog({
  open,
  onOpenChange,
  page,
  reminders,
  onAdd,
  onToggleComplete,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  page: Page | null;
  reminders: Reminder[];
  onAdd: (title: string, datetime: string, chartId: string | null) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [chartId, setChartId] = useState<string>(NONE);

  if (!page) return null;

  const currentCharts = page.dashboard?.charts ?? [];

  const handleAdd = () => {
    if (!title.trim() || !datetime) return;
    onAdd(title.trim(), datetime, chartId === NONE ? null : chartId);
    setTitle("");
    setDatetime("");
    setChartId(NONE);
  };

  const pageReminders = reminders.filter((r) => r.pageId === page.id);
  const pendingReminders = pageReminders.filter((r) => !r.completed);
  const completedReminders = pageReminders.filter((r) => r.completed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4 text-primary" /> Lembretes e Agenda de Análises
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 text-sm">
          {/* Add Reminder Form */}
          <div className="grid gap-3 rounded-lg border border-border bg-secondary/30 p-4">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Novo Lembrete</h3>
            
            <div className="grid gap-2">
              <Label>O que você deseja revisar/analisar?</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Revisar queda nas vendas de eletrônicos..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Data e Horário</Label>
                <Input
                  type="datetime-local"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Vincular a qual gráfico? (Opcional)</Label>
                <Select value={chartId} onValueChange={setChartId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Nenhum gráfico (geral)</SelectItem>
                    {currentCharts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="mt-1"
              size="sm"
              onClick={handleAdd}
              disabled={!title.trim() || !datetime}
            >
              <Calendar className="size-4 mr-1.5" /> Adicionar à Agenda
            </Button>
          </div>

          {/* List Reminders */}
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="size-3.5" /> Pendentes ({pendingReminders.length})
              </h4>
              
              {pendingReminders.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-2 py-1">Nenhum lembrete pendente para esta página.</p>
              ) : (
                <div className="space-y-2">
                  {pendingReminders.map((r) => {
                    const linkedChart = currentCharts.find((c) => c.id === r.chartId);
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-background/50 p-3 text-xs shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground text-sm line-clamp-1">{r.title}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                            <span>📅 {new Date(r.datetime).toLocaleString("pt-BR")}</span>
                            {linkedChart && (
                              <span className="text-primary font-medium">
                                📊 Vínculo: {linkedChart.title}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onToggleComplete(r.id)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-green-500 transition"
                            title="Marcar como concluído"
                          >
                            <CheckCircle2 className="size-4" />
                          </button>
                          <button
                            onClick={() => onDelete(r.id)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive transition"
                            title="Excluir"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {completedReminders.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Concluídos ({completedReminders.length})
                </h4>
                <div className="space-y-2 opacity-65">
                  {completedReminders.map((r) => {
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/15 p-2 text-xs"
                      >
                        <div className="min-w-0 flex-1 line-through text-muted-foreground">
                          <p className="font-medium">{r.title}</p>
                          <span className="text-[10px]">
                            Concluído · 📅 {new Date(r.datetime).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <button
                          onClick={() => onDelete(r.id)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-destructive transition"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
