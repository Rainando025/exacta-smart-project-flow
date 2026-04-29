import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { priorityColor } from "@/lib/exacta";

export const Route = createFileRoute("/gantt")({
  component: () => <AppShell><GanttPage /></AppShell>,
});

function GanttPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const t = await supabase.from("tasks").select("*").not("due_date", "is", null).order("due_date");
      const p = await supabase.from("projects").select("*");
      if (t.data) setTasks(t.data);
      if (p.data) setProjects(p.data);
    })();
  }, []);

  const { rangeStart, totalDays, items } = useMemo(() => {
    if (tasks.length === 0) return { rangeStart: new Date(), totalDays: 30, items: [] as any[] };
    const dates = tasks.map((t) => new Date(t.due_date).getTime());
    const min = Math.min(...dates, Date.now());
    const max = Math.max(...dates, Date.now() + 14 * 86400000);
    const start = new Date(min);
    start.setDate(start.getDate() - 2);
    const total = Math.ceil((max - start.getTime()) / 86400000) + 5;
    const items = tasks.map((t) => {
      const taskStart = t.start_date ? new Date(t.start_date) : new Date(new Date(t.due_date).getTime() - 3 * 86400000);
      const offsetDays = Math.max(0, Math.floor((taskStart.getTime() - start.getTime()) / 86400000));
      const duration = Math.max(1, Math.ceil((new Date(t.due_date).getTime() - taskStart.getTime()) / 86400000));
      return { ...t, offsetDays, duration };
    });
    return { rangeStart: start, totalDays: total, items };
  }, [tasks]);

  const dayWidth = 40;
  const todayOffset = Math.floor((Date.now() - rangeStart.getTime()) / 86400000);

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
      <header>
        <p className="text-sm text-accent font-medium uppercase tracking-wider">Cronograma</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Gantt — visão temporal</h1>
        <p className="text-muted-foreground mt-2">Linha do tempo de todas as tarefas com prazo definido.</p>
      </header>

      <Card className="overflow-auto shadow-card">
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Nenhuma tarefa com prazo definido ainda.</div>
        ) : (
          <div className="min-w-fit">
            {/* Header dates */}
            <div className="flex border-b sticky top-0 bg-card z-10">
              <div className="w-64 shrink-0 border-r p-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Tarefa</div>
              <div className="flex">
                {Array.from({ length: totalDays }).map((_, i) => {
                  const d = new Date(rangeStart);
                  d.setDate(d.getDate() + i);
                  const isToday = i === todayOffset;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div key={i} className={`shrink-0 border-r text-center text-[10px] py-2 ${isToday ? "bg-accent/20 font-bold" : isWeekend ? "bg-muted/50" : ""}`} style={{ width: dayWidth }}>
                      <div className="text-muted-foreground">{d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 1).toUpperCase()}</div>
                      <div className="font-semibold">{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rows */}
            {items.map((t) => {
              const proj = projects.find((p) => p.id === t.project_id);
              return (
                <div key={t.id} className="flex border-b hover:bg-muted/30 transition">
                  <div className="w-64 shrink-0 border-r p-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: priorityColor(t.priority) }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      {proj && <p className="text-[10px] text-muted-foreground truncate">{proj.name}</p>}
                    </div>
                  </div>
                  <div className="relative" style={{ width: totalDays * dayWidth, height: 48 }}>
                    {/* Today line */}
                    {todayOffset >= 0 && todayOffset < totalDays && (
                      <div className="absolute top-0 bottom-0 w-px bg-accent/60" style={{ left: todayOffset * dayWidth + dayWidth / 2 }} />
                    )}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-7 rounded-md flex items-center px-2 text-[10px] font-medium text-white shadow-card"
                      style={{
                        left: t.offsetDays * dayWidth,
                        width: Math.max(t.duration * dayWidth - 4, 32),
                        background: proj?.color ? `linear-gradient(90deg, ${proj.color}, ${proj.color}dd)` : "var(--gradient-primary)",
                      }}
                    >
                      <span className="truncate">{t.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
