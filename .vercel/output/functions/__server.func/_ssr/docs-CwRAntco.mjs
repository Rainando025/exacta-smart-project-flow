import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AttachmentsPanel } from "./AttachmentsPanel-CXe9LiMG.mjs";
import { ak as useAuth, ai as supabase, aj as toast, b as Button, D as Dialog, t as DialogTrigger, o as DialogContent, r as DialogHeader, s as DialogTitle, p as DialogDescription, L as Label$1, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, q as DialogFooter, C as Card, e as CardHeader, f as CardTitle, c as CardContent, i as ChevronRight, B as Badge, a8 as createLucideIcon } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { T as Tabs, b as TabsList, c as TabsTrigger, a as TabsContent } from "./tabs-DVtr1KIk.mjs";
import { A as AppShell, F as FileText, P as Plus, d as LoaderCircle, S as Search, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { S as Star } from "./star-CsoGiJLD.mjs";
import { F as File, P as Paperclip } from "./paperclip-BgIjAsfH.mjs";
import { P as Pen } from "./pen-DrucmGnU.mjs";
import { S as Save } from "./save-CDG45ltg.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./download-DABr9rdP.mjs";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
const __iconNode$3 = [
  [
    "path",
    {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      key: "1nclc0"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
];
const Eye = createLucideIcon("eye", __iconNode$3);
const __iconNode$2 = [
  [
    "path",
    {
      d: "M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34",
      key: "o6klzx"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
  [
    "path",
    {
      d: "M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z",
      key: "zhnas1"
    }
  ]
];
const FilePen = createLucideIcon("file-pen", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
      key: "143wyd"
    }
  ],
  ["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6", key: "1itne7" }],
  ["rect", { x: "6", y: "14", width: "12", height: "8", rx: "1", key: "1ue0tg" }]
];
const Printer = createLucideIcon("printer", __iconNode$1);
const __iconNode = [
  ["circle", { cx: "18", cy: "5", r: "3", key: "gq8acd" }],
  ["circle", { cx: "6", cy: "12", r: "3", key: "w7nqdw" }],
  ["circle", { cx: "18", cy: "19", r: "3", key: "1xt0gg" }],
  ["line", { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49", key: "47mynk" }],
  ["line", { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49", key: "1n3mei" }]
];
const Share2 = createLucideIcon("share-2", __iconNode);
const CATEGORIES = ["Todos", "Processo", "Manual", "Roteiro", "Design", "Vendas", "TI", "Outros"];
function DocsPage() {
  const {
    user
  } = useAuth();
  const [documents, setDocuments] = reactExports.useState([]);
  const [profiles, setProfiles] = reactExports.useState({});
  const [loading, setLoading] = reactExports.useState(true);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [selectedType, setSelectedType] = reactExports.useState("Todos");
  const [filterStarred, setFilterStarred] = reactExports.useState(false);
  const [selectedDoc, setSelectedDoc] = reactExports.useState(null);
  const [isDialogOpen, setIsDialogOpen] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState("preview");
  const [editTitle, setEditTitle] = reactExports.useState("");
  const [editType, setEditType] = reactExports.useState("Processo");
  const [editContent, setEditContent] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const [isCreateOpen, setIsCreateOpen] = reactExports.useState(false);
  const [newTitle, setNewTitle] = reactExports.useState("");
  const [newType, setNewType] = reactExports.useState("Processo");
  const [newContent, setNewContent] = reactExports.useState("");
  const [creating, setCreating] = reactExports.useState(false);
  const fetchProfiles = async () => {
    try {
      const {
        data
      } = await supabase.from("profiles").select("id, full_name");
      const profileMap = {};
      data?.forEach((p) => {
        profileMap[p.id] = p.full_name;
      });
      setProfiles(profileMap);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  };
  const fetchDocuments = reactExports.useCallback(async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("documents").select("*").order("updated_at", {
        ascending: false
      });
      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      toast.error("Erro ao carregar documentos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    fetchProfiles();
    fetchDocuments();
    const channel = supabase.channel("documents-realtime-changes").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "documents"
    }, () => {
      fetchDocuments();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDocuments]);
  reactExports.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get("id");
    if (docId && documents.length > 0) {
      const doc = documents.find((d) => d.id === docId);
      if (doc) {
        openDocument(doc, "preview");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [documents]);
  const openDocument = (doc, mode = "preview") => {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditType(doc.type || "Processo");
    setEditContent(doc.content || "");
    setActiveTab(mode);
    setIsDialogOpen(true);
  };
  const closeDocument = () => {
    setSelectedDoc(null);
    setIsDialogOpen(false);
  };
  const handleCreateDocument = async () => {
    if (!user) return toast.error("Você precisa estar autenticado.");
    if (!newTitle.trim()) return toast.error("O título do documento é obrigatório.");
    setCreating(true);
    try {
      const {
        data,
        error
      } = await supabase.from("documents").insert({
        title: newTitle.trim(),
        content: newContent,
        type: newType,
        owner_id: user.id,
        is_starred: false
      }).select().single();
      if (error) throw error;
      toast.success("Documento criado com sucesso!");
      setNewTitle("");
      setNewContent("");
      setNewType("Processo");
      setIsCreateOpen(false);
      if (data) {
        openDocument(data, "edit");
      }
    } catch (err) {
      toast.error("Erro ao criar documento: " + err.message);
    } finally {
      setCreating(false);
      fetchDocuments();
    }
  };
  const handleSaveDocument = async () => {
    if (!selectedDoc) return;
    if (!editTitle.trim()) return toast.error("O título do documento não pode estar vazio.");
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from("documents").update({
        title: editTitle.trim(),
        type: editType,
        content: editContent,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", selectedDoc.id);
      if (error) throw error;
      toast.success("Documento salvo com sucesso!");
      setSelectedDoc((prev) => prev ? {
        ...prev,
        title: editTitle.trim(),
        type: editType,
        content: editContent,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      } : null);
      setActiveTab("preview");
    } catch (err) {
      toast.error("Erro ao salvar documento: " + err.message);
    } finally {
      setSaving(false);
      fetchDocuments();
    }
  };
  const handleToggleStar = async (doc) => {
    const nextStar = !doc.is_starred;
    try {
      const {
        error
      } = await supabase.from("documents").update({
        is_starred: nextStar
      }).eq("id", doc.id);
      if (error) throw error;
      toast.success(nextStar ? "Documento marcado como favorito!" : "Removido dos favoritos.");
      if (selectedDoc && selectedDoc.id === doc.id) {
        setSelectedDoc((prev) => prev ? {
          ...prev,
          is_starred: nextStar
        } : null);
      }
      setDocuments((prev) => prev.map((d) => d.id === doc.id ? {
        ...d,
        is_starred: nextStar
      } : d));
    } catch (err) {
      toast.error("Erro ao favoritar: " + err.message);
    }
  };
  const handleDeleteDocument = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente este documento?")) return;
    try {
      const {
        error
      } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      toast.success("Documento excluído.");
      closeDocument();
      fetchDocuments();
    } catch (err) {
      toast.error("Erro ao excluir documento: " + err.message);
    }
  };
  const handleCopyShareLink = async (doc) => {
    const shareUrl = `${window.location.origin}/docs?id=${doc.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link de compartilhamento copiado!");
    } catch (err) {
      toast.error("Não foi possível copiar o link.");
    }
  };
  const handleExportPDF = (doc) => {
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
            Documento exportado eletronicamente pela plataforma EXACTA Smart Project Flow em ${(/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR")}.
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  const getFormattedDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = /* @__PURE__ */ new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 6e4);
    const hours = Math.floor(diff / 36e5);
    const days = Math.floor(diff / 864e5);
    if (minutes < 60) return `${minutes || 1} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return `Ontem`;
    if (days < 7) return `${days} dias atrás`;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short"
    });
  };
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || (doc.content || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "Todos" || doc.type === selectedType;
    const matchesStarred = !filterStarred || doc.is_starred;
    return matchesSearch && matchesType && matchesStarred;
  });
  const starredDocs = documents.filter((d) => d.is_starred);
  const getCategoryIconColor = (type) => {
    switch (type) {
      case "Processo":
        return {
          bg: "bg-blue-500/10 text-blue-500",
          raw: "#3b82f6"
        };
      case "Manual":
        return {
          bg: "bg-emerald-500/10 text-emerald-500",
          raw: "#10b981"
        };
      case "Roteiro":
        return {
          bg: "bg-amber-500/10 text-amber-500",
          raw: "#f59e0b"
        };
      case "Design":
        return {
          bg: "bg-purple-500/10 text-purple-500",
          raw: "#a855f7"
        };
      case "Vendas":
        return {
          bg: "bg-pink-500/10 text-pink-500",
          raw: "#ec4899"
        };
      case "TI":
        return {
          bg: "bg-indigo-500/10 text-indigo-500",
          raw: "#6366f1"
        };
      default:
        return {
          bg: "bg-slate-500/10 text-slate-500",
          raw: "#64748b"
        };
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-blue-500/10 text-blue-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Documentos" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Crie, visualize, colabore e exporte seus manuais e processos em tempo real." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: filterStarred ? "secondary" : "outline", onClick: () => setFilterStarred(!filterStarred), className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `h-4 w-4 ${filterStarred ? "fill-current" : ""}` }),
          filterStarred ? "Todos" : "Favoritos"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isCreateOpen, onOpenChange: setIsCreateOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
            " Novo Documento"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl bg-card border border-white/10 shadow-2xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Criar Novo Documento" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Adicione um título, escolha a categoria e preencha as orientações essenciais." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "new-title", children: "Título do Documento" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "new-title", placeholder: "Ex: Manual de Integração do Desenvolvedor", value: newTitle, onChange: (e) => setNewTitle(e.target.value) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "new-type", children: "Categoria" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newType, onValueChange: setNewType, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione uma categoria" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: CATEGORIES.slice(1).map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: cat, children: cat }, cat)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "new-content", children: "Conteúdo / Descrição" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "new-content", placeholder: "Escreva as diretrizes, POP ou manuais do processo aqui...", value: newContent, onChange: (e) => setNewContent(e.target.value), rows: 10, className: "resize-y" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setIsCreateOpen(false), children: "Cancelar" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleCreateDocument, disabled: creating, className: "bg-gradient-primary text-primary-foreground", children: [
                creating ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-2" }) : null,
                "Criar Documento"
              ] })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl p-2 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar documentos por título ou conteúdo...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10 border-none bg-transparent focus-visible:ring-0" })
      ] }),
      searchTerm && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => setSearchTerm(""), className: "h-8 text-xs text-muted-foreground mr-2", children: "Limpar" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 lg:col-span-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-white/5 bg-sidebar/50 backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5 fill-amber-500 text-amber-500" }),
          "Favoritos"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-1 px-3", children: starredDocs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground px-3 py-2 italic", children: "Nenhum favorito selecionado." }) : starredDocs.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => openDocument(d, "preview"), className: "flex items-center gap-2 p-2 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FilePen, { className: "h-3.5 w-3.5 text-accent opacity-70 group-hover:opacity-100" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs truncate font-medium flex-1 group-hover:text-accent transition-colors", children: d.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" })
        ] }, d.id)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-3 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-semibold flex items-center gap-2", children: [
            "Todos os Documentos",
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "font-mono text-xs", children: filteredDocs.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: CATEGORIES.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: selectedType === cat ? "secondary" : "outline", onClick: () => setSelectedType(cat), className: "cursor-pointer hover:bg-accent/20 transition-all text-xs", children: cat }, cat)) })
        ] }),
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-20 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Carregando documentos do EXACTA Flow..." })
        ] }) : filteredDocs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-card/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(File, { className: "h-10 w-10 text-muted-foreground opacity-20 mb-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-base", children: "Nenhum documento encontrado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground max-w-xs mt-1", children: 'Tente ajustar sua busca ou crie um novo documento clicando em "Novo Documento".' })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: filteredDocs.map((d) => {
          const colors = getCategoryIconColor(d.type);
          const ownerName = profiles[d.owner_id] || "Membro";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 rounded-xl border border-white/5 bg-card/50 hover:bg-card hover:shadow-elegant transition-all duration-300 group cursor-pointer", onClick: () => openDocument(d, "preview"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium group-hover:text-accent transition-colors truncate pr-4", children: d.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-accent/80", children: d.type || "Geral" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
                    "Por: ",
                    ownerName
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: getFormattedDate(d.updated_at || d.created_at) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", onClick: (e) => e.stopPropagation(), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleToggleStar(d), className: `h-8 w-8 text-muted-foreground hover:text-amber-500`, title: d.is_starred ? "Remover dos favoritos" : "Adicionar aos favoritos", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `h-4 w-4 ${d.is_starred ? "fill-amber-500 text-amber-500" : ""}` }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleCopyShareLink(d), className: "h-8 w-8 text-muted-foreground hover:text-accent", title: "Compartilhar documento", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleExportPDF(d), className: "h-8 w-8 text-muted-foreground hover:text-accent", title: "Exportar como PDF", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => openDocument(d, "preview"), className: "h-8 w-8 text-muted-foreground hover:text-accent", title: "Visualizar documento", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) })
            ] })
          ] }, d.id);
        }) })
      ] })
    ] }),
    selectedDoc && /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isDialogOpen, onOpenChange: (open) => !open && closeDocument(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-4xl max-h-[85vh] flex flex-col bg-card border border-white/10 shadow-2xl p-0 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-white/5 bg-sidebar/30", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 rounded-lg shrink-0 ${getCategoryIconColor(selectedDoc.type).bg}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-lg font-bold truncate pr-6", children: selectedDoc.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
              "Categoria: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-accent/80", children: selectedDoc.type }),
              " • Atualizado em ",
              new Date(selectedDoc.updated_at).toLocaleDateString("pt-BR")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mr-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleToggleStar(selectedDoc), className: "h-8 w-8 text-muted-foreground hover:text-amber-500", title: "Favoritar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `h-4.5 w-4.5 ${selectedDoc.is_starred ? "fill-amber-500 text-amber-500" : ""}` }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleCopyShareLink(selectedDoc), className: "h-8 w-8 text-muted-foreground hover:text-accent", title: "Compartilhar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4.5 w-4.5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleExportPDF(selectedDoc), className: "h-8 w-8 text-muted-foreground hover:text-accent", title: "Exportar PDF", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-4.5 w-4.5" }) }),
          selectedDoc.owner_id === user?.id && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleDeleteDocument(selectedDoc.id), className: "h-8 w-8 text-muted-foreground hover:text-destructive", title: "Excluir documento", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4.5 w-4.5" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "flex-1 flex flex-col min-h-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 border-b border-white/5 bg-sidebar/10 py-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "bg-transparent border-none p-0 h-10 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "preview", className: "bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-1 text-sm font-semibold h-full flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }),
            " Visualizar"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "edit", className: "bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-1 text-sm font-semibold h-full flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FilePen, { className: "h-4 w-4" }),
            " Editar Conteúdo"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "attachments", className: "bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-1 text-sm font-semibold h-full flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Paperclip, { className: "h-4 w-4" }),
            " Anexos"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-6 min-h-0 bg-sidebar/5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "preview", className: "mt-0 h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto bg-card border border-white/10 rounded-xl p-8 shadow-lg min-h-[400px] relative overflow-hidden flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 right-0 h-1", style: {
              backgroundColor: getCategoryIconColor(selectedDoc.type).raw
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 py-0.5 rounded border border-white/10", children: selectedDoc.type }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold tracking-tight text-card-foreground mt-2", children: selectedDoc.title })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right text-[11px] text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Autor:" }),
                  " ",
                  profiles[selectedDoc.owner_id] || "Membro"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Atualizado:" }),
                  " ",
                  new Date(selectedDoc.updated_at).toLocaleDateString("pt-BR")
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-white/5 my-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 text-sm leading-relaxed text-muted-foreground font-sans whitespace-pre-wrap mt-2 select-text", children: selectedDoc.content ? selectedDoc.content.split("\n\n").map((para, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-4", children: para }, idx)) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center italic text-muted-foreground opacity-50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(File, { className: "h-8 w-8 mb-2" }),
              'Este documento está em branco. Clique na aba "Editar" para adicionar conteúdo.'
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-white/5 mt-8 pt-4 flex justify-between items-center text-[10px] text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Plataforma EXACTA Flow" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "ID: ",
                selectedDoc.id.slice(0, 8),
                "..."
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "attachments", className: "mt-0 h-full max-w-2xl mx-auto bg-card border border-white/10 rounded-xl p-8 shadow-lg min-h-[400px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AttachmentsPanel, { documentId: selectedDoc.id }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "edit", className: "mt-0 space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "edit-title", children: "Título do Documento" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "edit-title", value: editTitle, onChange: (e) => setEditTitle(e.target.value) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "edit-type", children: "Categoria" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: editType, onValueChange: setEditType, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: CATEGORIES.slice(1).map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: cat, children: cat }, cat)) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { htmlFor: "edit-content", children: "Conteúdo do Documento" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "edit-content", value: editContent, onChange: (e) => setEditContent(e.target.value), rows: 14, className: "font-sans resize-y leading-relaxed text-sm" })
            ] })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-4 border-t border-white/5 bg-sidebar/30 flex justify-between items-center shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: activeTab === "preview" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setActiveTab("edit"), className: "gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "h-3.5 w-3.5" }),
          " Editar Documento"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: closeDocument, children: "Fechar" }),
          activeTab === "edit" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: handleSaveDocument, disabled: saving, className: "bg-gradient-primary text-primary-foreground gap-1.5 shadow-elegant", children: [
            saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3.5 w-3.5" }),
            "Salvar Alterações"
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DocsPage, {}) });
export {
  SplitComponent as component
};
