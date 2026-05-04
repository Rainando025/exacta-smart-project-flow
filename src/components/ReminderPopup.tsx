import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BellRing, Clock, CheckCircle2, Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface Reminder {
  id: string; title: string; description: string | null;
  remind_at: string; completed: boolean;
}

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

function getStoredAdvance(): number {
  try { return parseInt(localStorage.getItem("reminder-advance") || "15", 10); } catch { return 15; }
}
function getStoredSnooze(): number {
  try { return parseInt(localStorage.getItem("reminder-snooze") || "10", 10); } catch { return 10; }
}

export function ReminderPopup() {
  const { user } = useAuth();
  const [popup, setPopup] = useState<Reminder | null>(null);
  const dismissed = useRef<Map<string, number>>(new Map()); // id -> dismiss until timestamp
  const [advance, setAdvance] = useState(getStoredAdvance);
  const [snooze, setSnooze] = useState(getStoredSnooze);

  const updateAdvance = (v: string) => {
    const n = parseInt(v, 10);
    setAdvance(n);
    localStorage.setItem("reminder-advance", v);
  };
  const updateSnooze = (v: string) => {
    const n = parseInt(v, 10);
    setSnooze(n);
    localStorage.setItem("reminder-snooze", v);
  };

  const check = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    const soon = new Date(now + advance * 60 * 1000);

    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .lte("remind_at", soon.toISOString())
      .order("remind_at", { ascending: true })
      .limit(5);

    if (!data) return;
    const pending = (data as Reminder[]).filter((r) => {
      const until = dismissed.current.get(r.id);
      return !until || now >= until;
    });
    if (pending.length > 0 && !popup) {
      setPopup(pending[0]);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(`🔔 ${pending[0].title}`, {
          body: pending[0].description || new Date(pending[0].remind_at).toLocaleString("pt-BR"),
        });
      }
    }
  }, [user, popup, advance]);

  useEffect(() => {
    if (!user) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [user?.id, check]);

  const dismiss = () => {
    if (popup) {
      dismissed.current.set(popup.id, Date.now() + snooze * 60 * 1000);
    }
    setPopup(null);
  };

  const markDone = async () => {
    if (!popup) return;
    await supabase.from("reminders").update({ completed: true }).eq("id", popup.id);
    dismissed.current.delete(popup.id);
    setPopup(null);
  };

  return (
    <>
      {/* Settings gear – fixed bottom-right, only visible when no popup */}
      {!popup && user && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="fixed bottom-4 right-4 z-40 p-2 rounded-full bg-muted/80 hover:bg-muted shadow-md" title="Configurar lembretes">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-64 space-y-4">
            <p className="text-sm font-semibold">Configurações de Lembrete</p>
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
          </PopoverContent>
        </Popover>
      )}

      <Dialog open={!!popup} onOpenChange={(o) => !o && dismiss()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-warning animate-bounce" />
              Lembrete!
            </DialogTitle>
          </DialogHeader>
          {popup && (
            <div className="space-y-3 mt-2">
              <h3 className="font-display font-bold text-lg">{popup.title}</h3>
              {popup.description && <p className="text-sm text-muted-foreground">{popup.description}</p>}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(popup.remind_at).toLocaleString("pt-BR")}
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={dismiss} className="flex-1">
                  Adiar {snooze} min
                </Button>
                <Button onClick={markDone} className="flex-1 bg-gradient-primary text-primary-foreground">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Concluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
