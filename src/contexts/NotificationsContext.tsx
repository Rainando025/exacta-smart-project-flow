import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isOverdue, formatDate } from "@/lib/exacta";
import { notify } from "@/lib/notify";
import { toast } from "sonner";
import { fetchUserReminders } from "@/lib/reminders/reminders-service";
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
    // Otimização de Log Ingestion: Não gasta requisições se a aba estiver oculta/minimizada
    if (typeof document !== "undefined" && document.hidden) return;

    const now = new Date();
    const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Busca tarefas do usuário em uma única query enxuta
    const { data: myTasks } = await (supabase
      .from("tasks" as any)
      .select("id,title,due_date,status,assignee_id,creator_id")
      .or(`assignee_id.eq.${user.id},creator_id.eq.${user.id}`) as any);

    const filteredTasks = (myTasks || []).filter(
      (t: any) => t.status !== "done" && t.due_date !== null,
    );

    // 2. Busca notificações recentes das últimas 24h em UMA ÚNICA QUERY (evita loop N+1 de requests)
    const { data: recentNotifs } = await supabase
      .from("notifications")
      .select("task_id, type, title")
      .eq("user_id", user.id)
      .gte("created_at", last24h);

    const existingTaskIds = new Set((recentNotifs || []).map((n) => n.task_id).filter(Boolean));
    const existingTitles = new Set((recentNotifs || []).map((n) => n.title));

    if (filteredTasks.length > 0) {
      for (const t of filteredTasks) {
        const due = new Date(t.due_date as string);
        const isSoon = due >= now && due <= in3;
        const overdue = isOverdue(t.due_date, t.status);
        if (!isSoon && !overdue) continue;

        if (existingTaskIds.has(t.id)) continue;

        await notify({
          user_id: user.id,
          type: "task_due",
          title: overdue ? `Atrasada: ${t.title}` : `Vence em breve: ${t.title}`,
          message: `Prazo: ${formatDate(t.due_date)}`,
          link: "/tasks",
          task_id: t.id,
        });
        existingTaskIds.add(t.id);
      }
    }

    // 3. Checa Lembretes pontuais via cache/service otimizado
    try {
      const allReminders = await fetchUserReminders(user.id);
      const soonRemindTime = now.getTime() + 60 * 60 * 1000; // próximas 1 hora

      const pendingReminders = allReminders.filter((r) => {
        if (r.completed) return false;
        const t = new Date(r.remind_at).getTime();
        return t <= soonRemindTime;
      });

      for (const r of pendingReminders) {
        const titleStr = `⏰ Compromisso: ${r.title}`;
        if (existingTitles.has(titleStr)) continue;

        await notify({
          user_id: user.id,
          type: "reminder",
          title: titleStr,
          message: `Agendado para ${new Date(r.remind_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
          link: "/notes",
        });
        existingTitles.add(titleStr);
      }
    } catch (e) {
      console.warn("ensureDueNotifications reminders error:", e);
    }

    // 4. Checa Contas a Vencer de Finanças Pessoais (despesas pendentes dos próximos 3 dias)
    try {
      const todayStr = now.toISOString().split("T")[0];
      const in3Str = in3.toISOString().split("T")[0];

      const { data: dueBills } = await supabase
        .from("personal_finances")
        .select("id, title, amount, due_date, paid, type")
        .eq("user_id", user.id)
        .eq("type", "despesa")
        .eq("paid", false)
        .gte("due_date", todayStr)
        .lte("due_date", in3Str);

      if (dueBills && dueBills.length > 0) {
        for (const b of dueBills) {
          const titleStr = `Conta a vencer: ${b.title}`;
          if (existingTitles.has(titleStr)) continue;

          await notify({
            user_id: user.id,
            type: "finance_due",
            title: titleStr,
            message: `Vencimento: ${formatDate(b.due_date)} • R$ ${Number(b.amount).toFixed(2)}`,
            link: "/finances",
          });
          existingTitles.add(titleStr);
        }
      }
    } catch (e) {
      console.warn("ensureDueNotifications finances error:", e);
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

    // Canal estável por usuário (sem Date.now() dinâmico que infla conexões WebSocket)
    const channelName = `notif-${user.id}`;
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

    // Polling inteligente a cada 5 minutos, apenas com aba ativa
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        ensureDueNotifications();
      }
    }, 5 * 60 * 1000);

    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        load();
        ensureDueNotifications();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      supabase.removeChannel(ch);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
