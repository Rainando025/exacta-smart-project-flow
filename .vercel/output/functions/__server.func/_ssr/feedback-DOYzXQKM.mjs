import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, P as Plus, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, ai as supabase, D as Dialog, t as DialogTrigger, b as Button, o as DialogContent, r as DialogHeader, s as DialogTitle, L as Label$1, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, $ as X, q as DialogFooter, C as Card, a8 as createLucideIcon, aj as toast, ad as notify } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { S as Switch } from "./switch-BYUmqUo6.mjs";
import { S as Star } from "./star-CsoGiJLD.mjs";
import { T as TrendingUp } from "./trending-up-CSHZ27ty.mjs";
import { F as Funnel } from "./funnel-DDdTvvLZ.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
const __iconNode$2 = [
  [
    "path",
    {
      d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",
      key: "1yiouv"
    }
  ],
  ["circle", { cx: "12", cy: "8", r: "6", key: "1vp47v" }]
];
const Award = createLucideIcon("award", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
      key: "ct8e1f"
    }
  ],
  ["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242", key: "151rxh" }],
  [
    "path",
    {
      d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
      key: "13bj9a"
    }
  ],
  ["path", { d: "m2 2 20 20", key: "1ooewy" }]
];
const EyeOff = createLucideIcon("eye-off", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
      key: "18887p"
    }
  ],
  ["path", { d: "M12 8v6", key: "1ib9pf" }],
  ["path", { d: "M9 11h6", key: "1fldmi" }]
];
const MessageSquarePlus = createLucideIcon("message-square-plus", __iconNode);
const DEFAULT_COMPETENCIES = ["Comunicação", "Colaboração", "Liderança", "Conhecimento técnico", "Proatividade", "Organização", "Resolução de problemas"];
const TYPE_LABELS = {
  peer: "Entre pares",
  manager: "Gestor → Colaborador",
  self: "Autoavaliação"
};
function StarRating({
  value,
  onChange,
  size = "md"
}) {
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-0.5", children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onChange?.(n), disabled: !onChange, className: `${onChange ? "cursor-pointer" : "cursor-default"}`, "aria-label": `${n} estrela${n === 1 ? "" : "s"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `${sz} transition ${n <= value ? "fill-accent text-accent" : "text-muted-foreground"}` }) }, n)) });
}
function FeedbackPage() {
  const {
    user
  } = useAuth();
  const [members, setMembers] = reactExports.useState([]);
  const [feedbacks, setFeedbacks] = reactExports.useState([]);
  const [competencies, setCompetencies] = reactExports.useState([]);
  const [tab, setTab] = reactExports.useState("received");
  const [search, setSearch] = reactExports.useState("");
  const [open, setOpen] = reactExports.useState(false);
  const [revieweeId, setRevieweeId] = reactExports.useState("");
  const [type, setType] = reactExports.useState("peer");
  const [rating, setRating] = reactExports.useState(4);
  const [strengths, setStrengths] = reactExports.useState("");
  const [improvements, setImprovements] = reactExports.useState("");
  const [message, setMessage] = reactExports.useState("");
  const [anonymous, setAnonymous] = reactExports.useState(false);
  const [comps, setComps] = reactExports.useState([{
    name: "Comunicação",
    score: 4
  }, {
    name: "Colaboração",
    score: 4
  }]);
  const [newComp, setNewComp] = reactExports.useState("");
  const load = async () => {
    if (!user) return;
    const [m, f] = await Promise.all([supabase.from("profiles").select("id,full_name,job_title"), supabase.from("feedbacks").select("*").order("created_at", {
      ascending: false
    })]);
    if (m.data) setMembers(m.data);
    if (f.data) {
      const list = f.data;
      setFeedbacks(list);
      if (list.length > 0) {
        const ids = list.map((x) => x.id);
        const c = await supabase.from("feedback_competencies").select("*").in("feedback_id", ids);
        setCompetencies(c.data || []);
      } else {
        setCompetencies([]);
      }
    }
  };
  reactExports.useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("feedback-realtime").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "feedbacks"
    }, load).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "feedback_competencies"
    }, load).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);
  const memberById = reactExports.useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const received = feedbacks.filter((f) => f.reviewee_id === user?.id);
  const sent = feedbacks.filter((f) => f.reviewer_id === user?.id);
  const avgRating = received.length > 0 ? received.reduce((s, f) => s + f.rating, 0) / received.length : 0;
  const competenciesByName = reactExports.useMemo(() => {
    const map = {};
    const myFeedbackIds = new Set(received.map((f) => f.id));
    competencies.filter((c) => myFeedbackIds.has(c.feedback_id)).forEach((c) => {
      if (!map[c.name]) map[c.name] = {
        sum: 0,
        count: 0
      };
      map[c.name].sum += c.score;
      map[c.name].count += 1;
    });
    return Object.entries(map).map(([name, v]) => ({
      name,
      avg: v.sum / v.count,
      count: v.count
    })).sort((a, b) => b.avg - a.avg);
  }, [competencies, received]);
  const strongest = competenciesByName.slice(0, 3);
  const toImprove = [...competenciesByName].reverse().slice(0, 3);
  const resetForm = () => {
    setRevieweeId("");
    setType("peer");
    setRating(4);
    setStrengths("");
    setImprovements("");
    setMessage("");
    setAnonymous(false);
    setComps([{
      name: "Comunicação",
      score: 4
    }, {
      name: "Colaboração",
      score: 4
    }]);
    setNewComp("");
  };
  const submit = async () => {
    if (!user) return;
    const target = type === "self" ? user.id : revieweeId;
    if (!target) return toast.error("Selecione quem será avaliado");
    const {
      data,
      error
    } = await supabase.from("feedbacks").insert({
      reviewee_id: target,
      reviewer_id: user.id,
      is_anonymous: type === "self" ? false : anonymous,
      feedback_type: type,
      rating,
      strengths: strengths || null,
      improvements: improvements || null,
      message: message || null
    }).select().single();
    if (error) return toast.error(error.message);
    if (comps.length > 0 && data) {
      await supabase.from("feedback_competencies").insert(comps.map((c) => ({
        feedback_id: data.id,
        name: c.name,
        score: c.score
      })));
    }
    if (type !== "self" && target !== user.id) {
      await notify({
        user_id: target,
        type: "feedback",
        title: anonymous ? "Você recebeu um novo feedback" : "Novo feedback recebido",
        message: `Avaliação: ${rating}/5 estrelas`,
        link: "/feedback"
      });
    }
    toast.success("Feedback enviado ✨");
    setOpen(false);
    resetForm();
  };
  const remove = async (id) => {
    if (!confirm("Excluir este feedback?")) return;
    const {
      error
    } = await supabase.from("feedbacks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Feedback excluído");
  };
  const addComp = () => {
    const name = newComp.trim();
    if (!name) return;
    if (comps.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return toast.error("Competência já adicionada");
    }
    setComps([...comps, {
      name,
      score: 4
    }]);
    setNewComp("");
  };
  const removeComp = (name) => setComps(comps.filter((c) => c.name !== name));
  const filterList = (list) => list.filter((f) => {
    if (!search.trim()) return true;
    const otherId = f.reviewee_id === user?.id ? f.reviewer_id : f.reviewee_id;
    const name = memberById[otherId]?.full_name || "";
    return name.toLowerCase().includes(search.toLowerCase()) || (f.message || "").toLowerCase().includes(search.toLowerCase());
  });
  const renderCard = (f, mode) => {
    const otherId = mode === "received" ? f.reviewer_id : f.reviewee_id;
    const showAnonymous = mode === "received" && f.is_anonymous;
    const otherName = showAnonymous ? "Anônimo" : memberById[otherId]?.full_name || "Usuário";
    const fComps = competencies.filter((c) => c.feedback_id === f.id);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 shadow-card space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${showAnonymous ? "bg-muted text-muted-foreground" : "bg-gradient-accent text-accent-foreground"}`, children: showAnonymous ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : otherName.slice(0, 2).toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-semibold text-sm", children: [
              mode === "received" ? "De" : "Para",
              ": ",
              otherName
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
              TYPE_LABELS[f.feedback_type],
              " •",
              " ",
              new Date(f.created_at).toLocaleDateString("pt-BR")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(StarRating, { value: f.rating }),
          mode === "sent" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => remove(f.id), className: "p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted", "aria-label": "Excluir", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }),
      f.strengths && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-wider text-accent font-bold mb-1", children: "Pontos fortes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: f.strengths })
      ] }),
      f.improvements && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-wider text-primary font-bold mb-1", children: "Pontos a melhorar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: f.improvements })
      ] }),
      f.message && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground italic border-l-2 border-accent/40 pl-3", children: [
        '"',
        f.message,
        '"'
      ] }),
      fComps.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 pt-2 border-t", children: fComps.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: c.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StarRating, { value: c.score, size: "sm" })
      ] }, c.id)) })
    ] }, f.id);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 max-w-6xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Feedback 360°" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Cultura de feedback contínuo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Avalie colegas, receba retornos e acompanhe sua evolução em competências." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "gap-2 bg-gradient-primary text-primary-foreground shadow-elegant", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquarePlus, { className: "h-4 w-4" }),
          " Dar feedback"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh] overflow-y-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Novo feedback" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Tipo" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: type, onValueChange: (v) => setType(v), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Object.entries(TYPE_LABELS).map(([v, l]) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: v, children: l }, v)) })
                ] })
              ] }),
              type !== "self" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Para quem" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: revieweeId, onValueChange: setRevieweeId, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione…" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: members.filter((m) => m.id !== user?.id).map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: m.id, children: m.full_name || "Sem nome" }, m.id)) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Avaliação geral" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StarRating, { value: rating, onChange: setRating }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Pontos fortes" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: strengths, onChange: (e) => setStrengths(e.target.value), placeholder: "O que essa pessoa faz muito bem?" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Pontos a melhorar" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: improvements, onChange: (e) => setImprovements(e.target.value), placeholder: "O que pode ser desenvolvido?" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Mensagem (opcional)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: message, onChange: (e) => setMessage(e.target.value), placeholder: "Comentário adicional" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Competências avaliadas" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 mt-2", children: [
                comps.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-2 rounded-md bg-muted/40", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm flex-1 font-medium", children: c.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(StarRating, { value: c.score, onChange: (v) => setComps(comps.map((x) => x.name === c.name ? {
                    ...x,
                    score: v
                  } : x)), size: "sm" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeComp(c.name), className: "p-1 text-muted-foreground hover:text-destructive", "aria-label": "Remover", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }) })
                ] }, c.name)),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newComp, onValueChange: setNewComp, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Adicionar competência…" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: DEFAULT_COMPETENCIES.filter((d) => !comps.find((c) => c.name === d)).map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: d, children: d }, d)) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "ou personalizada…", value: newComp.startsWith("__") ? "" : newComp, onChange: (e) => setNewComp(e.target.value), className: "h-9" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: addComp, size: "sm", variant: "outline", className: "gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) })
                ] })
              ] })
            ] }),
            type !== "self" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4 text-accent" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Enviar anonimamente" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: "Seu nome não aparecerá para o avaliado." })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: anonymous, onCheckedChange: setAnonymous })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: submit, className: "bg-gradient-primary text-primary-foreground", children: "Enviar feedback" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 shadow-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5 text-accent" }),
          " Nota média recebida"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-4xl font-bold", children: avgRating ? avgRating.toFixed(1) : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "/ 5" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
          received.length,
          " feedback",
          received.length === 1 ? "" : "s",
          " recebido",
          received.length === 1 ? "" : "s"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 shadow-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-3.5 w-3.5 text-accent" }),
          " Pontos fortes"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-3 space-y-1.5", children: [
          strongest.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-xs text-muted-foreground", children: "Sem dados ainda" }),
          strongest.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: c.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StarRating, { value: Math.round(c.avg), size: "sm" })
          ] }, c.name))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 shadow-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-3.5 w-3.5 text-primary" }),
          " Áreas de desenvolvimento"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-3 space-y-1.5", children: [
          toImprove.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-xs text-muted-foreground", children: "Sem dados ainda" }),
          toImprove.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: c.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StarRating, { value: Math.round(c.avg), size: "sm" })
          ] }, c.name))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      [{
        v: "received",
        l: `Recebidos (${received.length})`
      }, {
        v: "sent",
        l: `Enviados (${sent.length})`
      }, {
        v: "metrics",
        l: "Tabela de competências"
      }].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab(t.v), className: `px-3 py-1.5 rounded-full text-xs font-medium transition ${tab === t.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`, children: t.l }, t.v)),
      tab !== "metrics" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 ml-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar…", value: search, onChange: (e) => setSearch(e.target.value), className: "max-w-xs h-9" })
      ] })
    ] }),
    tab === "received" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      filterList(received).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center text-muted-foreground border-dashed", children: "Você ainda não recebeu feedbacks." }),
      filterList(received).map((f) => renderCard(f, "received"))
    ] }),
    tab === "sent" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      filterList(sent).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center text-muted-foreground border-dashed", children: "Você ainda não enviou feedbacks." }),
      filterList(sent).map((f) => renderCard(f, "sent"))
    ] }),
    tab === "metrics" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-card overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-3 border-b flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-sm", children: "Suas competências (média das avaliações recebidas)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          competenciesByName.length,
          " competência(s)"
        ] })
      ] }),
      competenciesByName.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-12 text-center text-muted-foreground", children: "Nenhuma competência avaliada ainda." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left text-xs uppercase tracking-wider text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-2.5", children: "Competência" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-2.5", children: "Nota média" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-2.5", children: "Avaliações" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-2.5 w-[40%]", children: "Distribuição" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y", children: competenciesByName.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 font-medium", children: c.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: c.avg.toFixed(1) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StarRating, { value: Math.round(c.avg), size: "sm" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-muted-foreground", children: c.count }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-gradient-accent", style: {
            width: `${c.avg / 5 * 100}%`
          } }) }) })
        ] }, c.name)) })
      ] })
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(FeedbackPage, {}) });
export {
  SplitComponent as component
};
