import { createFileRoute } from "@tanstack/react-router";
import {
  Timer, Play, Pause, Square, History, TrendingUp, Calendar,
  Plus, Users, Clock, CheckCircle2, Loader2, Trash2, RefreshCw,
  ChevronDown, FileText, Activity, Volume2, Bell, Sparkles, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState, useCallback } from "react";
import { format, differenceInSeconds, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/time-tracking")({
  component: () => <AppShell><TimeTrackingPage /></AppShell>,
});

interface TimeLog {
  id: string;
  user_id: string;
  task_id: string | null;
  start_time: string;
  end_time: string | null;
  duration: string | null;
  description: string | null;
  created_at: string;
  profile?: { full_name: string };
}

interface ActiveTimer {
  logId: string;
  startTime: Date;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseDurationToSeconds(dur: string | null): number {
  if (!dur) return 0;
  const [h, m, s] = dur.split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

function formatDisplayDuration(dur: string | null): string {
  if (!dur) return "—";
  const parts = dur.split(":");
  if (parts.length === 3) {
    const [h, m, s] = parts;
    if (Number(h) > 0) return `${h}h ${m}m`;
    if (Number(m) > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
  return dur;
}

// ─── AUDIO CHIME SOUND & BROWSER NOTIFICATION HELPER ───────────────────────
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First Tone (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second Tone (D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, now + 0.18);
    gain2.gain.setValueAtTime(0.35, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.7);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function triggerTimerNotification(title: string, body: string) {
  playNotificationSound();
  toast.success(title + ": " + body);

  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification(title, { body });
        }
      });
    }
  }
}

