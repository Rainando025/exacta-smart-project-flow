import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { priorityColor, STATUSES, PRIORITIES } from "@/lib/exacta";
import { Link2, Trash2, Info, Plus, CalendarDays, CalendarRange as RangeIcon, CalendarIcon, ChevronLeft, ChevronRight, Settings2, X, Pencil, GripVertical, GripHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "@/hooks/useRole";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/gantt")({
  component: () => (
    <AppShell>
      <GanttPage />
    </AppShell>
  ),
});

interface Dep {
  id: string;
  predecessor_id: string;
  successor_id: string;
}

const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 48;
const LABEL_WIDTH = 256;

function GanttPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [deps, setDeps] = useState<Dep[]>([]);
  
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [hoverTask, setHoverTask] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  
  const [viewMode, setViewMode] = useState<"days" | "weeks" | "months">("days");
  const [newGanttOpen, setNewGanttOpen] = useState(false);
  const [newGanttData, setNewGanttData] = useState({ title: "", projectId: "", days: 7, assigneeId: "", predecessorId: "none" });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { canDeleteTask, canEditTask, isGestor } = useRole();
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Drag state
  const [dragging, setDragging] = useState<{
    id: string;
    type: "move" | "resize";
    startX: number;
    initialStart: number; // timestamp
    initialDue: number;   // timestamp
  } | null>(null);

  const dayWidth = viewMode === "days" ? 40 : viewMode === "weeks" ? 12 : 3;

  const load = async () => {
    const t = await supabase.from("tasks").select("*").eq("is_personal", false).not("due_date", "is", null).order("due_date");
    const p = await supabase.from("projects").select("*");
    const pr = await supabase.from("profiles").select("id, full_name");
    const d = await supabase.from("task_dependencies").select("*");
    
    if (t.data) setTasks(t.data);
    if (p.data) setProjects(p.data);
    if (pr.data) setProfiles(pr.data);
    if (d.data) setDeps(d.data as Dep[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("gantt-deps")
      .on("postgres_changes", { event: "*", schema: "public", table: "task_dependencies" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const { rangeStart, totalDays, items } = useMemo(() => {
    if (tasks.length === 0)
      return { rangeStart: new Date(), totalDays: 30, items: [] as any[] };
    const dates = tasks.flatMap((t) => [new Date(t.due_date).getTime(), t.start_date ? new Date(t.start_date).getTime() : new Date(t.due_date).getTime() - 3 * 86400000]);
    const min = Math.min(...dates, Date.now());
    const max = Math.max(...dates, Date.now() + 14 * 86400000);
    const start = new Date(min);
    start.setDate(start.getDate() - 2);
    // Para modo months, mostrar até 6 meses a mais para ter visualização longa
    const extraDays = viewMode === "months" ? 180 : 5;
    const total = Math.ceil((max - start.getTime()) / 86400000) + extraDays;
    
    const items = tasks.map((t, idx) => {
      const taskStart = t.start_date
        ? new Date(t.start_date)
        : new Date(new Date(t.due_date).getTime() - 3 * 86400000);
      const offsetDays = Math.max(
        0,
        (taskStart.getTime() - start.getTime()) / 86400000
      );
      const duration = Math.max(
        1,
        (new Date(t.due_date).getTime() - taskStart.getTime()) / 86400000
      );
      return { ...t, offsetDays, duration, rowIndex: idx, actualStart: taskStart, actualDue: new Date(t.due_date) };
    });
    return { rangeStart: start, totalDays: total, items };
  }, [tasks, viewMode]);

  const todayOffset = Math.floor((Date.now() - rangeStart.getTime()) / 86400000);
  const itemById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  const arrows = useMemo(() => {
    return deps
      .map((d) => {
        const from = itemById[d.predecessor_id];
        const to = itemById[d.successor_id];
        if (!from || !to) return null;
        const x1 = (from.offsetDays + from.duration) * dayWidth - 2;
        const y1 = from.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
        const x2 = to.offsetDays * dayWidth;
        const y2 = to.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
        return { id: d.id, x1, y1, x2, y2 };
      })
      .filter(Boolean) as { id: string; x1: number; y1: number; x2: number; y2: number }[];
  }, [deps, itemById, dayWidth]);

  // LINKING
  const startLink = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLinkFrom(taskId);
  };

  const finishLink = async (toId: string) => {
    if (!linkFrom || !user || linkFrom === toId) {
      setLinkFrom(null);
      return;
    }
    const isCycle = deps.some((d) => d.predecessor_id === toId && d.successor_id === linkFrom);
    if (isCycle) {
      toast.error("Já existe vínculo no sentido contrário");
      setLinkFrom(null);
      return;
    }
    const { error } = await supabase.from("task_dependencies").insert({
      predecessor_id: linkFrom,
      successor_id: toId,
      created_by: user.id,
    });
    if (error) {
      if (error.code === "23505") toast.error("Vínculo já existe");
      else toast.error(error.message);
    } else {
      toast.success("Dependência criada");
      // Recalcular a data do sucessor
      const fromTask = tasks.find(t => t.id === linkFrom);
      const toTask = tasks.find(t => t.id === toId);
      if (fromTask && toTask) {
        const fromEnd = new Date(fromTask.due_date).getTime();
        const toStart = toTask.start_date ? new Date(toTask.start_date).getTime() : new Date(toTask.due_date).getTime() - 86400000;
        if (toStart < fromEnd) {
          const diff = fromEnd - toStart;
          await cascadePushTask(toId, diff);
        }
      }
    }
    setLinkFrom(null);
  };

  // CASCADING
  const cascadePushTask = async (taskId: string, pushMs: number) => {
    if (pushMs <= 0) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStart = new Date((task.start_date ? new Date(task.start_date).getTime() : new Date(task.due_date).getTime() - 86400000) + pushMs).toISOString();
    const newDue = new Date(new Date(task.due_date).getTime() + pushMs).toISOString();

    const { error } = await supabase.from("tasks").update({ start_date: newStart, due_date: newDue }).eq("id", taskId);
    if (!error) {
        // Encontrar sucessores e empurrá-los
        const successors = deps.filter(d => d.predecessor_id === taskId);
        for (const dep of successors) {
            await cascadePushTask(dep.successor_id, pushMs);
        }
    }
  };

  // MOUSE & DRAG EVENTS
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (dragging) {
        const deltaX = e.clientX - dragging.startX;
        const deltaDays = Math.round(deltaX / dayWidth);
        const deltaMs = deltaDays * 86400000;

        setTasks(prev => prev.map(t => {
            if (t.id === dragging.id) {
                if (dragging.type === "move") {
                    return {
                        ...t,
                        start_date: new Date(dragging.initialStart + deltaMs).toISOString(),
                        due_date: new Date(dragging.initialDue + deltaMs).toISOString()
                    };
                } else if (dragging.type === "resize") {
                    const newDueTime = Math.max(dragging.initialStart + 86400000, dragging.initialDue + deltaMs);
                    return {
                        ...t,
                        due_date: new Date(newDueTime).toISOString()
                    };
                }
            }
            return t;
        }));
    }
  };

  const handleMouseUp = async () => {
    if (dragging) {
        const task = tasks.find(t => t.id === dragging.id);
        if (task) {
            const currentStartMs = new Date(task.start_date).getTime();
            const currentDueMs = new Date(task.due_date).getTime();
            const pushMs = currentDueMs - dragging.initialDue;

            const { error } = await supabase.from("tasks").update({
                start_date: task.start_date,
                due_date: task.due_date
            }).eq("id", task.id);

            if (error) {
                toast.error("Erro ao salvar datas");
                load(); // revert
            } else {
                toast.success("Datas ajustadas");
                if (pushMs > 0) {
                    const successors = deps.filter(d => d.predecessor_id === task.id);
                    for (const dep of successors) {
                        await cascadePushTask(dep.successor_id, pushMs);
                    }
                    if(successors.length > 0) load();
                }
            }
        }
        setDragging(null);
    }
    setLinkFrom(null);
    setMousePos(null);
  };

  const removeDep = async (id: string) => {
    const { error } = await supabase.from("task_dependencies").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Vínculo removido");
  };

  const removeTask = async (id: string) => {
    if (!confirm("Excluir esta tarefa permanentemente? Todas as dependências vinculadas também serão removidas.")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
        toast.success("Tarefa excluída");
        load();
    }
  };

  const saveTaskEdit = async () => {
    if (!editingTask) return;
    const { error } = await supabase.from("tasks").update({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        status: editingTask.status,
        due_date: editingTask.due_date,
        start_date: editingTask.start_date,
        assignee_id: editingTask.assignee_id
    }).eq("id", editingTask.id);
    
    if (error) toast.error(error.message);
    else {
        toast.success("Tarefa atualizada");
        setEditingTask(null);
        load();
    }
  };

  const cancelLink = () => {
    setLinkFrom(null);
    setMousePos(null);
  };

  const fromItem = linkFrom ? itemById[linkFrom] : null;
  const ghostStart = fromItem
    ? {
        x: (fromItem.offsetDays + fromItem.duration) * dayWidth - 2,
        y: fromItem.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
      }
    : null;

  const createGanttTask = async () => {
    if (!newGanttData.title || !user) return;
    
    let baseStartDate = new Date();
    if (newGanttData.predecessorId && newGanttData.predecessorId !== "none") {
        const pred = tasks.find(t => t.id === newGanttData.predecessorId);
        if (pred) {
            baseStartDate = new Date(pred.due_date);
            // adiciona 1 dia para não encavalar
            baseStartDate.setDate(baseStartDate.getDate() + 1);
        }
    }

    const { data, error } = await (supabase.from("tasks" as any)).insert({
        title: newGanttData.title,
        project_id: newGanttData.projectId || null,
        start_date: baseStartDate.toISOString(),
        due_date: new Date(baseStartDate.getTime() + newGanttData.days * 86400000).toISOString(),
        creator_id: user.id,
        assignee_id: newGanttData.assigneeId || user.id,
        status: "todo",
        priority: "media"
    }).select().single();

    if (error) toast.error(error.message || "Erro ao criar cronograma");
    else {
        if (newGanttData.predecessorId && newGanttData.predecessorId !== "none" && data) {
            await supabase.from("task_dependencies").insert({
                predecessor_id: newGanttData.predecessorId,
                successor_id: (data as any).id,
                created_by: user.id
            });
        }
        toast.success("Novo item adicionado ao Gantt!");
        setNewGanttOpen(false);
        setNewGanttData({ title: "", projectId: "", days: 7, assigneeId: "", predecessorId: "none" });
        load();
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <header className="flex flex-wrap items-center justify-between gap-6 bg-card/40 p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent">
            <RangeIcon className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Cronograma Estratégico</p>
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight">Gantt Flow</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Visualize prazos, arraste o <Link2 className="inline h-3 w-3 text-accent" /> para vincular dependências e organize seu fluxo temporal. Arraste as barras para ajustar as datas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-xl p-1 border shadow-inner">
            <Button variant={viewMode === "days" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("days")} className="h-8 gap-2 rounded-lg text-xs font-bold">
              <CalendarDays className="h-3.5 w-3.5" /> Diário
            </Button>
            <Button variant={viewMode === "weeks" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("weeks")} className="h-8 gap-2 rounded-lg text-xs font-bold">
              <RangeIcon className="h-3.5 w-3.5" /> Semanal
            </Button>
            <Button variant={viewMode === "months" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("months")} className="h-8 gap-2 rounded-lg text-xs font-bold">
              <CalendarIcon className="h-3.5 w-3.5" /> Mensal
            </Button>
          </div>

          <Dialog open={newGanttOpen} onOpenChange={setNewGanttOpen}>
            <DialogTrigger asChild>
                <Button className="h-10 gap-2 bg-gradient-primary text-primary-foreground shadow-glow px-6 font-bold uppercase tracking-widest text-[10px]">
                    <Plus className="h-4 w-4" /> Novo Gantt
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo Planejamento de Gantt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                        <Label>Título do Item / Tarefa</Label>
                        <Input value={newGanttData.title} onChange={e => setNewGanttData({...newGanttData, title: e.target.value})} placeholder="Ex: Lançamento de Campanha" />
                    </div>
                    <div className="space-y-2">
                        <Label>Projeto Vinculado</Label>
                        <Select value={newGanttData.projectId} onValueChange={v => setNewGanttData({...newGanttData, projectId: v})}>
                            <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                            <SelectContent>
                                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Responsável</Label>
                        <Select value={newGanttData.assigneeId} onValueChange={v => setNewGanttData({...newGanttData, assigneeId: v})}>
                            <SelectTrigger><SelectValue placeholder="Atribuir a..." /></SelectTrigger>
                            <SelectContent>
                                {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Vincular após (Predecessora)</Label>
                        <Select value={newGanttData.predecessorId} onValueChange={v => setNewGanttData({...newGanttData, predecessorId: v})}>
                            <SelectTrigger><SelectValue placeholder="Opcional: Iniciar após qual tarefa?" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhuma</SelectItem>
                                {tasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Duração Estimada (Dias)</Label>
                        <Input type="number" value={newGanttData.days} onChange={e => setNewGanttData({...newGanttData, days: parseInt(e.target.value)})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={createGanttTask} className="w-full bg-gradient-primary">Criar e Visualizar no Gantt</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>

          {linkFrom && (
            <Button onClick={cancelLink} variant="destructive" size="sm" className="h-10 gap-2 font-bold px-4">
              <X className="h-4 w-4" /> Cancelar vínculo
            </Button>
          )}
        </div>
      </header>

      {tasks.length > 0 && deps.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs">
          <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <p>
            Dependências Cascata ativas. Alterar o prazo de uma tarefa empurrará automaticamente as tarefas vinculadas a ela.
          </p>
        </div>
      )}

      <Card className="overflow-auto shadow-card select-none">
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Nenhuma tarefa com prazo definido ainda.
          </div>
        ) : (
          <div className="min-w-fit relative" onClick={cancelLink}>
            {/* Header dates */}
            <div className="flex border-b sticky top-0 bg-card z-20">
              <div className="shrink-0 border-r p-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider" style={{ width: LABEL_WIDTH }}>
                Tarefa
              </div>
              <div className="flex">
                {Array.from({ length: totalDays }).map((_, i) => {
                  const d = new Date(rangeStart);
                  d.setDate(d.getDate() + i);
                  const isToday = i === todayOffset;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  
                  // Monthly view: only show label on the 1st of the month, simplify lines
                  if (viewMode === "months") {
                      const isFirst = d.getDate() === 1;
                      return (
                        <div key={i} className={`shrink-0 border-r ${isFirst ? 'bg-muted/30 relative' : ''}`} style={{ width: dayWidth }}>
                          {isFirst && (
                              <div className="absolute left-1 top-2 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                                  {d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).toUpperCase()}
                              </div>
                          )}
                        </div>
                      );
                  }

                  return (
                    <div
                      key={i}
                      className={`shrink-0 border-r text-center py-2 ${
                        isToday ? "bg-accent/20 font-bold" : isWeekend ? "bg-muted/50" : ""
                      }`}
                      style={{ width: dayWidth }}
                    >
                      {viewMode === "days" ? (
                          <>
                              <div className="text-[10px] text-muted-foreground">
                                {d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 1).toUpperCase()}
                              </div>
                              <div className="text-[10px] font-semibold">{d.getDate()}</div>
                          </>
                      ) : (
                          d.getDay() === 1 ? <div className="text-[9px] font-semibold mt-1">{d.getDate()}</div> : null
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex" ref={containerRef} onMouseMove={handleMouseMove}>
              {/* Labels column */}
              <div className="shrink-0 border-r bg-card z-10" style={{ width: LABEL_WIDTH }}>
                {items.map((t) => {
                  const proj = projects.find((p) => p.id === t.project_id);
                  const prof = profiles.find(p => p.id === t.assignee_id);
                  return (
                    <div
                      key={t.id}
                      className="border-b p-3 flex items-center gap-2"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: priorityColor(t.priority) }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <div className="flex items-center gap-1">
                            {proj && <p className="text-[10px] text-muted-foreground truncate">{proj.name}</p>}
                            {prof && <p className="text-[10px] text-accent truncate ml-auto">{prof.full_name.split(' ')[0]}</p>}
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                         {canEditTask(t.creator_id) && (
                             <button onClick={() => setEditingTask(t)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-accent transition-colors"><Pencil className="h-3 w-3" /></button>
                         )}
                         {canDeleteTask(t.creator_id) && (
                             <button onClick={() => removeTask(t.id)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline */}
              <div className="relative" style={{ width: totalDays * dayWidth, height: items.length * ROW_HEIGHT }}>
                {/* Grid background */}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const d = new Date(rangeStart);
                  d.setDate(d.getDate() + i);
                  const isToday = i === todayOffset;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isMonthStart = d.getDate() === 1;
                  
                  return (
                    <div
                      key={i}
                      className={`absolute top-0 bottom-0 border-r ${
                        isToday ? "bg-accent/10" : isWeekend && viewMode === "days" ? "bg-muted/30" : isMonthStart && viewMode === "months" ? "bg-muted/40" : ""
                      }`}
                      style={{ left: i * dayWidth, width: dayWidth }}
                    />
                  );
                })}

                {/* Row separators */}
                {items.map((_, idx) => (
                  <div key={idx} className="absolute left-0 right-0 border-b" style={{ top: (idx + 1) * ROW_HEIGHT - 1 }} />
                ))}

                {/* Bars */}
                {items.map((t) => {
                  const proj = projects.find((p) => p.id === t.project_id);
                  const isLinking = linkFrom === t.id;
                  const isHover = hoverTask === t.id && linkFrom && linkFrom !== t.id;
                  const isDragging = dragging?.id === t.id;
                  
                  return (
                    <div
                      key={t.id}
                      className="absolute group"
                      style={{ top: t.rowIndex * ROW_HEIGHT, left: 0, right: 0, height: ROW_HEIGHT, zIndex: isDragging ? 50 : 10 }}
                      onMouseEnter={() => setHoverTask(t.id)}
                      onMouseLeave={() => setHoverTask(null)}
                      onClick={(e) => {
                        if (linkFrom && linkFrom !== t.id) {
                          e.stopPropagation();
                          finishLink(t.id);
                        }
                      }}
                    >
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md flex items-center px-2 text-[10px] font-medium text-white shadow-card transition-colors ${
                          isLinking ? "ring-2 ring-accent ring-offset-2" : ""
                        } ${isHover ? "ring-2 ring-accent" : ""} ${isDragging ? "opacity-80 scale-[1.02]" : "transition-transform"}`}
                        style={{
                          left: t.offsetDays * dayWidth,
                          width: Math.max(t.duration * dayWidth, viewMode === 'months' ? 12 : 32),
                          background: proj?.color
                            ? `linear-gradient(90deg, ${proj.color}, ${proj.color}dd)`
                            : "linear-gradient(135deg, oklch(0.35 0.15 250), oklch(0.55 0.18 220))",
                          cursor: linkFrom ? "crosshair" : canEditTask(t.creator_id) ? "grab" : "default",
                        }}
                        onMouseDown={(e) => {
                            if (!linkFrom && canEditTask(t.creator_id) && e.button === 0) {
                                setDragging({ id: t.id, type: "move", startX: e.clientX, initialStart: t.actualStart.getTime(), initialDue: t.actualDue.getTime() });
                            }
                        }}
                      >
                        <span className="truncate flex-1 pointer-events-none">{viewMode !== "months" && t.title}</span>
                        
                        {/* Resize handle */}
                        {canEditTask(t.creator_id) && !linkFrom && (
                            <div 
                                className="absolute right-0 top-0 bottom-0 w-3 cursor-e-resize hover:bg-white/20 rounded-r-md flex items-center justify-center opacity-0 group-hover:opacity-100"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    if(e.button === 0) setDragging({ id: t.id, type: "resize", startX: e.clientX, initialStart: t.actualStart.getTime(), initialDue: t.actualDue.getTime() });
                                }}
                            >
                                <div className="w-0.5 h-3 bg-white/50 rounded-full" />
                            </div>
                        )}
                      </div>
                      
                      {/* Link handle */}
                      <button
                        onClick={(e) => startLink(t.id, e)}
                        className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition shadow-glow z-20"
                        style={{ left: (t.offsetDays + t.duration) * dayWidth + 4 }}
                        title="Criar dependência"
                      >
                        <Link2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                {/* SVG arrows for dependencies */}
                <svg className="absolute inset-0 pointer-events-none z-0" width={totalDays * dayWidth} height={items.length * ROW_HEIGHT} style={{ overflow: "visible" }}>
                  <defs>
                    <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                      <path d="M0,0 L8,4 L0,8 z" fill="hsl(var(--accent))" />
                    </marker>
                  </defs>
                  {arrows.map((a) => {
                    const midX = (a.x1 + a.x2) / 2;
                    const path = `M ${a.x1} ${a.y1} C ${midX} ${a.y1}, ${midX} ${a.y2}, ${a.x2} ${a.y2}`;
                    return (
                      <g key={a.id} className="pointer-events-auto">
                        <path d={path} stroke="hsl(var(--accent))" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" opacity="0.7" />
                        <path d={path} stroke="transparent" strokeWidth="10" fill="none" className="cursor-pointer hover:stroke-destructive/20" onClick={(e) => { e.stopPropagation(); if (confirm("Remover este vínculo?")) removeDep(a.id); }} />
                      </g>
                    );
                  })}
                  {ghostStart && mousePos && (
                    <line x1={ghostStart.x} y1={ghostStart.y} x2={mousePos.x - LABEL_WIDTH} y2={mousePos.y} stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="4 4" />
                  )}
                </svg>
              </div>
            </div>
          </div>
        )}
      </Card>

      {deps.length > 0 && (
        <Card className="p-5 shadow-card">
          <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-accent" /> Dependências ({deps.length})
          </h3>
          <ul className="divide-y">
            {deps.map((d) => {
              const from = tasks.find((t) => t.id === d.predecessor_id);
              const to = tasks.find((t) => t.id === d.successor_id);
              return (
                <li key={d.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="font-medium truncate flex-1">{from?.title || "—"}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium truncate flex-1">{to?.title || "—"}</span>
                  <button onClick={() => removeDep(d.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={o => !o && setEditingTask(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Editar Tarefa no Cronograma</DialogTitle></DialogHeader>
            {editingTask && (
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                        <Label>Título</Label>
                        <Input value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea value={editingTask.description || ""} onChange={e => setEditingTask({...editingTask, description: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Responsável</Label>
                        <Select value={editingTask.assignee_id || "none"} onValueChange={v => setEditingTask({...editingTask, assignee_id: v === "none" ? null : v})}>
                            <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sem responsável</SelectItem>
                                {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Início</Label>
                            <Input type="date" value={editingTask.start_date ? editingTask.start_date.slice(0, 10) : ""} onChange={e => setEditingTask({...editingTask, start_date: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fim (Prazo)</Label>
                            <Input type="date" value={editingTask.due_date ? editingTask.due_date.slice(0, 10) : ""} onChange={e => setEditingTask({...editingTask, due_date: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Prioridade</Label>
                            <Select value={editingTask.priority} onValueChange={v => setEditingTask({...editingTask, priority: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={editingTask.status} onValueChange={v => setEditingTask({...editingTask, status: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button onClick={saveTaskEdit} className="w-full bg-gradient-primary">Salvar Alterações</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
