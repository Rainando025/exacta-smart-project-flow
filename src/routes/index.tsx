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
  Target,
  Workflow
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

        <section id="features" className="py-24 bg-secondary/30 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <Badge variant="outline" className="mb-4 border-accent/30 text-accent bg-accent/5 py-1 px-4 text-[10px] uppercase tracking-widest">Ecosystem</Badge>
              <h2 className="text-3xl font-extrabold text-primary sm:text-5xl mb-6">O Poder da Gestão na Palma da Sua Mão.</h2>
              <p className="text-muted-foreground text-lg">De simples anotações a complexos fluxos corporativos, a EXACTA centraliza tudo o que importa.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Presentation, title: "Gestão Visual", desc: "Matrizes SWOT, Eisenhower, GUT e 5W2H integradas para decisões estratégicas.", color: "accent" },
                { icon: Brain, title: "Mapa Neural", desc: "Capture e conecte ideias em um mapa visual interativo para brainstorming de elite.", color: "primary" },
                { icon: Workflow, title: "Fluxogramas", desc: "Desenhe processos com arrastar e soltar, conexões automáticas e lógica de decisão.", color: "purple-500" },
                { icon: CalendarRange, title: "Agenda Inteligente", desc: "Calendário estilo Google com proatividade via IA para não perder nenhum prazo.", color: "blue-500" },
                { icon: FolderKanban, title: "Projetos & Kanban", desc: "Gestão ágil completa com quadros Kanban, cronogramas Gantt e controle de OKRs.", color: "green-500" },
                { icon: Target, title: "Metas OKR", desc: "Desdobre a visão da empresa em metas mensuráveis e acompanhe o progresso real.", color: "red-500" },
                { icon: Bot, title: "IA Jarvis", desc: "Inteligência preditiva que analisa seus dados e sugere ações corretivas automáticas.", color: "amber-500" },
                { icon: Users, title: "Competências", desc: "Matriz de soft/hard skills para gerir o capital humano com foco em performance.", color: "indigo-500" },
              ].map((f, i) => (
                <Card key={i} className="group relative border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-elegant hover:-translate-y-1 overflow-hidden">
                  <CardContent className="p-6">
                    <div className={cn("mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-opacity-10 transition-all group-hover:scale-110", `bg-${f.color}`, `text-${f.color}`)}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h4 className="mb-2 text-lg font-bold text-primary group-hover:text-accent transition-colors">{f.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                  <div className={cn("absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full", `bg-${f.color}`)} />
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 border-y border-border/40 overflow-hidden relative">
          <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <h3 className="text-accent font-bold uppercase tracking-widest text-xs mb-3">Sobre a EXACTA</h3>
                  <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">Filosofia da Precisão.</h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  A EXACTA nasceu da necessidade de simplificar a complexidade. Acreditamos que a gestão não deve ser um fardo, mas uma alavanca para o crescimento. 
                  Nossa plataforma combina o rigor dos métodos tradicionais de administração com a flexibilidade da era digital.
                </p>
                <ul className="space-y-4">
                  {[
                    "Foco absoluto na experiência do usuário (UX)",
                    "Integração total entre módulos estratégicos e operacionais",
                    "Apoio de Inteligência Artificial Generativa para decisões",
                    "Escalabilidade para pequenas e grandes corporações"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-4 pt-8">
                    <div className="p-6 rounded-2xl bg-primary text-white space-y-2 shadow-xl animate-bounce-slow">
                       <h4 className="text-2xl font-bold">98%</h4>
                       <p className="text-[10px] uppercase opacity-70">Aumento em produtividade</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-border bg-card space-y-2 shadow-lg">
                       <h4 className="text-2xl font-bold text-accent">24/7</h4>
                       <p className="text-[10px] uppercase text-muted-foreground">Monitoramento inteligente</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="p-6 rounded-2xl border border-border bg-card space-y-2 shadow-lg">
                       <h4 className="text-2xl font-bold text-primary">IA</h4>
                       <p className="text-[10px] uppercase text-muted-foreground">Insights Preditivos</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-accent text-accent-foreground space-y-2 shadow-xl">
                       <h4 className="text-2xl font-bold">100%</h4>
                       <p className="text-[10px] uppercase opacity-70">Gestão Visual Integrada</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-24 bg-primary text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="md:w-1/2 space-y-6">
                  <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm border border-white/20">
                    <ShieldCheck className="mr-2 h-4 w-4 text-accent" />
                    <span>Segurança de Nível Bancário</span>
                  </div>
                  <h2 className="text-3xl font-extrabold sm:text-5xl">Seus dados são seu maior ativo.</h2>
                  <p className="text-white/70 text-lg">
                    Utilizamos criptografia ponta a ponta e infraestrutura redundante para garantir que sua estratégia corporativa esteja sempre protegida e disponível.
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                       <h5 className="font-bold text-accent mb-1">Criptografia AES-256</h5>
                       <p className="text-[10px] text-white/50">Proteção máxima em repouso e trânsito.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                       <h5 className="font-bold text-accent mb-1">Conformidade LGPD</h5>
                       <p className="text-[10px] text-white/50">Total controle sobre sua privacidade.</p>
                    </div>
                  </div>
               </div>
               <div className="md:w-1/3 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent blur-[80px] opacity-20" />
                    <ShieldCheck className="h-64 w-64 text-accent animate-float" />
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-extrabold text-primary mb-6">Pronto para elevar o nível da sua gestão?</h2>
            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">Junte-se a centenas de líderes que já transformaram seus fluxos de trabalho com a EXACTA.</p>
            <Button asChild size="lg" className="bg-primary text-primary-foreground h-14 px-12 text-lg shadow-elegant hover:scale-105 transition-transform">
              <Link to="/auth" search={{ invite: undefined }}>Começar Gratuitamente</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <img src={ACTUAL_LOGO} alt="EXACTA" className="h-12 w-auto" />
                <span className="text-xl font-bold text-primary tracking-tighter uppercase">EXACTA</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                A plataforma inteligente de gestão estratégica. Projetada para transformar dados em decisões precisas e equipes em motores de alta performance.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-primary mb-4 uppercase text-xs tracking-widest">Produto</h5>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-accent transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Soluções Corporativas</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Atualizações</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Preços</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-primary mb-4 uppercase text-xs tracking-widest">Legal</h5>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Segurança</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© 2026 EXACTA Smart Project Flow. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-accent transition-colors">Instagram</a>
              <a href="#" className="hover:text-accent transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-accent transition-colors">X / Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
