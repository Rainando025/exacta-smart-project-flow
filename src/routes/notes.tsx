import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Pencil, Pin, PinOff, Search, StickyNote, Check, X, Network, FileText, Calendar as CalendarIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NeuralMap } from "@/components/NeuralMap";
import { CalendarScheduler } from "@/components/CalendarScheduler";
import { toast } from "sonner";

export const Route = createFileRoute("/notes")({ component: NotesPage });

interface Note {
  id: string; title: string; content: string | null; color: string;
  pinned: boolean; priority: string; created_at: string; updated_at: string;
}

const COLORS = ["#1e3a8a","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#db2777","#475569"];
const PRIORITIES = [
  { value: "baixa", label: "Baixa", color: "text-muted-foreground" },
  { value: "media", label: "Média", color: "text-accent" },
  { value: "alta", label: "Alta", color: "text-warning" },
  { value: "urgente", label: "Urgente", color: "text-destructive" },
];

function NotesPage() { return <AppShell><NotesContent /></AppShell>; }

function NotesContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [priority, setPriority] = useState("media");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notes").select("*").eq("user_id", user.id)
      .order("pinned", { ascending: false }).order("updated_at", { ascending: false });
    setItems((data || []) as Note[]);
  };

  useEffect(() => { load(); }, [user?.id]);

  const resetForm = () => { setTitle(""); setContent(""); setColor(COLORS[0]); setPriority("media"); setEditing(null); };

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    const payload = { user_id: user.id, title: title.trim(), content: content.trim() || null, color, priority };
    if (editing) {
      const { error } = await supabase.from("notes").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Anotação atualizada!");
    } else {
      const { error } = await supabase.from("notes").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Anotação criada!");
    }
    resetForm(); setOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    toast.success("Removida!"); load();
  };

  const togglePin = async (note: Note) => {
    await supabase.from("notes").update({ pinned: !note.pinned }).eq("id", note.id);
    load();
  };

  const openEdit = (n: Note) => {
    setEditing(n); setTitle(n.title); setContent(n.content || ""); setColor(n.color); setPriority(n.priority); setOpen(true);
  };

  const filtered = items.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q);
  });
  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Modo Pessoal</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Anotações</h1>
          <p className="text-muted-foreground mt-1">Suas notas pessoais, ideias e lembretes.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-elegant"><Plus className="h-4 w-4 mr-2" /> Nova anotação</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar anotação" : "Nova anotação"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da anotação" /></div>
              <div className="space-y-2"><Label>Conteúdo</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Escreva aqui..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Prioridade</Label>
                  <Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setColor(c)}
                        className={`h-7 w-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-accent scale-110" : "hover:scale-105"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full bg-gradient-primary text-primary-foreground">
                {editing ? "Salvar" : "Criar anotação"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="mb-6 bg-card/50 border border-white/5 p-1 rounded-xl">
          <TabsTrigger value="notes" className="rounded-lg gap-2"><FileText className="h-4 w-4" /> Anotações Tradicionais</TabsTrigger>
          <TabsTrigger value="ideas" className="rounded-lg gap-2"><Network className="h-4 w-4" /> Meu Mapa Neural</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg gap-2"><CalendarIcon className="h-4 w-4" /> Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-6 animate-in fade-in duration-500">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar anotações..." className="pl-10" />
          </div>

      {pinned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">📌 Fixadas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinned.map((n) => <NoteCard key={n.id} note={n} onEdit={openEdit} onDelete={handleDelete} onTogglePin={togglePin} onInlineSave={load} />)}
          </div>
        </div>
      )}

      <div>
        {pinned.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Outras</h2>}
        {unpinned.length === 0 && pinned.length === 0 && (
          <div className="text-center py-20">
            <StickyNote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma anotação ainda. Crie a primeira!</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {unpinned.map((n) => <NoteCard key={n.id} note={n} onEdit={openEdit} onDelete={handleDelete} onTogglePin={togglePin} onInlineSave={load} />)}
        </div>
      </div>
        </TabsContent>

        <TabsContent value="ideas" className="animate-in fade-in duration-500">
          <NeuralMap />
        </TabsContent>

        <TabsContent value="calendar" className="animate-in fade-in duration-500">
          <CalendarScheduler isTeam={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, onInlineSave }: {
  note: Note; onEdit: (n: Note) => void; onDelete: (id: string) => void;
  onTogglePin: (n: Note) => void; onInlineSave: () => void;
}) {
  const [inlineEdit, setInlineEdit] = useState(false);
  const [iTitle, setITitle] = useState(note.title);
  const [iContent, setIContent] = useState(note.content || "");

  const save = async () => {
    const { error } = await supabase.from("notes").update({ title: iTitle.trim(), content: iContent.trim() || null }).eq("id", note.id);
    if (error) { toast.error(error.message); return; }
    setInlineEdit(false); onInlineSave();
  };

  const prioInfo = PRIORITIES.find((p) => p.value === note.priority) || PRIORITIES[1];

  return (
    <Card className="group relative overflow-hidden shadow-card hover:shadow-lg transition-all border-0" style={{ borderTop: `4px solid ${note.color}` }}>
      <div className="p-5 space-y-3">
        {inlineEdit ? (
          <div className="space-y-2">
            <Input value={iTitle} onChange={(e) => setITitle(e.target.value)} className="h-8 text-sm font-bold" />
            <Textarea value={iContent} onChange={(e) => setIContent(e.target.value)} rows={4} className="text-sm" />
            <div className="flex gap-1">
              <button onClick={save} className="p-1.5 rounded hover:bg-success/10 text-success"><Check className="h-4 w-4" /></button>
              <button onClick={() => setInlineEdit(false)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base leading-snug cursor-pointer" onDoubleClick={() => { setITitle(note.title); setIContent(note.content || ""); setInlineEdit(true); }}>{note.title}</h3>
                <Badge variant="outline" className={`text-[10px] ${prioInfo.color}`}>{prioInfo.label}</Badge>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                <button onClick={() => onTogglePin(note)} className="p-1.5 rounded hover:bg-muted" title={note.pinned ? "Desafixar" : "Fixar"}>
                  {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => onEdit(note)} className="p-1.5 rounded hover:bg-muted" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => onDelete(note.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            {note.content && <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>}
            <p className="text-[10px] text-muted-foreground/60">{new Date(note.updated_at).toLocaleString("pt-BR")}</p>
          </>
        )}
      </div>
    </Card>
  );
}
