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
  Sparkles
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

  // Se o usuário já estiver logado, redireciona para o dashboard
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-accent-foreground">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img
              src={ACTUAL_LOGO}
              alt="EXACTA Logo"
              className="h-14 w-auto object-contain"
            />
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
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground shadow-elegant hover:opacity-90">
              <Link to="/auth">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col space-y-8 text-white">
                <div className="inline-flex items-center rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent backdrop-blur-sm border border-accent/20 animate-in fade-in slide-in-from-top-4 duration-1000">
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Nova versão 2.0 disponível</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:leading-tight animate-in fade-in slide-in-from-left-4 duration-1000">
                  Gestão Inteligente para <br />
                  <span className="text-accent">Resultados de Elite.</span>
                </h1>
                <p className="max-w-xl text-lg text-white/80 sm:text-xl animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
                  Simplifique fluxos de trabalho complexos, controle suas finanças e escale sua produtividade com a plataforma EXACTA. Integrada com Inteligência Artificial de última geração.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                  <Button asChild size="lg" className="h-14 px-8 text-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow transition-all hover:scale-105">
                    <Link to="/auth" className="flex items-center gap-2">
                      Acessar Sistema <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
                    <a href="#features">Ver Demonstração</a>
                  </Button>
                </div>
                <div className="flex items-center gap-6 pt-4 text-white/60 animate-in fade-in duration-1000 delay-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span className="text-sm">Multifuncional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span className="text-sm">Seguro & Criptografado</span>
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block animate-in zoom-in duration-1000 delay-300">
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl shadow-2xl overflow-hidden group">
                  <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-accent/20 blur-3xl group-hover:bg-accent/30 transition-all duration-700"></div>
                  <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-primary/40 blur-3xl group-hover:bg-primary/50 transition-all duration-700"></div>
                  <div className="relative rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden aspect-video shadow-2xl">
                    {/* Placeholder para uma imagem do dashboard real ou uma ilustração premium */}
                    <img
                      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
                      alt="Dashboard EXACTA"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-accent/20 backdrop-blur-md flex items-center justify-center border border-accent/30">
                          <BarChart3 className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">Análise de Performance</p>
                          <p className="text-white/60 text-sm">Dados atualizados em tempo real</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating Cards */}
                <div className="absolute -top-6 -right-6 h-24 w-48 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl p-4 shadow-xl animate-bounce-slow">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Faturamento</p>
                      <p className="text-sm text-white font-bold">+R$ 45.280,00</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 h-24 w-56 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl p-4 shadow-xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">IA Insight</p>
                      <p className="text-sm text-white font-bold italic">"Projeto A com 15% de atraso"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-white py-12 border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-16">
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-primary">100%</span>
                <span className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Cloud Based</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-primary">256-bit</span>
                <span className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Criptografia</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-primary">99.9%</span>
                <span className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Uptime</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-primary">AI</span>
                <span className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Gemini & Groq</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-sm font-bold text-accent uppercase tracking-[0.2em] mb-4">Funcionalidades</h2>
              <h3 className="text-3xl font-extrabold text-primary sm:text-5xl mb-6">Tudo o que você precisa em um só lugar.</h3>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                Diga adeus à fragmentação de ferramentas. O EXACTA centraliza todo o seu fluxo de trabalho, desde a ideia inicial até a entrega final.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">Dashboard Inteligente</h4>
                <p className="text-muted-foreground mb-6">
                  Visão panorâmica de todos os seus projetos, finanças e tarefas em tempo real com métricas cruciais.
                </p>
                <div className="flex items-center text-accent font-semibold text-sm cursor-pointer group/link">
                  Saiba mais <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Kanban className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">Kanban & Gestão Ágil</h4>
                <p className="text-muted-foreground mb-6">
                  Organize suas tarefas visualmente. Arraste e solte para atualizar o progresso de cada entrega.
                </p>
                <div className="flex items-center text-accent font-semibold text-sm cursor-pointer group/link">
                  Saiba mais <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Calendar className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">Cronograma Gantt</h4>
                <p className="text-muted-foreground mb-6">
                  Planeje projetos no tempo com nossa visualização de linha do tempo. Controle prazos e dependências.
                </p>
                <div className="flex items-center text-accent font-semibold text-sm cursor-pointer group/link">
                  Saiba mais <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </div>
              </div>

              {/* Feature 4 */}
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">Controle Financeiro</h4>
                <p className="text-muted-foreground mb-6">
                  Gestão completa de despesas recorrentes e receitas. Saiba exatamente para onde está indo cada centavo.
                </p>
                <div className="flex items-center text-accent font-semibold text-sm cursor-pointer group/link">
                  Saiba mais <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </div>
              </div>

              {/* Feature 5 */}
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Bot className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">Inteligência Artificial</h4>
                <p className="text-muted-foreground mb-6">
                  Assistentes IA integrados (Gemini/Groq) para ajudar na redação, análise de dados e tomada de decisão.
                </p>
                <div className="flex items-center text-accent font-semibold text-sm cursor-pointer group/link">
                  Saiba mais <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </div>
              </div>

              {/* Feature 6 */}
              <div className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-primary">Relatórios Profissionais</h4>
                <p className="text-muted-foreground mb-6">
                  Gere relatórios em PDF com sua logo, prontos para serem apresentados a clientes e parceiros.
                </p>
                <div className="flex items-center text-accent font-semibold text-sm cursor-pointer group/link">
                  Saiba mais <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-24 bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2">
                <h2 className="text-sm font-bold text-accent uppercase tracking-[0.2em] mb-4">Segurança Inabalável</h2>
                <h3 className="text-3xl font-extrabold sm:text-5xl mb-8">Seus dados são o seu bem mais precioso.</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="mt-1 h-10 w-10 shrink-0 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                      <ShieldCheck className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h5 className="text-xl font-bold mb-2">Proteção de Nível Bancário</h5>
                      <p className="text-white/70">Utilizamos criptografia ponta a ponta e protocolos de segurança avançados para garantir que apenas você tenha acesso.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 h-10 w-10 shrink-0 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h5 className="text-xl font-bold mb-2">Backups Automatizados</h5>
                      <p className="text-white/70">Política rigorosa de backups para evitar qualquer perda de informação, com redundância geográfica.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 h-10 w-10 shrink-0 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h5 className="text-xl font-bold mb-2">Controle de Acesso Granular</h5>
                      <p className="text-white/70">Defina exatamente quem pode ver ou editar cada informação com permissões detalhadas por usuário.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 flex justify-center">
                <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                  <div className="absolute inset-0 border-[20px] border-accent/10 rounded-full animate-pulse"></div>
                  <div className="absolute inset-8 border-[10px] border-accent/20 rounded-full animate-pulse delay-150"></div>
                  <div className="h-48 w-48 rounded-full bg-accent flex items-center justify-center shadow-glow animate-float">
                    <ShieldCheck className="h-24 w-24 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI & Innovation Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="absolute -inset-4 bg-accent/20 blur-3xl rounded-full opacity-50"></div>
                <div className="relative border border-border bg-card rounded-3xl p-8 shadow-elegant">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white">
                        <Bot className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-primary">Assistente EXACTA</p>
                        <p className="text-sm text-muted-foreground">Potencializado por Gemini 1.5 Pro</p>
                      </div>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4 text-sm text-muted-foreground italic">
                      "Analise o progresso do Projeto Alpha e sugira otimizações para o cronograma da próxima semana considerando a carga de trabalho da equipe."
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-end">
                        <div className="bg-accent/10 border border-accent/20 rounded-2xl rounded-tr-none p-3 max-w-[80%]">
                          <p className="text-xs font-bold text-accent mb-1 uppercase">Insight IA</p>
                          <p className="text-sm text-primary">Com base nos dados atuais, recomendo realocar 2 desenvolvedores para a Fase 3, pois há um risco de 15% de atraso no marco final.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-8">
                <Badge variant="outline" className="border-accent text-accent px-4 py-1 rounded-full bg-accent/5">Inovação</Badge>
                <h2 className="text-3xl font-extrabold text-primary sm:text-5xl">Inteligência Artificial que trabalha para você.</h2>
                <p className="text-lg text-muted-foreground">
                  Não é apenas sobre gerenciar tarefas. É sobre ter um copiloto inteligente que analisa seus dados, prevê riscos e automatiza burocracias.
                </p>
                <ul className="space-y-4">
                  {[
                    "Resumos automáticos de reuniões e projetos.",
                    "Sugestão de prioridades baseada em prazos e esforço.",
                    "Detecção precoce de possíveis atrasos no cronograma.",
                    "Geração de relatórios analíticos em segundos."
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                      </div>
                      <span className="text-muted-foreground font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-primary/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-primary mb-16">O que dizem os líderes de projetos</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Ricardo Silva",
                  role: "Gerente de Operações",
                  text: "O EXACTA mudou completamente como visualizamos nossos cronogramas. A integração com o Gantt é a melhor que já usamos."
                },
                {
                  name: "Ana Oliveira",
                  role: "Diretora de Tecnologia",
                  text: "A segurança e o controle de acesso granular nos deram a confiança necessária para migrar todos os nossos dados críticos."
                },
                {
                  name: "Marcos Souza",
                  role: "Head de Produto",
                  text: "Os insights de IA são assustadoramente precisos. Conseguimos economizar cerca de 20% do tempo de gestão semanal."
                }
              ].map((t, i) => (
                <Card key={i} className="border-none shadow-card hover:shadow-elegant transition-all">
                  <CardContent className="pt-8">
                    <div className="flex justify-center mb-4 text-accent">
                      {[1, 2, 3, 4, 5].map(s => <Sparkles key={s} className="h-4 w-4 fill-current" />)}
                    </div>
                    <p className="text-muted-foreground italic mb-6">"{t.text}"</p>
                    <div className="font-bold text-primary">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-primary">Dúvidas Frequentes</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-bold text-primary">O sistema é difícil de implementar?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Não! O EXACTA foi desenhado para ser intuitivo. Oferecemos templates prontos e uma interface limpa para que sua equipe comece a produzir em minutos.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-bold text-primary">Como funciona a integração com IA?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Utilizamos as APIs do Google Gemini e Groq. Seus dados são processados de forma anônima e segura para gerar insights sobre seus projetos e tarefas.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-bold text-primary">Posso exportar meus dados?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim, você tem total controle sobre seus dados. Oferecemos exportação para PDF, CSV e integração via API para outros sistemas.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-bold text-primary">Existe suporte em português?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim, nosso suporte é 100% em português, disponível via chat e email para todos os planos.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-accent p-12 lg:p-20 text-center shadow-glow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-extrabold text-accent-foreground sm:text-6xl mb-8">
                  Pronto para transformar sua gestão?
                </h2>
                <p className="max-w-2xl mx-auto text-xl text-accent-foreground/80 mb-12">
                  Junte-se a centenas de profissionais que já otimizaram seus resultados com o EXACTA Smart Project Flow.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <Button asChild size="lg" className="h-16 px-12 text-xl bg-primary text-white hover:bg-primary/90 shadow-2xl transition-all hover:scale-110">
                    <Link to="/auth">Criar Conta Grátis</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-16 px-12 text-xl border-accent-foreground/20 bg-white/10 text-accent-foreground hover:bg-white/20 backdrop-blur-sm">
                    <a href="mailto:contato@exacta.com">Falar com Consultor</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary py-16 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <img
                  src={ACTUAL_LOGO}
                  alt="EXACTA Logo"
                  className="h-12 w-auto object-contain"
                />
                <span className="text-lg font-bold tracking-tight text-primary">
                  EXACTA
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tecnologia de ponta para gestão de alta performance. O futuro do gerenciamento de projetos começa aqui.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-primary mb-6">Plataforma</h5>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Integrações IA</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Relatórios</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-primary mb-6">Suporte</h5>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Status do Sistema</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Fale Conosco</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-primary mb-6">Legal</h5>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Cookies</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 EXACTA — Precisão em gestão. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <MessageSquare className="h-5 w-5 text-muted-foreground hover:text-accent cursor-pointer" />
              <Users className="h-5 w-5 text-muted-foreground hover:text-accent cursor-pointer" />
              <BarChart3 className="h-5 w-5 text-muted-foreground hover:text-accent cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
