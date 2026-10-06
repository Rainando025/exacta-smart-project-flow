import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Pencil, BellRing, Clock, CheckCircle2, Repeat, Check, X,
  CheckSquare, Calendar, Sparkles, FolderOpen, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reminders")({ component: RemindersPage });

interface Reminder {
  id: string; title: string; description: string | null;
  remind_at: string; repeat: string; completed: boolean;
  priority: string; created_at: string; updated_at: string;
  task_id?: string | null;
}

const REPEAT_OPTIONS = [
  { value: "none", label: "Não repetir" },
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];

const PRIORITIES = [
  { value: "baixa", label: "Baixa", color: "text-muted-foreground" },
  { value: "media", label: "Média", color: "text-accent" },
  { value: "alta", label: "Alta", color: "text-warning" },
  { value: "urgente", label: "Urgente", color: "text-destructive" },
];

function RemindersPage() { return <AppShell><RemindersContent /></AppShell>; }

function RemindersContent() {
  const { user } = useAuth();
  const { selectedProjectId, selectedProject } = useProject();
  const [items, setItems] = useState<Reminder[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [repeat, setRepeat] = useState("none");
  const [priority, setPriority] = useState("media");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("none");
  const [periodOffset, setPeriodOffset] = useState<string>("custom");

  // Load reminders
  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("reminders").select("*").eq("user_id", user.id)
      .order("remind_at", { ascending: true });
    setItems((data || []) as Reminder[]);
  }, [user]);

  // Load tasks for task linking
  const loadTasks = useCallback(async () => {
    if (!user) return;
    let query = supabase.from("tasks").select("id, title, description, due_date, priority, project_id").order("created_at", { ascending: false });
    if (selectedProjectId !== "all") {
      query = query.eq("project_id", selectedProjectId);
    }
    const { data } = await query;
    if (data) setTasks(data);
  }, [user, selectedProjectId]);

  useEffect(() => { load(); loadTasks(); }, [load, loadTasks]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setRemindAt(""); setRepeat("none"); setPriority("media");
    setSelectedTaskId("none"); setPeriodOffset("custom"); setEditing(null);
  };

  // When user picks an existing task to link
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (taskId === "none") return;
    const t = tasks.find((task) => task.id === taskId);
    if (!t) return;
    setTitle(`Lembrete: ${t.title}`);
    if (t.description) setDescription(t.description);
    if (t.priority) setPriority(t.priority);
    if (t.due_date) {
      const dt = new Date(t.due_date);
      // Format to datetime-local input string: YYYY-MM-DDTHH:mm
      const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setRemindAt(localIso);
    }
  };

  // Period offset handler
  const handlePeriodOffsetChange = (offset: string) => {
    setPeriodOffset(offset);
    if (offset === "custom") return;

    let baseDate = remindAt ? new Date(remindAt) : new Date();
    // If a task with due_date is selected, use task's due date
    const t = tasks.find((task) => task.id === selectedTaskId);
    if (t?.due_date) {
      baseDate = new Date(t.due_date);
    }

    const d = new Date(baseDate.getTime());
    if (offset === "15m") d.setMinutes(d.getMinutes() - 15);
    else if (offset === "1h") d.setHours(d.getHours() - 1);
    else if (offset === "1d") d.setDate(d.getDate() - 1);

    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setRemindAt(localIso);
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !remindAt) {
      toast.error("Informe o título e a data/hora do lembrete.");
      return;
    }
    const payload = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      remind_at: new Date(remindAt).toISOString(),
      repeat,
      priority,
    };

    if (editing) {
      const { error } = await supabase.from("reminders").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Lembrete atualizado!");
    } else {
      const { error } = await supabase.from("reminders").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Lembrete criado com sucesso!");
    }
    resetForm(); setOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("reminders").delete().eq("id", id);
    toast.success("Removido!"); load();
  };

  const toggleComplete = async (r: Reminder) => {
    await supabase.from("reminders").update({ completed: !r.completed }).eq("id", r.id);
    load();
  };

  const openEdit = (r: Reminder) => {
    setEditing(r); setTitle(r.title); setDescription(r.description || "");
    const dt = new Date(r.remind_at);
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setRemindAt(localIso); setRepeat(r.repeat); setPriority(r.priority); setOpen(true);
  };

  const now = new Date();
  const active = items.filter((r) => !r.completed);
  const completed = items.filter((r) => r.completed);
  const display = showCompleted ? items : active;
  const upcoming = active.filter((r) => new Date(r.remind_at) > now);
  const overdue = active.filter((r) => new Date(r.remind_at) <= now);

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider flex items-center gap-2">
            Gestão & Notificações
            {selectedProject && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedProject.color || "#6366f1" }} />
                {selectedProject.name}
              </span>
            )}
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-extrabold mt-1 tracking-tight">Lembretes & Alertas</h1>
          <p className="text-muted-foreground mt-1 text-sm">Agende notificações periódicas e vincule suas tarefas ativas.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-elegant font-bold gap-2">
              <Plus className="h-4 w-4 stroke-[3]" /> Novo lembrete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <BellRing className="h-5 w-5 text-accent" />
                {editing ? "Editar lembrete" : "Novo lembrete"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Task Link Selector */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Vincular a uma Tarefa Existente (opcional)
                </Label>
                <Select value={selectedTaskId} onValueChange={handleTaskSelect}>
                  <SelectTrigger className="text-xs font-medium">
                    <SelectValue placeholder="Selecione uma tarefa para importar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (Lembrete independente)</SelectItem>
                    {tasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2 truncate">
                          <CheckSquare className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span className="truncate font-medium">{t.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Título do Lembrete *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Entregar relatório trimestral" />
              </div>

              <div className="space-y-1.5">
                <Label>Descrição / Notas</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Adicione observações adicionais..." />
              </div>

              {/* Period Preset Options */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Antecedência / Período do Alerta
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "custom", label: "Exata" },
                    { id: "15m", label: "15m antes" },
                    { id: "1h", label: "1h antes" },
                    { id: "1d", label: "1 dia antes" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePeriodOffsetChange(preset.id)}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-xs font-semibold border transition text-center",
                        periodOffset === preset.id
                          ? "bg-accent text-accent-foreground border-accent shadow-sm"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data e Hora do Alerta *</Label>
                  <Input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Prioridade</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Repetição</Label>
                <Select value={repeat} onValueChange={setRepeat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPEAT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-gradient-primary text-primary-foreground font-bold">
                {editing ? "Salvar Alterações" : "Criar Lembrete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 shadow-card border-0 flex items-center gap-3 bg-card/60 backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Atrasados</p><p className="text-xl font-extrabold text-destructive">{overdue.length}</p></div>
        </Card>
        <Card className="p-4 shadow-card border-0 flex items-center gap-3 bg-card/60 backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Clock className="h-5 w-5 text-accent" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Próximos</p><p className="text-xl font-extrabold text-accent">{upcoming.length}</p></div>
        </Card>
        <Card className="p-4 shadow-card border-0 flex items-center gap-3 bg-card/60 backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Concluídos</p><p className="text-xl font-extrabold text-emerald-500">{completed.length}</p></div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox checked={showCompleted} onCheckedChange={(v) => setShowCompleted(!!v)} id="showDone" />
          <label htmlFor="showDone" className="text-sm font-semibold text-muted-foreground cursor-pointer">Mostrar lembretes concluídos</label>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold text-destructive uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Atrasados
          </h2>
          <div className="space-y-2">
            {overdue.map((r) => <ReminderCard key={r.id} r={r} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleComplete} onReload={load} />)}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {overdue.length > 0 && <h2 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Próximos Lembretes</h2>}
        {display.filter((r) => !overdue.includes(r)).length === 0 && overdue.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed p-8">
            <BellRing className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-semibold">Nenhum lembrete pendente.</p>
            <p className="text-xs text-muted-foreground mt-1">Crie um novo lembrete ou vincule uma tarefa acima!</p>
          </div>
        )}
        <div className="space-y-2.5">
          {display.filter((r) => !overdue.includes(r)).map((r) => (
            <ReminderCard key={r.id} r={r} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleComplete} onReload={load} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReminderCard({ r, onEdit, onDelete, onToggle, onReload }: {
  r: Reminder; onEdit: (r: Reminder) => void;
  onDelete: (id: string) => void; onToggle: (r: Reminder) => void;
  onReload: () => void;
}) {
  const isOverdue = !r.completed && new Date(r.remind_at) <= new Date();
  const prioInfo = PRIORITIES.find((p) => p.value === r.priority) || PRIORITIES[1];

  const [inlineEdit, setInlineEdit] = useState(false);
  const [iTitle, setITitle] = useState(r.title);
  const [iDesc, setIDesc] = useState(r.description || "");
  const [iAt, setIAt] = useState(() => {
    const dt = new Date(r.remind_at);
    return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  const save = async () => {
    const { error } = await supabase.from("reminders").update({
      title: iTitle.trim(), description: iDesc.trim() || null,
      remind_at: new Date(iAt).toISOString(),
    }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    setInlineEdit(false); onReload();
  };

  return (
    <Card className={`p-4 shadow-card border bg-card/80 backdrop-blur-md flex items-start gap-3 transition-all duration-200 hover:bg-card ${r.completed ? "opacity-50" : ""} ${isOverdue ? "border-l-4 border-l-destructive shadow-md" : ""}`}>
      <Checkbox checked={r.completed} onCheckedChange={() => onToggle(r)} className="mt-1" />
      {inlineEdit ? (
        <div className="flex-1 space-y-2">
          <Input value={iTitle} onChange={(e) => setITitle(e.target.value)} className="h-8 text-sm font-semibold" />
          <Input value={iDesc} onChange={(e) => setIDesc(e.target.value)} className="h-8 text-sm" placeholder="Descrição" />
          <Input type="datetime-local" value={iAt} onChange={(e) => setIAt(e.target.value)} className="h-8 text-sm" />
          <div className="flex gap-1">
            <button onClick={save} className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-500"><Check className="h-4 w-4" /></button>
            <button onClick={() => setInlineEdit(false)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0" onDoubleClick={() => { setITitle(r.title); setIDesc(r.description || ""); setInlineEdit(true); }}>
            <div className="flex items-center gap-2">
              <p className={`font-bold text-sm ${r.completed ? "line-through text-muted-foreground" : ""}`}>{r.title}</p>
              <Badge variant="outline" className={`text-[10px] font-extrabold ${prioInfo.color}`}>{prioInfo.label}</Badge>
            </div>
            {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-accent" />{new Date(r.remind_at).toLocaleString("pt-BR")}</span>
              {r.repeat !== "none" && <span className="flex items-center gap-1"><Repeat className="h-3 w-3 text-primary" />{r.repeat}</span>}
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => onEdit(r)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => onDelete(r.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </>
      )}
    </Card>
  );
}
