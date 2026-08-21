import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, P as Plus, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, ay as useSensors, ax as useSensor, ai as supabase, b as Button, D as Dialog, t as DialogTrigger, o as DialogContent, r as DialogHeader, s as DialogTitle, q as DialogFooter, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, u as DndContext, v as DragOverlay, U as STATUSES, a8 as createLucideIcon, aj as toast, G as PointerSensor, aq as useDroppable, w as DropdownMenu, E as DropdownMenuTrigger, x as DropdownMenuContent, y as DropdownMenuItem, C as Card, ae as priorityColor, af as priorityLabel, ab as formatDate, ap as useDraggable } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { W as Wifi } from "./wifi-DYien79u.mjs";
import { F as Funnel } from "./funnel-DDdTvvLZ.mjs";
import { E as EllipsisVertical } from "./ellipsis-vertical-DLjUckc2.mjs";
import { P as Pencil } from "./pencil-BPpfGdWw.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
const __iconNode = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
];
const RotateCcw = createLucideIcon("rotate-ccw", __iconNode);
const DEFAULT_COLUMNS = STATUSES.map((s) => ({
  id: s.value,
  label: s.label
}));
const STORAGE_KEY = "exacta:kanban:columns";
function loadColumns() {
  if (typeof window === "undefined") return DEFAULT_COLUMNS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COLUMNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_COLUMNS;
    return parsed;
  } catch {
    return DEFAULT_COLUMNS;
  }
}
function KanbanPage() {
  const {
    user
  } = useAuth();
  const [tasks, setTasks] = reactExports.useState([]);
  const [columns, setColumns] = reactExports.useState(DEFAULT_COLUMNS);
  const [activeId, setActiveId] = reactExports.useState(null);
  const [priorityFilter, setPriorityFilter] = reactExports.useState("all");
  const [mineOnly, setMineOnly] = reactExports.useState(false);
  const [search, setSearch] = reactExports.useState("");
  const [newColOpen, setNewColOpen] = reactExports.useState(false);
  const [renameCol, setRenameCol] = reactExports.useState(null);
  const [colName, setColName] = reactExports.useState("");
  const [editingTask, setEditingTask] = reactExports.useState(null);
  const [realtime, setRealtime] = reactExports.useState(false);
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5
    }
  }));
  reactExports.useEffect(() => {
    setColumns(loadColumns());
  }, []);
  reactExports.useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);
  const load = async () => {
    const {
      data
    } = await supabase.from("tasks").select("*").eq("is_personal", false).order("position");
    if (data) setTasks(data);
  };
  reactExports.useEffect(() => {
    load();
    const ch = supabase.channel("kanban-tasks").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "tasks"
    }, () => load()).subscribe((status) => {
      if (status === "SUBSCRIBED") setRealtime(true);
    });
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);
  const filtered = reactExports.useMemo(() => tasks.filter((t) => {
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (mineOnly && t.assignee_id !== user?.id) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tasks, priorityFilter, mineOnly, search, user?.id]);
  const onDragEnd = async (e) => {
    setActiveId(null);
    const {
      active: active2,
      over
    } = e;
    if (!over) return;
    const taskId = active2.id;
    const newStatus = over.id;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    setTasks((prev) => prev.map((t) => t.id === taskId ? {
      ...t,
      status: newStatus
    } : t));
    const {
      error
    } = await supabase.from("tasks").update({
      status: newStatus,
      completed_at: newStatus === "done" ? (/* @__PURE__ */ new Date()).toISOString() : null
    }).eq("id", taskId);
    if (error) {
      toast.error(error.message);
      load();
    }
  };
  const addColumn = () => {
    const name = colName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    setColumns((c) => [...c, {
      id,
      label: name
    }]);
    setColName("");
    setNewColOpen(false);
    toast.success("Coluna adicionada");
  };
  const saveRename = () => {
    if (!renameCol) return;
    const name = colName.trim();
    if (!name) return;
    setColumns((c) => c.map((x) => x.id === renameCol.id ? {
      ...x,
      label: name
    } : x));
    setRenameCol(null);
    setColName("");
  };
  const deleteColumn = async (col) => {
    const inCol = tasks.filter((t) => t.status === col.id);
    if (inCol.length > 0) {
      const fallback = columns.find((c) => c.id !== col.id)?.id || "todo";
      if (!confirm(`Mover ${inCol.length} tarefa(s) para "${columns.find((c) => c.id === fallback)?.label}" e excluir esta coluna?`)) return;
      await supabase.from("tasks").update({
        status: fallback
      }).in("id", inCol.map((t) => t.id));
    } else if (!confirm("Excluir esta coluna?")) return;
    setColumns((c) => c.filter((x) => x.id !== col.id));
    toast.success("Coluna removida");
  };
  const resetColumns = () => {
    if (!confirm("Restaurar colunas padrão?")) return;
    setColumns(DEFAULT_COLUMNS);
  };
  const removeTask = async (id) => {
    if (!confirm("Excluir esta tarefa?")) return;
    const {
      error
    } = await supabase.from("tasks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Tarefa excluída");
      load();
    }
  };
  const saveTask = async () => {
    if (!editingTask) return;
    const {
      error
    } = await supabase.from("tasks").update({
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      due_date: editingTask.due_date || null
    }).eq("id", editingTask.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Tarefa atualizada");
      setEditingTask(null);
      load();
    }
  };
  const active = tasks.find((t) => t.id === activeId);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-accent font-medium uppercase tracking-wider flex items-center gap-2", children: [
          "Kanban",
          realtime && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] text-success normal-case tracking-normal", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { className: "h-3 w-3" }),
            " Tempo real"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Fluxo visual de trabalho" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Arraste cartões entre colunas. Personalize seu fluxo." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: resetColumns, className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3.5 w-3.5" }),
          " Padrão"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: newColOpen, onOpenChange: setNewColOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "gap-2 bg-gradient-primary text-primary-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
            " Nova coluna"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Nova coluna" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Ex: Bloqueado", value: colName, onChange: (e) => setColName(e.target.value), onKeyDown: (e) => e.key === "Enter" && addColumn() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: addColumn, className: "bg-gradient-primary text-primary-foreground", children: "Adicionar" }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar tarefa…", value: search, onChange: (e) => setSearch(e.target.value), className: "max-w-xs h-9" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: priorityFilter, onValueChange: setPriorityFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[160px] h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas prioridades" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "urgente", children: "Urgente" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "alta", children: "Alta" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "media", children: "Média" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "baixa", children: "Baixa" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMineOnly((v) => !v), className: `px-3 py-1.5 rounded-full text-xs font-medium transition ${mineOnly ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`, children: "Apenas minhas" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DndContext, { sensors, onDragStart: (e) => setActiveId(e.active.id), onDragEnd, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4", children: columns.map((col) => {
        const colTasks = filtered.filter((t) => t.status === col.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Column, { column: col, tasks: colTasks, onRename: () => {
          setRenameCol(col);
          setColName(col.label);
        }, onDelete: () => deleteColumn(col), onEditTask: setEditingTask, onDeleteTask: removeTask }, col.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DragOverlay, { children: active && /* @__PURE__ */ jsxRuntimeExports.jsx(TaskCard, { task: active, dragging: true }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!renameCol, onOpenChange: (o) => !o && setRenameCol(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Renomear coluna" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: colName, onChange: (e) => setColName(e.target.value), onKeyDown: (e) => e.key === "Enter" && saveRename() }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveRename, className: "bg-gradient-primary text-primary-foreground", children: "Salvar" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editingTask, onOpenChange: (o) => !o && setEditingTask(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Editar tarefa" }) }),
      editingTask && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: editingTask.title, onChange: (e) => setEditingTask({
          ...editingTask,
          title: e.target.value
        }), placeholder: "Título" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: editingTask.description || "", onChange: (e) => setEditingTask({
          ...editingTask,
          description: e.target.value
        }), placeholder: "Descrição" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editingTask.priority, onValueChange: (v) => setEditingTask({
            ...editingTask,
            priority: v
          }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "baixa", children: "Baixa" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "media", children: "Média" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "alta", children: "Alta" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "urgente", children: "Urgente" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: editingTask.due_date ? editingTask.due_date.slice(0, 10) : "", onChange: (e) => setEditingTask({
            ...editingTask,
            due_date: e.target.value
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveTask, className: "bg-gradient-primary text-primary-foreground", children: "Salvar" }) })
    ] }) })
  ] });
}
function Column({
  column,
  tasks,
  onRename,
  onDelete,
  onEditTask,
  onDeleteTask
}) {
  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id: column.id
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: setNodeRef, className: `rounded-xl bg-muted/40 p-3 min-h-[400px] transition ${isOver ? "bg-accent/10 ring-2 ring-accent" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3 px-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-sm uppercase tracking-wider text-muted-foreground", children: column.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold bg-card px-2 py-0.5 rounded-full", children: tasks.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "h-4 w-4" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: onRename, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5 mr-2" }),
            " Renomear"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: onDelete, className: "text-destructive", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 mr-2" }),
            " Excluir"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: tasks.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(DraggableTask, { task: t, onEdit: () => onEditTask(t), onDelete: () => onDeleteTask(t.id) }, t.id)) })
  ] });
}
function DraggableTask({
  task,
  onEdit,
  onDelete
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging
  } = useDraggable({
    id: task.id
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: setNodeRef, className: isDragging ? "opacity-30" : "", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ...listeners, ...attributes, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TaskCard, { task }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition flex gap-0.5 bg-card rounded shadow", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onEdit, "aria-label": "Editar", className: "p-1 hover:text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onDelete, "aria-label": "Excluir", className: "p-1 hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }) })
    ] })
  ] }) });
}
function TaskCard({
  task,
  dragging
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `p-3 cursor-grab active:cursor-grabbing shadow-card hover:shadow-elegant transition ${dragging ? "rotate-2 shadow-elegant" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full mt-1.5 shrink-0", style: {
      backgroundColor: priorityColor(task.priority)
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium leading-snug pr-12", children: task.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-2 text-[10px] text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: priorityLabel(task.priority) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatDate(task.due_date) })
      ] })
    ] })
  ] }) });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(KanbanPage, {}) });
export {
  SplitComponent as component
};
