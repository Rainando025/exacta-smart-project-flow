import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Pencil, BellRing, Clock, CheckCircle2, Repeat, Check, X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reminders")({ component: RemindersPage });

interface Reminder {
  id: string; title: string; description: string | null;
  remind_at: string; repeat: string; completed: boolean;
  priority: string; created_at: string; updated_at: string;
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
  const [items, setItems] = useState<Reminder[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [repeat, setRepeat] = useState("none");
  const [priority, setPriority] = useState("media");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("reminders").select("*").eq("user_id", user.id)
      .order("remind_at", { ascending: true });
    setItems((data || []) as Reminder[]);
  };

  useEffect(() => { load(); }, [user?.id]);

  const resetForm = () => { setTitle(""); setDescription(""); setRemindAt(""); setRepeat("none"); setPriority("media"); setEditing(null); };

  const handleSave = async () => {
    if (!user || !title.trim() || !remindAt) return;
    const payload = {
      user_id: user.id, title: title.trim(), description: description.trim() || null,
      remind_at: new Date(remindAt).toISOString(), repeat, priority,
    };
    if (editing) {
      const { error } = await supabase.from("reminders").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Lembrete atualizado!");
    } else {
      const { error } = await supabase.from("reminders").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Lembrete criado!");
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
    setRemindAt(r.remind_at.slice(0, 16)); setRepeat(r.repeat); setPriority(r.priority); setOpen(true);
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
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Modo Pessoal</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Lembretes</h1>
          <p className="text-muted-foreground mt-1">Seus lembretes e alertas pessoais.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-elegant"><Plus className="h-4 w-4 mr-2" /> Novo lembrete</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar lembrete" : "Novo lembrete"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reunião, Consulta..." /></div>
              <div className="space-y-2"><Label>Descrição (opcional)</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data e hora</Label><Input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} /></div>
                <div className="space-y-2"><Label>Prioridade</Label>
                  <Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Repetição</Label>
                <Select value={repeat} onValueChange={setRepeat}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REPEAT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full bg-gradient-primary text-primary-foreground">
                {editing ? "Salvar" : "Criar lembrete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 shadow-card border-0 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10"><BellRing className="h-5 w-5 text-warning" /></div>
          <div><p className="text-xs text-muted-foreground">Atrasados</p><p className="text-xl font-bold text-warning">{overdue.length}</p></div>
        </Card>
        <Card className="p-4 shadow-card border-0 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Clock className="h-5 w-5 text-accent" /></div>
          <div><p className="text-xs text-muted-foreground">Próximos</p><p className="text-xl font-bold text-accent">{upcoming.length}</p></div>
        </Card>
        <Card className="p-4 shadow-card border-0 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
          <div><p className="text-xs text-muted-foreground">Concluídos</p><p className="text-xl font-bold text-success">{completed.length}</p></div>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox checked={showCompleted} onCheckedChange={(v) => setShowCompleted(!!v)} id="showDone" />
        <label htmlFor="showDone" className="text-sm text-muted-foreground cursor-pointer">Mostrar concluídos</label>
      </div>

      {overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-warning uppercase tracking-wider mb-3">⚠️ Atrasados</h2>
          <div className="space-y-2">
            {overdue.map((r) => <ReminderCard key={r.id} r={r} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleComplete} onReload={load} />)}
          </div>
        </div>
      )}

      <div>
        {overdue.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Próximos</h2>}
        {display.filter((r) => !overdue.includes(r)).length === 0 && overdue.length === 0 && (
          <div className="text-center py-16">
            <BellRing className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum lembrete. Crie o primeiro!</p>
          </div>
        )}
        <div className="space-y-2">
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
  const [iAt, setIAt] = useState(r.remind_at.slice(0, 16));

  const save = async () => {
    const { error } = await supabase.from("reminders").update({
      title: iTitle.trim(), description: iDesc.trim() || null,
      remind_at: new Date(iAt).toISOString(),
    }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    setInlineEdit(false); onReload();
  };

  return (
    <Card className={`p-4 shadow-card border-0 flex items-start gap-3 transition ${r.completed ? "opacity-50" : ""} ${isOverdue ? "border-l-4 border-l-warning" : ""}`}>
      <Checkbox checked={r.completed} onCheckedChange={() => onToggle(r)} className="mt-1" />
      {inlineEdit ? (
        <div className="flex-1 space-y-2">
          <Input value={iTitle} onChange={(e) => setITitle(e.target.value)} className="h-8 text-sm font-semibold" />
          <Input value={iDesc} onChange={(e) => setIDesc(e.target.value)} className="h-8 text-sm" placeholder="Descrição" />
          <Input type="datetime-local" value={iAt} onChange={(e) => setIAt(e.target.value)} className="h-8 text-sm" />
          <div className="flex gap-1">
            <button onClick={save} className="p-1.5 rounded hover:bg-success/10 text-success"><Check className="h-4 w-4" /></button>
            <button onClick={() => setInlineEdit(false)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0" onDoubleClick={() => { setITitle(r.title); setIDesc(r.description || ""); setIAt(r.remind_at.slice(0, 16)); setInlineEdit(true); }}>
            <div className="flex items-center gap-2">
              <p className={`font-semibold ${r.completed ? "line-through" : ""}`}>{r.title}</p>
              <Badge variant="outline" className={`text-[10px] ${prioInfo.color}`}>{prioInfo.label}</Badge>
            </div>
            {r.description && <p className="text-sm text-muted-foreground mt-0.5">{r.description}</p>}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(r.remind_at).toLocaleString("pt-BR")}</span>
              {r.repeat !== "none" && <span className="flex items-center gap-1"><Repeat className="h-3 w-3" />{r.repeat}</span>}
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => onEdit(r)} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => onDelete(r.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </>
      )}
    </Card>
  );
}
