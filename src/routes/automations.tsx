import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Plus, Zap, Mail, UserPlus, ArrowRight, Play, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/automations")({
  component: () => <AppShell><AutomationsPage /></AppShell>,
});

function AutomationsPage() {
  const automations = [
    {
      id: 1,
      name: "Auto-atribuir Designer",
      trigger: "Tarefa criada em 'Marketing'",
      action: "Atribuir a @MarianaDesign",
      icon: UserPlus,
      active: true,
      executions: 124,
    },
    {
      id: 2,
      name: "Notificar Finalização",
      trigger: "Status muda para 'Concluído'",
      action: "Enviar e-mail para Gestor",
      icon: Mail,
      active: true,
      executions: 89,
    },
    {
      id: 3,
      name: "Urgência Automática",
      trigger: "Prazo vence em < 24h",
      action: "Mudar prioridade para 'Crítica'",
      icon: Zap,
      active: false,
      executions: 45,
    },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Cpu className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Automações</h1>
          </div>
          <p className="text-muted-foreground">Automatize fluxos de trabalho, mudanças de status e notificações.</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" /> Criar Automação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
             <Zap className="h-12 w-12 text-amber-500" />
          </div>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">258</CardTitle>
            <CardDescription>Execuções este mês</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-500 font-medium">↑ 12% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">12h</CardTitle>
            <CardDescription>Tempo economizado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Estimativa baseada em tarefas manuais</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">08</CardTitle>
            <CardDescription>Automações ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">De um total de 12 configuradas</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Minhas Automações</h2>
          <Button variant="ghost" size="sm">Ver histórico de execuções</Button>
        </div>

        <div className="grid gap-4">
          {automations.map((a) => (
            <Card key={a.id} className="border-white/5 bg-card/30 hover:bg-card/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-2xl bg-sidebar flex items-center justify-center text-accent shadow-elegant border border-white/5">
                      <a.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{a.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-white/5 text-[10px]">SE: {a.trigger}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-[10px]">ENTÃO: {a.action}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-muted-foreground mb-1">Execuções</p>
                      <p className="font-mono font-bold">{a.executions}</p>
                    </div>
                    <div className="flex items-center gap-3 border-l border-white/5 pl-6">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Status</span>
                        <Switch checked={a.active} />
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg"><Settings2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-accent/5">
        <Play className="h-8 w-8 mx-auto mb-3 text-accent/40" />
        <h3 className="font-semibold">Precisa de algo mais complexo?</h3>
        <p className="text-sm text-muted-foreground mb-4">Conecte com Zapier, Make ou use nossa API nativa para automações avançadas.</p>
        <Button variant="outline" size="sm">Explorar Integrações</Button>
      </div>
    </div>
  );
}
