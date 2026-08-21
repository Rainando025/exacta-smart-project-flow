import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, P as Plus, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, D as Dialog, t as DialogTrigger, b as Button, o as DialogContent, r as DialogHeader, s as DialogTitle, L as Label$1, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, C as Card, a as BellRing, l as Clock, k as CircleCheck, ai as supabase, aj as toast, g as Check, $ as X, B as Badge } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { C as Checkbox } from "./checkbox-DqPIV1bo.mjs";
import { R as Repeat } from "./repeat-6pNUF_Ws.mjs";
import { P as Pencil } from "./pencil-BPpfGdWw.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
const REPEAT_OPTIONS = [{
  value: "none",
  label: "Não repetir"
}, {
  value: "daily",
  label: "Diário"
}, {
  value: "weekly",
  label: "Semanal"
}, {
  value: "monthly",
  label: "Mensal"
}];
const PRIORITIES = [{
  value: "baixa",
  label: "Baixa",
  color: "text-muted-foreground"
}, {
  value: "media",
  label: "Média",
  color: "text-accent"
}, {
  value: "alta",
  label: "Alta",
  color: "text-warning"
}, {
  value: "urgente",
  label: "Urgente",
  color: "text-destructive"
}];
function RemindersPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(RemindersContent, {}) });
}
function RemindersContent() {
  const {
    user
  } = useAuth();
  const [items, setItems] = reactExports.useState([]);
  const [open, setOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [showCompleted, setShowCompleted] = reactExports.useState(false);
  const [title, setTitle] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [remindAt, setRemindAt] = reactExports.useState("");
  const [repeat, setRepeat] = reactExports.useState("none");
  const [priority, setPriority] = reactExports.useState("media");
  const load = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from("reminders").select("*").eq("user_id", user.id).order("remind_at", {
      ascending: true
    });
    setItems(data || []);
  };
  reactExports.useEffect(() => {
    load();
  }, [user?.id]);
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRemindAt("");
    setRepeat("none");
    setPriority("media");
    setEditing(null);
  };
  const handleSave = async () => {
    if (!user || !title.trim() || !remindAt) return;
    const payload = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      remind_at: new Date(remindAt).toISOString(),
      repeat,
      priority
    };
    if (editing) {
      const {
        error
      } = await supabase.from("reminders").update(payload).eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Lembrete atualizado!");
    } else {
      const {
        error
      } = await supabase.from("reminders").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Lembrete criado!");
    }
    resetForm();
    setOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    await supabase.from("reminders").delete().eq("id", id);
    toast.success("Removido!");
    load();
  };
  const toggleComplete = async (r) => {
    await supabase.from("reminders").update({
      completed: !r.completed
    }).eq("id", r.id);
    load();
  };
  const openEdit = (r) => {
    setEditing(r);
    setTitle(r.title);
    setDescription(r.description || "");
    setRemindAt(r.remind_at.slice(0, 16));
    setRepeat(r.repeat);
    setPriority(r.priority);
    setOpen(true);
  };
  const now = /* @__PURE__ */ new Date();
  const active = items.filter((r) => !r.completed);
  const completed = items.filter((r) => r.completed);
  const display = showCompleted ? items : active;
  const upcoming = active.filter((r) => new Date(r.remind_at) > now);
  const overdue = active.filter((r) => new Date(r.remind_at) <= now);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 space-y-8 max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col sm:flex-row sm:items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Modo Pessoal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Lembretes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Seus lembretes e alertas pessoais." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: (v) => {
        setOpen(v);
        if (!v) resetForm();
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-gradient-primary text-primary-foreground shadow-elegant", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
          " Novo lembrete"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing ? "Editar lembrete" : "Novo lembrete" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Ex: Reunião, Consulta..." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Descrição (opcional)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: description, onChange: (e) => setDescription(e.target.value), rows: 3 })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Data e hora" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: remindAt, onChange: (e) => setRemindAt(e.target.value) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Prioridade" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: priority, onValueChange: setPriority, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PRIORITIES.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.value, children: p.label }, p.value)) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Repetição" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: repeat, onValueChange: setRepeat, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: REPEAT_OPTIONS.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, className: "w-full bg-gradient-primary text-primary-foreground", children: editing ? "Salvar" : "Criar lembrete" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 shadow-card border-0 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BellRing, { className: "h-5 w-5 text-warning" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Atrasados" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-warning", children: overdue.length })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 shadow-card border-0 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-accent" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Próximos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-accent", children: upcoming.length })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 shadow-card border-0 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-success/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 text-success" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Concluídos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-success", children: completed.length })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: showCompleted, onCheckedChange: (v) => setShowCompleted(!!v), id: "showDone" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "showDone", className: "text-sm text-muted-foreground cursor-pointer", children: "Mostrar concluídos" })
    ] }),
    overdue.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-warning uppercase tracking-wider mb-3", children: "⚠️ Atrasados" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: overdue.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(ReminderCard, { r, onEdit: openEdit, onDelete: handleDelete, onToggle: toggleComplete, onReload: load }, r.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      overdue.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3", children: "Próximos" }),
      display.filter((r) => !overdue.includes(r)).length === 0 && overdue.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-16", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BellRing, { className: "h-12 w-12 text-muted-foreground/30 mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Nenhum lembrete. Crie o primeiro!" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: display.filter((r) => !overdue.includes(r)).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(ReminderCard, { r, onEdit: openEdit, onDelete: handleDelete, onToggle: toggleComplete, onReload: load }, r.id)) })
    ] })
  ] });
}
function ReminderCard({
  r,
  onEdit,
  onDelete,
  onToggle,
  onReload
}) {
  const isOverdue = !r.completed && new Date(r.remind_at) <= /* @__PURE__ */ new Date();
  const prioInfo = PRIORITIES.find((p) => p.value === r.priority) || PRIORITIES[1];
  const [inlineEdit, setInlineEdit] = reactExports.useState(false);
  const [iTitle, setITitle] = reactExports.useState(r.title);
  const [iDesc, setIDesc] = reactExports.useState(r.description || "");
  const [iAt, setIAt] = reactExports.useState(r.remind_at.slice(0, 16));
  const save = async () => {
    const {
      error
    } = await supabase.from("reminders").update({
      title: iTitle.trim(),
      description: iDesc.trim() || null,
      remind_at: new Date(iAt).toISOString()
    }).eq("id", r.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setInlineEdit(false);
    onReload();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `p-4 shadow-card border-0 flex items-start gap-3 transition ${r.completed ? "opacity-50" : ""} ${isOverdue ? "border-l-4 border-l-warning" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: r.completed, onCheckedChange: () => onToggle(r), className: "mt-1" }),
    inlineEdit ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: iTitle, onChange: (e) => setITitle(e.target.value), className: "h-8 text-sm font-semibold" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: iDesc, onChange: (e) => setIDesc(e.target.value), className: "h-8 text-sm", placeholder: "Descrição" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: iAt, onChange: (e) => setIAt(e.target.value), className: "h-8 text-sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: save, className: "p-1.5 rounded hover:bg-success/10 text-success", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setInlineEdit(false), className: "p-1.5 rounded hover:bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", onDoubleClick: () => {
        setITitle(r.title);
        setIDesc(r.description || "");
        setIAt(r.remind_at.slice(0, 16));
        setInlineEdit(true);
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `font-semibold ${r.completed ? "line-through" : ""}`, children: r.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `text-[10px] ${prioInfo.color}`, children: prioInfo.label })
        ] }),
        r.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: r.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mt-1.5 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
            new Date(r.remind_at).toLocaleString("pt-BR")
          ] }),
          r.repeat !== "none" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Repeat, { className: "h-3 w-3" }),
            r.repeat
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5 shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onEdit(r), className: "p-1.5 rounded hover:bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onDelete(r.id), className: "p-1.5 rounded hover:bg-destructive/10 text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
      ] })
    ] })
  ] });
}
export {
  RemindersPage as component
};
