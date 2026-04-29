import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { CheckSquare, FolderKanban, Clock, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { isOverdue, priorityColor, priorityLabel, formatDate } from "@/lib/exacta";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const { profile, user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [t, p] = await Promise.all([
        supabase.from("tasks").select("*").order("due_date", { ascending: true, nullsFirst: false }).limit(50),
        supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      if (t.data) setTasks(t.data);
      if (p.data) setProjects(p.data);
    })();
  }, []);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const myTasks = tasks.filter((t) => t.assignee_id === user?.id && t.status !== "done").slice(0, 5);
  const productivity = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <header>
        <p className="text-sm text-accent font-medium uppercase tracking-wider">Visão geral</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">
          Olá, {profile?.full_name?.split(" ")[0] || "colaborador"} 👋
        </h1>
        <p className="text-muted-foreground mt-2">Aqui está o pulso da sua operação hoje.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="Tarefas totais" value={total} accent="primary" />
        <StatCard icon={TrendingUp} label="Concluídas" value={done} accent="success" />
        <StatCard icon={Clock} label="Em andamento" value={tasks.filter((t) => t.status !== "done").length} accent="accent" />
        <StatCard icon={AlertTriangle} label="Atrasadas" value={overdue} accent="destructive" />
      </div>

      {/* Productivity */}
      <Card className="p-6 bg-gradient-hero text-white border-0 shadow-elegant overflow-hidden relative">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-accent">Produtividade da equipe</p>
            <h2 className="font-display text-4xl font-bold mt-1">{productivity}%</h2>
            <p className="text-sm text-white/70 mt-1">{done} de {total} tarefas concluídas</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gradient-accent transition-all duration-1000" style={{ width: `${productivity}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My tasks */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold">Minhas tarefas</h3>
            <Link to="/tasks" className="text-xs text-accent hover:underline">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {myTasks.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma tarefa atribuída a você. ✨</p>
            )}
            {myTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: priorityColor(t.priority) }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{priorityLabel(t.priority)} • {formatDate(t.due_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Projects */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold">Projetos ativos</h3>
            <Link to="/projects" className="text-xs text-accent hover:underline">Ver todos →</Link>
          </div>
          <div className="space-y-3">
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum projeto ainda. Crie o primeiro!</p>
            )}
            {projects.slice(0, 5).map((p) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                    <span className="font-medium truncate">{p.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-accent" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
  const colors: Record<string, string> = {
    primary: "from-primary/10 to-primary/5 text-primary",
    success: "from-success/10 to-success/5 text-success",
    accent: "from-accent/15 to-accent/5 text-accent",
    destructive: "from-destructive/10 to-destructive/5 text-destructive",
  };
  return (
    <Card className="p-5 shadow-card border-0 bg-card relative overflow-hidden">
      <div className={`absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br ${colors[accent]} blur-2xl opacity-50`} />
      <div className="relative">
        <Icon className={`h-5 w-5 ${colors[accent].split(" ").pop()}`} />
        <p className="text-2xl lg:text-3xl font-display font-bold mt-3">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </Card>
  );
}
