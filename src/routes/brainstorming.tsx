import { createFileRoute } from "@tanstack/react-router";
import { Brain, Lightbulb, MessageSquare, Plus, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/AppShell";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/brainstorming")({
  component: () => <AppShell><BrainstormingPage /></AppShell>,
});

function BrainstormingPage() {
  const sessions = [
    {
      id: 1,
      title: "Lançamento Q3 - Campanha Digital",
      description: "Ideias para a nova campanha de marketing digital focada em SaaS.",
      tags: ["Marketing", "Digital"],
      participants: 5,
      lastUpdate: "2 horas atrás",
    },
    {
      id: 2,
      title: "Refatoração de UX do Dashboard",
      description: "Mapeamento de pontos de fricção no onboarding de novos usuários.",
      tags: ["UX/UI", "Produto"],
      participants: 3,
      lastUpdate: "Ontem",
    },
    {
      id: 3,
      title: "Estratégia de Expansão Latam",
      description: "Brainstorming sobre táticas de entrada no mercado mexicano e colombiano.",
      tags: ["Estratégia", "Vendas"],
      participants: 8,
      lastUpdate: "3 dias atrás",
    },
  ];

  const templates = [
    { id: 1, title: "Matriz SWOT", desc: "Análise de Forças, Fraquezas, Oportunidades e Ameaças." },
    { id: 2, title: "Design Sprint", desc: "Processo rápido para resolver problemas e testar ideias." },
    { id: 3, title: "Mind Map", desc: "Estruture informações de forma visual e hierárquica." },
    { id: 4, title: "Brainwriting", desc: "Geração de ideias silenciosa em equipe para máxima inclusão." },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Brain className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Brainstorming</h1>
          </div>
          <p className="text-muted-foreground">Mapeie ideias e táticas de marketing com precisão.</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" /> Nova Sessão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
          <CardHeader className="pb-2">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-2 text-accent-foreground shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Brainstorming com IA</CardTitle>
            <CardDescription>Use nossa IA para expandir suas ideias iniciais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-accent/30 hover:bg-accent/10">
              Iniciar com IA
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center mb-2 text-primary-foreground shadow-elegant">
              <Target className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Táticas de Marketing</CardTitle>
            <CardDescription>Templates prontos para estratégias de crescimento.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10">
                  Ver Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Templates de Brainstorming</DialogTitle>
                  <DialogDescription>Escolha um framework para iniciar sua sessão.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {templates.map((tpl) => (
                    <Card key={tpl.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm group-hover:text-primary transition-colors">{tpl.title}</CardTitle>
                        <CardDescription className="text-xs mt-1 line-clamp-2">{tpl.desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/5 to-transparent border-secondary/20">
          <CardHeader className="pb-2">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-2 text-secondary-foreground shadow-elegant">
              <MessageSquare className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Colaboração ao Vivo</CardTitle>
            <CardDescription>Convide sua equipe para uma sessão em tempo real.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-secondary/30 hover:bg-secondary/10">
              Convidar Equipe
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sessões Recentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <Card key={s.id} className="group hover:shadow-elegant transition-all duration-300 border-white/10 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base group-hover:text-accent transition-colors">{s.title}</CardTitle>
                  <Lightbulb className="h-4 w-4 text-accent/50 group-hover:text-accent" />
                </div>
                <CardDescription className="line-clamp-2">{s.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {s.tags.map(t => (
                    <Badge key={t} variant="secondary" className="text-[10px] uppercase font-bold">{t}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-white/5">
                  <span>{s.participants} participantes</span>
                  <span>{s.lastUpdate}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