function TimeTrackingPage() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [teamLogs, setTeamLogs] = useState<TimeLog[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("none");
  const [targetLimitMinutes, setTargetLimitMinutes] = useState<number>(25); // Default 25 min Pomodoro
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "gestor" | "colaborador">("colaborador");
  const [teamMemberElapsed, setTeamMemberElapsed] = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const teamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [view, setView] = useState<"my" | "team">("my");
  const hasTriggeredTargetRef = useRef(false);

  // Request browser notification permission on load
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Load user role
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role) setUserRole(data.role as any);
      });

    supabase.from("tasks").select("id, title").eq("assignee_id", user.id).then(({ data }) => {
      if (data) setTasks(data);
    });
  }, [user]);

  // Load personal time logs
  const loadMyLogs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("time_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs(data || []);
  }, [user]);

  // Load team logs
  const loadTeamLogs = useCallback(async () => {
    if (!user) return;
    const { data: logsData } = await supabase
      .from("time_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!logsData) return;

    const userIds = [...new Set(logsData.map(l => l.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const profileMap: Record<string, { full_name: string }> = {};
    (profilesData || []).forEach(p => { profileMap[p.id] = { full_name: p.full_name }; });

    const enriched = logsData.map(l => ({ ...l, profile: profileMap[l.user_id] }));
    setTeamLogs(enriched);
  }, [user]);

  // Check for open active timer on load
  useEffect(() => {
    if (!user) return;
    const loadInitial = async () => {
      setLoading(true);
      const { data: active } = await supabase
        .from("time_logs")
        .select("*")
        .eq("user_id", user.id)
        .is("end_time", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (active) {
        const start = parseISO(active.start_time);
        setActiveTimer({ logId: active.id, startTime: start });
        setElapsed(differenceInSeconds(new Date(), start));
      }

      await loadMyLogs();
      setLoading(false);
    };
    loadInitial();
  }, [user, loadMyLogs]);

  useEffect(() => {
    if (userRole === "admin" || userRole === "gestor") {
      loadTeamLogs();
    }
  }, [userRole, loadTeamLogs]);

  // Personal timer tick with alert sound check when target limit reached
  useEffect(() => {
    if (activeTimer) {
      hasTriggeredTargetRef.current = false;
      timerRef.current = setInterval(() => {
        const newSecs = differenceInSeconds(new Date(), activeTimer.startTime);
        setElapsed(newSecs);

        // Check if target Pomodoro limit reached
        if (
          targetLimitMinutes > 0 &&
          newSecs >= targetLimitMinutes * 60 &&
          !hasTriggeredTargetRef.current
        ) {
          hasTriggeredTargetRef.current = true;
          if (soundEnabled) {
            triggerTimerNotification(
              "🔔 Tempo Alvo Atingido!",
              `Sua meta de ${targetLimitMinutes} minutos foi alcançada.`
            );
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTimer, targetLimitMinutes, soundEnabled]);

  // Team timers
  useEffect(() => {
    const activeTeamLogs = teamLogs.filter(l => !l.end_time);
    if (activeTeamLogs.length === 0) return;

    const tick = () => {
      const map: Record<string, number> = {};
      activeTeamLogs.forEach(l => {
        map[l.id] = differenceInSeconds(new Date(), parseISO(l.start_time));
      });
      setTeamMemberElapsed(map);
    };
    tick();
    teamTimerRef.current = setInterval(tick, 1000);
    return () => { if (teamTimerRef.current) clearInterval(teamTimerRef.current); };
  }, [teamLogs]);

  const handleStart = async () => {
    if (!user || !newDescription.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const payload: any = {
      user_id: user.id,
      start_time: now,
      description: newDescription.trim(),
    };
    if (selectedTaskId !== "none") payload.task_id = selectedTaskId;

    const { data, error } = await supabase
      .from("time_logs")
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      setActiveTimer({ logId: data.id, startTime: new Date(data.start_time) });
      setElapsed(0);
      setShowStartDialog(false);
      setNewDescription("");
      await loadMyLogs();
    }
    setSaving(false);
  };

  const handlePause = async () => {
    if (!activeTimer) return;
    const now = new Date();
    const durSecs = differenceInSeconds(now, activeTimer.startTime);
    const duration = formatDuration(durSecs);
    await supabase
      .from("time_logs")
      .update({ end_time: now.toISOString(), duration })
      .eq("id", activeTimer.logId);

    if (soundEnabled) {
      triggerTimerNotification(
        "⏱️ Cronômetro Finalizado",
        `Sessão de ${formatDisplayDuration(duration)} registrada com sucesso.`
      );
    }

    setActiveTimer(null);
    setElapsed(0);
    await loadMyLogs();
  };

  const handleStop = async () => {
    await handlePause();
  };

  const handleDeleteLog = async (id: string) => {
    await supabase.from("time_logs").delete().eq("id", id);
    await loadMyLogs();
  };

  // Stats
  const todayLogs = logs.filter(l => {
    if (!l.end_time) return false;
    return l.start_time.startsWith(new Date().toISOString().slice(0, 10));
  });
  const todaySeconds = todayLogs.reduce((acc, l) => acc + parseDurationToSeconds(l.duration), 0) + (activeTimer ? elapsed : 0);
  const DAILY_GOAL = 8 * 3600;

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Timer className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Rastreamento de Tempo</h1>
          </div>
          <p className="text-muted-foreground text-sm">Monitore sua produtividade, cronômetro Pomodoro e alerta sonoro.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playNotificationSound();
            }}
            className={cn("gap-1.5 text-xs font-semibold", soundEnabled ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "text-muted-foreground")}
          >
            <Volume2 className="h-4 w-4" />
            {soundEnabled ? "Som Ativado" : "Som Desativado"}
          </Button>

          {(userRole === "admin" || userRole === "gestor") && (
            <div className="flex bg-card/40 border border-white/5 rounded-lg overflow-hidden">
              <button
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === "my" ? "bg-accent text-accent-foreground" : "hover:bg-white/5"}`}
                onClick={() => setView("my")}
              >
                <Clock className="h-3.5 w-3.5 inline mr-1" />Meu Tempo
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === "team" ? "bg-accent text-accent-foreground" : "hover:bg-white/5"}`}
                onClick={() => { setView("team"); loadTeamLogs(); }}
              >
                <Users className="h-3.5 w-3.5 inline mr-1" />Equipe
              </button>
            </div>
          )}
          <Button
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg font-bold"
            onClick={() => setShowStartDialog(true)}
            disabled={!!activeTimer}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Iniciar Registro
          </Button>
        </div>
      </div>

      {/* Target Duration / Pomodoro Selector */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-card/60 border border-white/10 shadow-xs">
        <Sparkles className="h-4 w-4 text-emerald-500 ml-1" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta / Pomodoro:</span>
        <div className="flex items-center gap-1.5">
          {[
            { min: 0, label: "Livre" },
            { min: 25, label: "25 min (Pomodoro)" },
            { min: 45, label: "45 min" },
            { min: 60, label: "60 min (1h)" },
          ].map((item) => (
            <button
              key={item.min}
              onClick={() => setTargetLimitMinutes(item.min)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                targetLimitMinutes === item.min
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Timer Card */}
      <Card className="bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/5 border-emerald-500/20 overflow-hidden shadow-card">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left flex-1">
              {activeTimer ? (
                <>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cronômetro Ativo
                    {targetLimitMinutes > 0 && (
                      <span className="ml-2 text-muted-foreground normal-case font-normal">
                        (Meta: {targetLimitMinutes} min)
                      </span>
                    )}
                  </span>
                  <h2 className="text-2xl font-bold">{logs.find(l => l.id === activeTimer.logId)?.description || "Sessão em andamento"}</h2>
                  <p className="text-xs text-muted-foreground">Iniciado às {format(activeTimer.startTime, "HH:mm:ss", { locale: ptBR })}</p>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nenhum Cronômetro Ativo</span>
                  <h2 className="text-xl font-semibold text-muted-foreground">Clique em "Iniciar Registro" para começar</h2>
                </>
              )}
            </div>

            <div className="flex flex-col items-center">
              <div className={`text-6xl font-mono font-bold tracking-tighter mb-4 tabular-nums transition-colors ${activeTimer ? "text-emerald-400" : "text-muted-foreground/40"}`}>
                {formatDuration(elapsed)}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="lg" variant="outline"
                  className="rounded-full h-12 w-12 p-0 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                  disabled={!activeTimer}
                  onClick={handlePause}
                  title="Pausar / Finalizar com Alerta Sonoro"
                >
                  <Pause className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  className={`rounded-full h-14 w-14 p-0 text-white shadow-lg ${activeTimer ? "bg-emerald-500 hover:bg-emerald-600" : "bg-emerald-500/30 cursor-not-allowed"}`}
                  onClick={() => !activeTimer && setShowStartDialog(true)}
                  disabled={!!activeTimer}
                  title="Iniciar"
                >
                  <Play className="h-6 w-6 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Timer Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Timer className="h-5 w-5 text-emerald-500" />
              Iniciar Registro de Tempo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">O que você vai realizar? *</Label>
              <Input
                placeholder="Ex: Desenvolvimento da interface do Kanban"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                autoFocus
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Vincular a uma Tarefa (opcional)</Label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger><SelectValue placeholder="Selecione uma tarefa..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma tarefa</SelectItem>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>Cancelar</Button>
            <Button onClick={handleStart} disabled={saving || !newDescription.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
              {saving ? "Iniciando..." : "Começar Cronômetro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
