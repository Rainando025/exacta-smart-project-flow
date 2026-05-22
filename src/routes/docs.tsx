import { createFileRoute } from "@tanstack/react-router";
import { 
  FileText, Plus, Search, Star, Clock, FileEdit, Share2, 
  Trash2, Printer, Eye, Save, X, Edit2, Copy, File, 
  Bookmark, Check, ChevronRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/docs")({
  component: () => <AppShell><DocsPage /></AppShell>,
});

interface DocumentItem {
  id: string;
  title: string;
  content: string | null;
  type: string;
  owner_id: string;
  is_starred: boolean | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ["Todos", "Processo", "Manual", "Roteiro", "Design", "Vendas", "TI", "Outros"];

function DocsPage() {
  const { user } = useAuth();
  
  // Data States
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");
  const [filterStarred, setFilterStarred] = useState(false);

  // Active Dialog/Editor States
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  
  // Edit Form States
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("Processo");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Create Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Processo");
  const [newContent, setNewContent] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch profiles to map owner_id to user names
  const fetchProfiles = async () => {
    try {
      const { data } = await supabase.from("profiles").select("id, full_name");
      const profileMap: Record<string, string> = {};
      data?.forEach((p) => {
        profileMap[p.id] = p.full_name;
      });
      setProfiles(profileMap);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  };

  // Fetch documents from Supabase
  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as DocumentItem[]);
    } catch (err: any) {
      toast.error("Erro ao carregar documentos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup mount & Realtime subscription
  useEffect(() => {
    fetchProfiles();
    fetchDocuments();

    const channel = supabase
      .channel("documents-realtime-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDocuments]);

  // Check URL query parameters for sharing links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get("id");
    
    if (docId && documents.length > 0) {
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        openDocument(doc, "preview");
        // Clear query param so it doesn't reopen on every refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [documents]);

  // Open Document in Dialog
  const openDocument = (doc: DocumentItem, mode: "preview" | "edit" = "preview") => {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditType(doc.type || "Processo");
    setEditContent(doc.content || "");
    setActiveTab(mode);
    setIsDialogOpen(true);
  };

  // Close Document Dialog
  const closeDocument = () => {
    setSelectedDoc(null);
    setIsDialogOpen(false);
  };

  // Create Document Handler
  const handleCreateDocument = async () => {
    if (!user) return toast.error("Você precisa estar autenticado.");
    if (!newTitle.trim()) return toast.error("O título do documento é obrigatório.");

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title: newTitle.trim(),
          content: newContent,
          type: newType,
          owner_id: user.id,
          is_starred: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Documento criado com sucesso!");
      setNewTitle("");
      setNewContent("");
      setNewType("Processo");
      setIsCreateOpen(false);
      
      // Auto open the newly created document
      if (data) {
        openDocument(data as DocumentItem, "edit");
      }
    } catch (err: any) {
      toast.error("Erro ao criar documento: " + err.message);
    } finally {
      setCreating(false);
      fetchDocuments();
    }
  };

  // Save Document Changes Handler
  const handleSaveDocument = async () => {
    if (!selectedDoc) return;
    if (!editTitle.trim()) return toast.error("O título do documento não pode estar vazio.");

    setSaving(true);
    try {
      const { error } = await supabase
        .from("documents")
        .update({
          title: editTitle.trim(),
          type: editType,
          content: editContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedDoc.id);

      if (error) throw error;

      toast.success("Documento salvo com sucesso!");
      // Update selected doc state
      setSelectedDoc(prev => prev ? {
        ...prev,
        title: editTitle.trim(),
        type: editType,
        content: editContent,
        updated_at: new Date().toISOString()
      } : null);
      
      setActiveTab("preview");
    } catch (err: any) {
      toast.error("Erro ao salvar documento: " + err.message);
    } finally {
      setSaving(false);
      fetchDocuments();
    }
  };

  // Toggle Star Status Handler
  const handleToggleStar = async (doc: DocumentItem) => {
    const nextStar = !doc.is_starred;
    try {
      const { error } = await supabase
        .from("documents")
        .update({ is_starred: nextStar })
        .eq("id", doc.id);

      if (error) throw error;

      toast.success(nextStar ? "Documento marcado como favorito!" : "Removido dos favoritos.");
      
      // Update local states
      if (selectedDoc && selectedDoc.id === doc.id) {
        setSelectedDoc(prev => prev ? { ...prev, is_starred: nextStar } : null);
      }
      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, is_starred: nextStar } : d));
    } catch (err: any) {
      toast.error("Erro ao favoritar: " + err.message);
    }
  };

  // Delete Document Handler
  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente este documento?")) return;

    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Documento excluído.");
      closeDocument();
      fetchDocuments();
    } catch (err: any) {
      toast.error("Erro ao excluir documento: " + err.message);
    }
  };

  // Copy Share Link Handler
  const handleCopyShareLink = async (doc: DocumentItem) => {
    const shareUrl = `${window.location.origin}/docs?id=${doc.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link de compartilhamento copiado!");
    } catch (err) {
      toast.error("Não foi possível copiar o link.");
    }
  };

  // PDF Export Print Handler (Elegant format with printing styles)
  const handleExportPDF = (doc: DocumentItem) => {
    const ownerName = profiles[doc.owner_id] || "Membro";
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Bloqueador de pop-ups ativo. Permita pop-ups para exportar o PDF.");
      return;
    }

    const formattedDate = new Date(doc.updated_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        color: #1e293b;
        line-height: 1.6;
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
      }
      .header {
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 20px;
        margin-bottom: 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .logo {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.05em;
        color: #0f172a;
      }
      .logo span {
        color: #3b82f6;
      }
      .meta-item {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 4px;
      }
      .doc-type {
        display: inline-block;
        padding: 4px 10px;
        background: #eff6ff;
        color: #2563eb;
        font-weight: 700;
        font-size: 11px;
        border-radius: 6px;
        margin-bottom: 15px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      h1 {
        font-size: 32px;
        font-weight: 700;
        color: #0f172a;
        margin-top: 0;
        margin-bottom: 10px;
        line-height: 1.25;
      }
      .content {
        font-size: 15px;
        white-space: pre-wrap;
        color: #334155;
        margin-top: 25px;
      }
      .footer {
        margin-top: 60px;
        border-top: 1px solid #e2e8f0;
        padding-top: 15px;
        font-size: 11px;
        color: #94a3b8;
        text-align: center;
      }
      @media print {
        body { padding: 0; }
      }
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>${doc.title}</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">EXACTA<span>FLOW</span></div>
              <div class="meta-item">Plataforma de Gestão Integrada</div>
            </div>
            <div style="text-align: right;">
              <div class="meta-item"><strong>Proprietário:</strong> ${ownerName}</div>
              <div class="meta-item"><strong>Última atualização:</strong> ${formattedDate}</div>
            </div>
          </div>
          
          <div class="doc-type">${doc.type}</div>
          <h1>${doc.title}</h1>
          
          <div class="content">${doc.content || "<i>Este documento não possui conteúdo ainda.</i>"}</div>
          
          <div class="footer">
            Documento exportado eletronicamente pela plataforma EXACTA Smart Project Flow em ${new Date().toLocaleDateString("pt-BR")}.
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper to format date relative or clean
  const getFormattedDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes || 1} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return `Ontem`;
    if (days < 7) return `${days} dias atrás`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  // Filter Logic
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (doc.content || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "Todos" || doc.type === selectedType;
    const matchesStarred = !filterStarred || doc.is_starred;

    return matchesSearch && matchesType && matchesStarred;
  });

  const starredDocs = documents.filter(d => d.is_starred);

  // Return icons based on category type
  const getCategoryIconColor = (type: string) => {
    switch (type) {
      case "Processo": return { bg: "bg-blue-500/10 text-blue-500", raw: "#3b82f6" };
      case "Manual": return { bg: "bg-emerald-500/10 text-emerald-500", raw: "#10b981" };
      case "Roteiro": return { bg: "bg-amber-500/10 text-amber-500", raw: "#f59e0b" };
      case "Design": return { bg: "bg-purple-500/10 text-purple-500", raw: "#a855f7" };
      case "Vendas": return { bg: "bg-pink-500/10 text-pink-500", raw: "#ec4899" };
      case "TI": return { bg: "bg-indigo-500/10 text-indigo-500", raw: "#6366f1" };
      default: return { bg: "bg-slate-500/10 text-slate-500", raw: "#64748b" };
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          </div>
          <p className="text-muted-foreground">Crie, visualize, colabore e exporte seus manuais e processos em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filterStarred ? "accent" : "outline"} 
            onClick={() => setFilterStarred(!filterStarred)}
            className="gap-2"
          >
            <Star className={`h-4 w-4 ${filterStarred ? "fill-current" : ""}`} /> 
            {filterStarred ? "Todos" : "Favoritos"}
          </Button>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" /> Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border border-white/10 shadow-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Documento</DialogTitle>
                <DialogDescription>
                  Adicione um título, escolha a categoria e preencha as orientações essenciais.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-title">Título do Documento</Label>
                  <Input 
                    id="new-title" 
                    placeholder="Ex: Manual de Integração do Desenvolvedor" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-type">Categoria</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.slice(1).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-content">Conteúdo / Descrição</Label>
                  <Textarea 
                    id="new-content" 
                    placeholder="Escreva as diretrizes, POP ou manuais do processo aqui..." 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={10}
                    className="resize-y"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button 
                  onClick={handleCreateDocument} 
                  disabled={creating}
                  className="bg-gradient-primary text-primary-foreground"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Documento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SEARCH AND QUICK FILTER BAR */}
      <div className="flex items-center gap-4 bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl p-2 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar documentos por título ou conteúdo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-none bg-transparent focus-visible:ring-0" 
          />
        </div>
        {searchTerm && (
          <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="h-8 text-xs text-muted-foreground mr-2">
            Limpar
          </Button>
        )}
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: STARRED LIST */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="border-white/5 bg-sidebar/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                Favoritos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-3">
              {starredDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-2 italic">Nenhum favorito selecionado.</p>
              ) : (
                starredDocs.map(d => (
                  <div 
                    key={d.id} 
                    onClick={() => openDocument(d, "preview")}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer group"
                  >
                    <FileEdit className="h-3.5 w-3.5 text-accent opacity-70 group-hover:opacity-100" />
                    <span className="text-xs truncate font-medium flex-1 group-hover:text-accent transition-colors">{d.title}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: ALL DOCUMENTS */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Todos os Documentos
              <Badge variant="secondary" className="font-mono text-xs">{filteredDocs.length}</Badge>
            </h2>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <Badge 
                  key={cat} 
                  variant={selectedType === cat ? "accent" : "outline"} 
                  onClick={() => setSelectedType(cat)}
                  className="cursor-pointer hover:bg-accent/20 transition-all text-xs"
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* DOCUMENTS LIST */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Carregando documentos do EXACTA Flow...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-card/20">
              <File className="h-10 w-10 text-muted-foreground opacity-20 mb-3" />
              <h3 className="font-medium text-base">Nenhum documento encontrado</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Tente ajustar sua busca ou crie um novo documento clicando em "Novo Documento".
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredDocs.map((d) => {
                const colors = getCategoryIconColor(d.type);
                const ownerName = profiles[d.owner_id] || "Membro";
                
                return (
                  <div 
                    key={d.id} 
                    className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-card/50 hover:bg-card hover:shadow-elegant transition-all duration-300 group cursor-pointer"
                    onClick={() => openDocument(d, "preview")}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium group-hover:text-accent transition-colors truncate pr-4">{d.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-0.5">
                          <span className="font-semibold text-accent/80">{d.type || "Geral"}</span>
                          <span>•</span>
                          <span className="truncate">Por: {ownerName}</span>
                          <span>•</span>
                          <span>{getFormattedDate(d.updated_at || d.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* ACCESSIBLE ACTIONS */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleStar(d)}
                        className={`h-8 w-8 text-muted-foreground hover:text-amber-500`}
                        title={d.is_starred ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Star className={`h-4 w-4 ${d.is_starred ? "fill-amber-500 text-amber-500" : ""}`} />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleCopyShareLink(d)}
                        className="h-8 w-8 text-muted-foreground hover:text-accent"
                        title="Compartilhar documento"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleExportPDF(d)}
                        className="h-8 w-8 text-muted-foreground hover:text-accent"
                        title="Exportar como PDF"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openDocument(d, "preview")}
                        className="h-8 w-8 text-muted-foreground hover:text-accent"
                        title="Visualizar documento"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT PREVIEW & EDITOR DIALOG */}
      {selectedDoc && (
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDocument()}>
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-card border border-white/10 shadow-2xl p-0 overflow-hidden">
            
            {/* Header bar inside Dialog */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-sidebar/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 ${getCategoryIconColor(selectedDoc.type).bg}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-bold truncate pr-6">{selectedDoc.title}</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Categoria: <span className="font-semibold text-accent/80">{selectedDoc.type}</span> • Atualizado em {new Date(selectedDoc.updated_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Action shortcuts at top-right */}
              <div className="flex items-center gap-1.5 mr-6">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleToggleStar(selectedDoc)}
                  className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                  title="Favoritar"
                >
                  <Star className={`h-4.5 w-4.5 ${selectedDoc.is_starred ? "fill-amber-500 text-amber-500" : ""}`} />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleCopyShareLink(selectedDoc)}
                  className="h-8 w-8 text-muted-foreground hover:text-accent"
                  title="Compartilhar"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleExportPDF(selectedDoc)}
                  className="h-8 w-8 text-muted-foreground hover:text-accent"
                  title="Exportar PDF"
                >
                  <Printer className="h-4.5 w-4.5" />
                </Button>

                {selectedDoc.owner_id === user?.id && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteDocument(selectedDoc.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Excluir documento"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* TAB CONTAINER */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              
              {/* Selector Tabs */}
              <div className="px-6 border-b border-white/5 bg-sidebar/10 py-1">
                <TabsList className="bg-transparent border-none p-0 h-10 gap-4">
                  <TabsTrigger 
                    value="preview" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-1 text-sm font-semibold h-full flex items-center gap-1.5"
                  >
                    <Eye className="h-4 w-4" /> Visualizar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="edit" 
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-1 text-sm font-semibold h-full flex items-center gap-1.5"
                  >
                    <FileEdit className="h-4 w-4" /> Editar Conteúdo
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TABS CONTENT */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-sidebar/5">
                
                {/* PREVIEW CONTAINER */}
                <TabsContent value="preview" className="mt-0 h-full">
                  <div className="max-w-2xl mx-auto bg-card border border-white/10 rounded-xl p-8 shadow-lg min-h-[400px] relative overflow-hidden flex flex-col">
                    
                    {/* Watermark/Accent lines */}
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: getCategoryIconColor(selectedDoc.type).raw }} />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 py-0.5 rounded border border-white/10">
                          {selectedDoc.type}
                        </span>
                        <h2 className="text-2xl font-bold tracking-tight text-card-foreground mt-2">{selectedDoc.title}</h2>
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground">
                        <p><strong>Autor:</strong> {profiles[selectedDoc.owner_id] || "Membro"}</p>
                        <p><strong>Atualizado:</strong> {new Date(selectedDoc.updated_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 my-4"></div>

                    {/* Formatted Content Pane */}
                    <div className="flex-1 text-sm leading-relaxed text-muted-foreground font-sans whitespace-pre-wrap mt-2 select-text">
                      {selectedDoc.content ? (
                        selectedDoc.content.split("\n\n").map((para, idx) => (
                          <p key={idx} className="mb-4">
                            {para}
                          </p>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center italic text-muted-foreground opacity-50">
                          <File className="h-8 w-8 mb-2" />
                          Este documento está em branco. Clique na aba "Editar" para adicionar conteúdo.
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/5 mt-8 pt-4 flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Plataforma EXACTA Flow</span>
                      <span>ID: {selectedDoc.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </TabsContent>

                {/* EDITING CONTAINER */}
                <TabsContent value="edit" className="mt-0 space-y-4">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Título do Documento</Label>
                      <Input 
                        id="edit-title" 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-type">Categoria</Label>
                      <Select value={editType} onValueChange={setEditType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.slice(1).map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-content">Conteúdo do Documento</Label>
                      <Textarea 
                        id="edit-content" 
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={14}
                        className="font-sans resize-y leading-relaxed text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* DIALOG FOOTER BAR */}
            <div className="px-6 py-4 border-t border-white/5 bg-sidebar/30 flex justify-between items-center shrink-0">
              <div>
                {activeTab === "preview" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab("edit")}
                    className="gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Editar Documento
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={closeDocument}>Fechar</Button>
                
                {activeTab === "edit" && (
                  <Button 
                    size="sm" 
                    onClick={handleSaveDocument}
                    disabled={saving}
                    className="bg-gradient-primary text-primary-foreground gap-1.5 shadow-elegant"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Salvar Alterações
                  </Button>
                )}
              </div>
            </div>

          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
