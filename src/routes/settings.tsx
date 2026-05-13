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
import { UserPlus, Users, Shield, Mail, KeyRound, Send, X, Copy, ScrollText, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

interface Profile { id: string; full_name: string; avatar_url: string | null; job_title: string | null; created_at: string; }
interface UserRole { id: string; user_id: string; role: string; }
interface Invitation { id: string; email: string; role: string; token: string; status: string; expires_at: string; created_at: string; accepted_at: string | null; invited_by: string; }
interface AuditLog { id: string; actor_id: string | null; entity_type: string; entity_id: string | null; action: string; changes: any; created_at: string; }

function SettingsPage() { return <AppShell><SettingsContent /></AppShell>; }

function SettingsContent() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [newEmail, setNewEmail] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState(""); const [newRole, setNewRole] = useState("colaborador");
  const [newJobTitle, setNewJobTitle] = useState(""); const [creating, setCreating] = useState(false);

  const [openInvite, setOpenInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(""); const [inviteRole, setInviteRole] = useState("colaborador");
  const [inviting, setInviting] = useState(false);

  const [resetEmail, setResetEmail] = useState(""); const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: p }, { data: r }, { data: inv }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("invitations").select("*").order("created_at", { ascending: false }),
    ]);
    setProfiles((p || []) as Profile[]);
    setRoles((r || []) as UserRole[]);
    setInvites((inv || []) as Invitation[]);
    const myRole = (r || []).find((ro: any) => ro.user_id === user.id);
    const admin = myRole?.role === "admin";
    setIsAdmin(admin);
    if (admin) {
      const { data: a } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      setAudits((a || []) as AuditLog[]);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const getRoleForUser = (uid: string) => roles.find((ro) => ro.user_id === uid)?.role || "colaborador";
  const roleLabel = (r: string) => r === "admin" ? "Administrador" : r === "gestor" ? "Gestor" : "Colaborador";

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newName) return toast.error("Preencha todos os campos obrigatórios.");
    if (newPassword.length < 6) return toast.error("Senha mínima de 6 caracteres.");
    setCreating(true);
    const { data, error } = await supabase.auth.signUp({
      email: newEmail, password: newPassword,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: newName } },
    });
    if (error) { toast.error(error.message); setCreating(false); return; }
    if (data.user && newRole !== "colaborador") {
      await supabase.from("user_roles").insert([{ user_id: data.user.id, role: newRole as any }]);
    }
    toast.success(`Usuário ${newName} criado!`);
    setNewEmail(""); setNewPassword(""); setNewName(""); setNewRole("colaborador"); setNewJobTitle("");
    setOpenCreate(false);
    setTimeout(load, 1500);
    setCreating(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !user) return toast.error("Informe o email do convidado.");
    setInviting(true);
    const { data, error } = await supabase.from("invitations").insert({
      email: inviteEmail, role: inviteRole as any, invited_by: user.id,
    }).select().single();
    if (error) { toast.error(error.message); setInviting(false); return; }
    const link = `${window.location.origin}/auth?invite=${data.token}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    await supabase.auth.resetPasswordForEmail(inviteEmail, { redirectTo: link });
    toast.success(`Convite criado! Link copiado.`);
    setInviteEmail(""); setInviteRole("colaborador"); setOpenInvite(false);
    load();
    setInviting(false);
  };

  const resendInvite = async (inv: Invitation) => {
    const link = `${window.location.origin}/auth?invite=${inv.token}`;
    await supabase.from("invitations").update({ expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), status: "pending" }).eq("id", inv.id);
    await supabase.auth.resetPasswordForEmail(inv.email, { redirectTo: link });
    toast.success(`Convite reenviado para ${inv.email}`);
    load();
  };

  const revokeInvite = async (id: string) => {
    await supabase.from("invitations").update({ status: "revoked" }).eq("id", id);
    toast.success("Convite revogado.");
    load();
  };

  const copyInviteLink = async (inv: Invitation) => {
    const link = `${window.location.origin}/auth?invite=${inv.token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const handlePasswordReset = async (email: string) => {
    if (!email) return toast.error("Email obrigatório.");
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
    if (error) toast.error(error.message); else toast.success(`Link enviado para ${email}`);
    setResetting(false);
  };

  const handleChangeRole = async (userId: string, role: string) => {
    const existing = roles.find((r) => r.user_id === userId);
    if (existing) await supabase.from("user_roles").delete().eq("id", existing.id);
    if (role !== "colaborador") await supabase.from("user_roles").insert([{ user_id: userId, role: role as any }]);
    toast.success("Função atualizada!");
    load();
  };

  const profileName = (id: string | null) => id ? (profiles.find((p) => p.id === id)?.full_name || id.slice(0, 8)) : "Sistema";
  const inviteStatusBadge = (s: string) => {
    const c = s === "accepted" ? "bg-success/10 text-success" : s === "revoked" ? "bg-muted text-muted-foreground" : "bg-warning/10 text-warning";
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c}`}>{s === "accepted" ? "Aceito" : s === "revoked" ? "Revogado" : "Pendente"}</span>;
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      <header>
        <p className="text-sm text-accent font-medium uppercase tracking-wider">Sistema</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie usuários, convites e auditoria.</p>
      </header>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-1.5" />Meu Perfil</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" />Usuários</TabsTrigger>
          <TabsTrigger value="invites"><Mail className="h-4 w-4 mr-1.5" />Convites</TabsTrigger>
          {isAdmin && <TabsTrigger value="audit"><ScrollText className="h-4 w-4 mr-1.5" />Auditoria</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 shadow-card max-w-2xl">
            <h3 className="font-display font-bold text-xl mb-4">Informações Pessoais</h3>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input 
                    value={profile?.full_name || ""} 
                    onChange={(e) => {/* In a real app, update state and DB */}} 
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo / Título</Label>
                  <Input 
                    value={profile?.job_title || ""} 
                    placeholder="Ex: Desenvolvedor Sênior"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-mail (Login)</Label>
                <Input value={user?.email || ""} disabled className="bg-muted cursor-not-allowed" />
              </div>
              <div className="pt-4 flex justify-end">
                <Button className="bg-gradient-primary text-primary-foreground">Salvar Alterações</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card max-w-2xl border-destructive/20">
            <h3 className="font-display font-bold text-xl mb-2 text-destructive">Zona de Perigo</h3>
            <p className="text-sm text-muted-foreground mb-4">A exclusão da conta é permanente e não pode ser desfeita.</p>
            <Button variant="destructive" className="shadow-elegant">Excluir minha conta</Button>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold">Usuários do Sistema</h2>
            <div className="flex gap-2">
              <Dialog open={openInvite} onOpenChange={setOpenInvite}>
                <DialogTrigger asChild><Button variant="outline" className="gap-2"><Mail className="h-4 w-4" />Convidar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Convidar Usuário</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2"><Label>Email *</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@empresa.com" /></div>
                    <div className="space-y-2"><Label>Função</Label>
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

              <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogTrigger asChild><Button className="bg-gradient-primary text-primary-foreground gap-2"><UserPlus className="h-4 w-4" />Criar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2"><Label>Nome *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Senha *</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mín. 6" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Função</Label>
                        <Select value={newRole} onValueChange={setNewRole}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="colaborador">Colaborador</SelectItem>
                            <SelectItem value="gestor">Gestor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Cargo</Label><Input value={newJobTitle} onChange={(e) => setNewJobTitle(e.target.value)} /></div>
                    </div>
                    <Button onClick={handleCreateUser} disabled={creating} className="w-full bg-gradient-primary text-primary-foreground">
                      {creating ? "Criando…" : "Criar Usuário"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="p-4 shadow-card">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label className="text-xs">Redefinir senha</Label>
                <Input type="email" placeholder="Email do usuário" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="h-9" />
              </div>
              <Button variant="outline" onClick={() => handlePasswordReset(resetEmail)} disabled={resetting || !resetEmail} className="gap-2 h-9">
                <KeyRound className="h-4 w-4" />{resetting ? "Enviando…" : "Enviar link"}
              </Button>
            </div>
          </Card>

          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold">Cargo</th>
                  <th className="text-left px-4 py-3 font-semibold">Função</th>
                  <th className="text-left px-4 py-3 font-semibold">Criado em</th>
                  {isAdmin && <th className="text-right px-4 py-3 font-semibold">Ações</th>}
                </tr></thead>
                <tbody className="divide-y">
                  {profiles.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum usuário.</td></tr>}
                  {profiles.map((p) => {
                    const role = getRoleForUser(p.id);
                    const isSelf = p.id === user?.id;
                    return (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3"><div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-accent text-accent-foreground text-xs font-bold">{(p.full_name || "U").slice(0, 2).toUpperCase()}</div>
                          <div><p className="font-medium">{p.full_name || "Sem nome"}</p>{isSelf && <span className="text-[10px] text-accent">(você)</span>}</div>
                        </div></td>
                        <td className="px-4 py-3 text-muted-foreground">{p.job_title || "—"}</td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${role === "admin" ? "bg-destructive/10 text-destructive" : role === "gestor" ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"}`}><Shield className="h-3 w-3" />{roleLabel(role)}</span></td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                        {isAdmin && <td className="px-4 py-3 text-right">{!isSelf && (
                          <Select value={role} onValueChange={(v) => handleChangeRole(p.id, v)}>
                            <SelectTrigger className="h-8 w-[130px] text-xs ml-auto"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="colaborador">Colaborador</SelectItem>
                              <SelectItem value="gestor">Gestor</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        )}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* INVITES TAB */}
        <TabsContent value="invites" className="space-y-4">
          <h2 className="font-display text-xl font-bold">Convites</h2>
          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Função</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Expira em</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr></thead>
                <tbody className="divide-y">
                  {invites.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum convite.</td></tr>}
                  {invites.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{inv.email}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{inv.role}</td>
                      <td className="px-4 py-3">{inviteStatusBadge(inv.status)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(inv.expires_at).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => copyInviteLink(inv)} title="Copiar link"><Copy className="h-3.5 w-3.5" /></Button>
                          {inv.status === "pending" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => resendInvite(inv)} title="Reenviar"><Send className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => revokeInvite(inv.id)} title="Revogar" className="text-destructive"><X className="h-3.5 w-3.5" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* AUDIT TAB */}
        {isAdmin && (
          <TabsContent value="audit" className="space-y-4">
            <h2 className="font-display text-xl font-bold">Registro de Auditoria</h2>
            <p className="text-sm text-muted-foreground">Últimas 100 alterações em tarefas, projetos e funções.</p>
            <Card className="shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3">Quando</th>
                    <th className="text-left px-4 py-3">Autor</th>
                    <th className="text-left px-4 py-3">Entidade</th>
                    <th className="text-left px-4 py-3">Ação</th>
                    <th className="text-left px-4 py-3">Detalhes</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {audits.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum registro.</td></tr>}
                    {audits.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30 align-top">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3">{profileName(a.actor_id)}</td>
                        <td className="px-4 py-3 capitalize">{a.entity_type}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.action === "create" ? "bg-success/10 text-success" : a.action === "delete" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{a.action}</span>
                        </td>
                        <td className="px-4 py-3">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-accent">ver</summary>
                            <pre className="mt-2 p-2 bg-muted rounded max-w-md overflow-auto max-h-48 text-[10px]">{JSON.stringify(a.changes, null, 2)}</pre>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
