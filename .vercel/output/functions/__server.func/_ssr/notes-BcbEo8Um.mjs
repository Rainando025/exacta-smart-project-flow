import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, P as Plus, F as FileText, S as Search, i as StickyNote, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, D as Dialog, t as DialogTrigger, b as Button, o as DialogContent, r as DialogHeader, s as DialogTitle, L as Label$1, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, ai as supabase, aj as toast, C as Card, g as Check, $ as X, B as Badge, a8 as createLucideIcon } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { T as Tabs, b as TabsList, c as TabsTrigger, a as TabsContent } from "./tabs-DVtr1KIk.mjs";
import { N as Network, a as NeuralMap } from "./NeuralMap-BcKs3OsM.mjs";
import { C as CalendarScheduler } from "./CalendarScheduler-DvubtSUY.mjs";
import { C as Calendar } from "./calendar-DYvPAJmB.mjs";
import { P as Pin } from "./pin-M4Iqdrd8.mjs";
import { P as Pencil } from "./pencil-BPpfGdWw.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
import "./pen-DrucmGnU.mjs";
import "./calendar-B9iwqwlp.mjs";
import "./funnel-DDdTvvLZ.mjs";
import "./pen-line-CFs4a1Rv.mjs";
const __iconNode = [
  ["path", { d: "M12 17v5", key: "bb1du9" }],
  ["path", { d: "M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89", key: "znwnzq" }],
  ["path", { d: "m2 2 20 20", key: "1ooewy" }],
  [
    "path",
    {
      d: "M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11",
      key: "c9qhm2"
    }
  ]
];
const PinOff = createLucideIcon("pin-off", __iconNode);
const COLORS = ["#1e3a8a", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#475569"];
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
function NotesPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(NotesContent, {}) });
}
function NotesContent() {
  const {
    user
  } = useAuth();
  const [items, setItems] = reactExports.useState([]);
  const [search, setSearch] = reactExports.useState("");
  const [open, setOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [title, setTitle] = reactExports.useState("");
  const [content, setContent] = reactExports.useState("");
  const [color, setColor] = reactExports.useState(COLORS[0]);
  const [priority, setPriority] = reactExports.useState("media");
  const load = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from("notes").select("*").eq("user_id", user.id).order("pinned", {
      ascending: false
    }).order("updated_at", {
      ascending: false
    });
    setItems(data || []);
  };
  reactExports.useEffect(() => {
    load();
  }, [user?.id]);
  const resetForm = () => {
    setTitle("");
    setContent("");
    setColor(COLORS[0]);
    setPriority("media");
    setEditing(null);
  };
  const handleSave = async () => {
    if (!user || !title.trim()) return;
    const payload = {
      user_id: user.id,
      title: title.trim(),
      content: content.trim() || null,
      color,
      priority
    };
    if (editing) {
      const {
        error
      } = await supabase.from("notes").update(payload).eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Anotação atualizada!");
    } else {
      const {
        error
      } = await supabase.from("notes").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Anotação criada!");
    }
    resetForm();
    setOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    await supabase.from("notes").delete().eq("id", id);
    toast.success("Removida!");
    load();
  };
  const togglePin = async (note) => {
    await supabase.from("notes").update({
      pinned: !note.pinned
    }).eq("id", note.id);
    load();
  };
  const openEdit = (n) => {
    setEditing(n);
    setTitle(n.title);
    setContent(n.content || "");
    setColor(n.color);
    setPriority(n.priority);
    setOpen(true);
  };
  const filtered = items.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q);
  });
  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 space-y-8 max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col sm:flex-row sm:items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Modo Pessoal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Anotações" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Suas notas pessoais, ideias e lembretes." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: (v) => {
        setOpen(v);
        if (!v) resetForm();
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-gradient-primary text-primary-foreground shadow-elegant", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
          " Nova anotação"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing ? "Editar anotação" : "Nova anotação" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Título da anotação" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Conteúdo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: content, onChange: (e) => setContent(e.target.value), rows: 6, placeholder: "Escreva aqui..." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Prioridade" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: priority, onValueChange: setPriority, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PRIORITIES.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.value, children: p.label }, p.value)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Cor" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: COLORS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setColor(c), className: `h-7 w-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-accent scale-110" : "hover:scale-105"}`, style: {
                  backgroundColor: c
                } }, c)) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, className: "w-full bg-gradient-primary text-primary-foreground", children: editing ? "Salvar" : "Criar anotação" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "notes", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "mb-6 bg-card/50 border border-white/5 p-1 rounded-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "notes", className: "rounded-lg gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
          " Anotações Tradicionais"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "ideas", className: "rounded-lg gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Network, { className: "h-4 w-4" }),
          " Meu Mapa Neural"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "calendar", className: "rounded-lg gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4" }),
          " Calendário"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "notes", className: "space-y-6 animate-in fade-in duration-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Buscar anotações...", className: "pl-10" })
        ] }),
        pinned.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3", children: "📌 Fixadas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: pinned.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx(NoteCard, { note: n, onEdit: openEdit, onDelete: handleDelete, onTogglePin: togglePin, onInlineSave: load }, n.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          pinned.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3", children: "Outras" }),
          unpinned.length === 0 && pinned.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(StickyNote, { className: "h-12 w-12 text-muted-foreground/30 mx-auto mb-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Nenhuma anotação ainda. Crie a primeira!" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: unpinned.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx(NoteCard, { note: n, onEdit: openEdit, onDelete: handleDelete, onTogglePin: togglePin, onInlineSave: load }, n.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "ideas", className: "animate-in fade-in duration-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NeuralMap, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "calendar", className: "animate-in fade-in duration-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarScheduler, { isTeam: false }) })
    ] })
  ] });
}
function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onInlineSave
}) {
  const [inlineEdit, setInlineEdit] = reactExports.useState(false);
  const [iTitle, setITitle] = reactExports.useState(note.title);
  const [iContent, setIContent] = reactExports.useState(note.content || "");
  const save = async () => {
    const {
      error
    } = await supabase.from("notes").update({
      title: iTitle.trim(),
      content: iContent.trim() || null
    }).eq("id", note.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setInlineEdit(false);
    onInlineSave();
  };
  const prioInfo = PRIORITIES.find((p) => p.value === note.priority) || PRIORITIES[1];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "group relative overflow-hidden shadow-card hover:shadow-lg transition-all border-0", style: {
    borderTop: `4px solid ${note.color}`
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 space-y-3", children: inlineEdit ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: iTitle, onChange: (e) => setITitle(e.target.value), className: "h-8 text-sm font-bold" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: iContent, onChange: (e) => setIContent(e.target.value), rows: 4, className: "text-sm" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: save, className: "p-1.5 rounded hover:bg-success/10 text-success", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setInlineEdit(false), className: "p-1.5 rounded hover:bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
    ] })
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-base leading-snug cursor-pointer", onDoubleClick: () => {
          setITitle(note.title);
          setIContent(note.content || "");
          setInlineEdit(true);
        }, children: note.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `text-[10px] ${prioInfo.color}`, children: prioInfo.label })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onTogglePin(note), className: "p-1.5 rounded hover:bg-muted", title: note.pinned ? "Desafixar" : "Fixar", children: note.pinned ? /* @__PURE__ */ jsxRuntimeExports.jsx(PinOff, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onEdit(note), className: "p-1.5 rounded hover:bg-muted", title: "Editar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onDelete(note.id), className: "p-1.5 rounded hover:bg-destructive/10 text-destructive", title: "Excluir", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
      ] })
    ] }),
    note.content && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap", children: note.content }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground/60", children: new Date(note.updated_at).toLocaleString("pt-BR") })
  ] }) }) });
}
export {
  NotesPage as component
};
