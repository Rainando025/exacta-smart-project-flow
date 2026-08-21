import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, FolderKanban, Clock, AlertTriangle, TrendingUp, Sparkles, FileDown, FileSpreadsheet, Filter } from "lucide-react";
import { addBrandedHeader, addBrandedFooter } from "@/lib/pdf";
import { isOverdue, priorityColor, priorityLabel, formatDate } from "@/lib/exacta";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { toCSV, downloadCSV } from "@/lib/csv";
import { AIChat } from "@/components/AIChat";
import { CalendarWidget } from "@/components/CalendarWidget";
import { BottleneckAnalysis } from "@/components/BottleneckAnalysis";

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

const STATUS_OPTIONS = [
  { value: "todo", label: "A fazer" },
  { value: "doing", label: "Em andamento" },
  { value: "review", label: "Revisão" },
  { value: "done", label: "Concluído" },
];

function startOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Dashboard() {
  const { profile, user } = useAuth();
  const { isGestor } = useRole();
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});

  // Filters
  const [from, setFrom] = useState<string>(startOfMonthISO());
  const [to, setTo] = useState<string>(todayISO());
  const [memberFilter, setMemberFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("exacta-onboarding-seen");
    if (!hasSeenOnboarding) {
      toast.info("Bem-vindo à EXACTA!", {
        description: "Explore o seu novo dashboard inteligente. Use Ctrl+K para comandos rápidos.",
        duration: 10000,
      });
      localStorage.setItem("exacta-onboarding-seen", "true");
    }
  }, []);

  useEffect(() => {
    (async () => {
      const mode = localStorage.getItem("exacta-mode") || "team";
      const isPersonal = mode === "personal";
      const [t, p, m, r] = await Promise.all([
        supabase.from("tasks").select("*").eq("is_personal", isPersonal).order("due_date", { ascending: true, nullsFirst: false }).limit(500),
        supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (t.data) setAllTasks(t.data);
      if (p.data) setProjects(p.data);
      if (m.data) setMembers(m.data);
      if (r.data) setRoles(Object.fromEntries(r.data.map((x: any) => [x.user_id, x.role])));
    })();
  }, []);

  const tasks = useMemo(() => {
    return allTasks.filter((t) => {
      // Date range — uses created_at as the primary axis with due_date fallback
      const d = t.created_at ? new Date(t.created_at) : null;
      if (d) {
        if (from && d < new Date(from + "T00:00:00")) return false;
        if (to && d > new Date(to + "T23:59:59")) return false;
      }
      if (memberFilter.length && !memberFilter.includes(t.assignee_id || "")) return false;
      if (statusFilter.length && !statusFilter.includes(t.status)) return false;
      return true;
    });
  }, [allTasks, from, to, memberFilter, statusFilter]);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status));
  const myTasks = tasks.filter((t) => t.assignee_id === user?.id && t.status !== "done").slice(0, 5);
  const productivity = total ? Math.round((done / total) * 100) : 0;
  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const dueSoon = tasks.filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    const d = new Date(t.due_date);
    return d >= now && d <= in3days;
  });
  const alerts = [...overdue, ...dueSoon].slice(0, 6);

  const buildTeamRows = () => {
    const visibleMembers = memberFilter.length ? members.filter((m) => memberFilter.includes(m.id)) : members;
    return visibleMembers.map((m) => {
      const mine = tasks.filter((t) => t.assignee_id === m.id);
      const d = mine.filter((t) => t.status === "done").length;
      const inProg = mine.filter((t) => t.status === "doing").length;
      const todo = mine.filter((t) => t.status === "todo").length;
      const review = mine.filter((t) => t.status === "review").length;
      const od = mine.filter((t) => isOverdue(t.due_date, t.status)).length;
      const completionDays = mine
        .filter((t) => t.status === "done" && t.completed_at && t.created_at)
        .map((t) => (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / 86400000);
      const avgDays = completionDays.length
        ? (completionDays.reduce((a, b) => a + b, 0) / completionDays.length).toFixed(1)
        : "0";
      return {
        name: m.full_name || "Sem nome",
        role: roles[m.id] || "colaborador",
        total: mine.length,
        completed: d,
        in_progress: inProg,
        todo,
        review,
        overdue: od,
        completion_rate: mine.length ? `${Math.round((d / mine.length) * 100)}%` : "0%",
        avg_completion_days: avgDays,
      };
    });
  };

  const filterSummary = () => {
    const parts = [`Período: ${from} → ${to}`];
    if (statusFilter.length) parts.push(`Status: ${statusFilter.map((s) => STATUS_OPTIONS.find((o) => o.value === s)?.label || s).join(", ")}`);
    if (memberFilter.length) parts.push(`Equipe: ${members.filter((m) => memberFilter.includes(m.id)).map((m) => m.full_name).join(", ")}`);
    return parts.join(" • ");
  };

  const exportCSV = () => {
    const rows = buildTeamRows();
    if (!rows.length) { toast.error("Sem dados para exportar."); return; }
    downloadCSV(`exacta-produtividade-${todayISO()}.csv`, toCSV(rows));
    toast.success("CSV exportado!");
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    let y = await addBrandedHeader(
      doc, 
      "Produtividade da Equipe", 
      "Resumo Geral", 
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`
    );
    // Filters block
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const summary = filterSummary();
    const split = doc.splitTextToSize(summary, pw - 28);
    doc.text(split, 14, y);
    y += split.length * 5 + 6;

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.text("Resumo Geral", 14, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Métrica", "Valor"]],
      body: [
        ["Total de tarefas", String(total)],
        ["Concluídas", String(done)],
        ["Em andamento", String(total - done - overdue.length)],
        ["Atrasadas", String(overdue.length)],
        ["Produtividade", `${productivity}%`],
        ["Projetos ativos", String(projects.filter((p) => p.status === "ativo").length)],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text("Distribuição por Status", 14, y);
    y += 8;
    const statusGroups = STATUS_OPTIONS.map((s, i) => ({
      label: s.label,
      count: tasks.filter((t) => t.status === s.value).length,
      color: [[100,116,139],[6,182,212],[124,58,237],[5,150,105]][i],
    }));
    const barMaxW = pw - 80;
    const maxCount = Math.max(...statusGroups.map((s) => s.count), 1);
    statusGroups.forEach((s) => {
      doc.setFontSize(9); doc.setTextColor(60, 60, 60);
      doc.text(`${s.label} (${s.count})`, 14, y + 4);
      const barW = (s.count / maxCount) * barMaxW * 0.6;
      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      doc.rect(65, y - 1, barW, 6, "F");
      y += 10;
    });
    y += 6;

    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(14); doc.setTextColor(30, 58, 138);
    doc.text("Desempenho por Membro", 14, y);
    y += 4;
    const teamRows = buildTeamRows();
    autoTable(doc, {
      startY: y,
      head: [["Membro", "Função", "Total", "Concluídas", "Atrasadas", "Produtividade"]],
      body: teamRows.map((r) => [r.name, r.role, String(r.total), String(r.completed), String(r.overdue), r.completion_rate]),
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138] },
      margin: { left: 14, right: 14 },
    });

    addBrandedFooter(doc);

    doc.save("produtividade.pdf");
    toast.success("PDF exportado!");
  };

  const toggleArr = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Visão geral</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">
            Olá, {profile?.full_name?.split(" ")[0] || "colaborador"} 👋
          </h1>
          <p className="text-muted-foreground mt-2">Aqui está o pulso da sua operação hoje.</p>
        </div>
        {isGestor && (
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Exportar CSV
            </Button>
            <Button onClick={exportPDF} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        )}
      </header>

      {/* Filters */}
      {isGestor && (
        <Card className="p-4 shadow-card">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">De</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Até</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px]" />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                  <Filter className="h-3 w-3" />
                  Status {statusFilter.length > 0 && `(${statusFilter.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((s) => (
                    <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={statusFilter.includes(s.value)} onCheckedChange={() => toggleArr(statusFilter, s.value, setStatusFilter)} />
                      <span className="text-sm">{s.label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                  <Filter className="h-3 w-3" />
                  Equipe {memberFilter.length > 0 && `(${memberFilter.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 max-h-72 overflow-y-auto">
                <div className="space-y-2">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={memberFilter.includes(m.id)} onCheckedChange={() => toggleArr(memberFilter, m.id, setMemberFilter)} />
                      <span className="text-sm truncate">{m.full_name || "Sem nome"}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {(memberFilter.length > 0 || statusFilter.length > 0) && (
              <Button variant="ghost" size="sm" onClick={() => { setMemberFilter([]); setStatusFilter([]); }}>
                Limpar
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="Tarefas totais" value={total} accent="primary" />
        <StatCard icon={TrendingUp} label="Concluídas" value={done} accent="success" />
        <StatCard icon={Clock} label="Em andamento" value={tasks.filter((t) => t.status !== "done").length} accent="accent" />
        <StatCard icon={AlertTriangle} label="Atrasadas" value={overdue.length} accent="destructive" />
      </div>

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

      <Card className="p-6 shadow-card border-l-4 border-l-destructive">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-display text-lg font-bold">Alertas de prazo</h3>
          </div>
          <span className="text-xs text-muted-foreground">{overdue.length} atrasada(s) • {dueSoon.length} vence(m) em breve</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {alerts.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 col-span-full text-center">Nenhum alerta. Você está em dia! ✨</p>
          )}
          {alerts.map((t) => {
            const od = isOverdue(t.due_date, t.status);
            return (
              <Link key={t.id} to="/tasks" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition">
                <div className={`h-2 w-2 rounded-full shrink-0 ${od ? "bg-destructive" : "bg-accent"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{t.title}</p>
                  <p className={`text-xs ${od ? "text-destructive" : "text-muted-foreground"}`}>
                    {od ? "Atrasada" : "Vence"} • {formatDate(t.due_date)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 shadow-card lg:col-span-1">
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

        <Card className="p-6 shadow-card lg:col-span-1">
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

        <div className="lg:col-span-1">
          <CalendarWidget />
        </div>
      </div>

      <div className="mt-8">
        <BottleneckAnalysis data={{ tasks, overdue, projects, productivity }} />
      </div>

      <AIChat contextData={{ tasks: tasks.length, overdue: overdue.length, active_projects: projects.length, productivity }} />
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
