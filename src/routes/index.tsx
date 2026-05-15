import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle2,
  LayoutDashboard,
  Users,
  DollarSign,
  BarChart3,
  Clock,
  Zap,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  FileText,
  Kanban,
  Calendar,
  MessageSquare,
  Bot,
  Sparkles,
  Presentation,
  Brain,
  CalendarRange,
  FolderKanban,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const ACTUAL_LOGO = "https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/gen_3CpSPBsmWgKcVvejbF3BGqkl98C%20(2).png";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-accent-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img src={ACTUAL_LOGO} alt="EXACTA Logo" className="h-14 w-auto object-contain" />
            <span className="text-xl font-bold tracking-tight text-primary sm:text-2xl">
              EXACTA <span className="text-xs font-normal text-muted-foreground ml-1">Precisão em gestão</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Funcionalidades</a>
            <a href="#about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Sobre</a>
            <a href="#security" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Segurança</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth" search={{ invite: undefined }}>Entrar</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground shadow-elegant hover:opacity-90">
              <Link to="/auth" search={{ invite: undefined }}>Começar Agora</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col space-y-8 text-white">
                <div className="inline-flex items-center rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent backdrop-blur-sm border border-accent/20">
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Nova versão 2.0 disponível</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:leading-tight">
                  Gestão Estratégica com <br />
                  <span className="text-accent">Precisão Cirúrgica.</span>
                </h1>
                <p className="max-w-xl text-lg text-white/80 sm:text-xl">
                  A plataforma definitiva para líderes que buscam escala. Gestão visual, análise de performance e Inteligência Artificial integradas em um fluxo de trabalho de elite.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="h-14 px-8 text-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow transition-all hover:scale-105">
                    <Link to="/auth" search={{ invite: undefined }} className="flex items-center gap-2">
                      Iniciar Jornada <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
                    <a href="#features">Explorar Módulos</a>
                  </Button>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl shadow-2xl overflow-hidden group">
                  <div className="relative rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden aspect-video shadow-2xl">
                    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" alt="Dashboard EXACTA" className="w-full h-full object-cover opacity-80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-sm font-bold text-accent uppercase tracking-[0.2em] mb-4">Funcionalidades</h2>
              <h3 className="text-3xl font-extrabold text-primary sm:text-5xl mb-6">Tudo o que você precisa em um só lugar.</h3>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <Presentation className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">Gestão Visual 360°</h4>
                <p className="text-muted-foreground mb-6">SWOT, Eisenhower, 5W2H e Matriz GUT integradas.</p>
              </div>
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Brain className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">Mapa Neural & Brainstorm</h4>
                <p className="text-muted-foreground mb-6">Conecte ideias visualmente e estruture pensamentos.</p>
              </div>
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                  <CalendarRange className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">Calendário Inteligente</h4>
                <p className="text-muted-foreground mb-6">Agendamentos com alertas proativos de IA.</p>
              </div>
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500 transition-colors group-hover:bg-green-500 group-hover:text-white">
                  <Users className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">Matriz de Competências</h4>
                <p className="text-muted-foreground mb-6">Gerencie as habilidades do seu time com precisão.</p>
              </div>
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                  <Bot className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">IA Estratégica</h4>
                <p className="text-muted-foreground mb-6">A IA analisa suas matrizes e propõe o próximo passo.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
