import { createFileRoute } from "@tanstack/react-router";
import { Timer, Play, Pause, Square, History, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/time-tracking")({
  component: () => <AppShell><TimeTrackingPage /></AppShell>,
});

function TimeTrackingPage() {
  const recentLogs = [
    { id: 1, task: "Review de Código: Módulo de IA", project: "Exacta Flow", duration: "1h 45m", date: "Hoje" },
    { id: 2, task: "Meeting de Alinhamento Q3", project: "Marketing", duration: "50m", date: "Hoje" },
    { id: 3, task: "Design System: Componentes de Chart", project: "Exacta Flow", duration: "3h 20m", date: "Ontem" },
    { id: 4, task: "Fix: Bug de Scroll no Mobile", project: "App Mobile", duration: "1h 10m", date: "Ontem" },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          <Button variant="outline"><Calendar className="mr-2 h-4 w-4" /> Relatórios</Button>
          <Button className="bg-gradient-primary shadow-elegant"><History className="mr-2 h-4 w-4" /> Histórico Completo</Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-emerald-500/10 via-transparent to-accent/5 border-emerald-500/20 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Cronômetro Ativo</span>
              <h2 className="text-2xl font-bold">Design de Interface: Dashboard</h2>
              <p className="text-sm text-muted-foreground">Projeto: EXACTA Smart Flow</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-6xl font-mono font-bold tracking-tighter mb-4 tabular-nums">
                00:42:15
              </div>
              <div className="flex gap-3">
                <Button size="lg" variant="outline" className="rounded-full h-12 w-12 p-0 border-emerald-500/30 text-emerald-500">
                  <Pause className="h-5 w-5" />
                </Button>
                <Button size="lg" className="rounded-full h-14 w-14 p-0 bg-emerald-500 hover:bg-emerald-600 text-white shadow-glow-emerald">
                  <Play className="h-6 w-6 ml-1" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-full h-12 w-12 p-0 border-red-500/30 text-red-500">
                  <Square className="h-5 w-5 fill-current" />
                </Button>
              </div>
            </div>

            <div className="hidden lg:block w-48 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Meta Diária</span>
                  <span className="font-bold">6h / 8h</span>
                </div>
                <Progress value={75} className="h-1.5 bg-emerald-500/10" />
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
                <TrendingUp className="h-4 w-4" />
                <span>+15% que ontem</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 border-white/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hoje</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">05h 42m</div>
            <p className="text-[10px] text-muted-foreground mt-1">Estimativa de custo: R$ 450,00</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-white/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média Semanal</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">06h 15m</div>
            <p className="text-[10px] text-muted-foreground mt-1">-5% em relação à semana passada</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-white/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projetos Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">04</div>
            <p className="text-[10px] text-muted-foreground mt-1">Mais tempo gasto em: Design</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Registros Recentes</h2>
        <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid gap-px">
            {recentLogs.map((log) => (
              <div key={log.id} className="bg-card/50 p-4 flex items-center justify-between hover:bg-card transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">{log.task}</h4>
                    <p className="text-xs text-muted-foreground">{log.project}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-right">
                  <div>
                    <p className="font-mono font-bold text-sm">{log.duration}</p>
                    <p className="text-[10px] text-muted-foreground">{log.date}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-3.5 w-3.5 text-emerald-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
