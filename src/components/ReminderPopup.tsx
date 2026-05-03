import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BellRing, Clock, CheckCircle2 } from "lucide-react";

interface Reminder {
  id: string; title: string; description: string | null;
  remind_at: string; completed: boolean;
}

export function ReminderPopup() {
  const { user } = useAuth();
  const [popup, setPopup] = useState<Reminder | null>(null);
  const dismissed = useRef<Set<string>>(new Set());

  const check = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const soon = new Date(now.getTime() + 15 * 60 * 1000); // 15 min ahead

    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .lte("remind_at", soon.toISOString())
      .order("remind_at", { ascending: true })
      .limit(5);

    if (!data) return;
    const pending = (data as Reminder[]).filter((r) => !dismissed.current.has(r.id));
    if (pending.length > 0 && !popup) {
      setPopup(pending[0]);
      // Try browser notification too
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(`🔔 ${pending[0].title}`, {
          body: pending[0].description || new Date(pending[0].remind_at).toLocaleString("pt-BR"),
        });
      }
    }
  }, [user, popup]);

  useEffect(() => {
    if (!user) return;
    // Request notification permission
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    check();
    const interval = setInterval(check, 60_000); // every 1 min
    return () => clearInterval(interval);
  }, [user?.id, check]);

  const dismiss = () => {
    if (popup) dismissed.current.add(popup.id);
    setPopup(null);
  };

  const markDone = async () => {
    if (!popup) return;
    await supabase.from("reminders").update({ completed: true }).eq("id", popup.id);
    dismissed.current.add(popup.id);
    setPopup(null);
  };

  if (!popup) return null;

  return (
    <Dialog open={!!popup} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-warning animate-bounce" />
            Lembrete!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <h3 className="font-display font-bold text-lg">{popup.title}</h3>
          {popup.description && <p className="text-sm text-muted-foreground">{popup.description}</p>}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(popup.remind_at).toLocaleString("pt-BR")}
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={dismiss} className="flex-1">Adiar</Button>
            <Button onClick={markDone} className="flex-1 bg-gradient-primary text-primary-foreground">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Concluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
