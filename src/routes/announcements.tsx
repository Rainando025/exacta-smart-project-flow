import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Pin, Megaphone, Trash2, Pencil, Filter, ShieldAlert,
  AlertTriangle, Users, ImagePlus, CheckCircle2, ArchiveRestore, Maximize2, X, Loader2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/announcements")({
  component: () => <AppShell><AnnouncementsPage /></AppShell>,
});

function AnnouncementsPage() {
  const { user } = useAuth();
  const { isGestor } = useRole();
  const [items, setItems] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [allProfilesList, setAllProfilesList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"active" | "pinned" | "mine" | "archived">("active");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    pinned: false,
    full_width: false,
    type: "aviso",
    target_user_id: "all",
    image_url: "" as string | null,
  });

  const load = async () => {
    const [{ data: announcementsData }, { data: profilesData }] = await Promise.all([
      supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("full_name", { ascending: true })
    ]);

    if (profilesData) {
      setAllProfilesList(profilesData);
      setProfiles(Object.fromEntries(profilesData.map((p) => [p.id, p])));
    }

    if (announcementsData) {
      setItems(announcementsData);
    }
  };
  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 10MB).");
      return null;
    }
    setUploadingImage(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `announcements/${user.id}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) {
        toast.error("Erro ao enviar imagem: " + upErr.message);
        return null;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      return urlData.publicUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  const create = async () => {
    if (!form.title.trim() || !form.content.trim() || !user) return;
    const payload: any = {
      title: form.title,
      content: form.content,
      pinned: form.pinned,
      full_width: form.full_width,
      type: form.type,
      target_user_id: form.target_user_id === "all" ? null : form.target_user_id,
      image_url: form.image_url || null,
      is_archived: false,
      author_id: user.id
    };
    const { error } = await supabase.from("announcements").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(form.type === "auditoria" ? "Auditoria registrada" : "Aviso publicado");
    setOpen(false);
    setForm({ title: "", content: "", pinned: false, full_width: false, type: "aviso", target_user_id: "all", image_url: null });
    load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const payload: any = {
      title: editing.title,
      content: editing.content,
      pinned: editing.pinned,
      full_width: !!editing.full_width,
      type: editing.type,
      image_url: editing.image_url || null,
      target_user_id: editing.target_user_id === "all" || !editing.target_user_id ? null : editing.target_user_id,
    };
    const { data, error } = await supabase.from("announcements").update(payload).eq("id", editing.id).select("id").maybeSingle();
    if (error) return toast.error(error.message);
    if (!data) return toast.error("Sem permissão no banco (RLS) para editar este aviso.");
    toast.success("Comunicado atualizado");
    setEditing(null);
    load();
  };

  const toggleArchive = async (a: any) => {
    const nextArchived = !a.is_archived;
    const { data, error } = await supabase
      .from("announcements")
      .update({ is_archived: nextArchived } as any)
      .eq("id", a.id)
      .select("id")
      .maybeSingle();

    if (error) return toast.error(error.message);
    if (!data) return toast.error("Sem permissão no banco (RLS) para arquivar este aviso.");

    setItems((prev) => prev.map((item) => (item.id === a.id ? { ...item, is_archived: nextArchived } : item)));
    toast.success(nextArchived ? "Aviso concluído e arquivado!" : "Aviso reaberto para o mural!");
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este aviso permanentemente?")) return;
    const { data, error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) return toast.error("Erro ao excluir: " + error.message);
    if (!data || data.length === 0) {
      return toast.error("Sem permissão no banco (RLS) para excluir este aviso. Execute a migração de announcements.");
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Aviso excluído");
  };

  const filtered = items.filter((a) => {
    const archived = !!a.is_archived;
    if (filter === "archived") {
      if (!archived) return false;
    } else {
      if (archived) return false;
      if (filter === "pinned" && !a.pinned) return false;
      if (filter === "mine" && a.author_id !== user?.id) return false;
    }
    if (search.trim() && !(a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const archivedCount = items.filter((a) => !!a.is_archived).length;

  return (
    <div className="p-4 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Mural de Anúncios</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Comunicados da equipe</h1>
          <p className="text-muted-foreground mt-1">Anúncios visuais, comunicados e avisos importantes para o seu setor.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary text-primary-foreground shadow-elegant"><Plus className="h-4 w-4" /> Novo anúncio</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Publicar no mural</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aviso">Aviso (Geral)</SelectItem>
                      <SelectItem value="auditoria">Auditoria / Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Para quem?</Label>
                  <Select value={form.target_user_id} onValueChange={(v) => setForm({ ...form, target_user_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos da equipe</SelectItem>
                      {allProfilesList.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Novo procedimento operacional" /></div>
              <div><Label>Conteúdo</Label><Textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Descreva o comunicado..." /></div>

              {/* Anexar Imagem */}
              <div className="space-y-2">
                <Label>Imagem / Banner (opcional)</Label>
                {form.image_url ? (
                  <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                    <img src={form.image_url} alt="Anexo" className="w-full max-h-56 object-contain" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => setForm({ ...form, image_url: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-border hover:border-accent/60 cursor-pointer bg-muted/20 hover:bg-muted/40 transition text-xs text-muted-foreground">
                    {uploadingImage ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Enviando imagem...</>
                    ) : (
                      <><ImagePlus className="h-4 w-4" /> Clique para anexar uma imagem (PNG, JPG, WebP)</>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        if (url) setForm((prev) => ({ ...prev, image_url: url }));
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <Switch checked={form.pinned} onCheckedChange={(v) => setForm({ ...form, pinned: v })} />
                  <Label>Fixar no topo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.full_width} onCheckedChange={(v) => setForm({ ...form, full_width: v })} />
                  <Label>Destaque em tela cheia</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={uploadingImage} className="bg-gradient-primary text-primary-foreground">Publicar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar no mural…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
        {[
          { v: "active", l: "Ativos" },
          { v: "pinned", l: "Fixados" },
          { v: "mine", l: "Meus" },
          { v: "archived", l: `Arquivados (${archivedCount})` },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === f.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Board Grid (full-width cards for featured/image announcements) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground border-dashed lg:col-span-2">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
            Nenhum anúncio encontrado neste filtro.
          </Card>
        )}
        {filtered.map((a) => {
          const author = profiles[a.author_id];
          const canManage = a.author_id === user?.id || isGestor;
          const isWide = !!a.full_width || !!a.image_url;
          return (
            <Card
              key={a.id}
              className={`p-6 shadow-card relative flex flex-col gap-4 transition ${isWide ? "lg:col-span-2" : ""} ${a.pinned ? "border-l-4 border-l-accent" : ""} ${a.is_archived ? "opacity-75" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${a.type === 'auditoria' ? 'bg-destructive/10 text-destructive' : 'bg-gradient-accent text-accent-foreground'}`}>
                    {a.type === 'auditoria' ? <ShieldAlert className="h-5 w-5" /> : (author?.full_name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent">
                          <Pin className="h-3 w-3" /> Fixado
                        </span>
                      )}
                      {a.type === 'auditoria' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-destructive text-white">
                          <AlertTriangle className="h-3 w-3" /> Auditoria
                        </span>
                      )}
                      {a.is_archived && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-success/15 text-success">
                          <CheckCircle2 className="h-3 w-3" /> Concluído / Arquivado
                        </span>
                      )}
                      {a.target_user_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-warning/20 text-warning-foreground">
                          <Users className="h-3 w-3" /> Apenas para: {profiles[a.target_user_id]?.full_name || 'Usuário'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-xl lg:text-2xl">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {author?.full_name || "Usuário"} • {new Date(a.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleArchive(a)}
                      title={a.is_archived ? "Reabrir no mural" : "Marcar como concluído e arquivar"}
                      className={`h-8 gap-1.5 text-xs ${a.is_archived ? "text-accent" : "text-success hover:text-success"}`}
                    >
                      {a.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      <span className="hidden sm:inline">{a.is_archived ? "Reabrir" : "Concluir"}</span>
                    </Button>
                    <button onClick={() => setEditing(a)} aria-label="Editar" className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted transition">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(a.id)} aria-label="Excluir" className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm lg:text-base whitespace-pre-wrap leading-relaxed">{a.content}</p>

              {a.image_url && (
                <div
                  className="relative group rounded-xl overflow-hidden border bg-muted/20 cursor-pointer"
                  onClick={() => setPreviewImage(a.image_url)}
                >
                  <img
                    src={a.image_url}
                    alt={a.title}
                    className={`w-full object-contain bg-black/5 ${a.full_width ? "max-h-[75vh]" : "max-h-[480px]"}`}
                  />
                  <div className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-black/60 text-white text-xs flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                    <Maximize2 className="h-3.5 w-3.5" /> Ampliar
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar anúncio</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={editing.type || "aviso"} onValueChange={(v) => setEditing({ ...editing, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aviso">Aviso (Geral)</SelectItem>
                      <SelectItem value="auditoria">Auditoria / Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Para quem?</Label>
                  <Select value={editing.target_user_id || "all"} onValueChange={(v) => setEditing({ ...editing, target_user_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos da equipe</SelectItem>
                      {allProfilesList.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Título</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Conteúdo</Label><Textarea rows={5} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></div>

              <div className="space-y-2">
                <Label>Imagem / Banner</Label>
                {editing.image_url ? (
                  <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                    <img src={editing.image_url} alt="Anexo" className="w-full max-h-56 object-contain" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => setEditing({ ...editing, image_url: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-border hover:border-accent/60 cursor-pointer bg-muted/20 hover:bg-muted/40 transition text-xs text-muted-foreground">
                    {uploadingImage ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Enviando imagem...</>
                    ) : (
                      <><ImagePlus className="h-4 w-4" /> Anexar imagem</>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        if (url) setEditing((prev: any) => prev ? { ...prev, image_url: url } : prev);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <Switch checked={!!editing.pinned} onCheckedChange={(v) => setEditing({ ...editing, pinned: v })} />
                  <Label>Fixar no topo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={!!editing.full_width} onCheckedChange={(v) => setEditing({ ...editing, full_width: v })} />
                  <Label>Destaque em tela cheia</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={saveEdit} disabled={uploadingImage} className="bg-gradient-primary text-primary-foreground">Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Lightbox */}
      <Dialog open={!!previewImage} onOpenChange={(o) => !o && setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-black/90 border-0 flex items-center justify-center">
          {previewImage && (
            <img src={previewImage} alt="Visualização em tela cheia" className="max-w-full max-h-[90vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
