import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, P as Plus, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, D as Dialog, t as DialogTrigger, b as Button, o as DialogContent, r as DialogHeader, s as DialogTitle, L as Label$1, q as DialogFooter, C as Card, a3 as cn, B as Badge, k as CircleCheck, aj as toast, ai as supabase, a8 as createLucideIcon } from "./router-Bktayy9l.mjs";
import { u as useRole } from "./useRole-CfzsBAW-.mjs";
import { P as Progress } from "./progress-DuRzMOu1.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { B as BottleneckAnalysis } from "./BottleneckAnalysis-CvOvEo7x.mjs";
import { C as ChartColumn } from "./chart-column-CcM7ihUv.mjs";
import { a as ArrowUpRight, A as ArrowDownRight } from "./arrow-up-right-sY3HdY_z.mjs";
import { P as Pencil } from "./pencil-BPpfGdWw.mjs";
import { T as Target } from "./target-BBkqu7Bi.mjs";
import { T as TrendingUp } from "./trending-up-CSHZ27ty.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./triangle-alert-BLaYDMdg.mjs";
import "./shield-alert-B5hU69HF.mjs";
import "./zap-CmRyB6hR.mjs";
import "./refresh-cw-DLz0yuwe.mjs";
const __iconNode = [
  [
    "path",
    {
      d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
      key: "169zse"
    }
  ]
];
const Activity = createLucideIcon("activity", __iconNode);
function OKRsPage() {
  const {
    user
  } = useAuth();
  const {
    isGestor
  } = useRole();
  const [kpis, setKpis] = reactExports.useState([]);
  const [okrs, setOkrs] = reactExports.useState([]);
  const [departments, setDepartments] = reactExports.useState([]);
  const [projects, setProjects] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [openKpi, setOpenKpi] = reactExports.useState(false);
  const [newKpi, setNewKpi] = reactExports.useState({
    name: "",
    goal: "",
    current_value: "",
    unit: "%",
    department_id: "",
    project_id: "",
    period_month: (/* @__PURE__ */ new Date()).getMonth() + 1,
    period_year: (/* @__PURE__ */ new Date()).getFullYear()
  });
  const [editingKpi, setEditingKpi] = reactExports.useState(null);
  const [openOkr, setOpenOkr] = reactExports.useState(false);
  const [newOkr, setNewOkr] = reactExports.useState({
    title: "",
    description: "",
    project_id: ""
  });
  const loadData = async () => {
    setLoading(true);
    const {
      data: kpiData
    } = await supabase.from("kpis").select("*, departments(name), projects(name)");
    const {
      data: okrData
    } = await supabase.from("okrs").select("*, projects(name)");
    const {
      data: deptData
    } = await supabase.from("departments").select("*");
    const {
      data: projData
    } = await supabase.from("projects").select("*");
    if (kpiData) setKpis(kpiData);
    if (okrData) setOkrs(okrData);
    if (deptData) setDepartments(deptData);
    if (projData) setProjects(projData);
    setLoading(false);
  };
  reactExports.useEffect(() => {
    loadData();
  }, []);
  const handleCreateKpi = async () => {
    if (!newKpi.name || !newKpi.department_id) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const {
      error
    } = await supabase.from("kpis").insert({
      ...newKpi,
      department_id: newKpi.department_id || null,
      project_id: newKpi.project_id || null,
      goal: Number(newKpi.goal),
      current_value: Number(newKpi.current_value),
      created_by: user?.id
    });
    if (error) {
      toast.error("Erro ao criar KPI");
    } else {
      toast.success("KPI criado com sucesso!");
      setOpenKpi(false);
      setNewKpi({
        name: "",
        goal: "",
        current_value: "",
        unit: "%",
        department_id: "",
        project_id: "",
        period_month: (/* @__PURE__ */ new Date()).getMonth() + 1,
        period_year: (/* @__PURE__ */ new Date()).getFullYear()
      });
      loadData();
    }
  };
  const handleUpdateKpi = async () => {
    if (!editingKpi) return;
    const {
      error
    } = await supabase.from("kpis").update({
      name: editingKpi.name,
      goal: Number(editingKpi.goal),
      current_value: Number(editingKpi.current_value),
      unit: editingKpi.unit,
      department_id: editingKpi.department_id || null,
      project_id: editingKpi.project_id || null
    }).eq("id", editingKpi.id);
    if (error) {
      toast.error("Erro ao atualizar KPI");
    } else {
      toast.success("KPI atualizado!");
      setEditingKpi(null);
      loadData();
    }
  };
  const handleDeleteKpi = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este indicador permanentemente?")) return;
    const {
      error
    } = await supabase.from("kpis").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir KPI");
    } else {
      toast.success("KPI excluído!");
      loadData();
    }
  };
  const getProgress = (current, goal) => {
    if (goal === 0) return 0;
    const p = current / goal * 100;
    return Math.min(Math.round(p), 100);
  };
  const handleCreateOkr = async () => {
    if (!newOkr.title) {
      toast.error("Preencha o título do OKR");
      return;
    }
    const {
      error
    } = await supabase.from("okrs").insert({
      title: newOkr.title,
      description: newOkr.description,
      project_id: newOkr.project_id || null,
      owner_id: user?.id,
      status: "em_andamento",
      progress: 0
    });
    if (error) {
      toast.error("Erro ao criar OKR");
    } else {
      toast.success("OKR criado com sucesso!");
      setOpenOkr(false);
      setNewOkr({
        title: "",
        description: "",
        project_id: ""
      });
      loadData();
    }
  };
  const handleDeleteOkr = async (id) => {
    if (!confirm("Excluir este OKR permanentemente? Todas as sub-metas serão perdidas.")) return;
    const {
      error
    } = await supabase.from("okrs").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir OKR");
    } else {
      toast.success("OKR excluído!");
      loadData();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 max-w-7xl mx-auto space-y-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Estratégia & Performance" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Metas, OKRs e KPIs" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Acompanhe o desempenho estratégico e indicadores de cada setor." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: openOkr, onOpenChange: setOpenOkr, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
            " Novo OKR"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Novo OKR" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título / Objetivo" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Ex: Aumentar faturamento...", value: newOkr.title, onChange: (e) => setNewOkr({
                  ...newOkr,
                  title: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Descrição" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { placeholder: "Detalhes...", value: newOkr.description, onChange: (e) => setNewOkr({
                  ...newOkr,
                  description: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Projeto (Opcional)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", value: newOkr.project_id, onChange: (e) => setNewOkr({
                  ...newOkr,
                  project_id: e.target.value
                }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Selecione um projeto" }),
                  projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.id, children: p.name }, p.id))
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreateOkr, className: "bg-gradient-primary", children: "Criar OKR" }) })
          ] })
        ] }),
        isGestor && /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: openKpi, onOpenChange: setOpenKpi, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-gradient-primary text-primary-foreground gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-4 w-4" }),
            " Novo KPI"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Novo Indicador (KPI)" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Nome do Indicador" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Ex: NPS, Faturamento, Taxa de Conversão", value: newKpi.name, onChange: (e) => setNewKpi({
                  ...newKpi,
                  name: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Meta Mensal" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: newKpi.goal, onChange: (e) => setNewKpi({
                    ...newKpi,
                    goal: e.target.value
                  }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Unidade" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", value: newKpi.unit, onChange: (e) => setNewKpi({
                    ...newKpi,
                    unit: e.target.value
                  }), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "%", children: "%" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "R$", children: "R$" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "UN", children: "Unidades" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "H", children: "Horas" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Setor / Departamento" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", value: newKpi.department_id, onChange: (e) => setNewKpi({
                    ...newKpi,
                    department_id: e.target.value
                  }), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Selecione um setor" }),
                    departments.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: d.id, children: d.name }, d.id))
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Projeto" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", value: newKpi.project_id, onChange: (e) => setNewKpi({
                    ...newKpi,
                    project_id: e.target.value
                  }), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Selecione um projeto" }),
                    projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.id, children: p.name }, p.id))
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreateKpi, className: "bg-gradient-primary", children: "Criar KPI" }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "h-5 w-5 text-accent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-xl", children: "Indicadores de Setores (KPIs)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: loading ? Array(4).fill(0).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6 h-32 animate-pulse bg-muted/50" }, i)) : kpis.length > 0 ? kpis.map((kpi) => {
        const progress = getProgress(kpi.current_value, kpi.goal);
        const isMeetingGoal = progress >= 100;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 shadow-card hover:shadow-elegant transition-all border-l-4 border-l-accent overflow-hidden group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase font-bold text-muted-foreground tracking-widest", children: kpi.departments?.name || "Geral" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-sm leading-tight mt-1 group-hover:text-accent transition-colors", children: kpi.name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("p-1.5 rounded-lg", isMeetingGoal ? "bg-success/10 text-success" : "bg-warning/10 text-warning"), children: isMeetingGoal ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownRight, { className: "h-4 w-4" }) })
          ] }),
          isGestor && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditingKpi(kpi), className: "p-1 rounded bg-background border hover:bg-muted text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDeleteKpi(kpi.id), className: "p-1 rounded bg-background border hover:bg-destructive hover:text-destructive-foreground text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xl font-bold font-display", children: [
                kpi.unit === "R$" && "R$ ",
                kpi.current_value.toLocaleString(),
                kpi.unit !== "R$" && kpi.unit
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "/ meta ",
                kpi.goal,
                kpi.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px] font-bold uppercase", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Atingimento" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  progress,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: progress, className: cn("h-1.5", isMeetingGoal ? "bg-success/20 [&>div]:bg-success" : "") })
            ] })
          ] })
        ] }, kpi.id);
      }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "col-span-full p-10 flex flex-col items-center justify-center text-muted-foreground border-dashed", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-10 w-10 mb-2 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Nenhum KPI cadastrado para este período." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-5 w-5 text-accent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-xl", children: "Objetivos Estratégicos (OKRs)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6", children: loading ? Array(2).fill(0).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6 h-40 animate-pulse bg-muted/50" }, i)) : okrs.length > 0 ? okrs.map((okr) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6 shadow-card hover:border-accent/40 transition-all border-l-4 border-l-accent relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "absolute top-6 right-6 capitalize bg-accent/5 text-accent border-accent/20", children: okr.projects?.name || "Geral" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-7 w-7 text-accent" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-2xl tracking-tight", children: okr.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground flex items-center gap-2 mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Progresso Atual: ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-foreground font-medium", children: [
                  okr.progress,
                  "%"
                ] })
              ] })
            ] }),
            okr.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-2 text-muted-foreground", children: okr.description })
          ] }),
          isGestor && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toast.info("Editar OKR (Em breve)"), className: "p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDeleteOkr(okr.id), className: "p-2 rounded-lg bg-muted/50 hover:bg-destructive hover:text-destructive-foreground transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-3 gap-8 items-center pt-6 border-t", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: "Progresso do Objetivo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
                okr.progress,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: okr.progress, className: "h-2.5" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6 justify-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase font-bold text-muted-foreground tracking-widest", children: "Status" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold capitalize text-accent", children: okr.status.replace("_", " ") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-px bg-border" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase font-bold text-muted-foreground tracking-widest", children: "Tendência" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 justify-end text-success font-bold text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "-" })
              ] })
            ] })
          ] })
        ] })
      ] }, okr.id)) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "col-span-full p-10 flex flex-col items-center justify-center text-muted-foreground border-dashed", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-10 w-10 mb-2 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Nenhum OKR cadastrado." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-5 w-5 text-destructive" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-xl text-destructive", children: "Gargalos e Soluções (IA)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BottleneckAnalysis, { data: {
        kpis
      } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editingKpi, onOpenChange: (o) => !o && setEditingKpi(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Editar Indicador (KPI)" }) }),
      editingKpi && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Nome do Indicador" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: editingKpi.name, onChange: (e) => setEditingKpi({
            ...editingKpi,
            name: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Meta" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: editingKpi.goal, onChange: (e) => setEditingKpi({
              ...editingKpi,
              goal: e.target.value
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Valor Atual" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: editingKpi.current_value, onChange: (e) => setEditingKpi({
              ...editingKpi,
              current_value: e.target.value
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Setor" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", value: editingKpi.department_id || "", onChange: (e) => setEditingKpi({
              ...editingKpi,
              department_id: e.target.value
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Selecione um setor" }),
              departments.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: d.id, children: d.name }, d.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Projeto" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", value: editingKpi.project_id || "", onChange: (e) => setEditingKpi({
              ...editingKpi,
              project_id: e.target.value
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Selecione um projeto" }),
              projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.id, children: p.name }, p.id))
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleUpdateKpi, className: "bg-gradient-primary", children: "Salvar Alterações" }) })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(OKRsPage, {}) });
export {
  SplitComponent as component
};
