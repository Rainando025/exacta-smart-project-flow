import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, o as getAIConfig, U as User, a as Building2, d as LoaderCircle, k as UserPlus, g as Send, P as Plus, j as Trash2, E as ExternalLink, b as CircleAlert, t as testAIConnection, s as saveAIConfig } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, ai as supabase, C as Card, L as Label$1, b as Button, D as Dialog, t as DialogTrigger, o as DialogContent, r as DialogHeader, s as DialogTitle, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, $ as X, B as Badge, k as CircleCheck, q as DialogFooter, a8 as createLucideIcon, aj as toast } from "./router-Bktayy9l.mjs";
import { S as Sparkles, I as Input } from "./input-nTKCBTY6.mjs";
import { T as Tabs, b as TabsList, c as TabsTrigger, a as TabsContent } from "./tabs-DVtr1KIk.mjs";
import { U as Users } from "./users-C5uEgJff.mjs";
import { M as Mail } from "./mail-BtVOGUiJ.mjs";
import { C as Camera } from "./camera-DYsb7olI.mjs";
import { P as Pencil } from "./pencil-BPpfGdWw.mjs";
import { R as RefreshCw } from "./refresh-cw-DLz0yuwe.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
const __iconNode$3 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
const Copy = createLucideIcon("copy", __iconNode$3);
const __iconNode$2 = [
  [
    "path",
    {
      d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
      key: "1s6t7t"
    }
  ],
  ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", key: "w0ekpg" }]
];
const KeyRound = createLucideIcon("key-round", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "M15 12h-5", key: "r7krc0" }],
  ["path", { d: "M15 8h-5", key: "1khuty" }],
  ["path", { d: "M19 17V5a2 2 0 0 0-2-2H4", key: "zz82l3" }],
  [
    "path",
    {
      d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3",
      key: "1ph1d7"
    }
  ]
];
const ScrollText = createLucideIcon("scroll-text", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ]
];
const Shield = createLucideIcon("shield", __iconNode);
function SettingsPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsContent, {}) });
}
function SettingsContent() {
  const {
    user,
    profile
  } = useAuth();
  const [profiles, setProfiles] = reactExports.useState([]);
  const [roles, setRoles] = reactExports.useState([]);
  const [invites, setInvites] = reactExports.useState([]);
  const [audits, setAudits] = reactExports.useState([]);
  const [departments, setDepartments] = reactExports.useState([]);
  const [isAdmin, setIsAdmin] = reactExports.useState(false);
  const [isGestor, setIsGestor] = reactExports.useState(false);
  const [profileName, setProfileName] = reactExports.useState("");
  const [profileJobTitle, setProfileJobTitle] = reactExports.useState("");
  const [avatarFile, setAvatarFile] = reactExports.useState(null);
  const [avatarPreview, setAvatarPreview] = reactExports.useState(null);
  const [savingProfile, setSavingProfile] = reactExports.useState(false);
  const fileRef = reactExports.useRef(null);
  const [openCreate, setOpenCreate] = reactExports.useState(false);
  const [newEmail, setNewEmail] = reactExports.useState("");
  const [newPassword, setNewPassword] = reactExports.useState("");
  const [newName, setNewName] = reactExports.useState("");
  const [newRole, setNewRole] = reactExports.useState("colaborador");
  const [newJobTitle, setNewJobTitle] = reactExports.useState("");
  const [creating, setCreating] = reactExports.useState(false);
  const [openInvite, setOpenInvite] = reactExports.useState(false);
  const [inviteEmail, setInviteEmail] = reactExports.useState("");
  const [inviteRole, setInviteRole] = reactExports.useState("colaborador");
  const [inviting, setInviting] = reactExports.useState(false);
  const [resetEmail, setResetEmail] = reactExports.useState("");
  const [resetting, setResetting] = reactExports.useState(false);
  const [deptDialog, setDeptDialog] = reactExports.useState(false);
  const [editingDept, setEditingDept] = reactExports.useState(null);
  const [deptName, setDeptName] = reactExports.useState("");
  const [deptColor, setDeptColor] = reactExports.useState("#6366f1");
  const [savingDept, setSavingDept] = reactExports.useState(false);
  const [aiConfig, setAiConfigState] = reactExports.useState(getAIConfig);
  const [geminiKey, setGeminiKey] = reactExports.useState("");
  const [groqKey, setGroqKey] = reactExports.useState("");
  const [preferredProvider, setPreferredProvider] = reactExports.useState("auto");
  const [testingAI, setTestingAI] = reactExports.useState(null);
  const [aiTestResult, setAiTestResult] = reactExports.useState(null);
  const load = reactExports.useCallback(async () => {
    if (!user) return;
    const [{
      data: p
    }, {
      data: r
    }, {
      data: inv
    }, {
      data: depts
    }] = await Promise.all([supabase.from("profiles").select("*").order("created_at", {
      ascending: false
    }), supabase.from("user_roles").select("*"), supabase.from("invitations").select("*").order("created_at", {
      ascending: false
    }), supabase.from("departments").select("*").order("name")]);
    setProfiles(p || []);
    setRoles(r || []);
    setInvites(inv || []);
    setDepartments(depts || []);
    const myRole = (r || []).find((ro) => ro.user_id === user.id);
    const admin = myRole?.role === "admin";
    const gestor = myRole?.role === "gestor" || admin;
    setIsAdmin(admin);
    setIsGestor(gestor);
    if (admin) {
      const {
        data: a
      } = await supabase.from("audit_logs").select("*").order("created_at", {
        ascending: false
      }).limit(100);
      setAudits(a || []);
    }
  }, [user]);
  reactExports.useEffect(() => {
    load();
    if (profile) {
      setProfileName(profile.full_name || "");
      setProfileJobTitle(profile.job_title || "");
      setAvatarPreview(profile.avatar_url || null);
    }
    const cfg = getAIConfig();
    setAiConfigState(cfg);
    setGeminiKey(cfg.geminiKey || "");
    setGroqKey(cfg.groqKey || "");
    setPreferredProvider(cfg.preferredProvider || "auto");
  }, [load, profile]);
  const handleSaveAIConfig = () => {
    const updated = saveAIConfig({
      geminiKey: geminiKey.trim(),
      groqKey: groqKey.trim(),
      preferredProvider
    });
    setAiConfigState(updated);
    toast.success("Configurações de Inteligência Artificial salvas!");
  };
  const handleTestAI = async (provider) => {
    setTestingAI(provider);
    setAiTestResult(null);
    const key = provider === "gemini" ? geminiKey : groqKey;
    const res = await testAIConnection(provider, key);
    setTestingAI(null);
    setAiTestResult({
      provider,
      success: res.success,
      message: res.message
    });
    if (res.success) {
      toast.success(`Chave ${provider.toUpperCase()} validada com sucesso!`);
    } else {
      toast.error(res.message);
    }
  };
  const getRoleForUser = (uid) => roles.find((ro) => ro.user_id === uid)?.role || "colaborador";
  const roleLabel = (r) => r === "admin" ? "Administrador" : r === "gestor" ? "Gestor" : "Colaborador";
  const getDeptName = (deptId) => deptId ? departments.find((d) => d.id === deptId)?.name || "—" : "—";
  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newName) return toast.error("Preencha todos os campos obrigatórios.");
    if (newPassword.length < 6) return toast.error("Senha mínima de 6 caracteres.");
    setCreating(true);
    const {
      data,
      error
    } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: newName,
          job_title: newJobTitle
        }
      }
    });
    if (error) {
      toast.error(error.message);
      setCreating(false);
      return;
    }
    if (data.user && newRole !== "colaborador") {
      await supabase.from("user_roles").upsert({
        user_id: data.user.id,
        role: newRole
      }, {
        onConflict: "user_id"
      });
    }
    toast.success(`Usuário ${newName} criado!`);
    setNewEmail("");
    setNewPassword("");
    setNewName("");
    setNewRole("colaborador");
    setNewJobTitle("");
    setOpenCreate(false);
    setTimeout(load, 1500);
    setCreating(false);
  };
  const handleInvite = async () => {
    if (!inviteEmail || !user) return toast.error("Informe o email do convidado.");
    setInviting(true);
    const {
      data,
      error
    } = await supabase.from("invitations").insert({
      email: inviteEmail,
      role: inviteRole,
      invited_by: user.id
    }).select().single();
    if (error) {
      toast.error(error.message);
      setInviting(false);
      return;
    }
    const link = `${window.location.origin}/auth?invite=${data.token}`;
    await navigator.clipboard.writeText(link).catch(() => {
    });
    await supabase.auth.resetPasswordForEmail(inviteEmail, {
      redirectTo: link
    });
    toast.success(`Convite criado! Link copiado.`);
    setInviteEmail("");
    setInviteRole("colaborador");
    setOpenInvite(false);
    load();
    setInviting(false);
  };
  const resendInvite = async (inv) => {
    const link = `${window.location.origin}/auth?invite=${inv.token}`;
    await supabase.from("invitations").update({
      expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
      status: "pending"
    }).eq("id", inv.id);
    await supabase.auth.resetPasswordForEmail(inv.email, {
      redirectTo: link
    });
    toast.success(`Convite reenviado para ${inv.email}`);
    load();
  };
  const revokeInvite = async (id) => {
    await supabase.from("invitations").update({
      status: "revoked"
    }).eq("id", id);
    toast.success("Convite revogado.");
    load();
  };
  const copyInviteLink = async (inv) => {
    const link = `${window.location.origin}/auth?invite=${inv.token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };
  const handlePasswordReset = async (email) => {
    if (!email) return toast.error("Email obrigatório.");
    setResetting(true);
    const {
      error
    } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`
    });
    if (error) toast.error(error.message);
    else toast.success(`Link enviado para ${email}`);
    setResetting(false);
  };
  const handleChangeRole = async (userId, role) => {
    const existing = roles.find((r) => r.user_id === userId);
    if (existing) await supabase.from("user_roles").delete().eq("id", existing.id);
    if (role !== "colaborador") await supabase.from("user_roles").insert([{
      user_id: userId,
      role
    }]);
    toast.success("Função atualizada!");
    load();
  };
  const handleChangeDepartment = async (userId, deptId) => {
    const val = deptId === "none" ? null : deptId;
    const {
      error
    } = await supabase.from("profiles").update({
      department_id: val
    }).eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success("Setor atualizado!");
      load();
    }
  };
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };
  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    let avatar_url = profile?.avatar_url || null;
    if (avatarFile) {
      const path = `avatars/${user.id}/${Date.now()}_${avatarFile.name}`;
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
      } else {
        toast.error("Erro ao fazer upload da foto: " + upErr.message);
      }
    }
    const {
      error
    } = await supabase.from("profiles").update({
      full_name: profileName,
      job_title: profileJobTitle,
      avatar_url
    }).eq("id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Perfil atualizado!");
      load();
    }
    setSavingProfile(false);
  };
  const openNewDept = () => {
    setEditingDept(null);
    setDeptName("");
    setDeptColor("#6366f1");
    setDeptDialog(true);
  };
  const openEditDept = (d) => {
    setEditingDept(d);
    setDeptName(d.name);
    setDeptColor(d.color || "#6366f1");
    setDeptDialog(true);
  };
  const saveDept = async () => {
    if (!deptName.trim()) return toast.error("Nome do setor é obrigatório.");
    setSavingDept(true);
    if (editingDept) {
      const {
        error
      } = await supabase.from("departments").update({
        name: deptName.trim(),
        color: deptColor
      }).eq("id", editingDept.id);
      if (error) toast.error(error.message);
      else toast.success("Setor atualizado!");
    } else {
      const {
        error
      } = await supabase.from("departments").insert({
        name: deptName.trim(),
        color: deptColor
      });
      if (error) toast.error(error.message);
      else toast.success("Setor criado!");
    }
    setSavingDept(false);
    setDeptDialog(false);
    load();
  };
  const deleteDept = async (id) => {
    if (!confirm("Excluir este setor? Os usuários serão desvinculados.")) return;
    await supabase.from("profiles").update({
      department_id: null
    }).eq("department_id", id);
    const {
      error
    } = await supabase.from("departments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Setor excluído.");
      load();
    }
  };
  const profileNameFn = (id) => id ? profiles.find((p) => p.id === id)?.full_name || id.slice(0, 8) : "Sistema";
  const inviteStatusBadge = (s) => {
    const c = s === "accepted" ? "bg-success/10 text-success" : s === "revoked" ? "bg-muted text-muted-foreground" : "bg-warning/10 text-warning";
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${c}`, children: s === "accepted" ? "Aceito" : s === "revoked" ? "Revogado" : "Pendente" });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 space-y-8 max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Sistema" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Configurações" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Gerencie usuários, setores, convites e auditoria." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "users", className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "flex-wrap h-auto gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "users", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4 mr-1.5" }),
          "Usuários"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "profile", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4 mr-1.5" }),
          "Meu Perfil"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "ai", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 mr-1.5 text-accent" }),
          "Inteligência Artificial"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "invites", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4 mr-1.5" }),
          "Convites"
        ] }),
        isGestor && /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "sectors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4 mr-1.5" }),
          "Setores"
        ] }),
        isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "audit", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollText, { className: "h-4 w-4 mr-1.5" }),
          "Auditoria & Logs"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "profile", className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6 shadow-card max-w-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-xl mb-6", children: "Informações Pessoais" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                avatarPreview ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatarPreview, alt: "avatar", className: "h-20 w-20 rounded-full object-cover ring-2 ring-accent/30" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-2xl", children: (profileName || "U").slice(0, 2).toUpperCase() }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => fileRef.current?.click(), className: "absolute bottom-0 right-0 h-7 w-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-md hover:bg-accent/90 transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-3.5 w-3.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: handleAvatarChange })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: profileName || "Sem nome" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: user?.email }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => fileRef.current?.click(), className: "text-xs text-accent hover:underline mt-1", children: "Trocar foto" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Nome Completo" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: profileName, onChange: (e) => setProfileName(e.target.value), placeholder: "Seu nome" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Cargo / Título" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: profileJobTitle, onChange: (e) => setProfileJobTitle(e.target.value), placeholder: "Ex: Desenvolvedor Sênior" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "E-mail (Login)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: user?.email || "", disabled: true, className: "bg-muted cursor-not-allowed" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveProfile, disabled: savingProfile, className: "bg-gradient-primary text-primary-foreground gap-2", children: savingProfile ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
              "Salvando…"
            ] }) : "Salvar Alterações" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6 shadow-card max-w-2xl border-destructive/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-xl mb-2 text-destructive", children: "Zona de Perigo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "A exclusão da conta é permanente e não pode ser desfeita." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", className: "shadow-elegant", children: "Excluir minha conta" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "users", className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-bold", children: "Usuários do Sistema" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: openInvite, onOpenChange: setOpenInvite, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4" }),
                "Convidar"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Convidar Usuário" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Email *" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value), placeholder: "email@empresa.com" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Função" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: inviteRole, onValueChange: setInviteRole, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "colaborador", children: "Colaborador" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gestor", children: "Gestor" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "admin", children: "Administrador" })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleInvite, disabled: inviting, className: "w-full bg-gradient-primary text-primary-foreground", children: inviting ? "Enviando…" : "Enviar Convite" })
                ] })
              ] })
            ] }),
            isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: openCreate, onOpenChange: setOpenCreate, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-gradient-primary text-primary-foreground gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-4 w-4" }),
                "Criar"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Criar Novo Usuário" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Nome *" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: newName, onChange: (e) => setNewName(e.target.value) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Email *" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", value: newEmail, onChange: (e) => setNewEmail(e.target.value) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Senha *" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), placeholder: "Mín. 6" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Função" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newRole, onValueChange: setNewRole, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "colaborador", children: "Colaborador" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gestor", children: "Gestor" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "admin", children: "Administrador" })
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Cargo" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: newJobTitle, onChange: (e) => setNewJobTitle(e.target.value) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreateUser, disabled: creating, className: "w-full bg-gradient-primary text-primary-foreground", children: creating ? "Criando…" : "Criar Usuário" })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4 shadow-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-[200px] space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "Redefinir senha" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", placeholder: "Email do usuário", value: resetEmail, onChange: (e) => setResetEmail(e.target.value), className: "h-9" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => handlePasswordReset(resetEmail), disabled: resetting || !resetEmail, className: "gap-2 h-9", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-4 w-4" }),
            resetting ? "Enviando…" : "Enviar link"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "shadow-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b bg-muted/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3 font-semibold", children: "Nome" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3 font-semibold", children: "Cargo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3 font-semibold", children: "Função" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3 font-semibold", children: "Setor" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3 font-semibold", children: "Criado em" }),
            isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-4 py-3 font-semibold", children: "Ações" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y", children: [
            profiles.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "text-center py-12 text-muted-foreground", children: "Nenhum usuário." }) }),
            profiles.map((p) => {
              const role = getRoleForUser(p.id);
              const isSelf = p.id === user?.id;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/30", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  p.avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.avatar_url, alt: p.full_name, className: "h-9 w-9 rounded-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-accent text-accent-foreground text-xs font-bold", children: (p.full_name || "U").slice(0, 2).toUpperCase() }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: p.full_name || "Sem nome" }),
                    isSelf && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-accent", children: "(você)" })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground", children: p.job_title || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${role === "admin" ? "bg-destructive/10 text-destructive" : role === "gestor" ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"}`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3 w-3" }),
                  roleLabel(role)
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: p.department_id || "none", onValueChange: (v) => handleChangeDepartment(p.id, v), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 w-[150px] text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Sem setor" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Sem setor" }),
                    departments.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: d.id, children: d.name }, d.id))
                  ] })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: getDeptName(p.department_id) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground text-xs", children: new Date(p.created_at).toLocaleDateString("pt-BR") }),
                isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-right", children: !isSelf && /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: role, onValueChange: (v) => handleChangeRole(p.id, v), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 w-[130px] text-xs ml-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "colaborador", children: "Colaborador" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gestor", children: "Gestor" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "admin", children: "Administrador" })
                  ] })
                ] }) })
              ] }, p.id);
            })
          ] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "invites", className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-bold", children: "Convites" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "shadow-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b bg-muted/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3", children: "Email" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3", children: "Função" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3", children: "Expira em" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-4 py-3", children: "Ações" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y", children: [
            invites.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "text-center py-12 text-muted-foreground", children: "Nenhum convite." }) }),
            invites.map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-medium", children: inv.email }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground capitalize", children: inv.role }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: inviteStatusBadge(inv.status) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: new Date(inv.expires_at).toLocaleDateString("pt-BR") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => copyInviteLink(inv), title: "Copiar link", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5" }) }),
                inv.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => resendInvite(inv), title: "Reenviar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => revokeInvite(inv.id), title: "Revogar", className: "text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }) })
                ] })
              ] }) })
            ] }, inv.id))
          ] })
        ] }) }) })
      ] }),
      isGestor && /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "sectors", className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-bold", children: "Setores / Departamentos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Organize os membros da equipe em setores." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNewDept, className: "bg-gradient-primary text-primary-foreground gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
            " Novo Setor"
          ] })
        ] }),
        departments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-12 text-center border-dashed text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-10 w-10 mx-auto mb-3 opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Nenhum setor cadastrado." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "mt-4 bg-gradient-primary", onClick: openNewDept, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
            "Criar primeiro setor"
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4", children: departments.map((d) => {
          const membersInDept = profiles.filter((p) => p.department_id === d.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 shadow-card hover:shadow-elegant transition group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-lg flex items-center justify-center shrink-0", style: {
                backgroundColor: (d.color || "#6366f1") + "22"
              }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5", style: {
                color: d.color || "#6366f1"
              } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold truncate", children: d.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 opacity-0 group-hover:opacity-100 transition", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => openEditDept(d), className: "p-1 hover:text-accent text-muted-foreground transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => deleteDept(d.id), className: "p-1 hover:text-destructive text-muted-foreground transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                  membersInDept.length,
                  " membro(s)"
                ] })
              ] })
            ] }),
            membersInDept.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-1.5", children: [
              membersInDept.slice(0, 5).map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs", children: [
                m.avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: m.avatar_url, alt: m.full_name, className: "h-4 w-4 rounded-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 rounded-full bg-accent/20 text-accent text-[8px] font-bold flex items-center justify-center", children: (m.full_name || "U").slice(0, 1).toUpperCase() }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate max-w-[80px]", children: m.full_name || "Sem nome" })
              ] }, m.id)),
              membersInDept.length > 5 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground px-2 py-1", children: [
                "+",
                membersInDept.length - 5
              ] })
            ] })
          ] }, d.id);
        }) })
      ] }),
      isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "audit", className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-bold", children: "Auditoria & Logs do Sistema" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Rastreamento completo de acessos e alterações críticas." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: load, className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }),
            " Atualizar"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "shadow-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b bg-muted/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]", children: "Quando" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]", children: "Usuário" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]", children: "Entidade" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]", children: "Ação" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-4 py-3 font-bold uppercase tracking-wider text-[10px]", children: "Detalhes" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y", children: [
            audits.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "text-center py-12 text-muted-foreground", children: "Nenhum registro encontrado." }) }),
            audits.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/30 align-top transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono", children: new Date(a.created_at).toLocaleString("pt-BR") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold", children: profileNameFn(a.actor_id).slice(0, 2).toUpperCase() }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: profileNameFn(a.actor_id) })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize text-[10px]", children: a.entity_type }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${a.action === "create" ? "bg-success/10 text-success" : a.action === "delete" ? "bg-destructive/10 text-destructive" : a.action === "login" ? "bg-blue-500/10 text-blue-500" : "bg-accent/10 text-accent"}`, children: a.action }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-[10px] font-bold text-accent", children: "DETALHES" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Detalhes da Auditoria" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "Entidade" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono mt-1 capitalize", children: a.entity_type })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "Ação" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono mt-1 uppercase", children: a.action })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs", children: "Alterações / Dados" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-2 p-4 bg-muted rounded-xl overflow-auto max-h-[300px] text-[11px] font-mono leading-relaxed", children: JSON.stringify(a.changes, null, 2) })
                    ] })
                  ] })
                ] })
              ] }) })
            ] }, a.id))
          ] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "ai", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6 shadow-card border-accent/20 bg-card/80 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent shadow-inner", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-xl", children: "Configuração do Agente IA (Gemini & Groq)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Configure provedores de IA generativa para automação de tarefas, análise de gargalos e chat executivo." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Provedor Preferencial" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: preferredProvider, onValueChange: (v) => setPreferredProvider(v), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 bg-muted/30 border-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auto", children: "Automático (Groq se disponível, senão Gemini ou Heurístico)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gemini", children: "Google Gemini (Recomendado para raciocínio complexo)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "groq", children: "Groq Llama 3.3 (Recomendado para velocidade instantânea)" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-muted/20 border border-white/5 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-blue-500" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "font-bold text-sm", children: "Google Gemini API Key" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://aistudio.google.com/app/apikey", target: "_blank", rel: "noreferrer", className: "text-xs text-accent flex items-center gap-1 hover:underline font-medium", children: [
                  "Criar chave grátis no Google AI Studio ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", placeholder: "AIzaSy...", value: geminiKey, onChange: (e) => setGeminiKey(e.target.value), className: "h-10 bg-background border-white/10 text-xs font-mono" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => handleTestAI("gemini"), disabled: testingAI === "gemini" || !geminiKey.trim(), className: "shrink-0 font-bold text-xs h-10", children: testingAI === "gemini" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-1" }) : "Testar Chave" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-muted/20 border border-white/5 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-amber-500" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "font-bold text-sm", children: "Groq API Key (Llama 3.3 70B)" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://console.groq.com/keys", target: "_blank", rel: "noreferrer", className: "text-xs text-accent flex items-center gap-1 hover:underline font-medium", children: [
                  "Criar chave grátis na Groq Console ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", placeholder: "gsk_...", value: groqKey, onChange: (e) => setGroqKey(e.target.value), className: "h-10 bg-background border-white/10 text-xs font-mono" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => handleTestAI("groq"), disabled: testingAI === "groq" || !groqKey.trim(), className: "shrink-0 font-bold text-xs h-10", children: testingAI === "groq" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-1" }) : "Testar Chave" })
              ] })
            ] }),
            aiTestResult && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-3.5 rounded-xl flex items-start gap-2.5 text-xs ${aiTestResult.success ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-destructive/10 border border-destructive/20 text-destructive"}`, children: [
              aiTestResult.success ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 shrink-0 mt-0.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold uppercase tracking-wider text-[10px]", children: aiTestResult.provider }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5", children: aiTestResult.message })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSaveAIConfig, className: "bg-gradient-primary shadow-glow font-bold px-6", children: "Salvar Chaves e Preferências" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 bg-card/40 border-white/5 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-bold text-sm flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-accent" }),
            "Onde o Agente de IA atua no sistema:"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-xs text-muted-foreground space-y-1.5 list-disc pl-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Chat Global & Assistente Flutuante:" }),
              " Disponível em todas as telas com contexto de produtividade."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Geração Automática de Tarefas:" }),
              " Criação de planos de ação divididos em etapas em ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "Tarefas" }),
              "."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Diagnóstico de Gargalos:" }),
              " Identificação de atrasos e recomendações no ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "Dashboard" }),
              "."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Análise Estratégica:" }),
              " Sugestões de matrizes SWOT, GUT e fluxogramas em ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "Gestão Visual" }),
              "."
            ] })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: deptDialog, onOpenChange: setDeptDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5 text-accent" }),
        editingDept ? "Editar Setor" : "Novo Setor"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Nome do Setor *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: deptName, onChange: (e) => setDeptName(e.target.value), placeholder: "Ex: Engenharia, Marketing…", onKeyDown: (e) => e.key === "Enter" && saveDept() })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Cor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "color", value: deptColor, onChange: (e) => setDeptColor(e.target.value), className: "h-10 w-16 rounded border border-input cursor-pointer" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setDeptColor(c), className: `h-6 w-6 rounded-full transition hover:scale-110 ${deptColor === c ? "ring-2 ring-offset-1 ring-foreground" : ""}`, style: {
              backgroundColor: c
            } }, c)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setDeptDialog(false), children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveDept, disabled: savingDept, className: "bg-gradient-primary text-primary-foreground", children: savingDept ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-1" }),
          "Salvando…"
        ] }) : editingDept ? "Salvar" : "Criar Setor" })
      ] })
    ] }) })
  ] });
}
export {
  SettingsPage as component
};
