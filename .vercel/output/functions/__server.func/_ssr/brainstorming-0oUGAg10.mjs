import { I as jsxRuntimeExports } from "./index.mjs";
import { b as Button, C as Card, e as CardHeader, f as CardTitle, d as CardDescription, c as CardContent, D as Dialog, t as DialogTrigger, o as DialogContent, r as DialogHeader, s as DialogTitle, p as DialogDescription, B as Badge } from "./router-Bktayy9l.mjs";
import { A as AppShell, P as Plus, f as MessageSquare, L as Lightbulb } from "./AppShell-OCwEkoGu.mjs";
import { a as Brain } from "./users-C5uEgJff.mjs";
import { S as Sparkles } from "./input-nTKCBTY6.mjs";
import { T as Target } from "./target-BBkqu7Bi.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "node:path";
import "node:url";
function BrainstormingPage() {
  const sessions = [{
    id: 1,
    title: "Lançamento Q3 - Campanha Digital",
    description: "Ideias para a nova campanha de marketing digital focada em SaaS.",
    tags: ["Marketing", "Digital"],
    participants: 5,
    lastUpdate: "2 horas atrás"
  }, {
    id: 2,
    title: "Refatoração de UX do Dashboard",
    description: "Mapeamento de pontos de fricção no onboarding de novos usuários.",
    tags: ["UX/UI", "Produto"],
    participants: 3,
    lastUpdate: "Ontem"
  }, {
    id: 3,
    title: "Estratégia de Expansão Latam",
    description: "Brainstorming sobre táticas de entrada no mercado mexicano e colombiano.",
    tags: ["Estratégia", "Vendas"],
    participants: 8,
    lastUpdate: "3 dias atrás"
  }];
  const templates = [{
    id: 1,
    title: "Matriz SWOT",
    desc: "Análise de Forças, Fraquezas, Oportunidades e Ameaças."
  }, {
    id: 2,
    title: "Design Sprint",
    desc: "Processo rápido para resolver problemas e testar ideias."
  }, {
    id: 3,
    title: "Mind Map",
    desc: "Estruture informações de forma visual e hierárquica."
  }, {
    id: 4,
    title: "Brainwriting",
    desc: "Geração de ideias silenciosa em equipe para máxima inclusão."
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Brainstorming" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Mapeie ideias e táticas de marketing com precisão." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
        " Nova Sessão"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-gradient-to-br from-accent/5 to-transparent border-accent/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-2 text-accent-foreground shadow-glow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Brainstorming com IA" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Use nossa IA para expandir suas ideias iniciais." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "w-full border-accent/30 hover:bg-accent/10", children: "Iniciar com IA" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-gradient-to-br from-primary/5 to-transparent border-primary/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-lg bg-primary flex items-center justify-center mb-2 text-primary-foreground shadow-elegant", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Táticas de Marketing" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Templates prontos para estratégias de crescimento." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "w-full border-primary/30 hover:bg-primary/10", children: "Ver Templates" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Templates de Brainstorming" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Escolha um framework para iniciar sua sessão." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4", children: templates.map((tpl) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "hover:border-primary/50 transition-colors cursor-pointer group", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm group-hover:text-primary transition-colors", children: tpl.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-xs mt-1 line-clamp-2", children: tpl.desc })
            ] }) }, tpl.id)) })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-gradient-to-br from-secondary/5 to-transparent border-secondary/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-2 text-secondary-foreground shadow-elegant", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Colaboração ao Vivo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Convide sua equipe para uma sessão em tempo real." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "w-full border-secondary/30 hover:bg-secondary/10", children: "Convidar Equipe" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold", children: "Sessões Recentes" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: sessions.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "group hover:shadow-elegant transition-all duration-300 border-white/10 bg-card/50 backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base group-hover:text-accent transition-colors", children: s.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { className: "h-4 w-4 text-accent/50 group-hover:text-accent" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "line-clamp-2", children: s.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: s.tags.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[10px] uppercase font-bold", children: t }, t)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-white/5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              s.participants,
              " participantes"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: s.lastUpdate })
          ] })
        ] })
      ] }, s.id)) })
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(BrainstormingPage, {}) });
export {
  SplitComponent as component
};
