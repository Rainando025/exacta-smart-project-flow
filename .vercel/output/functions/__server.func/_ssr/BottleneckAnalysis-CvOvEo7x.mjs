import { S as reactExports, I as jsxRuntimeExports } from "./index.mjs";
import { ak as useAuth, C as Card, D as Dialog, t as DialogTrigger, b as Button, o as DialogContent, r as DialogHeader, s as DialogTitle, L as Label$1, q as DialogFooter, B as Badge, a3 as cn, k as CircleCheck, ai as supabase, aj as toast } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { P as Plus, d as LoaderCircle, M as Markdown, j as Trash2, m as askGroq, l as askGemini } from "./AppShell-OCwEkoGu.mjs";
import { T as TriangleAlert } from "./triangle-alert-BLaYDMdg.mjs";
import { S as ShieldAlert } from "./shield-alert-B5hU69HF.mjs";
import { Z as Zap } from "./zap-CmRyB6hR.mjs";
import { R as RefreshCw } from "./refresh-cw-DLz0yuwe.mjs";
function BottleneckAnalysis({ data }) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const [manualBottlenecks, setManualBottlenecks] = reactExports.useState([]);
  const [departments, setDepartments] = reactExports.useState([]);
  const [openManual, setOpenManual] = reactExports.useState(false);
  const [newB, setNewB] = reactExports.useState({
    title: "",
    description: "",
    department_id: "",
    impact_level: "medio",
    suggested_solution: ""
  });
  const loadManual = async () => {
    const { data: bData } = await supabase.from("bottlenecks").select("*, departments(name)").order("created_at", { ascending: false });
    if (bData) setManualBottlenecks(bData);
    const { data: dData } = await supabase.from("departments").select("*");
    if (dData) setDepartments(dData);
  };
  reactExports.useEffect(() => {
    loadManual();
  }, []);
  const runAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `
        Analise os seguintes dados do sistema de gestão EXACTA e identifique GARGALOS (problemas de produtividade, atrasos, sobrecarga).
        Dados: ${JSON.stringify(data)}
        Gargalos Manuais já reportados: ${JSON.stringify(manualBottlenecks)}
        
        Para cada gargalo encontrado:
        1. Descreva o problema.
        2. Explique o impacto.
        3. Sugira como solucionar/selecionar a melhor abordagem.
        
        Use um tom profissional, direto e executivo. Responda em Markdown com emojis.
      `;
      let response;
      try {
        response = await askGroq(prompt);
      } catch {
        response = await askGemini(prompt);
      }
      setAnalysis(response || "Não foi possível gerar a análise.");
    } catch (error) {
      toast.error("Erro ao analisar gargalos.");
    } finally {
      setLoading(false);
    }
  };
  const createManualBottleneck = async () => {
    if (!newB.title || !newB.description || !newB.department_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const { error } = await supabase.from("bottlenecks").insert({
      ...newB,
      created_by: user?.id
    });
    if (error) {
      toast.error("Erro ao registrar gargalo");
    } else {
      toast.success("Gargalo registrado com sucesso!");
      setOpenManual(false);
      setNewB({ title: "", description: "", department_id: "", impact_level: "medio", suggested_solution: "" });
      loadManual();
    }
  };
  const updateStatus = async (id, status) => {
    const { error } = await supabase.from("bottlenecks").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else loadManual();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6 shadow-card border-destructive/20 relative overflow-hidden group bg-gradient-to-br from-card to-destructive/5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-32 w-32 text-destructive" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-7 w-7 text-destructive" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-xl", children: "Diagnóstico de Gargalos (IA)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "O JARVIS analisa dados e gargalos manuais para sugerir melhorias." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: openManual, onOpenChange: setOpenManual, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2 border-destructive/20 hover:bg-destructive/10 hover:text-destructive", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
                " Reportar Gargalo"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Reportar Novo Gargalo" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título do Problema" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: newB.title, onChange: (e) => setNewB({ ...newB, title: e.target.value }), placeholder: "Ex: Lentidão no setor de compras" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Descrição Detalhada" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: newB.description, onChange: (e) => setNewB({ ...newB, description: e.target.value }), placeholder: "Explique o que está travando o processo..." })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Setor Afetado" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "select",
                        {
                          className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-destructive",
                          value: newB.department_id,
                          onChange: (e) => setNewB({ ...newB, department_id: e.target.value }),
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Selecione..." }),
                            departments.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: d.id, children: d.name }, d.id))
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Nível de Impacto" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "select",
                        {
                          className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-destructive",
                          value: newB.impact_level,
                          onChange: (e) => setNewB({ ...newB, impact_level: e.target.value }),
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "baixo", children: "Baixo" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medio", children: "Médio" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "alto", children: "Alto" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "critico", children: "Crítico" })
                          ]
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Sugestão de Solução (Opcional)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: newB.suggested_solution, onChange: (e) => setNewB({ ...newB, suggested_solution: e.target.value }), placeholder: "Como podemos resolver?" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: createManualBottleneck, className: "bg-destructive text-white hover:bg-destructive/90", children: "Registrar Problema" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: runAnalysis,
                disabled: loading,
                className: "bg-destructive text-white hover:bg-destructive/90 gap-2 shadow-lg shadow-destructive/20",
                children: [
                  loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-4 w-4" }),
                  "IA Diagnosticar"
                ]
              }
            )
          ] })
        ] }),
        analysis ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 p-5 rounded-2xl bg-card border border-destructive/10 prose prose-sm max-w-none dark:prose-invert shadow-inner", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Markdown, { children: analysis }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => setAnalysis(null), className: "text-[10px] uppercase tracking-widest font-bold", children: "Limpar Diagnóstico" }) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 py-8 border-2 border-dashed border-destructive/10 rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-destructive/5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-10 w-10 mb-3 opacity-20 animate-spin-slow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Pronto para diagnóstico inteligente." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: manualBottlenecks.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: cn(
      "p-5 shadow-card border-l-4 transition-all hover:scale-[1.01]",
      b.impact_level === "critico" ? "border-l-destructive" : b.impact_level === "alto" ? "border-l-orange-500" : "border-l-warning"
    ), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: cn(
            "uppercase text-[10px] tracking-tighter",
            b.impact_level === "critico" ? "bg-destructive" : b.impact_level === "alto" ? "bg-orange-500" : "bg-warning"
          ), children: b.impact_level }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-muted-foreground uppercase", children: b.departments?.name })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
          b.status !== "resolvido" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => updateStatus(b.id, "resolvido"), className: "p-1 hover:bg-success/10 text-success rounded", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "p-1 hover:bg-muted text-muted-foreground rounded", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-bold text-lg mb-1", children: b.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4 line-clamp-2", children: b.description }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-border/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full bg-accent animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase text-muted-foreground", children: b.status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: new Date(b.created_at).toLocaleDateString() })
      ] })
    ] }, b.id)) })
  ] });
}
export {
  BottleneckAnalysis as B
};
