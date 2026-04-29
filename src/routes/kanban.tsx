import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, priorityColor, priorityLabel, formatDate } from "@/lib/exacta";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { Plus, MoreVertical, Pencil, Trash2, Filter, RotateCcw, Wifi } from "lucide-react";

export const Route = createFileRoute("/kanban")({
  component: () => <AppShell><KanbanPage /></AppShell>,
});

type Column = { id: string; label: string };

const DEFAULT_COLUMNS: Column[] = STATUSES.map((s) => ({ id: s.value, label: s.label }));
const STORAGE_KEY = "exacta:kanban:columns";

function loadColumns(): Column[] {
  if (typeof window === "undefined") return DEFAULT_COLUMNS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COLUMNS;
    const parsed = JSON.parse(raw) as Column[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_COLUMNS;
    return parsed;
  } catch { return DEFAULT_COLUMNS; }
}

function KanbanPage() {
  const { user } = useAuth();
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { setColumns(loadColumns()); }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  const load = async () => {
    const { data } = await supabase.from("tasks").select("*").order("position");
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
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (mineOnly && t.assignee_id !== user?.id) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tasks, priorityFilter, mineOnly, search, user?.id]);

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
            Kanban
            {realtime && <span className="inline-flex items-center gap-1 text-[10px] text-success normal-case tracking-normal"><Wifi className="h-3 w-3" /> Tempo real</span>}
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Fluxo visual de trabalho</h1>
          <p className="text-muted-foreground mt-2">Arraste cartões entre colunas. Personalize seu fluxo.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetColumns} className="gap-2"><RotateCcw className="h-3.5 w-3.5" /> Padrão</Button>
          <Dialog open={newColOpen} onOpenChange={setNewColOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" /> Nova coluna</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova coluna</DialogTitle></DialogHeader>
              <Input placeholder="Ex: Bloqueado" value={colName} onChange={(e) => setColName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addColumn()} />
              <DialogFooter><Button onClick={addColumn} className="bg-gradient-primary text-primary-foreground">Adicionar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar tarefa…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <button onClick={() => setMineOnly((v) => !v)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${mineOnly ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
          Apenas minhas
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.id);
            return (
              <Column
                key={col.id}
                column={col}
                tasks={colTasks}
                onRename={() => { setRenameCol(col); setColName(col.label); }}
                onDelete={() => deleteColumn(col)}
                onEditTask={setEditingTask}
                onDeleteTask={removeTask}
              />
            );
          })}
        </div>
        <DragOverlay>{active && <TaskCard task={active} dragging />}</DragOverlay>
      </DndContext>

      {/* Rename column */}
      <Dialog open={!!renameCol} onOpenChange={(o) => !o && setRenameCol(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear coluna</DialogTitle></DialogHeader>
          <Input value={colName} onChange={(e) => setColName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveRename()} />
          <DialogFooter><Button onClick={saveRename} className="bg-gradient-primary text-primary-foreground">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit task */}
      <Dialog open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar tarefa</DialogTitle></DialogHeader>
          {editingTask && (
            <div className="space-y-3">
              <Input value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} placeholder="Título" />
              <Input value={editingTask.description || ""} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} placeholder="Descrição" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={editingTask.priority} onValueChange={(v) => setEditingTask({ ...editingTask, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={editingTask.due_date ? editingTask.due_date.slice(0, 10) : ""} onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={saveTask} className="bg-gradient-primary text-primary-foreground">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Column({ column, tasks, onRename, onDelete, onEditTask, onDeleteTask }: {
  column: Column; tasks: any[];
  onRename: () => void; onDelete: () => void;
  onEditTask: (t: any) => void; onDeleteTask: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div ref={setNodeRef} className={`rounded-xl bg-muted/40 p-3 min-h-[400px] transition ${isOver ? "bg-accent/10 ring-2 ring-accent" : ""}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">{column.label}</h3>
          <span className="text-xs font-semibold bg-card px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}><Pencil className="h-3.5 w-3.5 mr-2" /> Renomear</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => <DraggableTask key={t.id} task={t} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />)}
      </div>
    </div>
  );
}

function DraggableTask({ task, onEdit, onDelete }: { task: any; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div ref={setNodeRef} className={isDragging ? "opacity-30" : ""}>
      <div className="relative group">
        <div {...listeners} {...attributes}>
          <TaskCard task={task} />
        </div>
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition flex gap-0.5 bg-card rounded shadow">
          <button onClick={onEdit} aria-label="Editar" className="p-1 hover:text-accent"><Pencil className="h-3 w-3" /></button>
          <button onClick={onDelete} aria-label="Excluir" className="p-1 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, dragging }: { task: any; dragging?: boolean }) {
  return (
    <Card className={`p-3 cursor-grab active:cursor-grabbing shadow-card hover:shadow-elegant transition ${dragging ? "rotate-2 shadow-elegant" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: priorityColor(task.priority) }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug pr-12">{task.title}</p>
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span className="font-medium">{priorityLabel(task.priority)}</span>
            <span>{formatDate(task.due_date)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
