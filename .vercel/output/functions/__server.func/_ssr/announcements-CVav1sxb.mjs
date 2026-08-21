import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, P as Plus, e as Megaphone, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, D as Dialog, t as DialogTrigger, b as Button, o as DialogContent, r as DialogHeader, s as DialogTitle, L as Label$1, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, q as DialogFooter, C as Card, ai as supabase, aj as toast } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { S as Switch } from "./switch-BYUmqUo6.mjs";
import { F as Funnel } from "./funnel-DDdTvvLZ.mjs";
import { P as Pin } from "./pin-M4Iqdrd8.mjs";
import { S as ShieldAlert } from "./shield-alert-B5hU69HF.mjs";
import { T as TriangleAlert } from "./triangle-alert-BLaYDMdg.mjs";
import { U as Users } from "./users-C5uEgJff.mjs";
import { P as Pencil } from "./pencil-BPpfGdWw.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
function AnnouncementsPage() {
  const {
    user
  } = useAuth();
  const [items, setItems] = reactExports.useState([]);
  const [profiles, setProfiles] = reactExports.useState({});
  const [allProfilesList, setAllProfilesList] = reactExports.useState([]);
  const [open, setOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [search, setSearch] = reactExports.useState("");
  const [filter, setFilter] = reactExports.useState("all");
  const [form, setForm] = reactExports.useState({
    title: "",
    content: "",
    pinned: false,
    type: "aviso",
    target_user_id: "all"
  });
  const load = async () => {
    const [{
      data: announcementsData
    }, {
      data: profilesData
    }] = await Promise.all([supabase.from("announcements").select("*").order("pinned", {
      ascending: false
    }).order("created_at", {
      ascending: false
    }), supabase.from("profiles").select("*").order("full_name", {
      ascending: true
    })]);
    if (profilesData) {
      setAllProfilesList(profilesData);
      setProfiles(Object.fromEntries(profilesData.map((p) => [p.id, p])));
    }
    if (announcementsData) {
      setItems(announcementsData);
    }
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const create = async () => {
    if (!form.title.trim() || !form.content.trim() || !user) return;
    const payload = {
      title: form.title,
      content: form.content,
      pinned: form.pinned,
      type: form.type,
      target_user_id: form.target_user_id === "all" ? null : form.target_user_id,
      author_id: user.id
    };
    const {
      error
    } = await supabase.from("announcements").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(form.type === "auditoria" ? "Auditoria registrada" : "Aviso publicado");
    setOpen(false);
    setForm({
      title: "",
      content: "",
      pinned: false,
      type: "aviso",
      target_user_id: "all"
    });
    load();
  };
  const saveEdit = async () => {
    if (!editing) return;
    const payload = {
      title: editing.title,
      content: editing.content,
      pinned: editing.pinned,
      type: editing.type,
      target_user_id: editing.target_user_id === "all" || !editing.target_user_id ? null : editing.target_user_id
    };
    const {
      error
    } = await supabase.from("announcements").update(payload).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Comunicado atualizado");
    setEditing(null);
    load();
  };
  const remove = async (id) => {
    if (!confirm("Excluir este aviso?")) return;
    const {
      error
    } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Aviso excluído");
    load();
  };
  const filtered = items.filter((a) => {
    if (filter === "pinned" && !a.pinned) return false;
    if (filter === "mine" && a.author_id !== user?.id) return false;
    if (search.trim() && !(a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 max-w-4xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Mural" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Comunicados da equipe" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Avisos importantes em um lugar só." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "gap-2 bg-gradient-primary text-primary-foreground shadow-elegant", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " Novo aviso"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Publicar aviso" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Tipo" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.type, onValueChange: (v) => setForm({
                  ...form,
                  type: v
                }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "aviso", children: "Aviso (Geral)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auditoria", children: "Auditoria / Notificação Crítica" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Para quem?" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.target_user_id, onValueChange: (v) => setForm({
                  ...form,
                  target_user_id: v
                }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos da equipe" }),
                    allProfilesList.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.full_name || p.id.slice(0, 8) }, p.id))
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.title, onChange: (e) => setForm({
                ...form,
                title: e.target.value
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Conteúdo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 5, value: form.content, onChange: (e) => setForm({
                ...form,
                content: e.target.value
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: form.pinned, onCheckedChange: (v) => setForm({
                ...form,
                pinned: v
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Fixar no topo" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: create, className: "bg-gradient-primary text-primary-foreground", children: "Publicar" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar aviso…", value: search, onChange: (e) => setSearch(e.target.value), className: "max-w-xs h-9" }),
      [{
        v: "all",
        l: "Todos"
      }, {
        v: "pinned",
        l: "Fixados"
      }, {
        v: "mine",
        l: "Meus"
      }].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFilter(f.v), className: `px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === f.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`, children: f.l }, f.v))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-12 text-center text-muted-foreground border-dashed", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "h-10 w-10 mx-auto mb-3 opacity-40" }),
        "Nenhum aviso encontrado."
      ] }),
      filtered.map((a) => {
        const author = profiles[a.author_id];
        const isOwner = a.author_id === user?.id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `p-5 shadow-card relative ${a.pinned ? "border-l-4 border-l-accent" : ""}`, children: [
          a.pinned && /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "absolute top-3 right-3 h-4 w-4 text-accent fill-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${a.type === "auditoria" ? "bg-destructive/10 text-destructive" : "bg-gradient-accent text-accent-foreground"}`, children: a.type === "auditoria" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-5 w-5" }) : (author?.full_name || "U").slice(0, 2).toUpperCase() }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                a.type === "auditoria" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-destructive text-white", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3 w-3" }),
                  " Auditoria"
                ] }),
                a.target_user_id && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-warning/20 text-warning-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-3 w-3" }),
                  " Apenas para: ",
                  profiles[a.target_user_id]?.full_name || "Usuário"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-lg", children: a.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                author?.full_name || "Usuário",
                " • ",
                new Date(a.created_at).toLocaleDateString("pt-BR")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-3 whitespace-pre-wrap", children: a.content })
            ] }),
            isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditing(a), "aria-label": "Editar", className: "p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => remove(a.id), "aria-label": "Excluir", className: "p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
            ] })
          ] })
        ] }, a.id);
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editing, onOpenChange: (o) => !o && setEditing(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Editar aviso" }) }),
      editing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Tipo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editing.type || "aviso", onValueChange: (v) => setEditing({
              ...editing,
              type: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "aviso", children: "Aviso (Geral)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auditoria", children: "Auditoria / Notificação Crítica" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Para quem?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editing.target_user_id || "all", onValueChange: (v) => setEditing({
              ...editing,
              target_user_id: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos da equipe" }),
                allProfilesList.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.full_name || p.id.slice(0, 8) }, p.id))
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: editing.title, onChange: (e) => setEditing({
            ...editing,
            title: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Conteúdo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 5, value: editing.content, onChange: (e) => setEditing({
            ...editing,
            content: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: editing.pinned, onCheckedChange: (v) => setEditing({
            ...editing,
            pinned: v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Fixar no topo" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveEdit, className: "bg-gradient-primary text-primary-foreground", children: "Salvar alterações" }) })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnnouncementsPage, {}) });
export {
  SplitComponent as component
};
