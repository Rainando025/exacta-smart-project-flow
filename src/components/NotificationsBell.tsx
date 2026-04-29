import { useEffect, useState } from "react";
import { Bell, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "@tanstack/react-router";
import { formatDate, isOverdue } from "@/lib/exacta";

export function NotificationsBell() {
  const [tasks, setTasks] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("id,title,due_date,status,priority")
      .neq("status", "done")
      .not("due_date", "is", null)
      .order("due_date", { ascending: true });
    if (data) setTasks(data);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("notifications-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status));
  const soon = tasks.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d >= now && d <= in3days;
  });
  const total = overdue.length + soon.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition"
        >
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <h3 className="font-display font-bold text-sm">Notificações</h3>
          <p className="text-xs text-muted-foreground">{total} alerta{total === 1 ? "" : "s"} de prazo</p>
        </div>
        <div className="max-h-96 overflow-auto divide-y">
          {total === 0 && (
            <p className="text-sm text-muted-foreground p-6 text-center">Tudo em dia ✨</p>
          )}
          {overdue.map((t) => (
            <Link key={t.id} to="/tasks" className="flex items-start gap-2 p-3 hover:bg-muted/50 transition">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-xs text-destructive">Atrasada • {formatDate(t.due_date)}</p>
              </div>
            </Link>
          ))}
          {soon.map((t) => (
            <Link key={t.id} to="/tasks" className="flex items-start gap-2 p-3 hover:bg-muted/50 transition">
              <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground">Vence {formatDate(t.due_date)}</p>
              </div>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
