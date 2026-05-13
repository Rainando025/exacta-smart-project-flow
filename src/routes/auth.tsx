import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Target, Zap } from "lucide-react";
const logo = "https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/icone_exacta.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>) => ({ invite: typeof s.invite === "string" ? s.invite : undefined }),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { invite } = useSearch({ from: "/auth" });
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [inviteId, setInviteId] = useState<string | null>(null);

  // Resolve invite token → prefill email + remember role
  useEffect(() => {
    if (!invite) return;
    (async () => {
      const { data } = await supabase
        .from("invitations")
        .select("id,email,role,status,expires_at")
        .eq("token", invite)
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

  const acceptInviteIfNeeded = async (newUserId?: string) => {
    if (!inviteId) return;
    await supabase.from("invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", inviteId);
    if (newUserId && inviteRole && inviteRole !== "colaborador") {
      await supabase.from("user_roles").insert([{ user_id: newUserId, role: inviteRole as any }]);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { await acceptInviteIfNeeded(data.user?.id); toast.success("Bem-vindo de volta!"); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: fullName } },
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { await acceptInviteIfNeeded(data.user?.id); toast.success("Conta criada! Verifique seu email."); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero side */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-hero p-12 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div className="relative flex items-center gap-3">
          <img src={logo} alt="EXACTA" className="h-16 w-16 rounded-xl object-contain" />
          <div>
            <h1 className="font-display text-2xl font-bold">EXACTA</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Precisão em gestão</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <h2 className="font-display text-5xl font-bold leading-tight">
            Gestão inteligente.<br />
            <span className="text-gradient-accent">Resultados precisos.</span>
          </h2>
          <p className="text-lg text-white/80 max-w-md">
            Tarefas, projetos, kanban, cronogramas e equipes — tudo em um único lugar, potencializado por IA.
          </p>

          <div className="grid gap-4 max-w-md">
            {[
              { icon: Target, title: "Cronograma com IA", desc: "Gere planejamentos otimizados automaticamente" },
              { icon: Zap, title: "Tempo real", desc: "Colaboração instantânea com toda a equipe" },
              { icon: Sparkles, title: "Insights preditivos", desc: "Identifique gargalos antes que aconteçam" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 rounded-xl bg-white/5 backdrop-blur p-4 border border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-xs text-white/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/50">© 2026 EXACTA. Construído para equipes de alta performance.</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3">
            <img src={logo} alt="EXACTA" className="h-12 w-12" />
            <h1 className="font-display text-xl font-bold">EXACTA</h1>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold">Acesse sua conta</h2>
            <p className="text-muted-foreground mt-2">Entre ou crie uma conta para começar.</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
                  {submitting ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Senha</Label>
                  <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
                  {submitting ? "Criando…" : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
