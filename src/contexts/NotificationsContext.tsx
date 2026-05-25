import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isOverdue, formatDate } from "@/lib/exacta";
import { notify } from "@/lib/notify";
import { toast } from "sonner";
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

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!(window as any).__sharedAudioContext) {
    (window as any).__sharedAudioContext = new AudioContextClass();
  }
  return (window as any).__sharedAudioContext as AudioContext;
};

const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Som tipo "ding-dong" de aviso suave
    playNote(523.25, 0, 0.3); // C5
    playNote(659.25, 0.1, 0.4); // E5
  } catch (e) {
    console.error("Audio error", e);
  }
};

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

    const { data: myTasks } = await (supabase
      .from("tasks" as any)
      .select("id,title,due_date,status,assignee_id,creator_id")
      .or(`assignee_id.eq.${user.id},creator_id.eq.${user.id}`) as any);

    // Filter locally to avoid complex PostgREST parsing issues if server is picky
    const filteredTasks = (myTasks || []).filter(
      (t: any) => t.status !== "done" && t.due_date !== null,
    );

    if (!filteredTasks) return;
    for (const t of filteredTasks) {
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

    // Check Reminders / Calendar events
    const { data: myReminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .lte("remind_at", new Date(now.getTime() + 60 * 60 * 1000).toISOString()); // within 1 hour

    if (myReminders) {
      for (const r of myReminders) {
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "reminder")
          .like("title", `%${r.title}%`)
          .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!existing || existing.length === 0) {
          await notify({
            user_id: user.id,
            type: "reminder",
            title: `⏰ Compromisso: ${r.title}`,
            message: `Agendado para ${new Date(r.remind_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
            link: "/notes",
          });
        }
      }
    }
  }, [user]);

  // Desbloqueia o AudioContext na primeira interação do usuário (exigência dos navegadores)
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };
    document.addEventListener("click", unlockAudio);
    document.addEventListener("keydown", unlockAudio);
    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };
  }, []);

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
        (payload) => {
          if (payload.eventType === "INSERT") {
            playNotificationSound();
            const record = payload.new as Notification;
            if (record && record.title) {
              toast.info("Nova notificação", { description: record.title });
            }
          }
          load();
        },
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
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
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
