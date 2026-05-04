import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BellRing, Clock, CheckCircle2, Settings2, CreditCard } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Reminder {
  id: string; title: string; description: string | null;
  remind_at: string; completed: boolean; priority: string;
}

interface DueBill {
  id: string; title: string; amount: number; due_date: string;
}

type PopupItem = { kind: "reminder"; data: Reminder } | { kind: "bill"; data: DueBill };

const ADVANCE_OPTIONS = [
  { value: "5", label: "5 minutos" },
  { value: "10", label: "10 minutos" },
  { value: "15", label: "15 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
];
const SNOOZE_OPTIONS = [
  { value: "5", label: "5 min" },
  { value: "10", label: "10 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hora" },
];

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = "sine"; gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.connect(g2); g2.connect(ctx.destination);
        osc2.frequency.value = 1100; osc2.type = "sine"; g2.gain.value = 0.3;
        osc2.start();
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc2.stop(ctx.currentTime + 0.5);
      } catch {}
    }, 300);
  } catch {}
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ReminderPopup() {
  const { user } = useAuth();
  const [popup, setPopup] = useState<PopupItem | null>(null);
  const dismissed = useRef<Map<string, number>>(new Map());
  const [advance, setAdvance] = useState(15);
  const [snooze, setSnooze] = useState(10);
  const [loaded, setLoaded] = useState(false);

  // Load settings from profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("reminder_advance_minutes, reminder_snooze_minutes")
        .eq("id", user.id)
        .single();
      if (data) {
        setAdvance(data.reminder_advance_minutes ?? 15);
        setSnooze(data.reminder_snooze_minutes ?? 10);
      }
      setLoaded(true);
    })();
  }, [user?.id]);

  const updateAdvance = (v: string) => {
    const n = parseInt(v, 10);
    setAdvance(n);
    if (user) supabase.from("profiles").update({ reminder_advance_minutes: n }).eq("id", user.id);
  };
  const updateSnooze = (v: string) => {
    const n = parseInt(v, 10);
    setSnooze(n);
    if (user) supabase.from("profiles").update({ reminder_snooze_minutes: n }).eq("id", user.id);
  };

  const check = useCallback(async () => {
    if (!user || !loaded) return;
    const now = Date.now();
    const soon = new Date(now + advance * 60 * 1000);

    const { data: reminders } = await supabase
      .from("reminders").select("*").eq("user_id", user.id).eq("completed", false)
      .lte("remind_at", soon.toISOString()).order("remind_at", { ascending: true }).limit(5);

    const pendingReminders = ((reminders || []) as Reminder[]).filter((r) => {
      const until = dismissed.current.get("r-" + r.id);
      return !until || now >= until;
    });

    if (pendingReminders.length > 0 && !popup) {
      setPopup({ kind: "reminder", data: pendingReminders[0] });
      playAlertSound();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(`🔔 ${pendingReminders[0].title}`, {
          body: pendingReminders[0].description || new Date(pendingReminders[0].remind_at).toLocaleString("pt-BR"),
        });
      }
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const soonDate = new Date(now + advance * 60 * 1000).toISOString().split("T")[0];
    const { data: bills } = await supabase
      .from("personal_finances").select("id,title,amount,due_date")
      .eq("user_id", user.id).eq("paid", false)
      .not("due_date", "is", null)
      .lte("due_date", soonDate).gte("due_date", today)
      .order("due_date", { ascending: true }).limit(5);

    const pendingBills = ((bills || []) as DueBill[]).filter((b) => {
      const until = dismissed.current.get("b-" + b.id);
      return !until || now >= until;
    });

    if (pendingBills.length > 0 && !popup) {
      setPopup({ kind: "bill", data: pendingBills[0] });
      playAlertSound();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(`💳 Conta vencendo: ${pendingBills[0].title}`, {
          body: `${fmt(Number(pendingBills[0].amount))} — vence ${pendingBills[0].due_date}`,
        });
      }
    }
  }, [user, popup, advance, loaded]);

  useEffect(() => {
    if (!user || !loaded) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [user?.id, loaded, check]);

  const dismiss = () => {
    if (popup) {
      const key = popup.kind === "reminder" ? "r-" + popup.data.id : "b-" + (popup.data as DueBill).id;
      dismissed.current.set(key, Date.now() + snooze * 60 * 1000);
    }
    setPopup(null);
  };

  const markDone = async () => {
    if (!popup) return;
    if (popup.kind === "reminder") {
      await supabase.from("reminders").update({ completed: true }).eq("id", popup.data.id);
    } else {
      await supabase.from("personal_finances").update({ paid: true }).eq("id", popup.data.id);
    }
    const key = popup.kind === "reminder" ? "r-" + popup.data.id : "b-" + popup.data.id;
    dismissed.current.delete(key);
    setPopup(null);
  };

  const isReminder = popup?.kind === "reminder";
  const reminderData = isReminder ? (popup?.data as Reminder) : null;
  const billData = !isReminder ? (popup?.data as DueBill) : null;

  return (
    <>
      {!popup && user && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="fixed bottom-4 right-4 z-40 p-2 rounded-full bg-muted/80 hover:bg-muted shadow-md" title="Configurar alertas">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-64 space-y-4">
            <p className="text-sm font-semibold">Configurações de Alerta</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Antecedência do alerta</Label>
              <Select value={String(advance)} onValueChange={updateAdvance}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{ADVANCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Duração do "Adiar"</Label>
              <Select value={String(snooze)} onValueChange={updateSnooze}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{SNOOZE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground">Salvo automaticamente no seu perfil.</p>
          </PopoverContent>
        </Popover>
      )}

      <Dialog open={!!popup} onOpenChange={(o) => !o && dismiss()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isReminder ? <BellRing className="h-5 w-5 text-warning animate-bounce" /> : <CreditCard className="h-5 w-5 text-purple-500 animate-bounce" />}
              {isReminder ? "Lembrete!" : "Conta Vencendo!"}
            </DialogTitle>
          </DialogHeader>
          {popup && (
            <div className="space-y-3 mt-2">
              <h3 className="font-display font-bold text-lg">{popup.data.title}</h3>
              {isReminder && reminderData?.description && <p className="text-sm text-muted-foreground">{reminderData.description}</p>}
              {isReminder && reminderData?.priority && (
                <Badge variant="outline" className="text-xs">
                  {reminderData.priority === "urgente" ? "🔴 Urgente" : reminderData.priority === "alta" ? "🟠 Alta" : reminderData.priority === "media" ? "🟡 Média" : "⚪ Baixa"}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isReminder
                  ? new Date(reminderData!.remind_at).toLocaleString("pt-BR")
                  : `Vence ${billData!.due_date} — ${fmt(Number(billData!.amount))}`}
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={dismiss} className="flex-1">Adiar {snooze} min</Button>
                <Button onClick={markDone} className="flex-1 bg-gradient-primary text-primary-foreground">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> {isReminder ? "Concluir" : "Pagar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
