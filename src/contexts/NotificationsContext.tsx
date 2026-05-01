import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isOverdue, formatDate } from "@/lib/exacta";
import { notify } from "@/lib/notify";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  task_id: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationsContextType {
  items: Notification[];
  unread: number;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data || []) as Notification[]);
  }, [user]);

  const ensureDueNotifications = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data: myTasks } = await supabase
      .from("tasks")
      .select("id,title,due_date,status,assignee_id,creator_id")
      .or(`assignee_id.eq.${user.id},creator_id.eq.${user.id}`)
      .neq("status", "done")
      .not("due_date", "is", null);

    if (!myTasks) return;

    for (const t of myTasks) {
      const due = new Date(t.due_date as string);
      const isSoon = due >= now && due <= in3;
      const overdue = isOverdue(t.due_date, t.status);
      if (!isSoon && !overdue) continue;

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("task_id", t.id)
        .eq("type", "task_due")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      if (existing && existing.length > 0) continue;

      await notify({
        user_id: user.id,
        type: "task_due",
        title: overdue ? `Atrasada: ${t.title}` : `Vence em breve: ${t.title}`,
        message: `Prazo: ${formatDate(t.due_date)}`,
        link: "/tasks",
        task_id: t.id,
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    load();
    ensureDueNotifications();

    const channelName = `notif-${user.id}-${Date.now()}`;
    const ch = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => { load(); }
      )
      .subscribe();

    const interval = setInterval(ensureDueNotifications, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(ch);
      clearInterval(interval);
    };
  }, [user?.id, load, ensureDueNotifications]);

  const unread = items.filter((i) => !i.read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    load();
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    load();
  };

  return (
    <NotificationsContext.Provider value={{ items, unread, markAllRead, markRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
