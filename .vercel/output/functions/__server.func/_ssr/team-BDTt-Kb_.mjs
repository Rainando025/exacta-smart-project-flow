import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, U as User, P as Plus, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, C as Card, a3 as cn, b as Button, D as Dialog, o as DialogContent, r as DialogHeader, s as DialogTitle, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, q as DialogFooter, L as Label$1, ai as supabase, a8 as createLucideIcon, aj as toast } from "./router-Bktayy9l.mjs";
import { u as useRole } from "./useRole-CfzsBAW-.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { T as Tabs, b as TabsList, c as TabsTrigger, a as TabsContent } from "./tabs-DVtr1KIk.mjs";
import { N as Network, a as NeuralMap } from "./NeuralMap-BcKs3OsM.mjs";
import { P as Pencil } from "./pencil-BPpfGdWw.mjs";
import { S as Save } from "./save-CDG45ltg.mjs";
import { S as Star } from "./star-CsoGiJLD.mjs";
import { C as Camera } from "./camera-DYsb7olI.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
import "./pen-DrucmGnU.mjs";
const __iconNode = [
  [
    "path",
    {
      d: "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",
      key: "l5xja"
    }
  ],
  ["path", { d: "M9 13a4.5 4.5 0 0 0 3-4", key: "10igwf" }],
  ["path", { d: "M6.003 5.125A3 3 0 0 0 6.401 6.5", key: "105sqy" }],
  ["path", { d: "M3.477 10.896a4 4 0 0 1 .585-.396", key: "ql3yin" }],
  ["path", { d: "M6 18a4 4 0 0 1-1.967-.516", key: "2e4loj" }],
  ["path", { d: "M12 13h4", key: "1ku699" }],
  ["path", { d: "M12 18h6a2 2 0 0 1 2 2v1", key: "105ag5" }],
  ["path", { d: "M12 8h8", key: "1lhi5i" }],
  ["path", { d: "M16 8V5a2 2 0 0 1 2-2", key: "u6izg6" }],
  ["circle", { cx: "16", cy: "13", r: ".5", key: "ry7gng" }],
  ["circle", { cx: "18", cy: "3", r: ".5", key: "1aiba7" }],
  ["circle", { cx: "20", cy: "21", r: ".5", key: "yhc1fs" }],
  ["circle", { cx: "20", cy: "8", r: ".5", key: "1e43v0" }]
];
const BrainCircuit = createLucideIcon("brain-circuit", __iconNode);
function Avatar({
  member,
  size = "md"
}) {
  const s = size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-12 w-12 text-base";
  if (member?.avatar_url) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: member.avatar_url, alt: member.full_name, className: `${s} rounded-full object-cover ring-2 ring-accent/20` });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${s} rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold shrink-0`, children: (member?.full_name || "U").slice(0, 2).toUpperCase() });
}
function ScoreCell({
  score,
  editable,
  onChange
}) {
  const val = score ?? 0;
  const color = val >= 8 ? "text-green-500" : val >= 5 ? "text-yellow-500" : val > 0 ? "text-red-400" : "text-muted-foreground/30";
  if (!editable) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-0.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-bold text-sm ${color}`, children: val > 0 ? val : "—" }),
      val > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-px", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-0.5 w-2 rounded-full ${i <= Math.ceil(val / 2) ? "bg-accent" : "bg-muted"}` }, i)) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: val || "", onChange: (e) => onChange(Number(e.target.value)), className: "text-center text-xs font-bold w-12 h-7 rounded border border-input bg-background focus:ring-1 focus:ring-accent", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "—" }),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: n, children: n }, n))
  ] });
}
function TeamPage() {
  const {
    user
  } = useAuth();
  const {
    isGestor
  } = useRole();
  const [members, setMembers] = reactExports.useState([]);
  const [tasks, setTasks] = reactExports.useState([]);
  const [roles, setRoles] = reactExports.useState({});
  const [skills, setSkills] = reactExports.useState([]);
  const [scores, setScores] = reactExports.useState([]);
  const [pendingScores, setPendingScores] = reactExports.useState({});
  const [savingScores, setSavingScores] = reactExports.useState(false);
  const [skillDialog, setSkillDialog] = reactExports.useState(false);
  const [newSkillName, setNewSkillName] = reactExports.useState("");
  const [newSkillType, setNewSkillType] = reactExports.useState("soft");
  const [profileDialog, setProfileDialog] = reactExports.useState(null);
  const [profileForm, setProfileForm] = reactExports.useState({
    full_name: "",
    job_title: "",
    phone: "",
    bio: "",
    linkedin_url: ""
  });
  const [avatarFile, setAvatarFile] = reactExports.useState(null);
  const [avatarPreview, setAvatarPreview] = reactExports.useState(null);
  const [savingProfile, setSavingProfile] = reactExports.useState(false);
  const fileRef = reactExports.useRef(null);
  const [search, setSearch] = reactExports.useState("");
  const load = async () => {
    const [p, t, r, sk, sc] = await Promise.all([supabase.from("profiles").select("*"), supabase.from("tasks").select("assignee_id,status").eq("is_personal", false), supabase.from("user_roles").select("user_id,role"), supabase.from("team_skills").select("*").order("type").order("name"), supabase.from("member_skill_scores").select("*")]);
    if (p.data) setMembers(p.data);
    if (t.data) setTasks(t.data);
    if (r.data) setRoles(Object.fromEntries(r.data.map((x) => [x.user_id, x.role])));
    if (sk.data) setSkills(sk.data);
    if (sc.data) setScores(sc.data);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const filtered = members.filter((m) => !search.trim() || (m.full_name || "").toLowerCase().includes(search.toLowerCase()));
  const getScore = (memberId, skillId) => {
    const key = `${memberId}::${skillId}`;
    if (key in pendingScores) return pendingScores[key];
    return scores.find((s) => s.member_id === memberId && s.skill_id === skillId)?.score ?? 0;
  };
  const handleScoreChange = (memberId, skillId, value) => {
    setPendingScores((prev) => ({
      ...prev,
      [`${memberId}::${skillId}`]: value
    }));
  };
  const saveAllScores = async () => {
    if (!Object.keys(pendingScores).length) return;
    setSavingScores(true);
    const upserts = Object.entries(pendingScores).map(([key, score]) => {
      const [member_id, skill_id] = key.split("::");
      return {
        member_id,
        skill_id,
        score,
        evaluated_by: user?.id
      };
    });
    const {
      error
    } = await supabase.from("member_skill_scores").upsert(upserts, {
      onConflict: "member_id,skill_id"
    });
    if (error) toast.error("Erro ao salvar notas");
    else {
      toast.success("Notas salvas!");
      setPendingScores({});
      load();
    }
    setSavingScores(false);
  };
  const addSkill = async () => {
    if (!newSkillName.trim()) return;
    const {
      error
    } = await supabase.from("team_skills").insert({
      name: newSkillName.trim(),
      type: newSkillType,
      created_by: user?.id
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Skill adicionada!");
      setNewSkillName("");
      load();
    }
  };
  const deleteSkill = async (id) => {
    if (!confirm("Excluir esta skill? Todas as notas associadas serão removidas.")) return;
    await supabase.from("team_skills").delete().eq("id", id);
    load();
    toast.success("Skill removida");
  };
  const openProfile = (m) => {
    setProfileForm({
      full_name: m.full_name || "",
      job_title: m.job_title || "",
      phone: m.phone || "",
      bio: m.bio || "",
      linkedin_url: m.linkedin_url || ""
    });
    setAvatarPreview(m.avatar_url || null);
    setAvatarFile(null);
    setProfileDialog(m);
  };
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };
  const saveProfile = async () => {
    if (!profileDialog) return;
    setSavingProfile(true);
    let avatar_url = profileDialog.avatar_url;
    if (avatarFile) {
      const path = `avatars/${profileDialog.id}/${Date.now()}_${avatarFile.name}`;
      const {
        error: upErr
      } = await supabase.storage.from("avatars").upload(path, avatarFile, {
        upsert: true
      });
      if (!upErr) {
        const {
          data: urlData
        } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }
    }
    const {
      error
    } = await supabase.from("profiles").update({
      ...profileForm,
      avatar_url
    }).eq("id", profileDialog.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Perfil atualizado!");
      setProfileDialog(null);
      load();
    }
    setSavingProfile(false);
  };
  const softSkills = skills.filter((s) => s.type === "soft");
  const hardSkills = skills.filter((s) => s.type === "hard");
  const canEdit = isGestor;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Equipe" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Colaboração e Membros" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Gerencie competências, notas e perfis da equipe." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "skills", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "mb-6 bg-card/50 border border-white/5 p-1 rounded-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "members", className: "rounded-lg gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4" }),
          " Membros"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "skills", className: "rounded-lg gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BrainCircuit, { className: "h-4 w-4" }),
          " Competências"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "ideas", className: "rounded-lg gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Network, { className: "h-4 w-4" }),
          " Mapa Neural"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "members", className: "space-y-4 animate-in fade-in duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar membro…", value: search, onChange: (e) => setSearch(e.target.value), className: "max-w-xs h-9" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: filtered.map((m) => {
          const mine = tasks.filter((t) => t.assignee_id === m.id);
          const done = mine.filter((t) => t.status === "done").length;
          const pct = mine.length ? Math.round(done / mine.length * 100) : 0;
          const role = roles[m.id] || "colaborador";
          const isSelf = m.id === user?.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 shadow-card hover:shadow-elegant transition group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { member: m, size: "md" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold truncate", children: m.full_name || "Sem nome" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: m.job_title || role }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block", role === "admin" ? "bg-destructive/10 text-destructive" : role === "gestor" ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"), children: role })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Conclusão" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
                  pct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-gradient-accent transition-all", style: {
                width: `${pct}%`
              } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px] text-muted-foreground", children: [
                done,
                " concluídas / ",
                mine.length,
                " totais"
              ] })
            ] }),
            m.bio && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-3 line-clamp-2 italic", children: [
              '"',
              m.bio,
              '"'
            ] }),
            (isSelf || canEdit) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "w-full mt-4 h-8 gap-2 text-xs", onClick: () => openProfile(m), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }),
              " ",
              isSelf ? "Editar meu perfil" : "Ver / Editar perfil"
            ] })
          ] }, m.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "skills", className: "space-y-4 animate-in fade-in duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-xl", children: "Matriz de Competências" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Avalie cada membro com nota de 1 a 10 por competência." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: canEdit && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            Object.keys(pendingScores).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: saveAllScores, disabled: savingScores, className: "bg-gradient-primary gap-2 h-9", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
              " ",
              savingScores ? "Salvando…" : `Salvar (${Object.keys(pendingScores).length})`
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2 h-9", onClick: () => setSkillDialog(true), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
              " Gerenciar Skills"
            ] })
          ] }) })
        ] }),
        skills.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-12 text-center border-dashed text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BrainCircuit, { className: "h-10 w-10 mx-auto mb-3 opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Nenhuma competência cadastrada ainda." }),
          canEdit && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "mt-4 bg-gradient-primary", onClick: () => setSkillDialog(true), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
            " Adicionar Skills"
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "shadow-card overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[700px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("thead", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b bg-muted/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3 font-bold sticky left-0 bg-muted/30 min-w-[200px]", children: "Membro" }),
              hardSkills.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { colSpan: hardSkills.length, className: "text-center px-4 py-2 text-xs font-bold text-blue-500 uppercase tracking-widest border-l", children: "🔧 Hard Skills" }),
              softSkills.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { colSpan: softSkills.length, className: "text-center px-4 py-2 text-xs font-bold text-purple-500 uppercase tracking-widest border-l", children: "💡 Soft Skills" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "sticky left-0 bg-card px-4 py-2" }),
              [...hardSkills, ...softSkills].map((sk) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: cn("text-center px-3 py-2 font-semibold text-xs whitespace-nowrap border-l", sk.type === "hard" ? "text-blue-500" : "text-purple-500"), children: sk.name }, sk.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y", children: filtered.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/20 transition-colors group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "sticky left-0 bg-card px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { member: m, size: "sm" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm truncate", children: m.full_name || "Sem nome" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: m.job_title || roles[m.id] || "colaborador" })
              ] })
            ] }) }),
            [...hardSkills, ...softSkills].map((sk) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-center px-3 py-2 border-l", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreCell, { score: getScore(m.id, sk.id), editable: canEdit, onChange: (v) => handleScoreChange(m.id, sk.id, v) }) }, sk.id))
          ] }, m.id)) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-4 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-green-500 inline-block" }),
            " 8–10: Excelente"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-yellow-500 inline-block" }),
            " 5–7: Bom"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-red-400 inline-block" }),
            " 1–4: Em desenvolvimento"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "ideas", className: "animate-in fade-in duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NeuralMap, {}) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: skillDialog, onOpenChange: setSkillDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-5 w-5 text-accent" }),
        " Gerenciar Competências"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Nome da competência", value: newSkillName, onChange: (e) => setNewSkillName(e.target.value), onKeyDown: (e) => e.key === "Enter" && addSkill(), className: "flex-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newSkillType, onValueChange: (v) => setNewSkillType(v), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-28", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "soft", children: "Soft" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "hard", children: "Hard" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: addSkill, className: "bg-gradient-primary px-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-[280px] overflow-y-auto space-y-1", children: [
          skills.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-muted-foreground py-6 text-sm", children: "Nenhuma skill cadastrada" }),
          [...hardSkills, ...softSkills].map((sk) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3 py-2 rounded-lg border bg-card/50 hover:bg-muted/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-[10px] px-2 py-0.5 rounded-full font-bold", sk.type === "hard" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"), children: sk.type === "hard" ? "Hard" : "Soft" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: sk.name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => deleteSkill(sk.id), className: "p-1 hover:text-destructive text-muted-foreground transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] }, sk.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setSkillDialog(false), children: "Fechar" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!profileDialog, onOpenChange: (o) => !o && setProfileDialog(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-5 w-5 text-accent" }),
        " Perfil — ",
        profileDialog?.full_name
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            avatarPreview ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatarPreview, alt: "avatar", className: "h-20 w-20 rounded-full object-cover ring-2 ring-accent/30" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-2xl", children: (profileDialog?.full_name || "U").slice(0, 2).toUpperCase() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => fileRef.current?.click(), className: "absolute bottom-0 right-0 h-7 w-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-md hover:bg-accent/90 transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: handleAvatarChange })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground", children: profileDialog?.full_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: profileDialog ? roles[profileDialog.id] || "colaborador" : "" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => fileRef.current?.click(), className: "text-accent hover:underline text-xs mt-1", children: "Trocar foto" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "Nome Completo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: profileForm.full_name, onChange: (e) => setProfileForm((p) => ({
              ...p,
              full_name: e.target.value
            })) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "Cargo / Título" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: profileForm.job_title, onChange: (e) => setProfileForm((p) => ({
              ...p,
              job_title: e.target.value
            })), placeholder: "Ex: Dev Sênior" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "Telefone" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: profileForm.phone, onChange: (e) => setProfileForm((p) => ({
              ...p,
              phone: e.target.value
            })), placeholder: "+55 (11) 99999-9999" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "LinkedIn" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: profileForm.linkedin_url, onChange: (e) => setProfileForm((p) => ({
              ...p,
              linkedin_url: e.target.value
            })), placeholder: "linkedin.com/in/..." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "Bio / Apresentação" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: profileForm.bio, onChange: (e) => setProfileForm((p) => ({
            ...p,
            bio: e.target.value
          })), placeholder: "Conte um pouco sobre você...", rows: 3 })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setProfileDialog(null), children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveProfile, disabled: savingProfile, className: "bg-gradient-primary", children: savingProfile ? "Salvando…" : "Salvar Perfil" })
      ] })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TeamPage, {}) });
export {
  SplitComponent as component
};
