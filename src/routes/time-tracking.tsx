import { createFileRoute } from "@tanstack/react-router";
import {
  Timer, Play, Pause, Square, History, TrendingUp, Calendar,
  Plus, Users, Clock, CheckCircle2, Loader2, Trash2, RefreshCw,
  ChevronDown, FileText, Activity
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
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState, useCallback } from "react";
import { format, differenceInSeconds, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

function TimeTrackingPage() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [teamLogs, setTeamLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "gestor" | "colaborador">("colaborador");
  const [teamMemberElapsed, setTeamMemberElapsed] = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const teamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [view, setView] = useState<"my" | "team">("my");

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

  // Load all team logs (admin/gestor only)
  const loadTeamLogs = useCallback(async () => {
    if (!user) return;
    const { data: logsData } = await supabase
      .from("time_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!logsData) return;

    // Get unique user IDs
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

  // Check for existing active timer on load
  useEffect(() => {
    if (!user) return;
    const loadInitial = async () => {
      setLoading(true);
      // Check for an open (no end_time) timer
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

  // Load team logs for admin/gestor
  useEffect(() => {
    if (userRole === "admin" || userRole === "gestor") {
      loadTeamLogs();
    }
  }, [userRole, loadTeamLogs]);

  // Personal timer tick
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setElapsed(differenceInSeconds(new Date(), activeTimer.startTime));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTimer]);

  // Team timers — tick every second for active members
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
    const { data, error } = await supabase
      .from("time_logs")
      .insert({ user_id: user.id, start_time: now, description: newDescription.trim() })
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

  const handleResumeLog = async (log: TimeLog) => {
    if (!user) return;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("time_logs")
      .insert({ user_id: user.id, start_time: now, description: log.description })
      .select()
      .single();
    if (!error && data) {
      setActiveTimer({ logId: data.id, startTime: new Date(data.start_time) });
      setElapsed(0);
      await loadMyLogs();
    }
  };

  // Stats
  const todayLogs = logs.filter(l => {
    if (!l.end_time) return false;
    return l.start_time.startsWith(new Date().toISOString().slice(0, 10));
  });
  const todaySeconds = todayLogs.reduce((acc, l) => acc + parseDurationToSeconds(l.duration), 0) + (activeTimer ? elapsed : 0);
  const DAILY_GOAL = 8 * 3600;

  // Active team members
  const activeTeamLogs = teamLogs.filter(l => !l.end_time);

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Timer className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Rastreamento de Tempo</h1>
          </div>
          <p className="text-muted-foreground">Monitore sua produtividade e o tempo gasto em cada tarefa.</p>
        </div>
        <div className="flex gap-2">
          {(userRole === "admin" || userRole === "gestor") && (
            <div className="flex bg-card/40 border border-white/5 rounded-lg overflow-hidden">
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === "my" ? "bg-accent text-accent-foreground" : "hover:bg-white/5"}`}
                onClick={() => setView("my")}
              >
                <Clock className="h-4 w-4 inline mr-1" />Meu Tempo
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === "team" ? "bg-accent text-accent-foreground" : "hover:bg-white/5"}`}
                onClick={() => { setView("team"); loadTeamLogs(); }}
              >
                <Users className="h-4 w-4 inline mr-1" />Equipe
              </button>
            </div>
          )}
          <Button
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
            onClick={() => setShowStartDialog(true)}
            disabled={!!activeTimer}
          >
            <Plus className="mr-2 h-4 w-4" /> Iniciar Registro
          </Button>
        </div>
      </div>

      {/* Active Timer Card */}
      <Card className="bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/5 border-emerald-500/20 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left flex-1">
              {activeTimer ? (
                <>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Cronômetro Ativo
                  </span>
                  <h2 className="text-2xl font-bold">{logs.find(l => l.id === activeTimer.logId)?.description || "Sessão em andamento"}</h2>
                  <p className="text-sm text-muted-foreground">Iniciado às {format(activeTimer.startTime, "HH:mm", { locale: ptBR })}</p>
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
              <div className="flex gap-3">
                <Button
                  size="lg" variant="outline"
                  className="rounded-full h-12 w-12 p-0 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                  disabled={!activeTimer}
                  onClick={handlePause}
                  title="Pausar"
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
                <Button
                  size="lg" variant="outline"
                  className="rounded-full h-12 w-12 p-0 border-red-500/30 text-red-500 hover:bg-red-500/10"
                  disabled={!activeTimer}
                  onClick={handleStop}
                  title="Parar e salvar"
                >
                  <Square className="h-5 w-5 fill-current" />
                </Button>
              </div>
            </div>

            <div className="hidden lg:block w-52 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Meta Diária</span>
                  <span className="font-bold">{formatDisplayDuration(formatDuration(Math.min(todaySeconds, DAILY_GOAL)))} / 8h</span>
                </div>
                <Progress value={(todaySeconds / DAILY_GOAL) * 100} className="h-1.5" />
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
                <TrendingUp className="h-4 w-4" />
                <span>{todayLogs.length} registros hoje</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 border-white/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hoje</CardTitle>
            <Clock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDisplayDuration(formatDuration(todaySeconds))}</div>
            <p className="text-[10px] text-muted-foreground mt-1">{todayLogs.length} registro(s) finalizados</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-white/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Registros</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.filter(l => l.end_time).length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Histórico completo</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-white/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {(userRole === "admin" || userRole === "gestor") ? "Membros Ativos Agora" : "Meta Diária"}
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(userRole === "admin" || userRole === "gestor")
                ? activeTeamLogs.length
                : `${Math.round((todaySeconds / DAILY_GOAL) * 100)}%`}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {(userRole === "admin" || userRole === "gestor") ? "com cronômetro rodando" : "da meta diária de 8h"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team View (admin/gestor) */}
      {view === "team" && (userRole === "admin" || userRole === "gestor") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Atividade da Equipe
            </h2>
            <Button variant="ghost" size="sm" onClick={loadTeamLogs}>
              <RefreshCw className="h-4 w-4 mr-1" />Atualizar
            </Button>
          </div>

          {/* Active now */}
          {activeTeamLogs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-500 px-1">Rodando agora</p>
              {activeTeamLogs.map(log => (
                <div key={log.id} className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{log.profile?.full_name || log.user_id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground truncate">{log.description || "Sem descrição"}</p>
                  </div>
                  <div className="font-mono font-bold text-emerald-400 text-lg tabular-nums flex-shrink-0">
                    {formatDuration(teamMemberElapsed[log.id] || 0)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent team logs */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Registros Recentes da Equipe</p>
            <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              {teamLogs.filter(l => l.end_time).slice(0, 20).map(log => (
                <div key={log.id} className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0 text-sm font-bold">
                    {(log.profile?.full_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{log.description || "Sem descrição"}</p>
                    <p className="text-xs text-muted-foreground">{log.profile?.full_name || "Membro"} · {format(parseISO(log.start_time), "dd/MM HH:mm", { locale: ptBR })}</p>
                  </div>
                  <Badge variant="outline" className="font-mono flex-shrink-0">{formatDisplayDuration(log.duration)}</Badge>
                </div>
              ))}
              {teamLogs.filter(l => l.end_time).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum registro da equipe encontrado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Logs */}
      {view === "my" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Meus Registros</h2>
            <Button variant="ghost" size="sm" onClick={loadMyLogs}>
              <RefreshCw className="h-4 w-4 mr-1" />Atualizar
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              {logs.filter(l => l.end_time).length === 0 && !activeTimer ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Timer className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhum registro ainda. Inicie um cronômetro!</p>
                </div>
              ) : (
                <div className="grid gap-px">
                  {logs.filter(l => l.end_time).map(log => (
                    <div key={log.id} className="bg-card/50 p-4 flex items-center justify-between hover:bg-card transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{log.description || "Sem descrição"}</h4>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(log.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            {log.end_time && ` → ${format(parseISO(log.end_time), "HH:mm")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-sm">{formatDisplayDuration(log.duration)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 rounded-full text-emerald-500"
                            onClick={() => handleResumeLog(log)}
                            title="Retomar"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive"
                            onClick={() => handleDeleteLog(log.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Start Timer Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-emerald-500" />
              Iniciar Cronômetro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="time-desc">Descrição da atividade</Label>
              <Input
                id="time-desc"
                placeholder="Ex: Reunião de alinhamento, Desenvolvimento de feature..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleStart()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleStart}
              disabled={!newDescription.trim() || saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
