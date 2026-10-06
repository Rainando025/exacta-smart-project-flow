import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, priorityColor, priorityLabel, formatDate } from "@/lib/exacta";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { Plus, MoreVertical, Pencil, Trash2, Filter, RotateCcw, Wifi, FolderOpen, Calendar, Layers, Sparkles, Tag } from "lucide-react";
import { ProjectSelector } from "@/components/ProjectSelector";

export const Route = createFileRoute("/kanban")({
  component: () => <AppShell><KanbanPage /></AppShell>,
});

type Column = { id: string; label: string };

const DEFAULT_COLUMNS: Column[] = STATUSES.map((s) => ({ id: s.value, label: s.label }));

function getStorageKey(projectId: string) {
  return `exacta:kanban:columns:${projectId || "default"}`;
}

function loadColumns(projectId: string): Column[] {
  if (typeof window === "undefined") return DEFAULT_COLUMNS;
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return DEFAULT_COLUMNS;
    const parsed = JSON.parse(raw) as Column[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_COLUMNS;
    return parsed;
  } catch { return DEFAULT_COLUMNS; }
}

function KanbanPage() {
  const { user } = useAuth();
  const { selectedProjectId, selectedProject, projects } = useProject();
  const [tasks, setTasks] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [newColOpen, setNewColOpen] = useState(false);
  const [renameCol, setRenameCol] = useState<Column | null>(null);
  const [colName, setColName] = useState("");
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [realtime, setRealtime] = useState(false);

  // New Card Modal State
  const [newCardOpen, setNewCardOpen] = useState(false);
  const [newCardTargetCol, setNewCardTargetCol] = useState<string>("todo");
  const [newCardForm, setNewCardForm] = useState({
    title: "",
    description: "",
    priority: "media",
    project_id: selectedProjectId !== "all" ? selectedProjectId : "",
    due_date: "",
  });
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  // Sync project_id in new card form when active project changes
  useEffect(() => {
    if (selectedProjectId !== "all") {
      setNewCardForm((prev) => ({ ...prev, project_id: selectedProjectId }));
    }
  }, [selectedProjectId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Load columns per project
  useEffect(() => {
    setColumns(loadColumns(selectedProjectId));
  }, [selectedProjectId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(getStorageKey(selectedProjectId), JSON.stringify(columns));
    }
  }, [columns, selectedProjectId]);

  const load = async () => {
    const { data } = await supabase.from("tasks").select("*").eq("is_personal", false).order("position");
    if (data) setTasks(data);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("kanban-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => load())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtime(true);
      });
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (selectedProjectId !== "all" && t.project_id !== selectedProjectId) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (mineOnly && t.assignee_id !== user?.id) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tasks, selectedProjectId, priorityFilter, mineOnly, search, user?.id]);

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    const { error } = await supabase.from("tasks").update({
      status: newStatus,
      completed_at: newStatus === "done" ? new Date().toISOString() : null,
    }).eq("id", taskId);
    if (error) { toast.error(error.message); load(); }
  };

  const addColumn = () => {
    const name = colName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    setColumns((c) => [...c, { id, label: name }]);
    setColName(""); setNewColOpen(false);
    toast.success("Coluna adicionada");
  };

  const saveRename = () => {
    if (!renameCol) return;
    const name = colName.trim();
    if (!name) return;
    setColumns((c) => c.map((x) => (x.id === renameCol.id ? { ...x, label: name } : x)));
    setRenameCol(null); setColName("");
  };

  const deleteColumn = async (col: Column) => {
    const inCol = tasks.filter((t) => t.status === col.id);
    if (inCol.length > 0) {
      const fallback = columns.find((c) => c.id !== col.id)?.id || "todo";
      if (!confirm(`Mover ${inCol.length} tarefa(s) para "${columns.find((c) => c.id === fallback)?.label}" e excluir esta coluna?`)) return;
      await supabase.from("tasks").update({ status: fallback }).in("id", inCol.map((t) => t.id));
    } else if (!confirm("Excluir esta coluna?")) return;
    setColumns((c) => c.filter((x) => x.id !== col.id));
    toast.success("Coluna removida");
  };

  const resetColumns = () => {
    if (!confirm("Restaurar colunas padrão?")) return;
    setColumns(DEFAULT_COLUMNS);
  };

  const openNewCardModal = (columnId?: string) => {
    setNewCardTargetCol(columnId || columns[0]?.id || "todo");
    setNewCardForm({
      title: "",
      description: "",
      priority: "media",
      project_id: selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id || ""),
      due_date: "",
    });
    setNewCardOpen(true);
  };

  const handleCreateCard = async () => {
    if (!newCardForm.title.trim() || !user) {
      toast.error("Informe o título do cartão");
      return;
    }
    setIsCreatingCard(true);
    const { error } = await supabase.from("tasks").insert({
      title: newCardForm.title.trim(),
      description: newCardForm.description.trim() || null,
      status: newCardTargetCol,
      priority: newCardForm.priority,
      project_id: newCardForm.project_id || (selectedProjectId !== "all" ? selectedProjectId : null),
      due_date: newCardForm.due_date || null,
      creator_id: user.id,
      assignee_id: user.id,
      is_personal: false,
    });
    setIsCreatingCard(false);

    if (error) {
      toast.error("Erro ao criar cartão: " + error.message);
    } else {
      toast.success("Cartão adicionado com sucesso!");
      setNewCardOpen(false);
      load();
    }
  };

  const removeTask = async (id: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Tarefa excluída"); load(); }
  };

  const saveTask = async () => {
    if (!editingTask) return;
    const { error } = await supabase.from("tasks").update({
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      due_date: editingTask.due_date || null,
      project_id: editingTask.project_id || null,
    }).eq("id", editingTask.id);
    if (error) toast.error(error.message);
    else { toast.success("Tarefa atualizada"); setEditingTask(null); load(); }
  };

  const active = tasks.find((t) => t.id === activeId);

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider flex items-center gap-2">
            Kanban 3D
            {realtime && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 normal-case tracking-normal font-semibold"><Wifi className="h-3 w-3 animate-pulse" /> Tempo real</span>}
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-extrabold mt-1 tracking-tight flex items-center gap-2">
            Fluxo Visual de Trabalho
            {selectedProject && (
              <span className="text-base font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedProject.color || "#6366f1" }} />
                {selectedProject.name}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Organize e arraste seus cartões interativos em 3D com alta precisão.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BOTÃO ADICIONAR CARD DIRETO */}
          <Button
            onClick={() => openNewCardModal()}
            className="gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold shadow-[0_8px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_28px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Adicionar Cartão
          </Button>

          <Button variant="outline" size="sm" onClick={resetColumns} className="gap-2"><RotateCcw className="h-3.5 w-3.5" /> Padrão</Button>

          <Dialog open={newColOpen} onOpenChange={setNewColOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2"><Plus className="h-4 w-4" /> Nova coluna</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova coluna</DialogTitle></DialogHeader>
              <Input placeholder="Ex: Em Homologação" value={colName} onChange={(e) => setColName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addColumn()} />
              <DialogFooter><Button onClick={addColumn} className="bg-gradient-primary text-primary-foreground">Adicionar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-card/60 backdrop-blur-md border border-white/10 shadow-sm">
        <Filter className="h-4 w-4 text-muted-foreground ml-1" />
        <Input placeholder="Buscar cartão..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9 text-xs" />
        
        {/* Integrated Project Selector */}
        <ProjectSelector />

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Todas prioridades" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="urgente">🚨 Urgente</SelectItem>
            <SelectItem value="alta">⚡ Alta</SelectItem>
            <SelectItem value="media">🔹 Média</SelectItem>
            <SelectItem value="baixa">🟢 Baixa</SelectItem>
          </SelectContent>
        </Select>

        <button
          onClick={() => setMineOnly((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mineOnly
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/70 hover:bg-muted text-muted-foreground"
          }`}
        >
          Apenas minhas
        </button>

        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {filtered.length} cartão(ões)
        </span>
      </div>

      {/* Kanban Board Grid */}
      <DndContext sensors={sensors} onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {columns.map((col, idx) => {
            const colTasks = filtered.filter((t) => t.status === col.id);
            return (
              <ColumnContainer
                key={col.id}
                column={col}
                columnIndex={idx}
                tasks={colTasks}
                projects={projects}
                onRename={() => { setRenameCol(col); setColName(col.label); }}
                onDelete={() => deleteColumn(col)}
                onAddCard={() => openNewCardModal(col.id)}
                onEditTask={setEditingTask}
                onDeleteTask={removeTask}
              />
            );
          })}
        </div>
        <DragOverlay>{active && <TaskCard3D task={active} projects={projects} dragging />}</DragOverlay>
      </DndContext>

      {/* MODAL ADICIONAR CARTÃO DIRETO */}
      <Dialog open={newCardOpen} onOpenChange={setNewCardOpen}>
        <DialogContent className="sm:max-w-[500px] border-accent/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-accent" />
              Adicionar Novo Cartão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Título do Cartão *</label>
              <Input
                placeholder="Ex: Refatorar API de autenticação"
                value={newCardForm.title}
                onChange={(e) => setNewCardForm({ ...newCardForm, title: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Descrição</label>
              <Textarea
                placeholder="Detalhes sobre esta tarefa ou demanda..."
                rows={3}
                value={newCardForm.description}
                onChange={(e) => setNewCardForm({ ...newCardForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Coluna (Status)</label>
                <Select value={newCardTargetCol} onValueChange={setNewCardTargetCol}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Prioridade</label>
                <Select value={newCardForm.priority} onValueChange={(v) => setNewCardForm({ ...newCardForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                    <SelectItem value="media">🔹 Média</SelectItem>
                    <SelectItem value="alta">⚡ Alta</SelectItem>
                    <SelectItem value="urgente">🚨 Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Projeto Associado</label>
                <Select
                  value={newCardForm.project_id || "none"}
                  onValueChange={(v) => setNewCardForm({ ...newCardForm, project_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum projeto</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || "#6366f1" }} />
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Prazo Final</label>
                <Input
                  type="date"
                  value={newCardForm.due_date}
                  onChange={(e) => setNewCardForm({ ...newCardForm, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCardOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateCard}
              disabled={isCreatingCard}
              className="bg-gradient-primary text-primary-foreground font-bold"
            >
              {isCreatingCard ? "Salvando..." : "Criar Cartão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename column dialog */}
      <Dialog open={!!renameCol} onOpenChange={(o) => !o && setRenameCol(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear coluna</DialogTitle></DialogHeader>
          <Input value={colName} onChange={(e) => setColName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveRename()} />
          <DialogFooter><Button onClick={saveRename} className="bg-gradient-primary text-primary-foreground">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit task dialog */}
      <Dialog open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar cartão</DialogTitle></DialogHeader>
          {editingTask && (
            <div className="space-y-3">
              <Input value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} placeholder="Título" />
              <Textarea value={editingTask.description || ""} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} placeholder="Descrição" rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={editingTask.priority} onValueChange={(v) => setEditingTask({ ...editingTask, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                    <SelectItem value="media">🔹 Média</SelectItem>
                    <SelectItem value="alta">⚡ Alta</SelectItem>
                    <SelectItem value="urgente">🚨 Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={editingTask.due_date ? editingTask.due_date.slice(0, 10) : ""} onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Projeto</label>
                <Select
                  value={editingTask.project_id || "none"}
                  onValueChange={(v) => setEditingTask({ ...editingTask, project_id: v === "none" ? null : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem projeto</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || "#6366f1" }} />
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={saveTask} className="bg-gradient-primary text-primary-foreground">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 3D COLUMN CONTAINER ──────────────────────────────────────────────────────
const COLUMN_ACCENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-cyan-500 to-blue-600",
];

function ColumnContainer({
  column,
  columnIndex,
  tasks,
  projects,
  onRename,
  onDelete,
  onAddCard,
  onEditTask,
  onDeleteTask,
}: {
  column: Column;
  columnIndex: number;
  tasks: any[];
  projects: any[];
  onRename: () => void;
  onDelete: () => void;
  onAddCard: () => void;
  onEditTask: (t: any) => void;
  onDeleteTask: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const accentGradient = COLUMN_ACCENTS[columnIndex % COLUMN_ACCENTS.length];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl bg-gradient-to-b from-card/90 via-card/70 to-muted/40 p-4 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.12)] min-h-[500px] flex flex-col transition-all duration-300 relative overflow-hidden backdrop-blur-md ${
        isOver ? "ring-2 ring-accent bg-accent/5 shadow-[0_15px_40px_rgba(99,102,241,0.25)] scale-[1.01]" : ""
      }`}
    >
      {/* 3D Top Accent Bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${accentGradient} absolute top-0 left-0 right-0 rounded-t-2xl`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pt-1 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-foreground">
            {column.label}
          </h3>
          <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20 shadow-inner">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddCard}
            title="Adicionar cartão nesta coluna"
            className="p-1 rounded-lg hover:bg-accent/10 hover:text-accent text-muted-foreground transition"
          >
            <Plus className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg"><MoreVertical className="h-4 w-4" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRename}><Pencil className="h-3.5 w-3.5 mr-2" /> Renomear</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card List */}
      <div className="space-y-3 flex-1 pb-2">
        {tasks.map((t) => (
          <DraggableTask key={t.id} task={t} projects={projects} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />
        ))}
      </div>

      {/* Bottom Add Card Button */}
      <button
        onClick={onAddCard}
        className="w-full py-2.5 px-3 rounded-xl border border-dashed border-accent/30 hover:border-accent bg-accent/5 hover:bg-accent/10 text-accent text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md mt-2 group"
      >
        <Plus className="h-3.5 w-3.5 transition-transform group-hover:scale-125" />
        Adicionar Cartão
      </button>
    </div>
  );
}

function DraggableTask({ task, projects, onEdit, onDelete }: { task: any; projects: any[]; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div ref={setNodeRef} className={isDragging ? "opacity-30 scale-95" : ""}>
      <div className="relative group">
        <div {...listeners} {...attributes}>
          <TaskCard3D task={task} projects={projects} />
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-150 flex gap-1 bg-card/90 backdrop-blur-md p-1 rounded-lg border shadow-lg z-10">
          <button onClick={onEdit} aria-label="Editar" className="p-1 hover:text-accent hover:bg-accent/10 rounded"><Pencil className="h-3 w-3" /></button>
          <button onClick={onDelete} aria-label="Excluir" className="p-1 hover:text-destructive hover:bg-destructive/10 rounded"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>
    </div>
  );
}

// ─── 3D CARD COMPONENT ────────────────────────────────────────────────────────
function TaskCard3D({ task, projects, dragging }: { task: any; projects: any[]; dragging?: boolean }) {
  const pColor = priorityColor(task.priority);
  const project = projects.find((p) => p.id === task.project_id);

  return (
    <div
      className={`group relative rounded-xl border bg-gradient-to-b from-card via-card/95 to-muted/20 p-4 cursor-grab active:cursor-grabbing transition-all duration-200
        border-t-white/30 dark:border-t-white/10
        ${
          dragging
            ? "rotate-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)] scale-105 ring-2 ring-accent z-50"
            : "shadow-[0_6px_16px_rgba(0,0,0,0.08),_0_1px_3px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(0,0,0,0.18)]"
        }`}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: pColor,
        borderColor: `color-mix(in srgb, ${pColor} 25%, transparent)`,
      }}
    >
      {/* Project Tag Badge */}
      {project && (
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs"
            style={{
              backgroundColor: `color-mix(in srgb, ${project.color || "#6366f1"} 12%, transparent)`,
              borderColor: `color-mix(in srgb, ${project.color || "#6366f1"} 30%, transparent)`,
              color: project.color || "#6366f1",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color || "#6366f1" }} />
            {project.name}
          </span>
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer info: priority pill + date */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 gap-2">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs"
          style={{
            backgroundColor: `color-mix(in srgb, ${pColor} 18%, transparent)`,
            color: pColor,
            border: `1px solid color-mix(in srgb, ${pColor} 30%, transparent)`,
          }}
        >
          {priorityLabel(task.priority)}
        </span>

        {task.due_date && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
            <Calendar className="h-3 w-3 text-accent" />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}
