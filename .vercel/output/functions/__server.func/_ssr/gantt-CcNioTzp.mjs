import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, P as Plus, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, ai as supabase, b as Button, D as Dialog, t as DialogTrigger, o as DialogContent, r as DialogHeader, s as DialogTitle, L as Label$1, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, q as DialogFooter, $ as X, C as Card, ae as priorityColor, P as PRIORITIES, U as STATUSES, aj as toast, a8 as createLucideIcon } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { u as useRole } from "./useRole-CfzsBAW-.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { C as CalendarRange } from "./users-C5uEgJff.mjs";
import { C as Calendar } from "./calendar-DYvPAJmB.mjs";
import { P as Pencil } from "./pencil-BPpfGdWw.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
const __iconNode$2 = [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }],
  ["path", { d: "M8 14h.01", key: "6423bh" }],
  ["path", { d: "M12 14h.01", key: "1etili" }],
  ["path", { d: "M16 14h.01", key: "1gbofw" }],
  ["path", { d: "M8 18h.01", key: "lrp35t" }],
  ["path", { d: "M12 18h.01", key: "mhygvu" }],
  ["path", { d: "M16 18h.01", key: "kzsmim" }]
];
const CalendarDays = createLucideIcon("calendar-days", __iconNode$2);
const __iconNode$1 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 16v-4", key: "1dtifu" }],
  ["path", { d: "M12 8h.01", key: "e9boi3" }]
];
const Info = createLucideIcon("info", __iconNode$1);
const __iconNode = [
  ["path", { d: "M9 17H7A5 5 0 0 1 7 7h2", key: "8i5ue5" }],
  ["path", { d: "M15 7h2a5 5 0 1 1 0 10h-2", key: "1b9ql8" }],
  ["line", { x1: "8", x2: "16", y1: "12", y2: "12", key: "1jonct" }]
];
const Link2 = createLucideIcon("link-2", __iconNode);
const ROW_HEIGHT = 48;
const LABEL_WIDTH = 256;
function GanttPage() {
  const {
    user
  } = useAuth();
  const [tasks, setTasks] = reactExports.useState([]);
  const [projects, setProjects] = reactExports.useState([]);
  const [profiles, setProfiles] = reactExports.useState([]);
  const [deps, setDeps] = reactExports.useState([]);
  const [linkFrom, setLinkFrom] = reactExports.useState(null);
  const [hoverTask, setHoverTask] = reactExports.useState(null);
  const [mousePos, setMousePos] = reactExports.useState(null);
  const [viewMode, setViewMode] = reactExports.useState("days");
  const [newGanttOpen, setNewGanttOpen] = reactExports.useState(false);
  const [newGanttData, setNewGanttData] = reactExports.useState({
    title: "",
    projectId: "",
    days: 7,
    assigneeId: "",
    predecessorId: "none"
  });
  const containerRef = reactExports.useRef(null);
  const {
    canDeleteTask,
    canEditTask
  } = useRole();
  const [editingTask, setEditingTask] = reactExports.useState(null);
  const [dragging, setDragging] = reactExports.useState(null);
  const dayWidth = viewMode === "days" ? 40 : viewMode === "weeks" ? 12 : 3;
  const load = async () => {
    const t = await supabase.from("tasks").select("*").eq("is_personal", false).not("due_date", "is", null).order("due_date");
    const p = await supabase.from("projects").select("*");
    const pr = await supabase.from("profiles").select("id, full_name");
    const d = await supabase.from("task_dependencies").select("*");
    if (t.data) setTasks(t.data);
    if (p.data) setProjects(p.data);
    if (pr.data) setProfiles(pr.data);
    if (d.data) setDeps(d.data);
  };
  reactExports.useEffect(() => {
    load();
    const ch = supabase.channel("gantt-deps").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "task_dependencies"
    }, load).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "tasks"
    }, load).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);
  const {
    rangeStart,
    totalDays,
    items
  } = reactExports.useMemo(() => {
    if (tasks.length === 0) return {
      rangeStart: /* @__PURE__ */ new Date(),
      totalDays: 30,
      items: []
    };
    const dates = tasks.flatMap((t) => [new Date(t.due_date).getTime(), t.start_date ? new Date(t.start_date).getTime() : new Date(t.due_date).getTime() - 3 * 864e5]);
    const min = Math.min(...dates, Date.now());
    const max = Math.max(...dates, Date.now() + 14 * 864e5);
    const start = new Date(min);
    start.setDate(start.getDate() - 2);
    const extraDays = viewMode === "months" ? 180 : 5;
    const total = Math.ceil((max - start.getTime()) / 864e5) + extraDays;
    const items2 = tasks.map((t, idx) => {
      const taskStart = t.start_date ? new Date(t.start_date) : new Date(new Date(t.due_date).getTime() - 3 * 864e5);
      const offsetDays = Math.max(0, (taskStart.getTime() - start.getTime()) / 864e5);
      const duration = Math.max(1, (new Date(t.due_date).getTime() - taskStart.getTime()) / 864e5);
      return {
        ...t,
        offsetDays,
        duration,
        rowIndex: idx,
        actualStart: taskStart,
        actualDue: new Date(t.due_date)
      };
    });
    return {
      rangeStart: start,
      totalDays: total,
      items: items2
    };
  }, [tasks, viewMode]);
  const todayOffset = Math.floor((Date.now() - rangeStart.getTime()) / 864e5);
  const itemById = reactExports.useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const arrows = reactExports.useMemo(() => {
    return deps.map((d) => {
      const from = itemById[d.predecessor_id];
      const to = itemById[d.successor_id];
      if (!from || !to) return null;
      const x1 = (from.offsetDays + from.duration) * dayWidth - 2;
      const y1 = from.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
      const x2 = to.offsetDays * dayWidth;
      const y2 = to.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
      return {
        id: d.id,
        x1,
        y1,
        x2,
        y2
      };
    }).filter(Boolean);
  }, [deps, itemById, dayWidth]);
  const startLink = (taskId, e) => {
    e.stopPropagation();
    setLinkFrom(taskId);
  };
  const finishLink = async (toId) => {
    if (!linkFrom || !user || linkFrom === toId) {
      setLinkFrom(null);
      return;
    }
    const isCycle = deps.some((d) => d.predecessor_id === toId && d.successor_id === linkFrom);
    if (isCycle) {
      toast.error("Já existe vínculo no sentido contrário");
      setLinkFrom(null);
      return;
    }
    const {
      error
    } = await supabase.from("task_dependencies").insert({
      predecessor_id: linkFrom,
      successor_id: toId,
      created_by: user.id
    });
    if (error) {
      if (error.code === "23505") toast.error("Vínculo já existe");
      else toast.error(error.message);
    } else {
      toast.success("Dependência criada");
      const fromTask = tasks.find((t) => t.id === linkFrom);
      const toTask = tasks.find((t) => t.id === toId);
      if (fromTask && toTask) {
        const fromEnd = new Date(fromTask.due_date).getTime();
        const toStart = toTask.start_date ? new Date(toTask.start_date).getTime() : new Date(toTask.due_date).getTime() - 864e5;
        if (toStart < fromEnd) {
          const diff = fromEnd - toStart;
          await cascadePushTask(toId, diff);
        }
      }
    }
    setLinkFrom(null);
  };
  const cascadePushTask = async (taskId, pushMs) => {
    if (pushMs <= 0) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStart = new Date((task.start_date ? new Date(task.start_date).getTime() : new Date(task.due_date).getTime() - 864e5) + pushMs).toISOString();
    const newDue = new Date(new Date(task.due_date).getTime() + pushMs).toISOString();
    const {
      error
    } = await supabase.from("tasks").update({
      start_date: newStart,
      due_date: newDue
    }).eq("id", taskId);
    if (!error) {
      const successors = deps.filter((d) => d.predecessor_id === taskId);
      for (const dep of successors) {
        await cascadePushTask(dep.successor_id, pushMs);
      }
    }
  };
  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    if (dragging) {
      const deltaX = e.clientX - dragging.startX;
      const deltaDays = Math.round(deltaX / dayWidth);
      const deltaMs = deltaDays * 864e5;
      setTasks((prev) => prev.map((t) => {
        if (t.id === dragging.id) {
          if (dragging.type === "move") {
            return {
              ...t,
              start_date: new Date(dragging.initialStart + deltaMs).toISOString(),
              due_date: new Date(dragging.initialDue + deltaMs).toISOString()
            };
          } else if (dragging.type === "resize") {
            const newDueTime = Math.max(dragging.initialStart + 864e5, dragging.initialDue + deltaMs);
            return {
              ...t,
              due_date: new Date(newDueTime).toISOString()
            };
          }
        }
        return t;
      }));
    }
  };
  const handleMouseUp = async () => {
    if (dragging) {
      const task = tasks.find((t) => t.id === dragging.id);
      if (task) {
        new Date(task.start_date).getTime();
        const currentDueMs = new Date(task.due_date).getTime();
        const pushMs = currentDueMs - dragging.initialDue;
        const {
          error
        } = await supabase.from("tasks").update({
          start_date: task.start_date,
          due_date: task.due_date
        }).eq("id", task.id);
        if (error) {
          toast.error("Erro ao salvar datas");
          load();
        } else {
          toast.success("Datas ajustadas");
          if (pushMs > 0) {
            const successors = deps.filter((d) => d.predecessor_id === task.id);
            for (const dep of successors) {
              await cascadePushTask(dep.successor_id, pushMs);
            }
            if (successors.length > 0) load();
          }
        }
      }
      setDragging(null);
    }
    setLinkFrom(null);
    setMousePos(null);
  };
  const removeDep = async (id) => {
    const {
      error
    } = await supabase.from("task_dependencies").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Vínculo removido");
  };
  const removeTask = async (id) => {
    if (!confirm("Excluir esta tarefa permanentemente? Todas as dependências vinculadas também serão removidas.")) return;
    const {
      error
    } = await supabase.from("tasks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Tarefa excluída");
      load();
    }
  };
  const saveTaskEdit = async () => {
    if (!editingTask) return;
    const {
      error
    } = await supabase.from("tasks").update({
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      status: editingTask.status,
      due_date: editingTask.due_date,
      start_date: editingTask.start_date,
      assignee_id: editingTask.assignee_id
    }).eq("id", editingTask.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Tarefa atualizada");
      setEditingTask(null);
      load();
    }
  };
  const cancelLink = () => {
    setLinkFrom(null);
    setMousePos(null);
  };
  const fromItem = linkFrom ? itemById[linkFrom] : null;
  const ghostStart = fromItem ? {
    x: (fromItem.offsetDays + fromItem.duration) * dayWidth - 2,
    y: fromItem.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2
  } : null;
  const createGanttTask = async () => {
    if (!newGanttData.title || !user) return;
    let baseStartDate = /* @__PURE__ */ new Date();
    if (newGanttData.predecessorId && newGanttData.predecessorId !== "none") {
      const pred = tasks.find((t) => t.id === newGanttData.predecessorId);
      if (pred) {
        baseStartDate = new Date(pred.due_date);
        baseStartDate.setDate(baseStartDate.getDate() + 1);
      }
    }
    const {
      data,
      error
    } = await supabase.from("tasks").insert({
      title: newGanttData.title,
      project_id: newGanttData.projectId || null,
      start_date: baseStartDate.toISOString(),
      due_date: new Date(baseStartDate.getTime() + newGanttData.days * 864e5).toISOString(),
      creator_id: user.id,
      assignee_id: newGanttData.assigneeId || user.id,
      status: "todo",
      priority: "media"
    }).select().single();
    if (error) toast.error(error.message || "Erro ao criar cronograma");
    else {
      if (newGanttData.predecessorId && newGanttData.predecessorId !== "none" && data) {
        await supabase.from("task_dependencies").insert({
          predecessor_id: newGanttData.predecessorId,
          successor_id: data.id,
          created_by: user.id
        });
      }
      toast.success("Novo item adicionado ao Gantt!");
      setNewGanttOpen(false);
      setNewGanttData({
        title: "",
        projectId: "",
        days: 7,
        assigneeId: "",
        predecessorId: "none"
      });
      load();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6", onMouseUp: handleMouseUp, onMouseLeave: handleMouseUp, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-center justify-between gap-6 bg-card/40 p-6 rounded-2xl border shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-accent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarRange, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.2em]", children: "Cronograma Estratégico" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-black tracking-tight", children: "Gantt Flow" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground max-w-md", children: [
          "Visualize prazos, arraste o ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "inline h-3 w-3 text-accent" }),
          " para vincular dependências e organize seu fluxo temporal. Arraste as barras para ajustar as datas."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center bg-muted/50 rounded-xl p-1 border shadow-inner", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: viewMode === "days" ? "secondary" : "ghost", size: "sm", onClick: () => setViewMode("days"), className: "h-8 gap-2 rounded-lg text-xs font-bold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-3.5 w-3.5" }),
            " Diário"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: viewMode === "weeks" ? "secondary" : "ghost", size: "sm", onClick: () => setViewMode("weeks"), className: "h-8 gap-2 rounded-lg text-xs font-bold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarRange, { className: "h-3.5 w-3.5" }),
            " Semanal"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: viewMode === "months" ? "secondary" : "ghost", size: "sm", onClick: () => setViewMode("months"), className: "h-8 gap-2 rounded-lg text-xs font-bold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3.5 w-3.5" }),
            " Mensal"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: newGanttOpen, onOpenChange: setNewGanttOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "h-10 gap-2 bg-gradient-primary text-primary-foreground shadow-glow px-6 font-bold uppercase tracking-widest text-[10px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
            " Novo Gantt"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Novo Planejamento de Gantt" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 max-h-[60vh] overflow-y-auto", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título do Item / Tarefa" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: newGanttData.title, onChange: (e) => setNewGanttData({
                  ...newGanttData,
                  title: e.target.value
                }), placeholder: "Ex: Lançamento de Campanha" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Projeto Vinculado" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newGanttData.projectId, onValueChange: (v) => setNewGanttData({
                  ...newGanttData,
                  projectId: v
                }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione o projeto" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.name }, p.id)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Responsável" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newGanttData.assigneeId, onValueChange: (v) => setNewGanttData({
                  ...newGanttData,
                  assigneeId: v
                }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Atribuir a..." }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: profiles.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.full_name }, p.id)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Vincular após (Predecessora)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newGanttData.predecessorId, onValueChange: (v) => setNewGanttData({
                  ...newGanttData,
                  predecessorId: v
                }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Opcional: Iniciar após qual tarefa?" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Nenhuma" }),
                    tasks.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t.id, children: t.title }, t.id))
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Duração Estimada (Dias)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: newGanttData.days, onChange: (e) => setNewGanttData({
                  ...newGanttData,
                  days: parseInt(e.target.value)
                }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: createGanttTask, className: "w-full bg-gradient-primary", children: "Criar e Visualizar no Gantt" }) })
          ] })
        ] }),
        linkFrom && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: cancelLink, variant: "destructive", size: "sm", className: "h-10 gap-2 font-bold px-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
          " Cancelar vínculo"
        ] })
      ] })
    ] }),
    tasks.length > 0 && deps.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-4 w-4 text-accent mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Dependências Cascata ativas. Alterar o prazo de uma tarefa empurrará automaticamente as tarefas vinculadas a ela." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-auto shadow-card select-none", children: tasks.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-12 text-center text-muted-foreground", children: "Nenhuma tarefa com prazo definido ainda." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-fit relative", onClick: cancelLink, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border-b sticky top-0 bg-card z-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 border-r p-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider", style: {
          width: LABEL_WIDTH
        }, children: "Tarefa" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex", children: Array.from({
          length: totalDays
        }).map((_, i) => {
          const d = new Date(rangeStart);
          d.setDate(d.getDate() + i);
          const isToday = i === todayOffset;
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          if (viewMode === "months") {
            const isFirst = d.getDate() === 1;
            return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `shrink-0 border-r ${isFirst ? "bg-muted/30 relative" : ""}`, style: {
              width: dayWidth
            }, children: isFirst && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-1 top-2 text-[10px] font-bold text-muted-foreground whitespace-nowrap", children: d.toLocaleDateString("pt-BR", {
              month: "short",
              year: "2-digit"
            }).toUpperCase() }) }, i);
          }
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `shrink-0 border-r text-center py-2 ${isToday ? "bg-accent/20 font-bold" : isWeekend ? "bg-muted/50" : ""}`, style: {
            width: dayWidth
          }, children: viewMode === "days" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: d.toLocaleDateString("pt-BR", {
              weekday: "short"
            }).slice(0, 1).toUpperCase() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold", children: d.getDate() })
          ] }) : d.getDay() === 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-semibold mt-1", children: d.getDate() }) : null }, i);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex", ref: containerRef, onMouseMove: handleMouseMove, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 border-r bg-card z-10", style: {
          width: LABEL_WIDTH
        }, children: items.map((t) => {
          const proj = projects.find((p) => p.id === t.project_id);
          const prof = profiles.find((p) => p.id === t.assignee_id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b p-3 flex items-center gap-2", style: {
            height: ROW_HEIGHT
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full", style: {
              backgroundColor: priorityColor(t.priority)
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium truncate", children: t.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                proj && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground truncate", children: proj.name }),
                prof && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-accent truncate ml-auto", children: prof.full_name.split(" ")[0] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", children: [
              canEditTask(t.creator_id) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditingTask(t), className: "p-1 hover:bg-muted rounded text-muted-foreground hover:text-accent transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }) }),
              canDeleteTask(t.creator_id) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeTask(t.id), className: "p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }) })
            ] })
          ] }, t.id);
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", style: {
          width: totalDays * dayWidth,
          height: items.length * ROW_HEIGHT
        }, children: [
          Array.from({
            length: totalDays
          }).map((_, i) => {
            const d = new Date(rangeStart);
            d.setDate(d.getDate() + i);
            const isToday = i === todayOffset;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const isMonthStart = d.getDate() === 1;
            return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute top-0 bottom-0 border-r ${isToday ? "bg-accent/10" : isWeekend && viewMode === "days" ? "bg-muted/30" : isMonthStart && viewMode === "months" ? "bg-muted/40" : ""}`, style: {
              left: i * dayWidth,
              width: dayWidth
            } }, i);
          }),
          items.map((_, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 right-0 border-b", style: {
            top: (idx + 1) * ROW_HEIGHT - 1
          } }, idx)),
          items.map((t) => {
            const proj = projects.find((p) => p.id === t.project_id);
            const isLinking = linkFrom === t.id;
            const isHover = hoverTask === t.id && linkFrom && linkFrom !== t.id;
            const isDragging = dragging?.id === t.id;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute group", style: {
              top: t.rowIndex * ROW_HEIGHT,
              left: 0,
              right: 0,
              height: ROW_HEIGHT,
              zIndex: isDragging ? 50 : 10
            }, onMouseEnter: () => setHoverTask(t.id), onMouseLeave: () => setHoverTask(null), onClick: (e) => {
              if (linkFrom && linkFrom !== t.id) {
                e.stopPropagation();
                finishLink(t.id);
              }
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `absolute top-1/2 -translate-y-1/2 h-7 rounded-md flex items-center px-2 text-[10px] font-medium text-white shadow-card transition-colors ${isLinking ? "ring-2 ring-accent ring-offset-2" : ""} ${isHover ? "ring-2 ring-accent" : ""} ${isDragging ? "opacity-80 scale-[1.02]" : "transition-transform"}`, style: {
                left: t.offsetDays * dayWidth,
                width: Math.max(t.duration * dayWidth, viewMode === "months" ? 12 : 32),
                background: proj?.color ? `linear-gradient(90deg, ${proj.color}, ${proj.color}dd)` : "linear-gradient(135deg, oklch(0.35 0.15 250), oklch(0.55 0.18 220))",
                cursor: linkFrom ? "crosshair" : canEditTask(t.creator_id) ? "grab" : "default"
              }, onMouseDown: (e) => {
                if (!linkFrom && canEditTask(t.creator_id) && e.button === 0) {
                  setDragging({
                    id: t.id,
                    type: "move",
                    startX: e.clientX,
                    initialStart: t.actualStart.getTime(),
                    initialDue: t.actualDue.getTime()
                  });
                }
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate flex-1 pointer-events-none", children: viewMode !== "months" && t.title }),
                canEditTask(t.creator_id) && !linkFrom && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-0 bottom-0 w-3 cursor-e-resize hover:bg-white/20 rounded-r-md flex items-center justify-center opacity-0 group-hover:opacity-100", onMouseDown: (e) => {
                  e.stopPropagation();
                  if (e.button === 0) setDragging({
                    id: t.id,
                    type: "resize",
                    startX: e.clientX,
                    initialStart: t.actualStart.getTime(),
                    initialDue: t.actualDue.getTime()
                  });
                }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-0.5 h-3 bg-white/50 rounded-full" }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => startLink(t.id, e), className: "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition shadow-glow z-20", style: {
                left: (t.offsetDays + t.duration) * dayWidth + 4
              }, title: "Criar dependência", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "h-3 w-3" }) })
            ] }, t.id);
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute inset-0 pointer-events-none z-0", width: totalDays * dayWidth, height: items.length * ROW_HEIGHT, style: {
            overflow: "visible"
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("marker", { id: "arrow", markerWidth: "8", markerHeight: "8", refX: "7", refY: "4", orient: "auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M0,0 L8,4 L0,8 z", fill: "hsl(var(--accent))" }) }) }),
            arrows.map((a) => {
              const midX = (a.x1 + a.x2) / 2;
              const path = `M ${a.x1} ${a.y1} C ${midX} ${a.y1}, ${midX} ${a.y2}, ${a.x2} ${a.y2}`;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "pointer-events-auto", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: path, stroke: "hsl(var(--accent))", strokeWidth: "1.5", fill: "none", markerEnd: "url(#arrow)", opacity: "0.7" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: path, stroke: "transparent", strokeWidth: "10", fill: "none", className: "cursor-pointer hover:stroke-destructive/20", onClick: (e) => {
                  e.stopPropagation();
                  if (confirm("Remover este vínculo?")) removeDep(a.id);
                } })
              ] }, a.id);
            }),
            ghostStart && mousePos && /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: ghostStart.x, y1: ghostStart.y, x2: mousePos.x - LABEL_WIDTH, y2: mousePos.y, stroke: "hsl(var(--accent))", strokeWidth: "2", strokeDasharray: "4 4" })
          ] })
        ] })
      ] })
    ] }) }),
    deps.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 shadow-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-display font-bold text-sm mb-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "h-4 w-4 text-accent" }),
        " Dependências (",
        deps.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y", children: deps.map((d) => {
        const from = tasks.find((t) => t.id === d.predecessor_id);
        const to = tasks.find((t) => t.id === d.successor_id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2 py-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium truncate flex-1", children: from?.title || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "→" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium truncate flex-1", children: to?.title || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeDep(d.id), className: "p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
        ] }, d.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editingTask, onOpenChange: (o) => !o && setEditingTask(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Editar Tarefa no Cronograma" }) }),
      editingTask && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 max-h-[60vh] overflow-y-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: editingTask.title, onChange: (e) => setEditingTask({
            ...editingTask,
            title: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Descrição" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: editingTask.description || "", onChange: (e) => setEditingTask({
            ...editingTask,
            description: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Responsável" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editingTask.assignee_id || "none", onValueChange: (v) => setEditingTask({
            ...editingTask,
            assignee_id: v === "none" ? null : v
          }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Sem responsável" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Sem responsável" }),
              profiles.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.full_name }, p.id))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Início" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: editingTask.start_date ? editingTask.start_date.slice(0, 10) : "", onChange: (e) => setEditingTask({
              ...editingTask,
              start_date: e.target.value
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Fim (Prazo)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: editingTask.due_date ? editingTask.due_date.slice(0, 10) : "", onChange: (e) => setEditingTask({
              ...editingTask,
              due_date: e.target.value
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Prioridade" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editingTask.priority, onValueChange: (v) => setEditingTask({
              ...editingTask,
              priority: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PRIORITIES.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.value, children: p.label }, p.value)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editingTask.status, onValueChange: (v) => setEditingTask({
              ...editingTask,
              status: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: STATUSES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s.value, children: s.label }, s.value)) })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveTaskEdit, className: "w-full bg-gradient-primary", children: "Salvar Alterações" }) })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(GanttPage, {}) });
export {
  SplitComponent as component
};
