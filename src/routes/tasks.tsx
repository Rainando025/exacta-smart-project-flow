import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Sparkles, Filter, Pencil, ListChecks, Paperclip } from "lucide-react";
import { PRIORITIES, STATUSES, priorityColor, priorityLabel, formatDate, isOverdue } from "@/lib/exacta";
import { toast } from "sonner";
import { SubtasksPanel } from "@/components/SubtasksPanel";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { CommentsPanel } from "@/components/CommentsPanel";
import { notify } from "@/lib/notify";
import { generateTasksWithAI } from "@/lib/ai";

interface SubtaskCount { task_id: string; total: number; done: number; }

export const Route = createFileRoute("/tasks")({
  component: () => <AppShell><TasksPage /></AppShell>,
});

function TasksPage() {
  const { user } = useAuth();
  const { canDeleteTask, canEditTask } = useRole();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [counts, setCounts] = useState<Record<string, { total: number; done: number; files: number }>>({});
  const [form, setForm] = useState({ title: "", description: "", priority: "media", status: "todo", due_date: "", project_id: "" });

  const load = async () => {
    const mode = localStorage.getItem("exacta-mode") || "team";
    let query = supabase.from("tasks").select("*");

    if (mode === "personal") {
      query = query.eq("is_personal", true);
      if (user?.id) {
        query = query.or(`assignee_id.eq.${user.id},creator_id.eq.${user.id}`);
      }
    } else {
      query = query.eq("is_personal", false);
      // No modo equipe, gestores veem tudo. Colaboradores veem o que lhes pertence ou ao seu setor.
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user?.id || "").maybeSingle();
      const role = roleData?.role || "colaborador";
      
      if (role === "colaborador" && user?.id) {
        // Obter setor do usuário para compartilhar tarefas da equipe no mesmo setor
        const { data: userProfile } = await supabase.from("profiles").select("department_id").eq("id", user.id).maybeSingle();
        if (userProfile?.department_id) {
          const { data: deptProfiles } = await supabase.from("profiles").select("id").eq("department_id", userProfile.department_id);
          const deptMemberIds = deptProfiles?.map((p) => p.id) || [];
          if (deptMemberIds.length > 0) {
            query = query.or(`assignee_id.in.(${deptMemberIds.map((id) => `"${id}"`).join(",")}),creator_id.eq.${user.id}`);
          } else {
            query = query.or(`assignee_id.eq.${user.id},creator_id.eq.${user.id}`);
          }
        } else {
          query = query.or(`assignee_id.eq.${user.id},creator_id.eq.${user.id}`);
        }
      }
      // Se for admin/gestor, não filtra (vê tudo)
    }

    const { data } = await query.order("created_at", { ascending: false });
    if (data) {
      setTasks(data);
      // Carrega contagens de subtarefas e anexos
      const ids = data.map((t: any) => t.id);
      if (ids.length > 0) {
        const [{ data: subs }, { data: atts }] = await Promise.all([
          supabase.from("subtasks").select("task_id,completed").in("task_id", ids),
          supabase.from("attachments").select("task_id").in("task_id", ids),
        ]);
        const map: Record<string, { total: number; done: number; files: number }> = {};
        (subs || []).forEach((s: any) => {
          if (!map[s.task_id]) map[s.task_id] = { total: 0, done: 0, files: 0 };
          map[s.task_id].total++;
          if (s.completed) map[s.task_id].done++;
        });
        (atts || []).forEach((a: any) => {
          if (!a.task_id) return;
          if (!map[a.task_id]) map[a.task_id] = { total: 0, done: 0, files: 0 };
          map[a.task_id].files++;
        });
        setCounts(map);
      }
    }
    const p = await supabase.from("projects").select("id,name,color");
    if (p.data) setProjects(p.data);
  };

  useEffect(() => {
    load();
    // Realtime: recarrega ao mudar subtasks/attachments
    const ch = supabase
      .channel("tasks-related")
      .on("postgres_changes", { event: "*", schema: "public", table: "subtasks" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "attachments" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const [creating, setCreating] = useState(false);
  const create = async () => {
    if (!form.title.trim() || !user) return;
    setCreating(true);
    const mode = localStorage.getItem("exacta-mode") || "team";
    const { error } = await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      project_id: form.project_id || null,
      creator_id: user.id,
      assignee_id: user.id,
      is_personal: mode === "personal",
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Tarefa criada");
    setOpen(false);
    setForm({ title: "", description: "", priority: "media", status: "todo", due_date: "", project_id: "" });
    load();
  };

  const toggle = async (t: any) => {
    const next = t.status === "done" ? "todo" : "done";
    await supabase.from("tasks").update({ status: next, completed_at: next === "done" ? new Date().toISOString() : null }).eq("id", t.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Tarefa excluída"); load(); }
  };

  const saveEdit = async () => {
    if (!editing || !user) return;
    const original = tasks.find((t) => t.id === editing.id);
    const { error } = await supabase.from("tasks").update({
      title: editing.title,
      description: editing.description || null,
      priority: editing.priority,
      status: editing.status,
      due_date: editing.due_date || null,
      project_id: editing.project_id || null,
      assignee_id: editing.assignee_id || null,
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    // Notificações
    if (original && editing.assignee_id && original.assignee_id !== editing.assignee_id && editing.assignee_id !== user.id) {
      await notify({
        user_id: editing.assignee_id,
        type: "task_assigned",
        title: `Nova tarefa atribuída: ${editing.title}`,
        message: editing.due_date ? `Prazo: ${formatDate(editing.due_date)}` : undefined,
        link: "/tasks",
        task_id: editing.id,
      });
    } else if (original && original.status !== editing.status && editing.assignee_id && editing.assignee_id !== user.id) {
      await notify({
        user_id: editing.assignee_id,
        type: "task_updated",
        title: `Status atualizado: ${editing.title}`,
        message: `Novo status: ${STATUSES.find((s) => s.value === editing.status)?.label || editing.status}`,
        link: "/tasks",
        task_id: editing.id,
      });
    }
    toast.success("Tarefa atualizada");
    setEditing(null);
    load();
  };

  const generateAI = async () => {
    if (!aiPrompt.trim() || !user) return;
    setAiLoading(true);
    try {
      const generatedTasks = await generateTasksWithAI(aiPrompt);
      if (!generatedTasks?.length) {
        toast.error("IA não conseguiu estruturar as tarefas");
        return;
      }
      const inserts = generatedTasks.map((t: any) => ({
        title: t.title,
        description: t.description || null,
        priority: t.priority || "media",
        status: "todo",
        due_date: t.due_date || null,
        creator_id: user.id,
        assignee_id: user.id,
      }));
      const { error } = await supabase.from("tasks").insert(inserts);
      if (error) throw error;
      toast.success(`${inserts.length} tarefas criadas pela IA ✨`);
      setAiOpen(false);
      setAiPrompt("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro na geração por IA");
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter === "mine" && t.assignee_id !== user?.id) return false;
    if (filter === "overdue" && !isOverdue(t.due_date, t.status)) return false;
    if (["todo", "doing", "review", "done"].includes(filter) && t.status !== filter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (projectFilter !== "all" && (projectFilter === "none" ? t.project_id : t.project_id !== projectFilter)) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Tarefas</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Lista de tarefas</h1>
          <p className="text-muted-foreground mt-2">Capture, organize e execute com clareza.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={aiOpen} onOpenChange={setAiOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> Gerar com IA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Gerar tarefas com IA</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Label>Descreva o objetivo ou projeto</Label>
                <Textarea rows={5} placeholder="Ex: Lançar landing page para nova feature em 2 semanas" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                <p className="text-xs text-muted-foreground">A IA vai gerar uma lista de tarefas com prioridade e prazo sugerido.</p>
              </div>
              <DialogFooter>
                <Button onClick={generateAI} disabled={aiLoading} className="bg-gradient-primary text-primary-foreground gap-2">
                  <Sparkles className="h-4 w-4" /> {aiLoading ? "Gerando…" : "Gerar tarefas"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary text-primary-foreground shadow-elegant"><Plus className="h-4 w-4" /> Nova tarefa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="O que precisa ser feito?" /></div>
                <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Prazo</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                  <div>
                    <Label>Projeto</Label>
                    <Select value={form.project_id || "none"} onValueChange={(v) => setForm({ ...form, project_id: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Sem projeto" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem projeto</SelectItem>
                        {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create} disabled={creating} className="bg-gradient-primary text-primary-foreground">
                  {creating ? "Criando..." : "Criar tarefa"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tarefa…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[170px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos projetos</SelectItem>
              <SelectItem value="none">Sem projeto</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { v: "all", l: "Todas" },
            { v: "mine", l: "Minhas" },
            { v: "todo", l: "A fazer" },
            { v: "doing", l: "Em andamento" },
            { v: "review", l: "Revisão" },
            { v: "done", l: "Concluídas" },
            { v: "overdue", l: "Atrasadas" },
          ].map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === f.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <Card className="divide-y shadow-card">
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">Nenhuma tarefa neste filtro.</div>
        )}
        {filtered.map((t) => {
          const overdue = isOverdue(t.due_date, t.status);
          const c = counts[t.id];
          return (
            <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition">
              <Checkbox checked={t.status === "done"} onCheckedChange={() => toggle(t)} />
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: priorityColor(t.priority) }} />
              <button onClick={() => setDetail(t)} className="flex-1 min-w-0 text-left">
                <p className={`font-medium text-sm ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{priorityLabel(t.priority)}</span>
                  <span>•</span>
                  <span className={overdue ? "text-destructive font-medium" : ""}>{formatDate(t.due_date)}</span>
                  {c && c.total > 0 && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1"><ListChecks className="h-3 w-3" />{c.done}/{c.total}</span>
                    </>
                  )}
                  {c && c.files > 0 && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{c.files}</span>
                    </>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-1">
                {canEditTask(t.creator_id, t.assignee_id) && (
                  <button onClick={() => setEditing({ ...t, due_date: t.due_date ? t.due_date.slice(0, 10) : "" })} aria-label="Editar" className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted transition">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {canDeleteTask(t.creator_id) && (
                  <button onClick={() => remove(t.id)} aria-label="Excluir" className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar tarefa</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prioridade</Label>
                  <Select value={editing.priority} onValueChange={(v) => setEditing({ ...editing, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prazo</Label><Input type="date" value={editing.due_date || ""} onChange={(e) => setEditing({ ...editing, due_date: e.target.value })} /></div>
                <div>
                  <Label>Projeto</Label>
                  <Select value={editing.project_id || "none"} onValueChange={(v) => setEditing({ ...editing, project_id: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="Sem projeto" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem projeto</SelectItem>
                      {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={saveEdit} className="bg-gradient-primary text-primary-foreground">Salvar alterações</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog: subtasks + attachments */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: priorityColor(detail?.priority) }} />
              {detail?.title}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-6">
              {detail.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.description}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-muted">{priorityLabel(detail.priority)}</span>
                <span className="px-2 py-1 rounded bg-muted">
                  {STATUSES.find((s) => s.value === detail.status)?.label}
                </span>
                {detail.due_date && (
                  <span className={`px-2 py-1 rounded bg-muted ${isOverdue(detail.due_date, detail.status) ? "text-destructive" : ""}`}>
                    Prazo: {formatDate(detail.due_date)}
                  </span>
                )}
              </div>
              <div className="border-t pt-4">
                <SubtasksPanel taskId={detail.id} />
              </div>
              <div className="border-t pt-4">
                <AttachmentsPanel taskId={detail.id} />
              </div>
              <div className="border-t pt-4">
                <CommentsPanel taskId={detail.id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

