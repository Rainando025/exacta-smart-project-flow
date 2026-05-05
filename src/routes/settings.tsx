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
import { UserPlus, Users, Shield, Trash2 } from "lucide-react";
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
  const [openCreate, setOpenCreate] = useState(false);

  // New user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [creating, setCreating] = useState(false);

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
    return r?.role || "user";
  };

  const roleLabel = (r: string) => {
    if (r === "admin") return "Administrador";
    if (r === "moderator") return "Moderador";
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
      // Use the admin invite via edge function or direct signup
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: newName },
        },
      });
      if (error) { toast.error(error.message); setCreating(false); return; }

      // Set role if not default
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
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Usuários do Sistema</h2>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground shadow-elegant">
                  <UserPlus className="h-4 w-4 mr-2" /> Criar Usuário
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
                          <SelectItem value="user">Colaborador</SelectItem>
                          <SelectItem value="moderator">Moderador</SelectItem>
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
                            role === "moderator" ? "bg-warning/10 text-warning" :
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
                            {!isSelf && (
                              <Select value={role} onValueChange={(v) => handleChangeRole(p.id, v)}>
                                <SelectTrigger className="h-8 w-[140px] text-xs ml-auto">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Colaborador</SelectItem>
                                  <SelectItem value="moderator">Moderador</SelectItem>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
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
