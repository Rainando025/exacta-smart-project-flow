import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCheck, Trash2, Filter, Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  component: () => (
    <AppShell>
      <NotificationsPage />
    </AppShell>
  ),
});

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  task_assigned: "Atribuição",
  task_updated: "Atualização",
  task_due: "Prazo",
  feedback: "Feedback",
  info: "Geral",
};

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data || []) as Notification[]);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`notif-page-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    toast.success("Todas marcadas como lidas");
  };

  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
  };

  const clearAll = async () => {
    if (!user || !confirm("Excluir todas as notificações?")) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    toast.success("Histórico limpo");
  };

  const filtered = items.filter((n) => {
    if (filter === "unread" && n.read) return false;
    if (filter === "read" && !n.read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (search.trim() && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Notificações</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Central de avisos</h1>
          <p className="text-muted-foreground mt-2">
            {unread > 0 ? `${unread} não lida${unread === 1 ? "" : "s"} • ` : ""}
            {items.length} no histórico
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={markAllRead} variant="outline" className="gap-2" disabled={unread === 0}>
            <CheckCheck className="h-4 w-4" /> Marcar todas
          </Button>
          <Button onClick={clearAll} variant="outline" className="gap-2 text-destructive" disabled={items.length === 0}>
            <Trash2 className="h-4 w-4" /> Limpar tudo
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">Não lidas</SelectItem>
            <SelectItem value="read">Lidas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[170px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="divide-y shadow-card">
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Bell className="h-8 w-8 opacity-40" />
            Nenhuma notificação neste filtro.
          </div>
        )}
        {filtered.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 p-4 hover:bg-muted/30 transition ${!n.read ? "bg-accent/5" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-accent">
                  {TYPE_LABELS[n.type] || n.type}
                </span>
                {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              </div>
              <p className="font-medium text-sm mt-0.5">{n.title}</p>
              {n.message && <p className="text-xs text-muted-foreground mt-1">{n.message}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">
                {new Date(n.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {n.link && (
                <Link
                  to={n.link as any}
                  onClick={() => markRead(n.id)}
                  className="text-xs text-accent hover:underline px-2"
                >
                  Abrir
                </Link>
              )}
              {!n.read && (
                <button onClick={() => markRead(n.id)} className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted" aria-label="Marcar lida">
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => remove(n.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted" aria-label="Excluir">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
