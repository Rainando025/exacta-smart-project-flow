import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, Shield, Mail, KeyRound, Send, X, Copy, ScrollText, User, RefreshCw, Building2, Camera, Loader2, Plus, Trash2, Pencil, Sparkles, Key, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getAIConfig, saveAIConfig, testAIConnection, type AIConfig } from "@/lib/ai";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

interface Profile { id: string; full_name: string; avatar_url: string | null; job_title: string | null; created_at: string; department_id: string | null; }
interface UserRole { id: string; user_id: string; role: string; }
interface Invitation { id: string; email: string; role: string; token: string; status: string; expires_at: string; created_at: string; accepted_at: string | null; invited_by: string; }
interface AuditLog { id: string; actor_id: string | null; entity_type: string; entity_id: string | null; action: string; changes: any; created_at: string; }
interface Department { id: string; name: string; color: string | null; created_at: string; }

function SettingsPage() { return <AppShell><SettingsContent /></AppShell>; }

function SettingsContent() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGestor, setIsGestor] = useState(false);

  // Profile editing state
  const [profileName, setProfileName] = useState("");
  const [profileJobTitle, setProfileJobTitle] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [newEmail, setNewEmail] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState(""); const [newRole, setNewRole] = useState("colaborador");
  const [newJobTitle, setNewJobTitle] = useState(""); const [creating, setCreating] = useState(false);

  const [openInvite, setOpenInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(""); const [inviteRole, setInviteRole] = useState("colaborador");
  const [inviting, setInviting] = useState(false);

  const [resetEmail, setResetEmail] = useState(""); const [resetting, setResetting] = useState(false);

  // Department state
  const [deptDialog, setDeptDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptColor, setDeptColor] = useState("#6366f1");
  const [savingDept, setSavingDept] = useState(false);

  // AI Settings state
  const [aiConfig, setAiConfigState] = useState<AIConfig>(getAIConfig);
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [preferredProvider, setPreferredProvider] = useState<"gemini" | "groq" | "auto">("auto");
  const [testingAI, setTestingAI] = useState<string | null>(null);
  const [aiTestResult, setAiTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: p }, { data: r }, { data: inv }, { data: depts }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("invitations").select("*").order("created_at", { ascending: false }),
      supabase.from("departments").select("*").order("name"),
    ]);
    setProfiles((p || []) as Profile[]);
    setRoles((r || []) as UserRole[]);
    setInvites((inv || []) as Invitation[]);
    setDepartments((depts || []) as Department[]);
    const myRole = (r || []).find((ro: any) => ro.user_id === user.id);
    const admin = myRole?.role === "admin";
    const gestor = myRole?.role === "gestor" || admin;
    setIsAdmin(admin);
    setIsGestor(gestor);
    if (admin) {
      const { data: a } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      setAudits((a || []) as AuditLog[]);
    }
  }, [user]);

  useEffect(() => {
    load();
    // Populate profile form
    if (profile) {
      setProfileName(profile.full_name || "");
      setProfileJobTitle((profile as any).job_title || "");
      setAvatarPreview((profile as any).avatar_url || null);
    }
    // Populate AI config
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
      preferredProvider,
    });
    setAiConfigState(updated);
    toast.success("Configura├º├Áes de Intelig├¬ncia Artificial salvas!");
  };

  const handleTestAI = async (provider: "gemini" | "groq") => {
    setTestingAI(provider);
    setAiTestResult(null);
    const key = provider === "gemini" ? geminiKey : groqKey;
    const res = await testAIConnection(provider, key);
    setTestingAI(null);
    setAiTestResult({ provider, success: res.success, message: res.message });
    if (res.success) {
      toast.success(`Chave ${provider.toUpperCase()} validada com sucesso!`);
    } else {
      toast.error(res.message);
    }
  };

  const getRoleForUser = (uid: string) => roles.find((ro) => ro.user_id === uid)?.role || "colaborador";
  const roleLabel = (r: string) => r === "admin" ? "Administrador" : r === "gestor" ? "Gestor" : "Colaborador";
  const getDeptName = (deptId: string | null) => deptId ? (departments.find((d) => d.id === deptId)?.name || "ÔÇö") : "ÔÇö";

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newName) return toast.error("Preencha todos os campos obrigat├│rios.");
    if (newPassword.length < 6) return toast.error("Senha m├¡nima de 6 caracteres.");
    setCreating(true);
    const { data, error } = await supabase.auth.signUp({
      email: newEmail, password: newPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: newName, job_title: newJobTitle }
      },
    });
    if (error) { toast.error(error.message); setCreating(false); return; }
    if (data.user && newRole !== "colaborador") {
      await supabase.from("user_roles").upsert({ user_id: data.user.id, role: newRole as any }, { onConflict: "user_id" });
    }
    toast.success(`Usu├írio ${newName} criado!`);
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
    if (!email) return toast.error("Email obrigat├│rio.");
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
    if (error) toast.error(error.message); else toast.success(`Link enviado para ${email}`);
    setResetting(false);
  };

  const handleChangeRole = async (userId: string, role: string) => {
    const existing = roles.find((r) => r.user_id === userId);
    if (existing) await supabase.from("user_roles").delete().eq("id", existing.id);
    if (role !== "colaborador") await supabase.from("user_roles").insert([{ user_id: userId, role: role as any }]);
    toast.success("Fun├º├úo atualizada!");
    load();
  };

  const handleChangeDepartment = async (userId: string, deptId: string) => {
    const val = deptId === "none" ? null : deptId;
    const { error } = await supabase.from("profiles").update({ department_id: val } as any).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Setor atualizado!"); load(); }
  };

  // Profile save
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    let avatar_url = (profile as any)?.avatar_url || null;
    if (avatarFile) {
      const path = `avatars/${user.id}/${Date.now()}_${avatarFile.name}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      } else {
        toast.error("Erro ao fazer upload da foto: " + upErr.message);
      }
    }
    const { error } = await supabase.from("profiles").update({
      full_name: profileName,
      job_title: profileJobTitle,
      avatar_url,
    } as any).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Perfil atualizado!"); load(); }
    setSavingProfile(false);
  };

  // Department CRUD
  const openNewDept = () => {
    setEditingDept(null);
    setDeptName("");
    setDeptColor("#6366f1");
    setDeptDialog(true);
  };

  const openEditDept = (d: Department) => {
    setEditingDept(d);
    setDeptName(d.name);
    setDeptColor(d.color || "#6366f1");
    setDeptDialog(true);
  };

  const saveDept = async () => {
    if (!deptName.trim()) return toast.error("Nome do setor ├® obrigat├│rio.");
    setSavingDept(true);
    if (editingDept) {
      const { error } = await supabase.from("departments").update({ name: deptName.trim(), color: deptColor }).eq("id", editingDept.id);
      if (error) toast.error(error.message); else toast.success("Setor atualizado!");
    } else {
      const { error } = await supabase.from("departments").insert({ name: deptName.trim(), color: deptColor });
      if (error) toast.error(error.message); else toast.success("Setor criado!");
    }
    setSavingDept(false);
    setDeptDialog(false);
    load();
  };

  const deleteDept = async (id: string) => {
    if (!confirm("Excluir este setor? Os usu├írios ser├úo desvinculados.")) return;
    // Unlink users from this dept
    await supabase.from("profiles").update({ department_id: null } as any).eq("department_id", id);
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Setor exclu├¡do."); load(); }
  };

  const profileNameFn = (id: string | null) => id ? (profiles.find((p) => p.id === id)?.full_name || id.slice(0, 8)) : "Sistema";
  const inviteStatusBadge = (s: string) => {
    const c = s === "accepted" ? "bg-success/10 text-success" : s === "revoked" ? "bg-muted text-muted-foreground" : "bg-warning/10 text-warning";
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c}`}>{s === "accepted" ? "Aceito" : s === "revoked" ? "Revogado" : "Pendente"}</span>;
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      <header>
        <p className="text-sm text-accent font-medium uppercase tracking-wider">Sistema</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Configura├º├Áes</h1>
        <p className="text-muted-foreground mt-1">Gerencie usu├írios, setores, convites e auditoria.</p>
      </header>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" />Usu├írios</TabsTrigger>
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-1.5" />Meu Perfil</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles className="h-4 w-4 mr-1.5 text-accent" />Intelig├¬ncia Artificial</TabsTrigger>
          <TabsTrigger value="invites"><Mail className="h-4 w-4 mr-1.5" />Convites</TabsTrigger>
          {isGestor && <TabsTrigger value="sectors"><Building2 className="h-4 w-4 mr-1.5" />Setores</TabsTrigger>}
          {isAdmin && <TabsTrigger value="audit"><ScrollText className="h-4 w-4 mr-1.5" />Auditoria & Logs</TabsTrigger>}
        </TabsList>

        {/* ÔöÇÔöÇ MEU PERFIL TAB ÔöÇÔöÇ */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 shadow-card max-w-2xl">
            <h3 className="font-display font-bold text-xl mb-6">Informa├º├Áes Pessoais</h3>
            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="h-20 w-20 rounded-full object-cover ring-2 ring-accent/30" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-2xl">
                      {(profileName || "U").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-md hover:bg-accent/90 transition"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <p className="font-medium">{profileName || "Sem nome"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <button onClick={() => fileRef.current?.click()} className="text-xs text-accent hover:underline mt-1">Trocar foto</button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label>Cargo / T├¡tulo</Label>
                  <Input value={profileJobTitle} onChange={(e) => setProfileJobTitle(e.target.value)} placeholder="Ex: Desenvolvedor S├¬nior" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-mail (Login)</Label>
                <Input value={user?.email || ""} disabled className="bg-muted cursor-not-allowed" />
              </div>
              <div className="pt-2 flex justify-end">
                <Button onClick={saveProfile} disabled={savingProfile} className="bg-gradient-primary text-primary-foreground gap-2">
                  {savingProfile ? <><Loader2 className="h-4 w-4 animate-spin" />SalvandoÔÇª</> : "Salvar Altera├º├Áes"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card max-w-2xl border-destructive/20">
            <h3 className="font-display font-bold text-xl mb-2 text-destructive">Zona de Perigo</h3>
            <p className="text-sm text-muted-foreground mb-4">A exclus├úo da conta ├® permanente e n├úo pode ser desfeita.</p>
            <Button variant="destructive" className="shadow-elegant">Excluir minha conta</Button>
          </Card>
        </TabsContent>

        {/* ÔöÇÔöÇ USERS TAB ÔöÇÔöÇ */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold">Usu├írios do Sistema</h2>
            <div className="flex gap-2">
              {isAdmin && <Dialog open={openInvite} onOpenChange={setOpenInvite}>
                <DialogTrigger asChild><Button variant="outline" className="gap-2"><Mail className="h-4 w-4" />Convidar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Convidar Usu├írio</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2"><Label>Email *</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@empresa.com" /></div>
                    <div className="space-y-2"><Label>Fun├º├úo</Label>
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
                      {inviting ? "EnviandoÔÇª" : "Enviar Convite"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>}

              {isAdmin && <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogTrigger asChild><Button className="bg-gradient-primary text-primary-foreground gap-2"><UserPlus className="h-4 w-4" />Criar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Novo Usu├írio</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2"><Label>Nome *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Senha *</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="M├¡n. 6" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Fun├º├úo</Label>
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
                      {creating ? "CriandoÔÇª" : "Criar Usu├írio"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>}
            </div>
          </div>

          <Card className="p-4 shadow-card">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label className="text-xs">Redefinir senha</Label>
                <Input type="email" placeholder="Email do usu├írio" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="h-9" />
              </div>
              <Button variant="outline" onClick={() => handlePasswordReset(resetEmail)} disabled={resetting || !resetEmail} className="gap-2 h-9">
                <KeyRound className="h-4 w-4" />{resetting ? "EnviandoÔÇª" : "Enviar link"}
              </Button>
            </div>
          </Card>

          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold">Cargo</th>
                  <th className="text-left px-4 py-3 font-semibold">Fun├º├úo</th>
                  <th className="text-left px-4 py-3 font-semibold">Setor</th>
                  <th className="text-left px-4 py-3 font-semibold">Criado em</th>
                  {isAdmin && <th className="text-right px-4 py-3 font-semibold">A├º├Áes</th>}
                </tr></thead>
                <tbody className="divide-y">
                  {profiles.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Nenhum usu├írio.</td></tr>}
                  {profiles.map((p) => {
                    const role = getRoleForUser(p.id);
                    const isSelf = p.id === user?.id;
                    return (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3"><div className="flex items-center gap-3">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={p.full_name} className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-accent text-accent-foreground text-xs font-bold">{(p.full_name || "U").slice(0, 2).toUpperCase()}</div>
                          )}
                          <div><p className="font-medium">{p.full_name || "Sem nome"}</p>{isSelf && <span className="text-[10px] text-accent">(voc├¬)</span>}</div>
                        </div></td>
                        <td className="px-4 py-3 text-muted-foreground">{p.job_title || "ÔÇö"}</td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${role === "admin" ? "bg-destructive/10 text-destructive" : role === "gestor" ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"}`}><Shield className="h-3 w-3" />{roleLabel(role)}</span></td>
                        <td className="px-4 py-3">
                          {isAdmin ? (
                            <Select value={p.department_id || "none"} onValueChange={(v) => handleChangeDepartment(p.id, v)}>
                              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Sem setor" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem setor</SelectItem>
                                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground text-xs">{getDeptName(p.department_id)}</span>
                          )}
                        </td>
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

        {/* ÔöÇÔöÇ INVITES TAB ÔöÇÔöÇ */}
        <TabsContent value="invites" className="space-y-4">
          <h2 className="font-display text-xl font-bold">Convites</h2>
          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Fun├º├úo</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Expira em</th>
                  <th className="text-right px-4 py-3">A├º├Áes</th>
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

        {/* ÔöÇÔöÇ SETORES TAB ÔöÇÔöÇ */}
        {isGestor && (
          <TabsContent value="sectors" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Setores / Departamentos</h2>
                <p className="text-sm text-muted-foreground mt-1">Organize os membros da equipe em setores.</p>
              </div>
              <Button onClick={openNewDept} className="bg-gradient-primary text-primary-foreground gap-2">
                <Plus className="h-4 w-4" /> Novo Setor
              </Button>
            </div>

            {departments.length === 0 ? (
              <Card className="p-12 text-center border-dashed text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Nenhum setor cadastrado.</p>
                <Button className="mt-4 bg-gradient-primary" onClick={openNewDept}><Plus className="h-4 w-4 mr-2" />Criar primeiro setor</Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((d) => {
                  const membersInDept = profiles.filter((p) => p.department_id === d.id);
                  return (
                    <Card key={d.id} className="p-5 shadow-card hover:shadow-elegant transition group">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (d.color || "#6366f1") + "22" }}>
                          <Building2 className="h-5 w-5" style={{ color: d.color || "#6366f1" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-display font-bold truncate">{d.name}</h3>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => openEditDept(d)} className="p-1 hover:text-accent text-muted-foreground transition"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => deleteDept(d.id)} className="p-1 hover:text-destructive text-muted-foreground transition"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{membersInDept.length} membro(s)</p>
                        </div>
                      </div>
                      {membersInDept.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {membersInDept.slice(0, 5).map((m) => (
                            <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs">
                              {m.avatar_url ? (
                                <img src={m.avatar_url} alt={m.full_name} className="h-4 w-4 rounded-full object-cover" />
                              ) : (
                                <div className="h-4 w-4 rounded-full bg-accent/20 text-accent text-[8px] font-bold flex items-center justify-center">
                                  {(m.full_name || "U").slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <span className="truncate max-w-[80px]">{m.full_name || "Sem nome"}</span>
                            </div>
                          ))}
                          {membersInDept.length > 5 && <span className="text-xs text-muted-foreground px-2 py-1">+{membersInDept.length - 5}</span>}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}

        {/* ÔöÇÔöÇ AUDIT & LOGS TAB ÔöÇÔöÇ */}
        {isAdmin && (
          <TabsContent value="audit" className="space-y-6">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Auditoria & Logs do Sistema</h2>
                <p className="text-sm text-muted-foreground mt-1">Rastreamento completo de acessos e altera├º├Áes cr├¡ticas.</p>
              </div>
              <Button variant="outline" size="sm" onClick={load} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Atualizar
              </Button>
            </header>

            <Card className="shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Quando</th>
                    <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Usu├írio</th>
                    <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Entidade</th>
                    <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]">A├º├úo</th>
                    <th className="text-right px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Detalhes</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {audits.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum registro encontrado.</td></tr>}
                    {audits.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30 align-top transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">
                              {profileNameFn(a.actor_id).slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium">{profileNameFn(a.actor_id)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline" className="capitalize text-[10px]">{a.entity_type}</Badge></td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                            a.action === "create" ? "bg-success/10 text-success" :
                            a.action === "delete" ? "bg-destructive/10 text-destructive" :
                            a.action === "login" ? "bg-blue-500/10 text-blue-500" :
                            "bg-accent/10 text-accent"
                          }`}>{a.action}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-accent">DETALHES</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader><DialogTitle>Detalhes da Auditoria</DialogTitle></DialogHeader>
                              <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><Label className="text-xs">Entidade</Label><p className="font-mono mt-1 capitalize">{a.entity_type}</p></div>
                                  <div><Label className="text-xs">A├º├úo</Label><p className="font-mono mt-1 uppercase">{a.action}</p></div>
                                </div>
                                <div>
                                  <Label className="text-xs">Altera├º├Áes / Dados</Label>
                                  <pre className="mt-2 p-4 bg-muted rounded-xl overflow-auto max-h-[300px] text-[11px] font-mono leading-relaxed">
                                    {JSON.stringify(a.changes, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        )}

        {/* ÔöÇÔöÇ AI SETTINGS TAB ÔöÇÔöÇ */}
        <TabsContent value="ai" className="space-y-6">
          <div className="max-w-3xl space-y-6">
            <Card className="p-6 shadow-card border-accent/20 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent shadow-inner">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl">Configura├º├úo do Agente IA (Gemini & Groq)</h3>
                  <p className="text-xs text-muted-foreground">Configure provedores de IA generativa para automa├º├úo de tarefas, an├ílise de gargalos e chat executivo.</p>
                </div>
              </div>

              <div className="space-y-5 pt-2">
                {/* Preferred Provider */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Provedor Preferencial</Label>
                  <Select value={preferredProvider} onValueChange={(v: any) => setPreferredProvider(v)}>
                    <SelectTrigger className="h-10 bg-muted/30 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Autom├ítico (Groq se dispon├¡vel, sen├úo Gemini ou Heur├¡stico)</SelectItem>
                      <SelectItem value="gemini">Google Gemini (Recomendado para racioc├¡nio complexo)</SelectItem>
                      <SelectItem value="groq">Groq Llama 3.3 (Recomendado para velocidade instant├ónea)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Google Gemini Card */}
                <div className="p-4 rounded-xl bg-muted/20 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-accent" />
                      <Label className="font-bold text-sm">Google Gemini API Key</Label>
                    </div>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
                    >
                      Obter chave gratuita no Google AI Studio <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="h-10 bg-muted/40 border-white/10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={testingAI === "gemini" || !geminiKey.trim()}
                      onClick={() => handleTestAI("gemini")}
                      className="h-10 font-bold shrink-0"
                    >
                      {testingAI === "gemini" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Testar Conex├úo
                    </Button>
                  </div>
                </div>

                {/* Groq Card */}
                <div className="p-4 rounded-xl bg-muted/20 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-accent" />
                      <Label className="font-bold text-sm">Groq API Key (Llama 3.3)</Label>
                    </div>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
                    >
                      Obter chave gratuita no Groq Console <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="gsk_..."
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      className="h-10 bg-muted/40 border-white/10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={testingAI === "groq" || !groqKey.trim()}
                      onClick={() => handleTestAI("groq")}
                      className="h-10 font-bold shrink-0"
                    >
                      {testingAI === "groq" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Testar Conex├úo
                    </Button>
                  </div>
                </div>

                {/* Test Feedback Box */}
                {aiTestResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                    aiTestResult.success
                      ? "bg-success/10 border-success/30 text-success"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                  }`}>
                    {aiTestResult.success ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[10px]">
                        {aiTestResult.provider}
                      </p>
                      <p className="mt-0.5">{aiTestResult.message}</p>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-2 flex justify-end">
                  <Button onClick={handleSaveAIConfig} className="bg-gradient-primary shadow-glow font-bold px-6">
                    Salvar Chaves e Prefer├¬ncias
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-card/40 border-white/5 space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Onde o Agente de IA atua no sistema:
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-5">
                <li><strong>Chat Global & Assistente Flutuante:</strong> Dispon├¡vel em todas as telas com contexto de produtividade.</li>
                <li><strong>Gera├º├úo Autom├ítica de Tarefas:</strong> Cria├º├úo de planos de a├º├úo divididos em etapas em <em>Tarefas</em>.</li>
                <li><strong>Diagn├│stico de Gargalos:</strong> Identifica├º├úo de atrasos e recomenda├º├Áes no <em>Dashboard</em>.</li>
                <li><strong>An├ílise Estrat├®gica:</strong> Sugest├Áes de matrizes SWOT, GUT e fluxogramas em <em>Gest├úo Visual</em>.</li>
              </ul>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dept dialog */}
      <Dialog open={deptDialog} onOpenChange={setDeptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-accent" />{editingDept ? "Editar Setor" : "Novo Setor"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Setor *</Label>
              <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="Ex: Engenharia, MarketingÔÇª" onKeyDown={(e) => e.key === "Enter" && saveDept()} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={deptColor} onChange={(e) => setDeptColor(e.target.value)} className="h-10 w-16 rounded border border-input cursor-pointer" />
                <div className="flex gap-2">
                  {["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((c) => (
                    <button key={c} onClick={() => setDeptColor(c)} className={`h-6 w-6 rounded-full transition hover:scale-110 ${deptColor === c ? "ring-2 ring-offset-1 ring-foreground" : ""}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeptDialog(false)}>Cancelar</Button>
            <Button onClick={saveDept} disabled={savingDept} className="bg-gradient-primary text-primary-foreground">
              {savingDept ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />SalvandoÔÇª</> : (editingDept ? "Salvar" : "Criar Setor")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
