import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  position: number;
}

export function SubtasksPanel({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Subtask[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("subtasks")
      .select("id,title,completed,position")
      .eq("task_id", taskId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    setItems(data || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`subtasks-${taskId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subtasks", filter: `task_id=eq.${taskId}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [taskId]);

  const add = async () => {
    if (!newTitle.trim() || !user) return;
    const { error } = await supabase.from("subtasks").insert({
      task_id: taskId,
      title: newTitle.trim(),
      created_by: user.id,
      position: items.length,
    });
    if (error) return toast.error(error.message);
    setNewTitle("");
  };

  const toggle = async (s: Subtask) => {
    await supabase.from("subtasks").update({ completed: !s.completed }).eq("id", s.id);
  };

  const remove = async (id: string) => {
    await supabase.from("subtasks").delete().eq("id", id);
  };

  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Checklist</h4>
        <span className="text-xs text-muted-foreground">
          {done}/{total} • {progress}%
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {items.map((s) => (
          <li
            key={s.id}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <Checkbox checked={s.completed} onCheckedChange={() => toggle(s)} />
            <span className={`flex-1 text-sm ${s.completed ? "line-through text-muted-foreground" : ""}`}>
              {s.title}
            </span>
            <button
              onClick={() => remove(s.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition"
              aria-label="Remover item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-xs text-muted-foreground px-2 py-2">Sem itens ainda.</li>
        )}
      </ul>

      <div className="flex gap-2">
        <Input
          placeholder="Adicionar item…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="h-9"
        />
        <Button onClick={add} size="sm" className="bg-gradient-primary text-primary-foreground gap-1">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
