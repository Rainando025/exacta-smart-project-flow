import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Target, Zap, ShieldAlert } from "lucide-react";
import { getLockoutStatus, recordFailedLogin, clearFailedLogins } from "@/lib/security/rate-limiter";
import { sanitizeString } from "@/lib/security/sanitizer";
import { useSplash, DIGITAL_TARGET_VIDEO } from "@/components/SplashScreen";

const logo = "https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/icone_exacta.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>) => ({ invite: typeof s.invite === "string" ? s.invite : undefined }),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { showSplash } = useSplash();
  const { invite } = useSearch({ from: "/auth" });
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [lockoutMsg, setLockoutMsg] = useState<string | null>(null);

  // Resolve invite token → prefill email + remember role
  useEffect(() => {
    if (!invite) return;
    (async () => {
      const sanitizedToken = sanitizeString(invite);
      const { data } = await supabase
        .from("invitations")
        .select("id,email,role,status,expires_at")
        .eq("token", sanitizedToken)
        .maybeSingle();
      if (data && data.status === "pending" && new Date(data.expires_at) > new Date()) {
        setEmail(data.email);
        setInviteRole(data.role);
        setInviteId(data.id);
        toast.info(`Convite válido para ${data.email} (${data.role})`);
      } else if (data) {
        toast.error("Convite expirado ou já utilizado.");
      }
    })();
  }, [invite]);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  // Check lockout status whenever email changes
  useEffect(() => {
    if (!email) {
      setLockoutMsg(null);
      return;
    }
    const status = getLockoutStatus(email);
    if (status.isLocked) {
      const mins = Math.ceil(status.remainingSeconds / 60);
      setLockoutMsg(`Conta temporariamente bloqueada por segurança. Tente novamente em ~${mins} minutos.`);
    } else {
      setLockoutMsg(null);
    }
  }, [email]);

  const acceptInviteIfNeeded = async (newUserId?: string) => {
    if (!inviteId) return;
    await supabase.from("invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", inviteId);
    if (newUserId && inviteRole && inviteRole !== "colaborador") {
      await supabase.from("user_roles").insert([{ user_id: newUserId, role: inviteRole as any }]);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeString(email).toLowerCase();

    // 1. Check account lockout (5 failed attempts limit)
    const lockoutStatus = getLockoutStatus(cleanEmail);
    if (lockoutStatus.isLocked) {
      const mins = Math.ceil(lockoutStatus.remainingSeconds / 60);
      const msg = `Muitas tentativas de login incorretas. Acesso bloqueado por segurança. Tente novamente em ~${mins} minutos.`;
      setLockoutMsg(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setSubmitting(false);

    if (error) {
      // Record failed attempt
      const result = recordFailedLogin(cleanEmail);
      if (result.isLocked) {
        const mins = Math.ceil(result.remainingSeconds / 60);
        const msg = `Acesso bloqueado após 5 tentativas incorretas. Tente novamente em ~${mins} min.`;
        setLockoutMsg(msg);
        toast.error(msg);
      } else {
        toast.error(`Credenciais inválidas. Você possui mais ${result.attemptsLeft} tentativa(s) antes do bloqueio.`);
      }
    } else {
      clearFailedLogins(cleanEmail);
      await acceptInviteIfNeeded(data.user?.id);
      toast.success("Bem-vindo de volta!");
      showSplash("Autenticando e preparando seu painel...", 2400);
      navigate({ to: "/dashboard" });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanName = sanitizeString(fullName);

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: cleanName } },
    });
    setSubmitting(false);

    if (error) toast.error(error.message);
    else { await acceptInviteIfNeeded(data.user?.id); toast.success("Conta criada! Verifique seu email."); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero side */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-hero p-12 text-white overflow-hidden">
        {/* Vídeo de fundo sutil com baixa opacidade */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-20 mix-blend-screen"
        >
          <source src={DIGITAL_TARGET_VIDEO} type="video/mp4" />
        </video>

        {/* Imagem de fundo com overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{
          backgroundImage: "url('https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/exactaback.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }} />

        {/* Fundo cibernético e iluminação azul */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.15)_0%,rgba(6,9,19,0.9)_80%)] pointer-events-none" />

        <div className="relative flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EXACTA" className="h-14 w-14 rounded-xl object-contain drop-shadow-md" />
            <div>
              <h1 className="font-display text-2xl font-bold tracking-wide">EXACTA</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Precisão em gestão</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6 my-auto">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Gestão inteligente.<br />
            <span className="text-gradient-accent">Resultados precisos.</span>
          </h2>
          <p className="text-base text-white/80 max-w-md">
            Tarefas, projetos, kanban, cronogramas e equipes — tudo em um único lugar, potencializado por IA.
          </p>

          <div className="grid gap-3 max-w-md">
            {[
              { icon: Target, title: "Cronograma com IA", desc: "Gere planejamentos otimizados automaticamente" },
              { icon: Zap, title: "Tempo real", desc: "Colaboração instantânea com toda a equipe" },
              { icon: Sparkles, title: "Insights preditivos", desc: "Identifique gargalos antes que aconteçam" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 rounded-xl bg-white/5 backdrop-blur-md p-3.5 border border-white/10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-xs text-white/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/50">© 2026 EXACTA. Construído para equipes de alta performance.</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3">
            <img src={logo} alt="EXACTA" className="h-10 w-10 object-contain drop-shadow-md" />
            <div>
              <h1 className="font-display text-xl font-bold">EXACTA</h1>
              <p className="text-[10px] uppercase tracking-widest text-accent">Precisão em gestão</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold">Acesse sua conta</h2>
            <p className="text-muted-foreground mt-2">Informe suas credenciais para entrar na plataforma.</p>
          </div>

          {lockoutMsg && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{lockoutMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={submitting || !!lockoutMsg} className="w-full bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
              {submitting ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Ao acessar, você concorda com nossos{" "}
            <Link to="/legal" className="underline hover:text-foreground transition-colors">Termos de Uso</Link>
            {" "}e{" "}
            <Link to="/legal" className="underline hover:text-foreground transition-colors">Política de Privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

