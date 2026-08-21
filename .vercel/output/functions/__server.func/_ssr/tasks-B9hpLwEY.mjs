import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, P as Plus, j as Trash2, n as generateTasksWithAI, f as MessageSquare, g as Send } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, ai as supabase, ac as isOverdue, D as Dialog, t as DialogTrigger, b as Button, o as DialogContent, r as DialogHeader, s as DialogTitle, L as Label$1, q as DialogFooter, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, P as PRIORITIES, X as SelectItem, U as STATUSES, C as Card, ae as priorityColor, af as priorityLabel, ab as formatDate, aj as toast, a8 as createLucideIcon, ad as notify } from "./router-Bktayy9l.mjs";
import { u as useRole } from "./useRole-CfzsBAW-.mjs";
import { S as Sparkles, I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { C as Checkbox } from "./checkbox-DqPIV1bo.mjs";
import { A as AttachmentsPanel } from "./AttachmentsPanel-CXe9LiMG.mjs";
import { A as Avatar, b as AvatarImage, a as AvatarFallback } from "./avatar-BK5WUjQQ.mjs";
import { P as Paperclip } from "./paperclip-BgIjAsfH.mjs";
import { F as Funnel } from "./funnel-DDdTvvLZ.mjs";
import { P as Pencil } from "./pencil-BPpfGdWw.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
import "./download-DABr9rdP.mjs";
import "./index-CxZfSfQO.mjs";
const __iconNode = [
  ["path", { d: "M13 5h8", key: "a7qcls" }],
  ["path", { d: "M13 12h8", key: "h98zly" }],
  ["path", { d: "M13 19h8", key: "c3s6r1" }],
  ["path", { d: "m3 17 2 2 4-4", key: "1jhpwq" }],
  ["path", { d: "m3 7 2 2 4-4", key: "1obspn" }]
];
const ListChecks = createLucideIcon("list-checks", __iconNode);
function SubtasksPanel({ taskId }) {
  const { user } = useAuth();
  const [items, setItems] = reactExports.useState([]);
  const [newTitle, setNewTitle] = reactExports.useState("");
  const load = async () => {
    const { data } = await supabase.from("subtasks").select("id,title,completed,position").eq("task_id", taskId).order("position", { ascending: true }).order("created_at", { ascending: true });
    setItems(data || []);
  };
  reactExports.useEffect(() => {
    load();
    const ch = supabase.channel(`subtasks-${taskId}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "subtasks", filter: `task_id=eq.${taskId}` },
      load
    ).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [taskId]);
  const add = async () => {
    if (!newTitle.trim() || !user) return;
    const { error } = await supabase.from("subtasks").insert({
      task_id: taskId,
      title: newTitle.trim(),
      created_by: user.id,
      position: items.length
    });
    if (error) return toast.error(error.message);
    setNewTitle("");
  };
  const toggle = async (s) => {
    await supabase.from("subtasks").update({ completed: !s.completed }).eq("id", s.id);
  };
  const remove = async (id) => {
    await supabase.from("subtasks").delete().eq("id", id);
  };
  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const progress = total === 0 ? 0 : Math.round(done / total * 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold", children: "Checklist" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
        done,
        "/",
        total,
        " • ",
        progress,
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-full rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "h-full bg-gradient-primary transition-all",
        style: { width: `${progress}%` }
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-1.5", children: [
      items.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "li",
        {
          className: "group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: s.completed, onCheckedChange: () => toggle(s) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `flex-1 text-sm ${s.completed ? "line-through text-muted-foreground" : ""}`, children: s.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => remove(s.id),
                className: "opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition",
                "aria-label": "Remover item",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
              }
            )
          ]
        },
        s.id
      )),
      items.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-xs text-muted-foreground px-2 py-2", children: "Sem itens ainda." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          placeholder: "Adicionar item…",
          value: newTitle,
          onChange: (e) => setNewTitle(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && add(),
          className: "h-9"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: add, size: "sm", className: "bg-gradient-primary text-primary-foreground gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) })
    ] })
  ] });
}
function CommentsPanel({ taskId }) {
  const { user } = useAuth();
  const [comments, setComments] = reactExports.useState([]);
  const [newComment, setNewComment] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const loadComments = async () => {
    const { data, error } = await supabase.from("task_comments").select("*, profiles(full_name, avatar_url)").eq("task_id", taskId).order("created_at", { ascending: true });
    if (error) {
      console.warn("Could not load comments from DB, using mock data for demo.", error.message);
      return;
    }
    setComments(data);
  };
  reactExports.useEffect(() => {
    loadComments();
  }, [taskId]);
  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId,
      user_id: user.id,
      content: newComment.trim()
    });
    if (error) {
      toast.error("Erro ao enviar comentário. Verifique se a tabela 'task_comments' existe no Supabase.");
    } else {
      setNewComment("");
      loadComments();
    }
    setLoading(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-5 w-5 text-accent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold", children: "Comentários" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 max-h-[300px] overflow-y-auto pr-2", children: [
      comments.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center py-4 italic", children: "Sem comentários ainda." }),
      comments.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-8 w-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: c.profiles?.avatar_url }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { children: (c.profiles?.full_name || "U").slice(0, 2).toUpperCase() })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold", children: c.profiles?.full_name || "Usuário" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: formatDate(c.created_at) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm bg-muted p-2 rounded-lg", children: c.content })
        ] })
      ] }, c.id))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2 border-t", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "shrink-0 text-muted-foreground hover:text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Paperclip, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          placeholder: "Comente ou mencione alguém com @...",
          value: newComment,
          onChange: (e) => setNewComment(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && handleSubmit(),
          disabled: loading
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSubmit, disabled: loading || !newComment.trim(), size: "icon", className: "shrink-0 bg-gradient-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }) })
    ] })
  ] });
}
function TasksPage() {
  const {
    user
  } = useAuth();
  const {
    canDeleteTask,
    canEditTask
  } = useRole();
  const [tasks, setTasks] = reactExports.useState([]);
  const [projects, setProjects] = reactExports.useState([]);
  const [filter, setFilter] = reactExports.useState("all");
  const [priorityFilter, setPriorityFilter] = reactExports.useState("all");
  const [projectFilter, setProjectFilter] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const [open, setOpen] = reactExports.useState(false);
  const [aiOpen, setAiOpen] = reactExports.useState(false);
  const [aiPrompt, setAiPrompt] = reactExports.useState("");
  const [aiLoading, setAiLoading] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [detail, setDetail] = reactExports.useState(null);
  const [counts, setCounts] = reactExports.useState({});
  const [form, setForm] = reactExports.useState({
    title: "",
    description: "",
    priority: "media",
    status: "todo",
    due_date: "",
    project_id: ""
  });
  const load = async () => {
    const mode = localStorage.getItem("exacta-mode") || "team";
    let query = supabase.from("tasks").select("*");
    if (mode === "personal") {
      query = query.eq("is_personal", true);
      if (user?.id) {
        query = query.or(`assignee_id.eq.${user.id},creator_id.eq.${user.id}`);
      }
    } else {
      query = query.eq("is_personal", false);
      const {
        data: roleData
      } = await supabase.from("user_roles").select("role").eq("user_id", user?.id || "").maybeSingle();
      const role = roleData?.role || "colaborador";
      if (role === "colaborador" && user?.id) {
        const {
          data: userProfile
        } = await supabase.from("profiles").select("department_id").eq("id", user.id).maybeSingle();
        if (userProfile?.department_id) {
          const {
            data: deptProfiles
          } = await supabase.from("profiles").select("id").eq("department_id", userProfile.department_id);
          const deptMemberIds = deptProfiles?.map((p2) => p2.id) || [];
          if (deptMemberIds.length > 0) {
            query = query.or(`assignee_id.in.(${deptMemberIds.map((id) => `"${id}"`).join(",")}),creator_id.eq.${user.id}`);
          } else {
            query = query.or(`assignee_id.eq.${user.id},creator_id.eq.${user.id}`);
          }
        } else {
          query = query.or(`assignee_id.eq.${user.id},creator_id.eq.${user.id}`);
        }
      }
    }
    const {
      data
    } = await query.order("created_at", {
      ascending: false
    });
    if (data) {
      setTasks(data);
      const ids = data.map((t) => t.id);
      if (ids.length > 0) {
        const [{
          data: subs
        }, {
          data: atts
        }] = await Promise.all([supabase.from("subtasks").select("task_id,completed").in("task_id", ids), supabase.from("attachments").select("task_id").in("task_id", ids)]);
        const map = {};
        (subs || []).forEach((s) => {
          if (!map[s.task_id]) map[s.task_id] = {
            total: 0,
            done: 0,
            files: 0
          };
          map[s.task_id].total++;
          if (s.completed) map[s.task_id].done++;
        });
        (atts || []).forEach((a) => {
          if (!a.task_id) return;
          if (!map[a.task_id]) map[a.task_id] = {
            total: 0,
            done: 0,
            files: 0
          };
          map[a.task_id].files++;
        });
        setCounts(map);
      }
    }
    const p = await supabase.from("projects").select("id,name,color");
    if (p.data) setProjects(p.data);
  };
  reactExports.useEffect(() => {
    load();
    const ch = supabase.channel("tasks-related").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "subtasks"
    }, load).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "attachments"
    }, load).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);
  const [creating, setCreating] = reactExports.useState(false);
  const create = async () => {
    if (!form.title.trim() || !user) return;
    setCreating(true);
    const mode = localStorage.getItem("exacta-mode") || "team";
    const {
      error
    } = await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      project_id: form.project_id || null,
      creator_id: user.id,
      assignee_id: user.id,
      is_personal: mode === "personal"
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Tarefa criada");
    setOpen(false);
    setForm({
      title: "",
      description: "",
      priority: "media",
      status: "todo",
      due_date: "",
      project_id: ""
    });
    load();
  };
  const toggle = async (t) => {
    const next = t.status === "done" ? "todo" : "done";
    await supabase.from("tasks").update({
      status: next,
      completed_at: next === "done" ? (/* @__PURE__ */ new Date()).toISOString() : null
    }).eq("id", t.id);
    load();
  };
  const remove = async (id) => {
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
  const saveEdit = async () => {
    if (!editing || !user) return;
    const original = tasks.find((t) => t.id === editing.id);
    const {
      error
    } = await supabase.from("tasks").update({
      title: editing.title,
      description: editing.description || null,
      priority: editing.priority,
      status: editing.status,
      due_date: editing.due_date || null,
      project_id: editing.project_id || null,
      assignee_id: editing.assignee_id || null
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    if (original && editing.assignee_id && original.assignee_id !== editing.assignee_id && editing.assignee_id !== user.id) {
      await notify({
        user_id: editing.assignee_id,
        type: "task_assigned",
        title: `Nova tarefa atribuída: ${editing.title}`,
        message: editing.due_date ? `Prazo: ${formatDate(editing.due_date)}` : void 0,
        link: "/tasks",
        task_id: editing.id
      });
    } else if (original && original.status !== editing.status && editing.assignee_id && editing.assignee_id !== user.id) {
      await notify({
        user_id: editing.assignee_id,
        type: "task_updated",
        title: `Status atualizado: ${editing.title}`,
        message: `Novo status: ${STATUSES.find((s) => s.value === editing.status)?.label || editing.status}`,
        link: "/tasks",
        task_id: editing.id
      });
    }
    toast.success("Tarefa atualizada");
    setEditing(null);
    load();
  };
  const generateAI = async () => {
    if (!aiPrompt.trim() || !user) return;
    setAiLoading(true);
    try {
      const generatedTasks = await generateTasksWithAI(aiPrompt);
      if (!generatedTasks?.length) {
        toast.error("IA não conseguiu estruturar as tarefas");
        return;
      }
      const inserts = generatedTasks.map((t) => ({
        title: t.title,
        description: t.description || null,
        priority: t.priority || "media",
        status: "todo",
        due_date: t.due_date || null,
        creator_id: user.id,
        assignee_id: user.id
      }));
      const {
        error
      } = await supabase.from("tasks").insert(inserts);
      if (error) throw error;
      toast.success(`${inserts.length} tarefas criadas pela IA ✨`);
      setAiOpen(false);
      setAiPrompt("");
      load();
    } catch (e) {
      toast.error(e.message || "Erro na geração por IA");
    } finally {
      setAiLoading(false);
    }
  };
  const filtered = tasks.filter((t) => {
    if (filter === "mine" && t.assignee_id !== user?.id) return false;
    if (filter === "overdue" && !isOverdue(t.due_date, t.status)) return false;
    if (["todo", "doing", "review", "done"].includes(filter) && t.status !== filter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (projectFilter !== "all" && (projectFilter === "none" ? t.project_id : t.project_id !== projectFilter)) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 max-w-6xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Tarefas" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Lista de tarefas" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Capture, organize e execute com clareza." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: aiOpen, onOpenChange: setAiOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-accent" }),
            " Gerar com IA"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5 text-accent" }),
              " Gerar tarefas com IA"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Descreva o objetivo ou projeto" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 5, placeholder: "Ex: Lançar landing page para nova feature em 2 semanas", value: aiPrompt, onChange: (e) => setAiPrompt(e.target.value) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "A IA vai gerar uma lista de tarefas com prioridade e prazo sugerido." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: generateAI, disabled: aiLoading, className: "bg-gradient-primary text-primary-foreground gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }),
              " ",
              aiLoading ? "Gerando…" : "Gerar tarefas"
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "gap-2 bg-gradient-primary text-primary-foreground shadow-elegant", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
            " Nova tarefa"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Nova tarefa" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.title, onChange: (e) => setForm({
                  ...form,
                  title: e.target.value
                }), placeholder: "O que precisa ser feito?" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Descrição" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: form.description, onChange: (e) => setForm({
                  ...form,
                  description: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Prioridade" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.priority, onValueChange: (v) => setForm({
                    ...form,
                    priority: v
                  }), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PRIORITIES.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.value, children: p.label }, p.value)) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Status" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.status, onValueChange: (v) => setForm({
                    ...form,
                    status: v
                  }), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: STATUSES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s.value, children: s.label }, s.value)) })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Prazo" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: form.due_date, onChange: (e) => setForm({
                    ...form,
                    due_date: e.target.value
                  }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Projeto" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.project_id || "none", onValueChange: (v) => setForm({
                    ...form,
                    project_id: v === "none" ? "" : v
                  }), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Sem projeto" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Sem projeto" }),
                      projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.name }, p.id))
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: create, disabled: creating, className: "bg-gradient-primary text-primary-foreground", children: creating ? "Criando..." : "Criar tarefa" }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar tarefa…", value: search, onChange: (e) => setSearch(e.target.value), className: "max-w-xs h-9" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: priorityFilter, onValueChange: setPriorityFilter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[150px] h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas prioridades" }),
            PRIORITIES.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.value, children: p.label }, p.value))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: projectFilter, onValueChange: setProjectFilter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[170px] h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos projetos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Sem projeto" }),
            projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.name }, p.id))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-2", children: [{
        v: "all",
        l: "Todas"
      }, {
        v: "mine",
        l: "Minhas"
      }, {
        v: "todo",
        l: "A fazer"
      }, {
        v: "doing",
        l: "Em andamento"
      }, {
        v: "review",
        l: "Revisão"
      }, {
        v: "done",
        l: "Concluídas"
      }, {
        v: "overdue",
        l: "Atrasadas"
      }].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFilter(f.v), className: `px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === f.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`, children: f.l }, f.v)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "divide-y shadow-card", children: [
      filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-12 text-center text-muted-foreground", children: "Nenhuma tarefa neste filtro." }),
      filtered.map((t) => {
        const overdue = isOverdue(t.due_date, t.status);
        const c = counts[t.id];
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-4 hover:bg-muted/30 transition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: t.status === "done", onCheckedChange: () => toggle(t) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full shrink-0", style: {
            backgroundColor: priorityColor(t.priority)
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setDetail(t), className: "flex-1 min-w-0 text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `font-medium text-sm ${t.status === "done" ? "line-through text-muted-foreground" : ""}`, children: t.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: priorityLabel(t.priority) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: overdue ? "text-destructive font-medium" : "", children: formatDate(t.due_date) }),
              c && c.total > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ListChecks, { className: "h-3 w-3" }),
                  c.done,
                  "/",
                  c.total
                ] })
              ] }),
              c && c.files > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Paperclip, { className: "h-3 w-3" }),
                  c.files
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
            canEditTask(t.creator_id, t.assignee_id) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditing({
              ...t,
              due_date: t.due_date ? t.due_date.slice(0, 10) : ""
            }), "aria-label": "Editar", className: "p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
            canDeleteTask(t.creator_id) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => remove(t.id), "aria-label": "Excluir", className: "p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
          ] })
        ] }, t.id);
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editing, onOpenChange: (o) => !o && setEditing(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Editar tarefa" }) }),
      editing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: editing.title, onChange: (e) => setEditing({
            ...editing,
            title: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Descrição" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: editing.description || "", onChange: (e) => setEditing({
            ...editing,
            description: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Prioridade" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editing.priority, onValueChange: (v) => setEditing({
              ...editing,
              priority: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PRIORITIES.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.value, children: p.label }, p.value)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editing.status, onValueChange: (v) => setEditing({
              ...editing,
              status: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: STATUSES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s.value, children: s.label }, s.value)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Prazo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: editing.due_date || "", onChange: (e) => setEditing({
              ...editing,
              due_date: e.target.value
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Projeto" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editing.project_id || "none", onValueChange: (v) => setEditing({
              ...editing,
              project_id: v === "none" ? null : v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Sem projeto" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Sem projeto" }),
                projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.name }, p.id))
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveEdit, className: "bg-gradient-primary text-primary-foreground", children: "Salvar alterações" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!detail, onOpenChange: (o) => !o && setDetail(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-full", style: {
          backgroundColor: priorityColor(detail?.priority)
        } }),
        detail?.title
      ] }) }),
      detail && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        detail.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-wrap", children: detail.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-1 rounded bg-muted", children: priorityLabel(detail.priority) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-1 rounded bg-muted", children: STATUSES.find((s) => s.value === detail.status)?.label }),
          detail.due_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `px-2 py-1 rounded bg-muted ${isOverdue(detail.due_date, detail.status) ? "text-destructive" : ""}`, children: [
            "Prazo: ",
            formatDate(detail.due_date)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SubtasksPanel, { taskId: detail.id }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AttachmentsPanel, { taskId: detail.id }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CommentsPanel, { taskId: detail.id }) })
      ] })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TasksPage, {}) });
export {
  SplitComponent as component
};
