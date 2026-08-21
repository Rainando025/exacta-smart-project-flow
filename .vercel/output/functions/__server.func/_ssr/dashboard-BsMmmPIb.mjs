import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, h as SquareCheckBig } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, aj as toast, ai as supabase, ac as isOverdue, b as Button, C as Card, L as Label$1, H as Popover, K as PopoverTrigger, J as PopoverContent, l as Clock, F as Link, ab as formatDate, ae as priorityColor, af as priorityLabel, a8 as createLucideIcon } from "./router-Bktayy9l.mjs";
import { u as useRole } from "./useRole-CfzsBAW-.mjs";
import { I as Input, S as Sparkles } from "./input-nTKCBTY6.mjs";
import { C as Checkbox } from "./checkbox-DqPIV1bo.mjs";
import { b as addBrandedHeader, a as addBrandedFooter } from "./pdf-BVNIhKRw.mjs";
import { C as Calendar, p as ptBR } from "./calendar-B9iwqwlp.mjs";
import { B as BottleneckAnalysis } from "./BottleneckAnalysis-CvOvEo7x.mjs";
import { F as FileDown } from "./file-down-C-76GfI8.mjs";
import { F as Funnel } from "./funnel-DDdTvvLZ.mjs";
import { T as TrendingUp } from "./trending-up-CSHZ27ty.mjs";
import { T as TriangleAlert } from "./triangle-alert-BLaYDMdg.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
import "./textarea-CGvy_XFp.mjs";
import "./shield-alert-B5hU69HF.mjs";
import "./zap-CmRyB6hR.mjs";
import "./refresh-cw-DLz0yuwe.mjs";
const __iconNode = [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      key: "1oefj6"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
  ["path", { d: "M8 13h2", key: "yr2amv" }],
  ["path", { d: "M14 13h2", key: "un5t4a" }],
  ["path", { d: "M8 17h2", key: "2yhykz" }],
  ["path", { d: "M14 17h2", key: "10kma7" }]
];
const FileSpreadsheet = createLucideIcon("file-spreadsheet", __iconNode);
function toCSV(rows, headers) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  return `${head}
${body}`;
}
function downloadCSV(filename, csv) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function CalendarWidget() {
  const [date, setDate] = reactExports.useState(/* @__PURE__ */ new Date());
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 shadow-card border-0 bg-card overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-sm mb-3 px-2", children: "Calendário" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Calendar,
      {
        mode: "single",
        selected: date,
        onSelect: setDate,
        locale: ptBR,
        className: "rounded-md border-0"
      }
    )
  ] });
}
function DashboardPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Dashboard, {}) });
}
const STATUS_OPTIONS = [{
  value: "todo",
  label: "A fazer"
}, {
  value: "doing",
  label: "Em andamento"
}, {
  value: "review",
  label: "Revisão"
}, {
  value: "done",
  label: "Concluído"
}];
function startOfMonthISO() {
  const d = /* @__PURE__ */ new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function todayISO() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function Dashboard() {
  const {
    profile,
    user
  } = useAuth();
  const {
    isGestor
  } = useRole();
  const [allTasks, setAllTasks] = reactExports.useState([]);
  const [projects, setProjects] = reactExports.useState([]);
  const [members, setMembers] = reactExports.useState([]);
  const [roles, setRoles] = reactExports.useState({});
  const [from, setFrom] = reactExports.useState(startOfMonthISO());
  const [to, setTo] = reactExports.useState(todayISO());
  const [memberFilter, setMemberFilter] = reactExports.useState([]);
  const [statusFilter, setStatusFilter] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("exacta-onboarding-seen");
    if (!hasSeenOnboarding) {
      toast.info("Bem-vindo à EXACTA!", {
        description: "Explore o seu novo dashboard inteligente. Use Ctrl+K para comandos rápidos.",
        duration: 1e4
      });
      localStorage.setItem("exacta-onboarding-seen", "true");
    }
  }, []);
  reactExports.useEffect(() => {
    (async () => {
      const mode = localStorage.getItem("exacta-mode") || "team";
      const isPersonal = mode === "personal";
      const [t, p, m, r] = await Promise.all([supabase.from("tasks").select("*").eq("is_personal", isPersonal).order("due_date", {
        ascending: true,
        nullsFirst: false
      }).limit(500), supabase.from("projects").select("*").order("created_at", {
        ascending: false
      }).limit(50), supabase.from("profiles").select("*"), supabase.from("user_roles").select("user_id,role")]);
      if (t.data) setAllTasks(t.data);
      if (p.data) setProjects(p.data);
      if (m.data) setMembers(m.data);
      if (r.data) setRoles(Object.fromEntries(r.data.map((x) => [x.user_id, x.role])));
    })();
  }, []);
  const tasks = reactExports.useMemo(() => {
    return allTasks.filter((t) => {
      const d = t.created_at ? new Date(t.created_at) : null;
      if (d) {
        if (from && d < /* @__PURE__ */ new Date(from + "T00:00:00")) return false;
        if (to && d > /* @__PURE__ */ new Date(to + "T23:59:59")) return false;
      }
      if (memberFilter.length && !memberFilter.includes(t.assignee_id || "")) return false;
      if (statusFilter.length && !statusFilter.includes(t.status)) return false;
      return true;
    });
  }, [allTasks, from, to, memberFilter, statusFilter]);
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status));
  const myTasks = tasks.filter((t) => t.assignee_id === user?.id && t.status !== "done").slice(0, 5);
  const productivity = total ? Math.round(done / total * 100) : 0;
  const now = /* @__PURE__ */ new Date();
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1e3);
  const dueSoon = tasks.filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    const d = new Date(t.due_date);
    return d >= now && d <= in3days;
  });
  const alerts = [...overdue, ...dueSoon].slice(0, 6);
  const buildTeamRows = () => {
    const visibleMembers = memberFilter.length ? members.filter((m) => memberFilter.includes(m.id)) : members;
    return visibleMembers.map((m) => {
      const mine = tasks.filter((t) => t.assignee_id === m.id);
      const d = mine.filter((t) => t.status === "done").length;
      const inProg = mine.filter((t) => t.status === "doing").length;
      const todo = mine.filter((t) => t.status === "todo").length;
      const review = mine.filter((t) => t.status === "review").length;
      const od = mine.filter((t) => isOverdue(t.due_date, t.status)).length;
      const completionDays = mine.filter((t) => t.status === "done" && t.completed_at && t.created_at).map((t) => (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / 864e5);
      const avgDays = completionDays.length ? (completionDays.reduce((a, b) => a + b, 0) / completionDays.length).toFixed(1) : "0";
      return {
        name: m.full_name || "Sem nome",
        role: roles[m.id] || "colaborador",
        total: mine.length,
        completed: d,
        in_progress: inProg,
        todo,
        review,
        overdue: od,
        completion_rate: mine.length ? `${Math.round(d / mine.length * 100)}%` : "0%",
        avg_completion_days: avgDays
      };
    });
  };
  const filterSummary = () => {
    const parts = [`Período: ${from} → ${to}`];
    if (statusFilter.length) parts.push(`Status: ${statusFilter.map((s) => STATUS_OPTIONS.find((o) => o.value === s)?.label || s).join(", ")}`);
    if (memberFilter.length) parts.push(`Equipe: ${members.filter((m) => memberFilter.includes(m.id)).map((m) => m.full_name).join(", ")}`);
    return parts.join(" • ");
  };
  const exportCSV = () => {
    const rows = buildTeamRows();
    if (!rows.length) {
      toast.error("Sem dados para exportar.");
      return;
    }
    downloadCSV(`exacta-produtividade-${todayISO()}.csv`, toCSV(rows));
    toast.success("CSV exportado!");
  };
  const exportPDF = async () => {
    const {
      default: jsPDF
    } = await import("./jspdf.node.min-C8q54cDs.mjs").then((n) => n.a);
    const {
      default: autoTable
    } = await import("./jspdf.plugin.autotable-CHV4x0GA.mjs");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = await addBrandedHeader(doc, "Produtividade da Equipe", "Resumo Geral", `Gerado em ${(/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR")} às ${(/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR")}`);
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const summary = filterSummary();
    const split = doc.splitTextToSize(summary, pw - 28);
    doc.text(split, 14, y);
    y += split.length * 5 + 6;
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.text("Resumo Geral", 14, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Métrica", "Valor"]],
      body: [["Total de tarefas", String(total)], ["Concluídas", String(done)], ["Em andamento", String(total - done - overdue.length)], ["Atrasadas", String(overdue.length)], ["Produtividade", `${productivity}%`], ["Projetos ativos", String(projects.filter((p) => p.status === "ativo").length)]],
      theme: "grid",
      headStyles: {
        fillColor: [30, 58, 138]
      },
      margin: {
        left: 14,
        right: 14
      }
    });
    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text("Distribuição por Status", 14, y);
    y += 8;
    const statusGroups = STATUS_OPTIONS.map((s, i) => ({
      label: s.label,
      count: tasks.filter((t) => t.status === s.value).length,
      color: [[100, 116, 139], [6, 182, 212], [124, 58, 237], [5, 150, 105]][i]
    }));
    const barMaxW = pw - 80;
    const maxCount = Math.max(...statusGroups.map((s) => s.count), 1);
    statusGroups.forEach((s) => {
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`${s.label} (${s.count})`, 14, y + 4);
      const barW = s.count / maxCount * barMaxW * 0.6;
      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      doc.rect(65, y - 1, barW, 6, "F");
      y += 10;
    });
    y += 6;
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text("Desempenho por Membro", 14, y);
    y += 4;
    const teamRows = buildTeamRows();
    autoTable(doc, {
      startY: y,
      head: [["Membro", "Função", "Total", "Concluídas", "Atrasadas", "Produtividade"]],
      body: teamRows.map((r) => [r.name, r.role, String(r.total), String(r.completed), String(r.overdue), r.completion_rate]),
      theme: "grid",
      headStyles: {
        fillColor: [30, 58, 138]
      },
      margin: {
        left: 14,
        right: 14
      }
    });
    addBrandedFooter(doc);
    doc.save("produtividade.pdf");
    toast.success("PDF exportado!");
  };
  const toggleArr = (arr, v, set) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 space-y-8 max-w-7xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Visão geral" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: [
          "Olá, ",
          profile?.full_name?.split(" ")[0] || "colaborador",
          " 👋"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Aqui está o pulso da sua operação hoje." })
      ] }),
      isGestor && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: exportCSV, variant: "outline", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileSpreadsheet, { className: "h-4 w-4" }),
          " Exportar CSV"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: exportPDF, variant: "outline", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4" }),
          " Exportar PDF"
        ] })
      ] })
    ] }),
    isGestor && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4 shadow-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "De" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: from, onChange: (e) => setFrom(e.target.value), className: "h-9 w-[150px]" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "Até" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: to, onChange: (e) => setTo(e.target.value), className: "h-9 w-[150px]" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "h-9 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-3 w-3" }),
          "Status ",
          statusFilter.length > 0 && `(${statusFilter.length})`
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverContent, { className: "w-56", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: STATUS_OPTIONS.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: statusFilter.includes(s.value), onCheckedChange: () => toggleArr(statusFilter, s.value, setStatusFilter) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: s.label })
        ] }, s.value)) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "h-9 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-3 w-3" }),
          "Equipe ",
          memberFilter.length > 0 && `(${memberFilter.length})`
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverContent, { className: "w-64 max-h-72 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: members.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: memberFilter.includes(m.id), onCheckedChange: () => toggleArr(memberFilter, m.id, setMemberFilter) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm truncate", children: m.full_name || "Sem nome" })
        ] }, m.id)) }) })
      ] }),
      (memberFilter.length > 0 || statusFilter.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
        setMemberFilter([]);
        setStatusFilter([]);
      }, children: "Limpar" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: SquareCheckBig, label: "Tarefas totais", value: total, accent: "primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: TrendingUp, label: "Concluídas", value: done, accent: "success" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Clock, label: "Em andamento", value: tasks.filter((t) => t.status !== "done").length, accent: "accent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: TriangleAlert, label: "Atrasadas", value: overdue.length, accent: "destructive" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6 bg-gradient-hero text-white border-0 shadow-elegant overflow-hidden relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-start gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-xl bg-accent/20 backdrop-blur flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-6 w-6 text-accent" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-widest text-accent", children: "Produtividade da equipe" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display text-4xl font-bold mt-1", children: [
            productivity,
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-white/70 mt-1", children: [
            done,
            " de ",
            total,
            " tarefas concluídas"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-gradient-accent transition-all duration-1000", style: {
            width: `${productivity}%`
          } }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6 shadow-card border-l-4 border-l-destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-destructive" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-lg font-bold", children: "Alertas de prazo" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          overdue.length,
          " atrasada(s) • ",
          dueSoon.length,
          " vence(m) em breve"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-2 gap-2", children: [
        alerts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground py-4 col-span-full text-center", children: "Nenhum alerta. Você está em dia! ✨" }),
        alerts.map((t) => {
          const od = isOverdue(t.due_date, t.status);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/tasks", className: "flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-2 w-2 rounded-full shrink-0 ${od ? "bg-destructive" : "bg-accent"}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm truncate", children: t.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-xs ${od ? "text-destructive" : "text-muted-foreground"}`, children: [
                od ? "Atrasada" : "Vence",
                " • ",
                formatDate(t.due_date)
              ] })
            ] })
          ] }, t.id);
        })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6 shadow-card lg:col-span-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-lg font-bold", children: "Minhas tarefas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/tasks", className: "text-xs text-accent hover:underline", children: "Ver todas →" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          myTasks.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: "Nenhuma tarefa atribuída a você. ✨" }),
          myTasks.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full", style: {
              backgroundColor: priorityColor(t.priority)
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm truncate", children: t.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                priorityLabel(t.priority),
                " • ",
                formatDate(t.due_date)
              ] })
            ] })
          ] }, t.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6 shadow-card lg:col-span-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-lg font-bold", children: "Projetos ativos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/projects", className: "text-xs text-accent hover:underline", children: "Ver todos →" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          projects.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: "Nenhum projeto ainda. Crie o primeiro!" }),
          projects.slice(0, 5).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2.5 w-2.5 rounded-sm", style: {
                  backgroundColor: p.color
                } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium truncate", children: p.name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                p.progress,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-gradient-accent", style: {
              width: `${p.progress}%`
            } }) })
          ] }, p.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarWidget, {}) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BottleneckAnalysis, { data: {
      tasks,
      overdue,
      projects,
      productivity
    } }) })
  ] });
}
function StatCard({
  icon: Icon,
  label,
  value,
  accent
}) {
  const colors = {
    primary: "from-primary/10 to-primary/5 text-primary",
    success: "from-success/10 to-success/5 text-success",
    accent: "from-accent/15 to-accent/5 text-accent",
    destructive: "from-destructive/10 to-destructive/5 text-destructive"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 shadow-card border-0 bg-card relative overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br ${colors[accent]} blur-2xl opacity-50` }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `h-5 w-5 ${colors[accent].split(" ").pop()}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl lg:text-3xl font-display font-bold mt-3", children: value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: label })
    ] })
  ] });
}
export {
  DashboardPage as component
};
