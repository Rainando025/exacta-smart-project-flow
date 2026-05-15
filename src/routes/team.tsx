import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Network, Calendar as CalendarIcon, BrainCircuit, Plus, Trash2, Save, Camera, User, Pencil, Star } from "lucide-react";
import { NeuralMap } from "@/components/NeuralMap";
import { CalendarScheduler } from "@/components/CalendarScheduler";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/team")({
  component: () => <AppShell><TeamPage /></AppShell>,
});

// ─── helpers ──────────────────────────────────────────────────────────────────
function Avatar({ member, size = "md" }: { member: any; size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-12 w-12 text-base";
  if (member?.avatar_url) {
    return <img src={member.avatar_url} alt={member.full_name} className={`${s} rounded-full object-cover ring-2 ring-accent/20`} />;
  }
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold shrink-0`}>
      {(member?.full_name || "U").slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Score cell (1-10) ────────────────────────────────────────────────────────
function ScoreCell({ score, editable, onChange }: { score: number | null; editable: boolean; onChange: (v: number) => void }) {
  const val = score ?? 0;
  const color = val >= 8 ? "text-green-500" : val >= 5 ? "text-yellow-500" : val > 0 ? "text-red-400" : "text-muted-foreground/30";
  if (!editable) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className={`font-bold text-sm ${color}`}>{val > 0 ? val : "—"}</span>
        {val > 0 && <div className="flex gap-px">{[1,2,3,4,5].map(i => <div key={i} className={`h-0.5 w-2 rounded-full ${i <= Math.ceil(val/2) ? "bg-accent" : "bg-muted"}`} />)}</div>}
      </div>
    );
  }
  return (
    <select
      value={val || ""}
      onChange={e => onChange(Number(e.target.value))}
      className="text-center text-xs font-bold w-12 h-7 rounded border border-input bg-background focus:ring-1 focus:ring-accent"
    >
      <option value="">—</option>
      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function TeamPage() {
  const { user } = useAuth();
  const { isGestor } = useRole();

  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [skills, setSkills] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]); // { member_id, skill_id, score }
  const [pendingScores, setPendingScores] = useState<Record<string, number>>({});
  const [savingScores, setSavingScores] = useState(false);

  // Skill management
  const [skillDialog, setSkillDialog] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillType, setNewSkillType] = useState<"soft" | "hard">("soft");

  // Profile editing
  const [profileDialog, setProfileDialog] = useState<any | null>(null);
  const [profileForm, setProfileForm] = useState({ full_name: "", job_title: "", phone: "", bio: "", linkedin_url: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");

  const load = async () => {
    const [p, t, r, sk, sc] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("tasks").select("assignee_id,status"),
      supabase.from("user_roles").select("user_id,role"),
      (supabase.from("team_skills" as any)).select("*").order("type").order("name"),
      (supabase.from("member_skill_scores" as any)).select("*"),
    ]);
    if (p.data) setMembers(p.data);
    if (t.data) setTasks(t.data);
    if (r.data) setRoles(Object.fromEntries(r.data.map((x: any) => [x.user_id, x.role])));
    if (sk.data) setSkills(sk.data as any[]);
    if (sc.data) setScores(sc.data as any[]);
  };

  useEffect(() => { load(); }, []);

  const filtered = members.filter(m =>
    !search.trim() || (m.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getScore = (memberId: string, skillId: string) => {
    const key = `${memberId}::${skillId}`;
    if (key in pendingScores) return pendingScores[key];
    return scores.find(s => s.member_id === memberId && s.skill_id === skillId)?.score ?? 0;
  };

  const handleScoreChange = (memberId: string, skillId: string, value: number) => {
    setPendingScores(prev => ({ ...prev, [`${memberId}::${skillId}`]: value }));
  };

  const saveAllScores = async () => {
    if (!Object.keys(pendingScores).length) return;
    setSavingScores(true);
    const upserts = Object.entries(pendingScores).map(([key, score]) => {
      const [member_id, skill_id] = key.split("::");
      return { member_id, skill_id, score, evaluated_by: user?.id };
    });
    const { error } = await (supabase.from("member_skill_scores" as any)).upsert(upserts as any, { onConflict: "member_id,skill_id" });
    if (error) toast.error("Erro ao salvar notas");
    else { toast.success("Notas salvas!"); setPendingScores({}); load(); }
    setSavingScores(false);
  };

  const addSkill = async () => {
    if (!newSkillName.trim()) return;
    const { error } = await (supabase.from("team_skills" as any)).insert({ name: newSkillName.trim(), type: newSkillType, created_by: user?.id } as any);
    if (error) toast.error(error.message);
    else { toast.success("Skill adicionada!"); setNewSkillName(""); load(); }
  };

  const deleteSkill = async (id: string) => {
    if (!confirm("Excluir esta skill? Todas as notas associadas serão removidas.")) return;
    await (supabase.from("team_skills" as any)).delete().eq("id", id);
    load();
    toast.success("Skill removida");
  };

  const openProfile = (m: any) => {
    setProfileForm({ full_name: m.full_name || "", job_title: m.job_title || "", phone: m.phone || "", bio: m.bio || "", linkedin_url: m.linkedin_url || "" });
    setAvatarPreview(m.avatar_url || null);
    setAvatarFile(null);
    setProfileDialog(m);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("profiles").update({ ...profileForm, avatar_url } as any).eq("id", profileDialog.id);
    if (error) toast.error(error.message);
    else { toast.success("Perfil atualizado!"); setProfileDialog(null); load(); }
    setSavingProfile(false);
  };

  const softSkills = skills.filter(s => s.type === "soft");
  const hardSkills = skills.filter(s => s.type === "hard");
  const canEdit = isGestor;

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      <header>
        <p className="text-sm text-accent font-medium uppercase tracking-wider">Equipe</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Colaboração e Membros</h1>
        <p className="text-muted-foreground mt-2">Gerencie competências, notas e perfis da equipe.</p>
      </header>

      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="mb-6 bg-card/50 border border-white/5 p-1 rounded-xl">
          <TabsTrigger value="members" className="rounded-lg gap-2"><User className="h-4 w-4" /> Membros</TabsTrigger>
          <TabsTrigger value="skills" className="rounded-lg gap-2"><BrainCircuit className="h-4 w-4" /> Competências</TabsTrigger>
          <TabsTrigger value="ideas" className="rounded-lg gap-2"><Network className="h-4 w-4" /> Mapa Neural</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg gap-2"><CalendarIcon className="h-4 w-4" /> Calendário</TabsTrigger>
        </TabsList>

        {/* ── MEMBERS TAB ── */}
        <TabsContent value="members" className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Input placeholder="Buscar membro…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs h-9" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(m => {
              const mine = tasks.filter(t => t.assignee_id === m.id);
              const done = mine.filter(t => t.status === "done").length;
              const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
              const role = roles[m.id] || "colaborador";
              const isSelf = m.id === user?.id;
              return (
                <Card key={m.id} className="p-5 shadow-card hover:shadow-elegant transition group">
                  <div className="flex items-start gap-3">
                    <Avatar member={m} size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold truncate">{m.full_name || "Sem nome"}</h3>
                      <p className="text-xs text-muted-foreground">{m.job_title || role}</p>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block",
                        role === "admin" ? "bg-destructive/10 text-destructive" : role === "gestor" ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"
                      )}>{role}</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Conclusão</span>
                      <span className="font-bold">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-accent transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">{done} concluídas / {mine.length} totais</div>
                  </div>
                  {m.bio && <p className="text-xs text-muted-foreground mt-3 line-clamp-2 italic">"{m.bio}"</p>}
                  {(isSelf || canEdit) && (
                    <Button size="sm" variant="outline" className="w-full mt-4 h-8 gap-2 text-xs" onClick={() => openProfile(m)}>
                      <Pencil className="h-3 w-3" /> {isSelf ? "Editar meu perfil" : "Ver / Editar perfil"}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── SKILLS / COMPETÊNCIAS TAB ── */}
        <TabsContent value="skills" className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-xl">Matriz de Competências</h2>
              <p className="text-sm text-muted-foreground">Avalie cada membro com nota de 1 a 10 por competência.</p>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <>
                  {Object.keys(pendingScores).length > 0 && (
                    <Button onClick={saveAllScores} disabled={savingScores} className="bg-gradient-primary gap-2 h-9">
                      <Save className="h-4 w-4" /> {savingScores ? "Salvando…" : `Salvar (${Object.keys(pendingScores).length})`}
                    </Button>
                  )}
                  <Button variant="outline" className="gap-2 h-9" onClick={() => setSkillDialog(true)}>
                    <Plus className="h-4 w-4" /> Gerenciar Skills
                  </Button>
                </>
              )}
            </div>
          </div>

          {skills.length === 0 ? (
            <Card className="p-12 text-center border-dashed text-muted-foreground">
              <BrainCircuit className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>Nenhuma competência cadastrada ainda.</p>
              {canEdit && <Button className="mt-4 bg-gradient-primary" onClick={() => setSkillDialog(true)}><Plus className="h-4 w-4 mr-2" /> Adicionar Skills</Button>}
            </Card>
          ) : (
            <Card className="shadow-card overflow-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-bold sticky left-0 bg-muted/30 min-w-[200px]">Membro</th>
                    {hardSkills.length > 0 && (
                      <th colSpan={hardSkills.length} className="text-center px-4 py-2 text-xs font-bold text-blue-500 uppercase tracking-widest border-l">
                        🔧 Hard Skills
                      </th>
                    )}
                    {softSkills.length > 0 && (
                      <th colSpan={softSkills.length} className="text-center px-4 py-2 text-xs font-bold text-purple-500 uppercase tracking-widest border-l">
                        💡 Soft Skills
                      </th>
                    )}
                  </tr>
                  <tr className="border-b">
                    <th className="sticky left-0 bg-card px-4 py-2"></th>
                    {[...hardSkills, ...softSkills].map(sk => (
                      <th key={sk.id} className={cn("text-center px-3 py-2 font-semibold text-xs whitespace-nowrap border-l", sk.type === "hard" ? "text-blue-500" : "text-purple-500")}>
                        {sk.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(m => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="sticky left-0 bg-card px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar member={m} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{m.full_name || "Sem nome"}</p>
                            <p className="text-[10px] text-muted-foreground">{m.job_title || roles[m.id] || "colaborador"}</p>
                          </div>
                        </div>
                      </td>
                      {[...hardSkills, ...softSkills].map(sk => (
                        <td key={sk.id} className="text-center px-3 py-2 border-l">
                          <ScoreCell
                            score={getScore(m.id, sk.id)}
                            editable={canEdit}
                            onChange={v => handleScoreChange(m.id, sk.id, v)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> 8–10: Excelente</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" /> 5–7: Bom</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" /> 1–4: Em desenvolvimento</span>
          </div>
        </TabsContent>

        <TabsContent value="ideas" className="animate-in fade-in duration-300"><NeuralMap /></TabsContent>
        <TabsContent value="calendar" className="animate-in fade-in duration-300"><CalendarScheduler isTeam={true} /></TabsContent>
      </Tabs>

      {/* ── SKILL MANAGEMENT DIALOG ── */}
      <Dialog open={skillDialog} onOpenChange={setSkillDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-accent" /> Gerenciar Competências</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Nome da competência" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill()} className="flex-1" />
              <Select value={newSkillType} onValueChange={(v: any) => setNewSkillType(v)}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="soft">Soft</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addSkill} className="bg-gradient-primary px-3"><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="max-h-[280px] overflow-y-auto space-y-1">
              {skills.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">Nenhuma skill cadastrada</p>}
              {[...hardSkills, ...softSkills].map(sk => (
                <div key={sk.id} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-card/50 hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", sk.type === "hard" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500")}>
                      {sk.type === "hard" ? "Hard" : "Soft"}
                    </span>
                    <span className="text-sm font-medium">{sk.name}</span>
                  </div>
                  <button onClick={() => deleteSkill(sk.id)} className="p-1 hover:text-destructive text-muted-foreground transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSkillDialog(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PROFILE EDIT DIALOG ── */}
      <Dialog open={!!profileDialog} onOpenChange={o => !o && setProfileDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><User className="h-5 w-5 text-accent" /> Perfil — {profileDialog?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="h-20 w-20 rounded-full object-cover ring-2 ring-accent/30" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-2xl">
                    {(profileDialog?.full_name || "U").slice(0, 2).toUpperCase()}
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
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{profileDialog?.full_name}</p>
                <p>{profileDialog ? (roles[profileDialog.id] || "colaborador") : ""}</p>
                <button onClick={() => fileRef.current?.click()} className="text-accent hover:underline text-xs mt-1">Trocar foto</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome Completo</Label>
                <Input value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cargo / Título</Label>
                <Input value={profileForm.job_title} onChange={e => setProfileForm(p => ({ ...p, job_title: e.target.value }))} placeholder="Ex: Dev Sênior" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefone</Label>
                <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="+55 (11) 99999-9999" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">LinkedIn</Label>
                <Input value={profileForm.linkedin_url} onChange={e => setProfileForm(p => ({ ...p, linkedin_url: e.target.value }))} placeholder="linkedin.com/in/..." />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bio / Apresentação</Label>
              <Textarea value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} placeholder="Conte um pouco sobre você..." rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProfileDialog(null)}>Cancelar</Button>
            <Button onClick={saveProfile} disabled={savingProfile} className="bg-gradient-primary">
              {savingProfile ? "Salvando…" : "Salvar Perfil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
