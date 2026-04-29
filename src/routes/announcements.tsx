import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pin, Megaphone, Trash2, Pencil, Filter } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/announcements")({
  component: () => <AppShell><AnnouncementsPage /></AppShell>,
});

function AnnouncementsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title: "", content: "", pinned: false });

  const load = async () => {
    const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
    if (data) {
      setItems(data);
      const ids = [...new Set(data.map((d) => d.author_id))];
      if (ids.length) {
        const { data: ps } = await supabase.from("profiles").select("*").in("id", ids);
        if (ps) setProfiles(Object.fromEntries(ps.map((p) => [p.id, p])));
      }
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim() || !form.content.trim() || !user) return;
    const { error } = await supabase.from("announcements").insert({ ...form, author_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Aviso publicado");
    setOpen(false);
    setForm({ title: "", content: "", pinned: false });
    load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("announcements").update({
      title: editing.title, content: editing.content, pinned: editing.pinned,
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Aviso atualizado");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este aviso?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Aviso excluído");
    load();
  };

  const filtered = items.filter((a) => {
    if (filter === "pinned" && !a.pinned) return false;
    if (filter === "mine" && a.author_id !== user?.id) return false;
    if (search.trim() && !(a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Mural</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Comunicados da equipe</h1>
          <p className="text-muted-foreground mt-2">Avisos importantes em um lugar só.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary text-primary-foreground shadow-elegant"><Plus className="h-4 w-4" /> Novo aviso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Publicar aviso</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Conteúdo</Label><Textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.pinned} onCheckedChange={(v) => setForm({ ...form, pinned: v })} /><Label>Fixar no topo</Label></div>
            </div>
            <DialogFooter><Button onClick={create} className="bg-gradient-primary text-primary-foreground">Publicar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar aviso…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
        {[
          { v: "all", l: "Todos" },
          { v: "pinned", l: "Fixados" },
          { v: "mine", l: "Meus" },
        ].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === f.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
            {f.l}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
            Nenhum aviso encontrado.
          </Card>
        )}
        {filtered.map((a) => {
          const author = profiles[a.author_id];
          const isOwner = a.author_id === user?.id;
          return (
            <Card key={a.id} className={`p-5 shadow-card relative ${a.pinned ? "border-l-4 border-l-accent" : ""}`}>
              {a.pinned && <Pin className="absolute top-3 right-3 h-4 w-4 text-accent fill-accent" />}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-bold text-sm shrink-0">
                  {(author?.full_name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold">{a.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{author?.full_name || "Usuário"} • {new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                  <p className="text-sm mt-3 whitespace-pre-wrap">{a.content}</p>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(a)} aria-label="Editar" className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted transition">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(a.id)} aria-label="Excluir" className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar aviso</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Conteúdo</Label><Textarea rows={5} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={editing.pinned} onCheckedChange={(v) => setEditing({ ...editing, pinned: v })} /><Label>Fixar no topo</Label></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveEdit} className="bg-gradient-primary text-primary-foreground">Salvar alterações</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
