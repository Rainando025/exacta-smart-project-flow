import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { priorityColor } from "@/lib/exacta";
import { Link2, Trash2, Info, Plus, CalendarDays, CalendarRange as RangeIcon, ChevronLeft, ChevronRight, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
const DAY_WIDTH = 40;
const LABEL_WIDTH = 256;

function GanttPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [deps, setDeps] = useState<Dep[]>([]);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [hoverTask, setHoverTask] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<"days" | "weeks">("days");
  const [newGanttOpen, setNewGanttOpen] = useState(false);
  const [newGanttData, setNewGanttData] = useState({ title: "", projectId: "", days: 7 });
  const containerRef = useRef<HTMLDivElement>(null);

  const dayWidth = viewMode === "days" ? 40 : 12;

  const load = async () => {
    const t = await supabase.from("tasks").select("*").not("due_date", "is", null).order("due_date");
    const p = await supabase.from("projects").select("*");
    const d = await supabase.from("task_dependencies").select("*");
    if (t.data) setTasks(t.data);
    if (p.data) setProjects(p.data);
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
    const dates = tasks.map((t) => new Date(t.due_date).getTime());
    const min = Math.min(...dates, Date.now());
    const max = Math.max(...dates, Date.now() + 14 * 86400000);
    const start = new Date(min);
    start.setDate(start.getDate() - 2);
    const total = Math.ceil((max - start.getTime()) / 86400000) + 5;
    const items = tasks.map((t, idx) => {
      const taskStart = t.start_date
        ? new Date(t.start_date)
        : new Date(new Date(t.due_date).getTime() - 3 * 86400000);
      const offsetDays = Math.max(
        0,
        Math.floor((taskStart.getTime() - start.getTime()) / 86400000)
      );
      const duration = Math.max(
        1,
        Math.ceil((new Date(t.due_date).getTime() - taskStart.getTime()) / 86400000)
      );
      return { ...t, offsetDays, duration, rowIndex: idx };
    });
    return { rangeStart: start, totalDays: total, items };
  }, [tasks]);

  const todayOffset = Math.floor((Date.now() - rangeStart.getTime()) / 86400000);

  // Compute pixel positions for arrows
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

  const startLink = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLinkFrom(taskId);
  };

  const finishLink = async (toId: string) => {
    if (!linkFrom || !user || linkFrom === toId) {
      setLinkFrom(null);
      return;
    }
    // evitar ciclos simples
    const isCycle = deps.some(
      (d) => d.predecessor_id === toId && d.successor_id === linkFrom
    );
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
      toast.success("Dependência criada — prazos serão recalculados");
    }
    setLinkFrom(null);
  };

  const removeDep = async (id: string) => {
    const { error } = await supabase.from("task_dependencies").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Vínculo removido");
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!linkFrom || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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
    const { error } = await (supabase.from("tasks" as any)).insert({
        title: newGanttData.title,
        project_id: newGanttData.projectId || null,
        due_date: new Date(Date.now() + newGanttData.days * 86400000).toISOString(),
        start_date: new Date().toISOString(),
        creator_id: user.id,
        status: "todo",
        priority: "medium"
    } as any);

    if (error) toast.error("Erro ao criar cronograma");
    else {
        toast.success("Novo item adicionado ao Gantt!");
        setNewGanttOpen(false);
        setNewGanttData({ title: "", projectId: "", days: 7 });
        load();
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-6 bg-card/40 p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent">
            <RangeIcon className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Cronograma Estratégico</p>
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight">Gantt Flow</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Visualize prazos, arraste o <Link2 className="inline h-3 w-3 text-accent" /> para vincular dependências e organize seu fluxo temporal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-xl p-1 border shadow-inner">
            <Button 
                variant={viewMode === "days" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("days")}
                className="h-8 gap-2 rounded-lg text-xs font-bold"
            >
              <CalendarDays className="h-3.5 w-3.5" /> Diário
            </Button>
            <Button 
                variant={viewMode === "weeks" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("weeks")}
                className="h-8 gap-2 rounded-lg text-xs font-bold"
            >
              <RangeIcon className="h-3.5 w-3.5" /> Semanal
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
                <div className="space-y-4 py-4">
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
            Quando o prazo de uma tarefa predecessora muda, as sucessoras são empurradas
            automaticamente para depois dela.
          </p>
        </div>
      )}

      <Card className="overflow-auto shadow-card">
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Nenhuma tarefa com prazo definido ainda.
          </div>
        ) : (
          <div className="min-w-fit relative" onClick={cancelLink}>
            {/* Header dates */}
            <div className="flex border-b sticky top-0 bg-card z-20">
              <div className="shrink-0 border-r p-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider"
                   style={{ width: LABEL_WIDTH }}>
                Tarefa
              </div>
              <div className="flex">
                {Array.from({ length: totalDays }).map((_, i) => {
                  const d = new Date(rangeStart);
                  d.setDate(d.getDate() + i);
                  const isToday = i === todayOffset;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={`shrink-0 border-r text-center text-[10px] py-2 ${
                        isToday ? "bg-accent/20 font-bold" : isWeekend ? "bg-muted/50" : ""
                      }`}
                      style={{ width: dayWidth }}
                    >
                      <div className="text-muted-foreground">
                        {d
                          .toLocaleDateString("pt-BR", { weekday: "short" })
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                      <div className="font-semibold">{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex" ref={containerRef} onMouseMove={handleMouseMove}>
              {/* Labels column */}
              <div className="shrink-0 border-r" style={{ width: LABEL_WIDTH }}>
                {items.map((t) => {
                  const proj = projects.find((p) => p.id === t.project_id);
                  return (
                    <div
                      key={t.id}
                      className="border-b p-3 flex items-center gap-2"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: priorityColor(t.priority) }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        {proj && (
                          <p className="text-[10px] text-muted-foreground truncate">{proj.name}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline */}
              <div
                className="relative"
                style={{ width: totalDays * dayWidth, height: items.length * ROW_HEIGHT }}
              >
                {/* Grid background */}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const d = new Date(rangeStart);
                  d.setDate(d.getDate() + i);
                  const isToday = i === todayOffset;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={`absolute top-0 bottom-0 border-r ${
                        isToday ? "bg-accent/10" : isWeekend ? "bg-muted/30" : ""
                      }`}
                      style={{ left: i * dayWidth, width: dayWidth }}
                    />
                  );
                })}

                {/* Row separators */}
                {items.map((_, idx) => (
                  <div
                    key={idx}
                    className="absolute left-0 right-0 border-b"
                    style={{ top: (idx + 1) * ROW_HEIGHT - 1 }}
                  />
                ))}

                {/* Bars */}
                {items.map((t) => {
                  const proj = projects.find((p) => p.id === t.project_id);
                  const isLinking = linkFrom === t.id;
                  const isHover = hoverTask === t.id && linkFrom && linkFrom !== t.id;
                  return (
                    <div
                      key={t.id}
                      className="absolute group"
                      style={{
                        top: t.rowIndex * ROW_HEIGHT,
                        left: 0,
                        right: 0,
                        height: ROW_HEIGHT,
                      }}
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
                        className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md flex items-center px-2 text-[10px] font-medium text-white shadow-card transition-all ${
                          isLinking ? "ring-2 ring-accent ring-offset-2" : ""
                        } ${isHover ? "ring-2 ring-accent" : ""}`}
                        style={{
                          left: t.offsetDays * dayWidth,
                          width: Math.max(t.duration * dayWidth - 4, 32),
                          background: proj?.color
                            ? `linear-gradient(90deg, ${proj.color}, ${proj.color}dd)`
                            : "linear-gradient(135deg, oklch(0.35 0.15 250), oklch(0.55 0.18 220))",
                          cursor: linkFrom ? "crosshair" : "default",
                        }}
                      >
                        <span className="truncate flex-1">{t.title}</span>
                      </div>
                      {/* Link handle on the right edge */}
                      <button
                        onClick={(e) => startLink(t.id, e)}
                        className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition shadow-glow z-10"
                        style={{
                          left: (t.offsetDays + t.duration) * dayWidth - 8,
                        }}
                        title="Criar dependência"
                      >
                        <Link2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                {/* SVG arrows for dependencies */}
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={totalDays * dayWidth}
                  height={items.length * ROW_HEIGHT}
                  style={{ overflow: "visible" }}
                >
                  <defs>
                    <marker
                      id="arrow"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M0,0 L8,4 L0,8 z" fill="hsl(var(--accent))" />
                    </marker>
                  </defs>
                  {arrows.map((a) => {
                    const midX = (a.x1 + a.x2) / 2;
                    const path = `M ${a.x1} ${a.y1} C ${midX} ${a.y1}, ${midX} ${a.y2}, ${a.x2} ${a.y2}`;
                    return (
                      <g key={a.id} className="pointer-events-auto">
                        <path
                          d={path}
                          stroke="hsl(var(--accent))"
                          strokeWidth="1.5"
                          fill="none"
                          markerEnd="url(#arrow)"
                          opacity="0.7"
                        />
                        <path
                          d={path}
                          stroke="transparent"
                          strokeWidth="10"
                          fill="none"
                          className="cursor-pointer hover:stroke-destructive/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Remover este vínculo?")) removeDep(a.id);
                          }}
                        />
                      </g>
                    );
                  })}
                  {/* Ghost line while linking */}
                  {ghostStart && mousePos && (
                    <line
                      x1={ghostStart.x}
                      y1={ghostStart.y}
                      x2={mousePos.x - LABEL_WIDTH}
                      y2={mousePos.y}
                      stroke="hsl(var(--accent))"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Dependencies list */}
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
                <li
                  key={d.id}
                  className="flex items-center gap-2 py-2 text-sm"
                >
                  <span className="font-medium truncate flex-1">{from?.title || "—"}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium truncate flex-1">{to?.title || "—"}</span>
                  <button
                    onClick={() => removeDep(d.id)}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
