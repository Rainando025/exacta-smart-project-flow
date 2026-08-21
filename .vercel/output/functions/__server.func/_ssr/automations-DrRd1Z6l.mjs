import { I as jsxRuntimeExports } from "./index.mjs";
import { b as Button, C as Card, e as CardHeader, f as CardTitle, d as CardDescription, c as CardContent, B as Badge, _ as Settings2 } from "./router-Bktayy9l.mjs";
import { S as Switch } from "./switch-BYUmqUo6.mjs";
import { A as AppShell, c as Cpu, P as Plus, k as UserPlus, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { Z as Zap } from "./zap-CmRyB6hR.mjs";
import { M as Mail } from "./mail-BtVOGUiJ.mjs";
import { A as ArrowRight } from "./arrow-right-DEuSowZh.mjs";
import { P as Play } from "./play-4h6KaSAP.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./input-nTKCBTY6.mjs";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
function AutomationsPage() {
  const automations = [{
    id: 1,
    name: "Auto-atribuir Designer",
    trigger: "Tarefa criada em 'Marketing'",
    action: "Atribuir a @MarianaDesign",
    icon: UserPlus,
    active: true,
    executions: 124
  }, {
    id: 2,
    name: "Notificar Finalização",
    trigger: "Status muda para 'Concluído'",
    action: "Enviar e-mail para Gestor",
    icon: Mail,
    active: true,
    executions: 89
  }, {
    id: 3,
    name: "Urgência Automática",
    trigger: "Prazo vence em < 24h",
    action: "Mudar prioridade para 'Crítica'",
    icon: Zap,
    active: false,
    executions: 45
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-amber-500/10 text-amber-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Automações" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Automatize fluxos de trabalho, mudanças de status e notificações." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
        " Criar Automação"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-12 w-12 text-amber-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-3xl font-bold", children: "258" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Execuções este mês" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-green-500 font-medium", children: "↑ 12% em relação ao mês anterior" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card/40 backdrop-blur-sm border-white/5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-3xl font-bold", children: "12h" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Tempo economizado" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Estimativa baseada em tarefas manuais" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card/40 backdrop-blur-sm border-white/5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-3xl font-bold", children: "08" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Automações ativas" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "De um total de 12 configuradas" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold", children: "Minhas Automações" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", children: "Ver histórico de execuções" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: automations.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-white/5 bg-card/30 hover:bg-card/50 transition-all duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-2xl bg-sidebar flex items-center justify-center text-accent shadow-elegant border border-white/5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(a.icon, { className: "h-6 w-6" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-lg", children: a.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "bg-white/5 text-[10px]", children: [
                "SE: ",
                a.trigger
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3 text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "bg-accent/10 text-accent border-accent/20 text-[10px]", children: [
                "ENTÃO: ",
                a.action
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right hidden md:block", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-1", children: "Execuções" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-bold", children: a.executions })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 border-l border-white/5 pl-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase font-bold tracking-wider text-muted-foreground", children: "Status" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: a.active })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 ml-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
            ] })
          ] })
        ] })
      ] }) }) }, a.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-dashed border-white/10 p-8 text-center bg-accent/5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-8 w-8 mx-auto mb-3 text-accent/40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Precisa de algo mais complexo?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Conecte com Zapier, Make ou use nossa API nativa para automações avançadas." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", children: "Explorar Integrações" })
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AutomationsPage, {}) });
export {
  SplitComponent as component
};
