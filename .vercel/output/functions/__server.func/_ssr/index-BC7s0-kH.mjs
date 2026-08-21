import { I as jsxRuntimeExports } from "./index.mjs";
import { ak as useAuth, N as Navigate, b as Button, F as Link, B as Badge, C as Card, c as CardContent, a3 as cn, k as CircleCheck, a8 as createLucideIcon } from "./router-Bktayy9l.mjs";
import { Z as Zap } from "./zap-CmRyB6hR.mjs";
import { A as ArrowRight } from "./arrow-right-DEuSowZh.mjs";
import { P as Presentation, a as Brain, C as CalendarRange, F as FolderKanban, B as Bot, U as Users } from "./users-C5uEgJff.mjs";
import { T as Target } from "./target-BBkqu7Bi.mjs";
import { S as ShieldCheck } from "./shield-check-B9wdJrTU.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode = [
  ["rect", { width: "8", height: "8", x: "3", y: "3", rx: "2", key: "by2w9f" }],
  ["path", { d: "M7 11v4a2 2 0 0 0 2 2h4", key: "xkn7yn" }],
  ["rect", { width: "8", height: "8", x: "13", y: "13", rx: "2", key: "1cgmvn" }]
];
const Workflow = createLucideIcon("workflow", __iconNode);
const ACTUAL_LOGO = "https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/gen_3CpSPBsmWgKcVvejbF3BGqkl98C%20(2).png";
function Index() {
  const {
    user,
    loading
  } = useAuth();
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" }) });
  }
  if (user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/dashboard" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen flex-col bg-background selection:bg-accent selection:text-accent-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: ACTUAL_LOGO, alt: "EXACTA Logo", className: "h-14 w-auto object-contain" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xl font-bold tracking-tight text-primary sm:text-2xl", children: [
          "EXACTA ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-normal text-muted-foreground ml-1", children: "Precisão em gestão" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "hidden md:flex items-center gap-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#features", className: "text-sm font-medium text-muted-foreground transition-colors hover:text-primary", children: "Funcionalidades" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#about", className: "text-sm font-medium text-muted-foreground transition-colors hover:text-primary", children: "Sobre" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#security", className: "text-sm font-medium text-muted-foreground transition-colors hover:text-primary", children: "Segurança" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "ghost", className: "hidden sm:inline-flex", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", search: {
          invite: void 0
        }, children: "Entrar" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "bg-primary text-primary-foreground shadow-elegant hover:opacity-90", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", search: {
          invite: void 0
        }, children: "Começar Agora" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden bg-gradient-hero py-20 lg:py-32", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container relative mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-12 lg:grid-cols-2 lg:items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col space-y-8 text-white", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent backdrop-blur-sm border border-accent/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "mr-2 h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Nova versão 2.0 disponível" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-4xl font-extrabold tracking-tight sm:text-6xl lg:leading-tight", children: [
              "Gestão Estratégica com ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent", children: "Precisão Cirúrgica." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xl text-lg text-white/80 sm:text-xl", children: "A plataforma definitiva para líderes que buscam escala. Gestão visual, análise de performance e Inteligência Artificial integradas em um fluxo de trabalho de elite." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "h-14 px-8 text-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow transition-all hover:scale-105", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/auth", search: {
                invite: void 0
              }, className: "flex items-center gap-2", children: [
                "Iniciar Jornada ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", size: "lg", className: "h-14 px-8 text-lg border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#features", children: "Explorar Módulos" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative hidden lg:block", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl shadow-2xl overflow-hidden group", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden aspect-video shadow-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426", alt: "Dashboard EXACTA", className: "w-full h-full object-cover opacity-80" }) }) }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "features", className: "py-24 bg-secondary/30 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-20 max-w-3xl mx-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "mb-4 border-accent/30 text-accent bg-accent/5 py-1 px-4 text-[10px] uppercase tracking-widest", children: "Ecosystem" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-extrabold text-primary sm:text-5xl mb-6", children: "O Poder da Gestão na Palma da Sua Mão." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-lg", children: "De simples anotações a complexos fluxos corporativos, a EXACTA centraliza tudo o que importa." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-4", children: [{
          icon: Presentation,
          title: "Gestão Visual",
          desc: "Matrizes SWOT, Eisenhower, GUT e 5W2H integradas para decisões estratégicas.",
          color: "accent"
        }, {
          icon: Brain,
          title: "Mapa Neural",
          desc: "Capture e conecte ideias em um mapa visual interativo para brainstorming de elite.",
          color: "primary"
        }, {
          icon: Workflow,
          title: "Fluxogramas",
          desc: "Desenhe processos com arrastar e soltar, conexões automáticas e lógica de decisão.",
          color: "purple-500"
        }, {
          icon: CalendarRange,
          title: "Agenda Inteligente",
          desc: "Calendário estilo Google com proatividade via IA para não perder nenhum prazo.",
          color: "blue-500"
        }, {
          icon: FolderKanban,
          title: "Projetos & Kanban",
          desc: "Gestão ágil completa com quadros Kanban, cronogramas Gantt e controle de OKRs.",
          color: "green-500"
        }, {
          icon: Target,
          title: "Metas OKR",
          desc: "Desdobre a visão da empresa em metas mensuráveis e acompanhe o progresso real.",
          color: "red-500"
        }, {
          icon: Bot,
          title: "IA Jarvis",
          desc: "Inteligência preditiva que analisa seus dados e sugere ações corretivas automáticas.",
          color: "amber-500"
        }, {
          icon: Users,
          title: "Competências",
          desc: "Matriz de soft/hard skills para gerir o capital humano com foco em performance.",
          color: "indigo-500"
        }].map((f, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "group relative border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-elegant hover:-translate-y-1 overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-opacity-10 transition-all group-hover:scale-110", `bg-${f.color}`, `text-${f.color}`), children: /* @__PURE__ */ jsxRuntimeExports.jsx(f.icon, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mb-2 text-lg font-bold text-primary group-hover:text-accent transition-colors", children: f.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: f.desc })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full", `bg-${f.color}`) })
        ] }, i)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "about", className: "py-24 border-y border-border/40 overflow-hidden relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2 gap-16 items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-accent font-bold uppercase tracking-widest text-xs mb-3", children: "Sobre a EXACTA" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-extrabold text-primary sm:text-4xl", children: "Filosofia da Precisão." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-lg leading-relaxed", children: "A EXACTA nasceu da necessidade de simplificar a complexidade. Acreditamos que a gestão não deve ser um fardo, mas uma alavanca para o crescimento. Nossa plataforma combina o rigor dos métodos tradicionais de administração com a flexibilidade da era digital." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-4", children: ["Foco absoluto na experiência do usuário (UX)", "Integração total entre módulos estratégicos e operacionais", "Apoio de Inteligência Artificial Generativa para decisões", "Escalabilidade para pequenas e grandes corporações"].map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: item })
            ] }, i)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pt-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-2xl bg-primary text-white space-y-2 shadow-xl animate-bounce-slow", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-2xl font-bold", children: "98%" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase opacity-70", children: "Aumento em produtividade" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-2xl border border-border bg-card space-y-2 shadow-lg", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-2xl font-bold text-accent", children: "24/7" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase text-muted-foreground", children: "Monitoramento inteligente" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-2xl border border-border bg-card space-y-2 shadow-lg", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-2xl font-bold text-primary", children: "IA" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase text-muted-foreground", children: "Insights Preditivos" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-2xl bg-accent text-accent-foreground space-y-2 shadow-xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-2xl font-bold", children: "100%" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase opacity-70", children: "Gestão Visual Integrada" })
              ] })
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "security", className: "py-24 bg-primary text-white relative overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:40px_40px]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:w-1/2 space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm border border-white/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mr-2 h-4 w-4 text-accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Segurança de Nível Bancário" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-extrabold sm:text-5xl", children: "Seus dados são seu maior ativo." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/70 text-lg", children: "Utilizamos criptografia ponta a ponta e infraestrutura redundante para garantir que sua estratégia corporativa esteja sempre protegida e disponível." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 pt-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-white/5 border border-white/10", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-bold text-accent mb-1", children: "Criptografia AES-256" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-white/50", children: "Proteção máxima em repouso e trânsito." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-white/5 border border-white/10", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-bold text-accent mb-1", children: "Conformidade LGPD" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-white/50", children: "Total controle sobre sua privacidade." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:w-1/3 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-accent blur-[80px] opacity-20" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-64 w-64 text-accent animate-float" })
          ] }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl font-extrabold text-primary mb-6", children: "Pronto para elevar o nível da sua gestão?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-10 max-w-2xl mx-auto", children: "Junte-se a centenas de líderes que já transformaram seus fluxos de trabalho com a EXACTA." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "bg-primary text-primary-foreground h-14 px-12 text-lg shadow-elegant hover:scale-105 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", search: {
          invite: void 0
        }, children: "Começar Gratuitamente" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "bg-background border-t border-border/40 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-4 gap-12 mb-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: ACTUAL_LOGO, alt: "EXACTA", className: "h-12 w-auto" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold text-primary tracking-tighter uppercase", children: "EXACTA" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-sm leading-relaxed", children: "A plataforma inteligente de gestão estratégica. Projetada para transformar dados em decisões precisas e equipes em motores de alta performance." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-bold text-primary mb-4 uppercase text-xs tracking-widest", children: "Produto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-3 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#features", className: "hover:text-accent transition-colors", children: "Funcionalidades" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "Soluções Corporativas" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "Atualizações" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "Preços" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "font-bold text-primary mb-4 uppercase text-xs tracking-widest", children: "Legal" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-3 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "Privacidade" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "Termos de Uso" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "Segurança" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "Cookies" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "© 2026 EXACTA Smart Project Flow. Todos os direitos reservados." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "Instagram" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "LinkedIn" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "X / Twitter" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Index as component
};
