import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BellRing,
  Clock,
  CheckCircle2,
  Settings2,
  CreditCard,
  AlertTriangle,
  Calendar,
  X,
  Volume2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { parseFinanceNotes, buildFinanceNotes } from "@/lib/finances-helpers";
import { formatDate } from "@/lib/exacta";
import { toast } from "sonner";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  remind_at: string;
  completed: boolean;
  priority: string;
}

interface DueBill {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  type?: string;
  notes?: string | null;
}

type PopupItem = { kind: "reminder"; data: Reminder } | { kind: "bill"; data: DueBill };

const ADVANCE_OPTIONS = [
  { value: "1", label: "1 dia antes" },
  { value: "2", label: "2 dias antes" },
  { value: "3", label: "3 dias antes" },
  { value: "5", label: "5 dias antes" },
  { value: "7", label: "1 semana antes" },
];

const SNOOZE_OPTIONS = [
  { value: "10", label: "10 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "240", label: "4 horas" },
  { value: "1440", label: "Amanhã (24h)" },
];

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.connect(g2);
        g2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        osc2.type = "sine";
        g2.gain.value = 0.3;
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
  const [advanceDays, setAdvanceDays] = useState(3); // dias de antecedência para contas
  const [snoozeMinutes, setSnoozeMinutes] = useState(60);
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
        if (data.reminder_advance_minutes) {
          // Converte minutos para dias se for grande, ou default para 3 dias
          setAdvanceDays(Math.max(1, Math.round(data.reminder_advance_minutes / 1440) || 3));
        }
        if (data.reminder_snooze_minutes) {
          setSnoozeMinutes(data.reminder_snooze_minutes);
        }
      }
      setLoaded(true);
    })();
  }, [user?.id]);

  const updateAdvance = (v: string) => {
    const days = parseInt(v, 10);
    setAdvanceDays(days);
    if (user) {
      supabase
        .from("profiles")
        .update({ reminder_advance_minutes: days * 1440 })
        .eq("id", user.id);
    }
  };

  const updateSnooze = (v: string) => {
    const n = parseInt(v, 10);
    setSnoozeMinutes(n);
    if (user) {
      supabase.from("profiles").update({ reminder_snooze_minutes: n }).eq("id", user.id);
    }
  };

  const check = useCallback(async () => {
    if (!user || !loaded) return;
    const now = Date.now();

    // 1. Checa Lembretes pontuais (reminders)
    const soonRemind = new Date(now + 15 * 60 * 1000);
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .lte("remind_at", soonRemind.toISOString())
      .order("remind_at", { ascending: true })
      .limit(5);

    const pendingReminders = ((reminders || []) as Reminder[]).filter((r) => {
      const until = dismissed.current.get("r-" + r.id);
      return !until || now >= until;
    });

    if (pendingReminders.length > 0 && !popup) {
      setPopup({ kind: "reminder", data: pendingReminders[0] });
      playAlertSound();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(`🔔 Lembrete: ${pendingReminders[0].title}`, {
          body:
            pendingReminders[0].description ||
            new Date(pendingReminders[0].remind_at).toLocaleString("pt-BR"),
        });
      }
      return;
    }

    // 2. Checa Contas / Finanças Vencendo ou Já Vencidas!
    // Limite máximo: data de hoje + advanceDays (ex: 3 dias)
    const futureDate = new Date(now + advanceDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: bills } = await supabase
      .from("personal_finances")
      .select("id, title, amount, due_date, type, notes")
      .eq("user_id", user.id)
      .eq("paid", false)
      .not("due_date", "is", null)
      .lte("due_date", futureDate)
      .order("due_date", { ascending: true })
      .limit(10);

    const pendingBills = ((bills || []) as DueBill[]).filter((b) => {
      const until = dismissed.current.get("b-" + b.id);
      return !until || now >= until;
    });

    if (pendingBills.length > 0 && !popup) {
      setPopup({ kind: "bill", data: pendingBills[0] });
      playAlertSound();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const isPast = pendingBills[0].due_date < new Date().toISOString().split("T")[0];
        new Notification(
          isPast
            ? `⚠️ CONTA VENCIDA: ${pendingBills[0].title}`
            : `💳 Conta vencendo: ${pendingBills[0].title}`,
          {
            body: `${fmt(Number(pendingBills[0].amount))} — Vencimento: ${formatDate(
              pendingBills[0].due_date
            )}`,
          }
        );
      }
    }
  }, [user, popup, advanceDays, loaded]);

  useEffect(() => {
    if (!user || !loaded) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    check();
    const interval = setInterval(check, 45_000);
    return () => clearInterval(interval);
  }, [user?.id, loaded, check]);

  const dismiss = () => {
    if (popup) {
      const key =
        popup.kind === "reminder" ? "r-" + popup.data.id : "b-" + (popup.data as DueBill).id;
      dismissed.current.set(key, Date.now() + snoozeMinutes * 60 * 1000);
    }
    setPopup(null);
  };

  const markDone = async () => {
    if (!popup || !user) return;
    if (popup.kind === "reminder") {
      await supabase.from("reminders").update({ completed: true }).eq("id", popup.data.id);
    } else {
      const bill = popup.data as DueBill;
      const today = new Date().toISOString().split("T")[0];
      const parsed = parseFinanceNotes(bill.notes);
      const updatedNotes = buildFinanceNotes(parsed.cleanNotes, parsed.cardName, today);

      await supabase
        .from("personal_finances")
        .update({
          paid: true,
          notes: updatedNotes,
        })
        .eq("id", bill.id)
        .eq("user_id", user.id);

      toast.success(
        bill.type === "receita"
          ? "Receita marcada como RECEBIDA!"
          : "Conta marcada como PAGA com sucesso!",
        { description: `Data de quitação captada: ${formatDate(today)}` }
      );
    }

    const key =
      popup.kind === "reminder" ? "r-" + popup.data.id : "b-" + (popup.data as DueBill).id;
    dismissed.current.delete(key);
    setPopup(null);
  };

  const isReminder = popup?.kind === "reminder";
  const reminderData = isReminder ? (popup?.data as Reminder) : null;
  const billData = !isReminder ? (popup?.data as DueBill) : null;

  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = billData ? billData.due_date < todayStr : false;
  const isDueToday = billData ? billData.due_date === todayStr : false;

  return (
    <>
      {!popup && user && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="fixed bottom-4 right-4 z-40 p-2.5 rounded-full bg-card hover:bg-muted border border-border shadow-lg transition text-muted-foreground hover:text-foreground"
              title="Configurar Alertas de Vencimento"
            >
              <Settings2 className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-72 space-y-4 p-4">
            <div className="flex items-center gap-2">
              <BellRing className="size-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Alertas de Vencimento</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Avisar com antecedência de:</Label>
              <Select value={String(advanceDays)} onValueChange={updateAdvance}>
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADVANCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ao adiar, reavisar em:</Label>
              <Select value={String(snoozeMinutes)} onValueChange={updateSnooze}>
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SNOOZE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground">
              O pop-up tocará um alerta sonoro e exibirá as contas vencidas e a vencer automaticamente na tela.
            </p>
          </PopoverContent>
        </Popover>
      )}

      {/* Pop-up Modal na Tela */}
      <Dialog open={!!popup} onOpenChange={(o) => !o && dismiss()}>
        <DialogContent className="max-w-md border-2 border-border/80 shadow-2xl p-6 bg-background">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                {isReminder ? (
                  <BellRing className="size-5 text-warning animate-bounce" />
                ) : isOverdue ? (
                  <AlertTriangle className="size-5 text-destructive animate-pulse" />
                ) : (
                  <CreditCard className="size-5 text-amber-500 animate-bounce" />
                )}
                {isReminder
                  ? "Lembrete Agendado"
                  : isOverdue
                  ? "Conta Vencida!"
                  : isDueToday
                  ? "Conta Vencendo Hoje!"
                  : "Alerta de Vencimento Próximo"}
              </DialogTitle>

              {billData && (
                <Badge
                  variant={isOverdue ? "destructive" : isDueToday ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {isOverdue ? "VENCIDO" : isDueToday ? "HOJE" : "EM BREVE"}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {popup && (
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-lg text-foreground leading-tight">
                    {popup.data.title}
                  </h3>
                  {billData && (
                    <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 shrink-0">
                      {fmt(Number(billData.amount))}
                    </span>
                  )}
                </div>

                {isReminder && reminderData?.description && (
                  <p className="text-xs text-muted-foreground">{reminderData.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="size-3.5 text-primary" />
                    <span>
                      {isReminder
                        ? new Date(reminderData!.remind_at).toLocaleString("pt-BR")
                        : `Vencimento: ${formatDate(billData!.due_date)}`}
                    </span>
                  </div>

                  {billData?.notes && parseFinanceNotes(billData.notes).cardName && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-medium text-[11px] flex items-center gap-1">
                      <CreditCard className="size-3" /> Cartão {parseFinanceNotes(billData.notes).cardName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Button
                  variant="outline"
                  onClick={dismiss}
                  className="flex-1 text-xs gap-1.5 h-9"
                >
                  <Clock className="size-3.5 text-muted-foreground" /> Adiar ({snoozeMinutes < 60 ? `${snoozeMinutes} min` : `${snoozeMinutes / 60}h`})
                </Button>

                <Button
                  onClick={markDone}
                  className="flex-1 text-xs gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                >
                  <CheckCircle2 className="size-4" />
                  {isReminder ? "Concluir" : "Pagar Agora"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
