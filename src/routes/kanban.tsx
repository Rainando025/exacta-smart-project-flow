import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { STATUSES, priorityColor, priorityLabel, formatDate } from "@/lib/exacta";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { toast } from "sonner";

export const Route = createFileRoute("/kanban")({
  component: () => <AppShell><KanbanPage /></AppShell>,
});

function KanbanPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data } = await supabase.from("tasks").select("*").order("position");
    if (data) setTasks(data);
  };
  useEffect(() => { load(); }, []);

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

  const active = tasks.find((t) => t.id === activeId);

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
      <header>
        <p className="text-sm text-accent font-medium uppercase tracking-wider">Kanban</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Fluxo visual de trabalho</h1>
        <p className="text-muted-foreground mt-2">Arraste cartões entre colunas para atualizar o status.</p>
      </header>

      <DndContext sensors={sensors} onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUSES.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.value);
            return <Column key={col.value} id={col.value} label={col.label} tasks={colTasks} />;
          })}
        </div>
        <DragOverlay>{active && <TaskCard task={active} dragging />}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ id, label, tasks }: { id: string; label: string; tasks: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`rounded-xl bg-muted/40 p-3 min-h-[400px] transition ${isOver ? "bg-accent/10 ring-2 ring-accent" : ""}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">{label}</h3>
        <span className="text-xs font-semibold bg-card px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => <DraggableTask key={t.id} task={t} />)}
      </div>
    </div>
  );
}

function DraggableTask({ task }: { task: any }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? "opacity-30" : ""}>
      <TaskCard task={task} />
    </div>
  );
}

function TaskCard({ task, dragging }: { task: any; dragging?: boolean }) {
  return (
    <Card className={`p-3 cursor-grab active:cursor-grabbing shadow-card hover:shadow-elegant transition ${dragging ? "rotate-2 shadow-elegant" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: priorityColor(task.priority) }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span className="font-medium">{priorityLabel(task.priority)}</span>
            <span>{formatDate(task.due_date)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
