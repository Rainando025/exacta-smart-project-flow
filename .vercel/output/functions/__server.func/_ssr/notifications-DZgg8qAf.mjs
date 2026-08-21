import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, C as CheckCheck, j as Trash2, B as Bell } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, ai as supabase, b as Button, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, C as Card, F as Link, aj as toast } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { F as Funnel } from "./funnel-DDdTvvLZ.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
const TYPE_LABELS = {
  task_assigned: "Atribuição",
  task_updated: "Atualização",
  task_due: "Prazo",
  feedback: "Feedback",
  info: "Geral"
};
function NotificationsPage() {
  const {
    user
  } = useAuth();
  const [items, setItems] = reactExports.useState([]);
  const [filter, setFilter] = reactExports.useState("all");
  const [typeFilter, setTypeFilter] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const load = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", {
      ascending: false
    });
    setItems(data || []);
  };
  reactExports.useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel(`notif-page-${user.id}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${user.id}`
    }, load).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);
  const markRead = async (id) => {
    await supabase.from("notifications").update({
      read: true
    }).eq("id", id);
  };
  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({
      read: true
    }).eq("user_id", user.id).eq("read", false);
    toast.success("Todas marcadas como lidas");
  };
  const remove = async (id) => {
    await supabase.from("notifications").delete().eq("id", id);
  };
  const clearAll = async () => {
    if (!user || !confirm("Excluir todas as notificações?")) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    toast.success("Histórico limpo");
  };
  const filtered = items.filter((n) => {
    if (filter === "unread" && n.read) return false;
    if (filter === "read" && !n.read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (search.trim() && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const unread = items.filter((i) => !i.read).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 max-w-5xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Notificações" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Central de avisos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground mt-2", children: [
          unread > 0 ? `${unread} não lida${unread === 1 ? "" : "s"} • ` : "",
          items.length,
          " no histórico"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: markAllRead, variant: "outline", className: "gap-2", disabled: unread === 0, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { className: "h-4 w-4" }),
          " Marcar todas"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: clearAll, variant: "outline", className: "gap-2 text-destructive", disabled: items.length === 0, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }),
          " Limpar tudo"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar…", value: search, onChange: (e) => setSearch(e.target.value), className: "max-w-xs h-9" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filter, onValueChange: (v) => setFilter(v), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[150px] h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "unread", children: "Não lidas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "read", children: "Lidas" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[170px] h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos os tipos" }),
          Object.entries(TYPE_LABELS).map(([v, l]) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: v, children: l }, v))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "divide-y shadow-card", children: [
      filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-12 text-center text-muted-foreground flex flex-col items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-8 w-8 opacity-40" }),
        "Nenhuma notificação neste filtro."
      ] }),
      filtered.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-start gap-3 p-4 hover:bg-muted/30 transition ${!n.read ? "bg-accent/5" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase font-bold tracking-wider text-accent", children: TYPE_LABELS[n.type] || n.type }),
            !n.read && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-accent" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm mt-0.5", children: n.title }),
          n.message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: n.message }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mt-1", children: new Date(n.created_at).toLocaleString("pt-BR") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
          n.link && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: n.link, onClick: () => markRead(n.id), className: "text-xs text-accent hover:underline px-2", children: "Abrir" }),
          !n.read && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => markRead(n.id), className: "p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted", "aria-label": "Marcar lida", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => remove(n.id), className: "p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted", "aria-label": "Excluir", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }, n.id))
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationsPage, {}) });
export {
  SplitComponent as component
};
