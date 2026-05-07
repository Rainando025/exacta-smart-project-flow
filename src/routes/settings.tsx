import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, Shield, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  job_title: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

function SettingsPage() {
  return <AppShell><SettingsContent /></AppShell>;
}

function SettingsContent() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Create user form
  const [openCreate, setOpenCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("colaborador");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Invite form
  const [openInvite, setOpenInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("colaborador");
  const [inviting, setInviting] = useState(false);

  // Password reset
  const [resetEmail, setResetEmail] = useState("");
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);
    setProfiles((p || []) as Profile[]);
    setRoles((r || []) as UserRole[]);
    const myRole = (r || []).find((ro: any) => ro.user_id === user.id);
    setIsAdmin(myRole?.role === "admin");
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const getRoleForUser = (uid: string) => {
    const r = roles.find((ro) => ro.user_id === uid);
    return r?.role || "colaborador";
  };

  const roleLabel = (r: string) => {
    if (r === "admin") return "Administrador";
    if (r === "gestor") return "Gestor";
    return "Colaborador";
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newName) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: newName },
        },
      });
      if (error) { toast.error(error.message); setCreating(false); return; }

      if (data.user && newRole !== "colaborador") {
        await supabase.from("user_roles").insert([{
          user_id: data.user.id,
          role: newRole as "admin" | "gestor" | "colaborador",
        }]);
      }

      toast.success(`Usuário ${newName} criado! Um email de confirmação foi enviado.`);
      setNewEmail(""); setNewPassword(""); setNewName(""); setNewRole("colaborador"); setNewJobTitle("");
      setOpenCreate(false);
      setTimeout(load, 2000);
    } catch {
      toast.error("Erro ao criar usuário.");
    }
    setCreating(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Informe o email do convidado.");
      return;
    }
    setInviting(true);
    try {
      // Generate a magic link / invite via signUp with a random password
      // The user will receive a confirmation email and can set their password
      const tempPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
      const { data, error } = await supabase.auth.signUp({
        email: inviteEmail,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { full_name: inviteEmail.split("@")[0], invited: true },
        },
      });
      if (error) { toast.error(error.message); setInviting(false); return; }

      if (data.user && inviteRole !== "colaborador") {
        await supabase.from("user_roles").insert([{
          user_id: data.user.id,
          role: inviteRole as "admin" | "gestor" | "colaborador",
        }]);
      }

      // Send password reset so they can set their own password
      await supabase.auth.resetPasswordForEmail(inviteEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      toast.success(`Convite enviado para ${inviteEmail}! O usuário receberá um link para definir a senha.`);
      setInviteEmail("");
      setInviteRole("colaborador");
      setOpenInvite(false);
      setTimeout(load, 2000);
    } catch {
      toast.error("Erro ao enviar convite.");
    }
    setInviting(false);
  };

  const handlePasswordReset = async (email: string) => {
    if (!email) {
      toast.error("Email não encontrado para este usuário.");
      return;
    }
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) { toast.error(error.message); setResetting(false); return; }
      toast.success(`Link de redefinição de senha enviado para ${email}`);
    } catch {
      toast.error("Erro ao enviar link de redefinição.");
    }
    setResetting(false);
  };

  const handleChangeRole = async (userId: string, role: string) => {
    const existing = roles.find((r) => r.user_id === userId);
    if (existing) {
      await supabase.from("user_roles").delete().eq("id", existing.id);
    }
    if (role !== "colaborador") {
      await supabase.from("user_roles").insert([{ user_id: userId, role: role as "admin" | "gestor" | "colaborador" }]);
    }
    toast.success("Função atualizada!");
    load();
  };

  // Find email for a user (we don't have it in profiles, so we use the auth user's email for self)
  const getUserEmail = (uid: string) => {
    if (uid === user?.id) return user.email || "";
    return "";
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-4xl mx-auto">
      <header>
        <p className="text-sm text-accent font-medium uppercase tracking-wider">Sistema</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie usuários e permissões do sistema.</p>
      </header>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" />Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold">Usuários do Sistema</h2>
            <div className="flex gap-2">
              {/* Invite button */}
              <Dialog open={openInvite} onOpenChange={setOpenInvite}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" /> Convidar por Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Convidar Usuário por Email</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <p className="text-sm text-muted-foreground">
                      O convidado receberá um email com um link para definir a senha e acessar o sistema.
                    </p>
                    <div className="space-y-2">
                      <Label>Email do convidado *</Label>
                      <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colaborador@empresa.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Função</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="colaborador">Colaborador</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleInvite} disabled={inviting} className="w-full bg-gradient-primary text-primary-foreground">
                      {inviting ? "Enviando…" : "Enviar Convite"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Create user button */}
              <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary text-primary-foreground shadow-elegant gap-2">
                    <UserPlus className="h-4 w-4" /> Criar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label>Nome completo *</Label>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do colaborador" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="colaborador@empresa.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Senha *</Label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <Select value={newRole} onValueChange={setNewRole}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="colaborador">Colaborador</SelectItem>
                            <SelectItem value="gestor">Gestor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cargo</Label>
                        <Input value={newJobTitle} onChange={(e) => setNewJobTitle(e.target.value)} placeholder="Ex: Analista" />
                      </div>
                    </div>
                    <Button onClick={handleCreateUser} disabled={creating} className="w-full bg-gradient-primary text-primary-foreground">
                      {creating ? "Criando…" : "Criar Usuário"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Password reset for any email */}
          <Card className="p-4 shadow-card">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label className="text-xs text-muted-foreground">Redefinir senha de um usuário</Label>
                <Input
                  type="email"
                  placeholder="Email do usuário"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => handlePasswordReset(resetEmail)}
                disabled={resetting || !resetEmail}
                className="gap-2 h-9"
              >
                <KeyRound className="h-4 w-4" />
                {resetting ? "Enviando…" : "Enviar link de redefinição"}
              </Button>
            </div>
          </Card>

          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold">Nome</th>
                    <th className="text-left px-4 py-3 font-semibold">Cargo</th>
                    <th className="text-left px-4 py-3 font-semibold">Função</th>
                    <th className="text-left px-4 py-3 font-semibold">Criado em</th>
                    {isAdmin && <th className="text-right px-4 py-3 font-semibold">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {profiles.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum usuário encontrado.</td></tr>
                  )}
                  {profiles.map((p) => {
                    const role = getRoleForUser(p.id);
                    const isSelf = p.id === user?.id;
                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-accent text-accent-foreground text-xs font-bold">
                              {(p.full_name || "U").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{p.full_name || "Sem nome"}</p>
                              {isSelf && <span className="text-[10px] text-accent">(você)</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.job_title || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            role === "admin" ? "bg-destructive/10 text-destructive" :
                            role === "gestor" ? "bg-warning/10 text-warning" :
                            "bg-accent/10 text-accent"
                          }`}>
                            <Shield className="h-3 w-3" />
                            {roleLabel(role)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isSelf && (
                                <Select value={role} onValueChange={(v) => handleChangeRole(p.id, v)}>
                                  <SelectTrigger className="h-8 w-[130px] text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="colaborador">Colaborador</SelectItem>
                                    <SelectItem value="gestor">Gestor</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
