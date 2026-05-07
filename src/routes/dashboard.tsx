import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, FolderKanban, Clock, AlertTriangle, TrendingUp, Sparkles, FileDown } from "lucide-react";
import { isOverdue, priorityColor, priorityLabel, formatDate } from "@/lib/exacta";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

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
  const { isGestor } = useRole();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [t, p, m, r] = await Promise.all([
        supabase.from("tasks").select("*").order("due_date", { ascending: true, nullsFirst: false }).limit(200),
        supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (t.data) setTasks(t.data);
      if (p.data) setProjects(p.data);
      if (m.data) setMembers(m.data);
      if (r.data) setRoles(Object.fromEntries(r.data.map((x: any) => [x.user_id, x.role])));
    })();
  }, []);

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

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pw, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("EXACTA — Produtividade da Equipe", 14, 15);
    doc.setFontSize(9);
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 14, 24);
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 32, pw, 2, "F");

    let y = 42;

    // Summary cards
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.text("Resumo Geral", 14, y);
    y += 8;
    const summaryData = [
      ["Total de tarefas", String(total)],
      ["Concluídas", String(done)],
      ["Em andamento", String(total - done - overdue.length)],
      ["Atrasadas", String(overdue.length)],
      ["Produtividade geral", `${productivity}%`],
      ["Projetos ativos", String(projects.filter((p) => p.status === "ativo").length)],
    ];
    autoTable(doc, {
      startY: y,
      head: [["Métrica", "Valor"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // Status distribution chart (text-based)
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text("Distribuição por Status", 14, y);
    y += 8;
    const statusGroups = [
      { label: "A fazer", count: tasks.filter((t) => t.status === "todo").length, color: [100, 116, 139] },
      { label: "Em andamento", count: tasks.filter((t) => t.status === "doing").length, color: [6, 182, 212] },
      { label: "Revisão", count: tasks.filter((t) => t.status === "review").length, color: [124, 58, 237] },
      { label: "Concluído", count: tasks.filter((t) => t.status === "done").length, color: [5, 150, 105] },
    ];
    const barMaxW = pw - 80;
    const maxCount = Math.max(...statusGroups.map((s) => s.count), 1);
    statusGroups.forEach((s) => {
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`${s.label} (${s.count})`, 14, y + 4);
      const barW = (s.count / maxCount) * barMaxW * 0.6;
      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      doc.rect(65, y - 1, barW, 6, "F");
      y += 10;
    });
    y += 6;

    // Priority distribution
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text("Distribuição por Prioridade", 14, y);
    y += 8;
    const priorityGroups = [
      { label: "Baixa", count: tasks.filter((t) => t.priority === "baixa").length, color: [100, 116, 139] },
      { label: "Média", count: tasks.filter((t) => t.priority === "media").length, color: [217, 119, 6] },
      { label: "Alta", count: tasks.filter((t) => t.priority === "alta").length, color: [234, 88, 12] },
      { label: "Urgente", count: tasks.filter((t) => t.priority === "urgente").length, color: [220, 38, 38] },
    ];
    const maxP = Math.max(...priorityGroups.map((s) => s.count), 1);
    priorityGroups.forEach((s) => {
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`${s.label} (${s.count})`, 14, y + 4);
      const barW = (s.count / maxP) * barMaxW * 0.6;
      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      doc.rect(65, y - 1, barW, 6, "F");
      y += 10;
    });
    y += 6;

    // Team performance table
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text("Desempenho por Membro", 14, y);
    y += 4;
    const teamData = members.map((m) => {
      const mine = tasks.filter((t) => t.assignee_id === m.id);
      const d = mine.filter((t) => t.status === "done").length;
      const pct = mine.length ? Math.round((d / mine.length) * 100) : 0;
      const role = roles[m.id] || "colaborador";
      return [m.full_name || "Sem nome", role, String(mine.length), String(d), `${pct}%`];
    });
    autoTable(doc, {
      startY: y,
      head: [["Membro", "Função", "Total", "Concluídas", "Produtividade"]],
      body: teamData,
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138] },
      margin: { left: 14, right: 14 },
    });

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(`EXACTA — Precisão em Gestão | Página ${i}/${totalPages}`, pw / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
    }

    doc.save(`exacta-produtividade-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

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
          <Button onClick={exportPDF} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" /> Exportar PDF
          </Button>
        )}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="Tarefas totais" value={total} accent="primary" />
        <StatCard icon={TrendingUp} label="Concluídas" value={done} accent="success" />
        <StatCard icon={Clock} label="Em andamento" value={tasks.filter((t) => t.status !== "done").length} accent="accent" />
        <StatCard icon={AlertTriangle} label="Atrasadas" value={overdue.length} accent="destructive" />
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

      {/* Alerts */}
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
