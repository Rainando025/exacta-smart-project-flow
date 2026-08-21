import { S as reactExports, I as jsxRuntimeExports } from "./index.mjs";
import { ak as useAuth, at as useNavigate, aw as useSearch, ai as supabase, aj as toast, L as Label$1, b as Button } from "./router-Bktayy9l.mjs";
import { S as Sparkles, I as Input } from "./input-nTKCBTY6.mjs";
import { T as Tabs, b as TabsList, c as TabsTrigger, a as TabsContent } from "./tabs-DVtr1KIk.mjs";
import { T as Target } from "./target-BBkqu7Bi.mjs";
import { Z as Zap } from "./zap-CmRyB6hR.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const logo = "https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/icone_exacta.png";
function AuthPage() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const {
    invite
  } = useSearch({
    from: "/auth"
  });
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [fullName, setFullName] = reactExports.useState("");
  const [inviteRole, setInviteRole] = reactExports.useState(null);
  const [inviteId, setInviteId] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!invite) return;
    (async () => {
      const {
        data
      } = await supabase.from("invitations").select("id,email,role,status,expires_at").eq("token", invite).maybeSingle();
      if (data && data.status === "pending" && new Date(data.expires_at) > /* @__PURE__ */ new Date()) {
        setEmail(data.email);
        setInviteRole(data.role);
        setInviteId(data.id);
        toast.info(`Convite válido para ${data.email} (${data.role})`);
      } else if (data) {
        toast.error("Convite expirado ou já utilizado.");
      }
    })();
  }, [invite]);
  reactExports.useEffect(() => {
    if (!loading && user) navigate({
      to: "/dashboard"
    });
  }, [user, loading, navigate]);
  const acceptInviteIfNeeded = async (newUserId) => {
    if (!inviteId) return;
    await supabase.from("invitations").update({
      status: "accepted",
      accepted_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", inviteId);
    if (newUserId && inviteRole && inviteRole !== "colaborador") {
      await supabase.from("user_roles").insert([{
        user_id: newUserId,
        role: inviteRole
      }]);
    }
  };
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      await acceptInviteIfNeeded(data.user?.id);
      toast.success("Bem-vindo de volta!");
    }
  };
  const handleSignUp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const {
      data,
      error
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName
        }
      }
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      await acceptInviteIfNeeded(data.user?.id);
      toast.success("Conta criada! Verifique seu email.");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen grid lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative hidden lg:flex flex-col justify-between bg-gradient-hero p-12 text-white overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 opacity-30 mix-blend-overlay", style: {
        backgroundImage: "url('https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/exactaback.png')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logo, alt: "EXACTA", className: "h-16 w-16 rounded-xl object-contain" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-bold", children: "EXACTA" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-accent", children: "Precisão em gestão" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative space-y-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display text-5xl font-bold leading-tight", children: [
          "Gestão inteligente.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gradient-accent", children: "Resultados precisos." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-white/80 max-w-md", children: "Tarefas, projetos, kanban, cronogramas e equipes — tudo em um único lugar, potencializado por IA." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 max-w-md", children: [{
          icon: Target,
          title: "Cronograma com IA",
          desc: "Gere planejamentos otimizados automaticamente"
        }, {
          icon: Zap,
          title: "Tempo real",
          desc: "Colaboração instantânea com toda a equipe"
        }, {
          icon: Sparkles,
          title: "Insights preditivos",
          desc: "Identifique gargalos antes que aconteçam"
        }].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 rounded-xl bg-white/5 backdrop-blur p-4 border border-white/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(f.icon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-sm", children: f.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-white/70", children: f.desc })
          ] })
        ] }, f.title)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "relative text-xs text-white/50", children: "© 2026 EXACTA. Construído para equipes de alta performance." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-6 lg:p-12 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:hidden flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logo, alt: "EXACTA", className: "h-12 w-12" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-xl font-bold", children: "EXACTA" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-3xl font-bold", children: "Acesse sua conta" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Entre ou crie uma conta para começar." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "signin", className: "w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "signin", children: "Entrar" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "signup", children: "Criar conta" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "signin", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSignIn, className: "space-y-4 mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "email", children: "Email" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "voce@empresa.com" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "password", children: "Senha" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "password", type: "password", required: true, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "••••••••" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: submitting, className: "w-full bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90", children: submitting ? "Entrando…" : "Entrar" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "signup", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSignUp, className: "space-y-4 mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "name", children: "Nome completo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "name", required: true, value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: "Seu nome" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "email2", children: "Email" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email2", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "voce@empresa.com" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "password2", children: "Senha" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "password2", type: "password", required: true, minLength: 6, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Mínimo 6 caracteres" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: submitting, className: "w-full bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90", children: submitting ? "Criando…" : "Criar conta" })
        ] }) })
      ] })
    ] }) })
  ] });
}
export {
  AuthPage as component
};
