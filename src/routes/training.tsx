import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  GraduationCap, Video, BookOpen, Search, Filter, Plus, Play,
  CheckCircle2, Clock, Sparkles, Download, ExternalLink, FileText,
  ChevronRight, Trash2, Layers, Award, Printer, Eye, Share2, Check,
  BookMarked, HelpCircle, ArrowRight, ShieldCheck, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface TrainingItem {
  id: string;
  title: string;
  description: string;
  category: "onboarding" | "operacional" | "vendas" | "tecnologia" | "gestao";
  type: "video" | "manual";
  duration_minutes: number;
  level: "iniciante" | "intermediario" | "avancado";
  video_url?: string;
  content_markdown: string;
  download_url?: string;
  download_label?: string;
  checklist?: string[];
  created_at: string;
  author?: string;
}

const CATEGORY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  onboarding: { label: "Onboarding & Cultura", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  operacional: { label: "Processos & POPs", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  vendas: { label: "Vendas & Clientes", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  tecnologia: { label: "Tecnologia & Segurança", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  gestao: { label: "Gestão & Finanças", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

const DEFAULT_TRAININGS: TrainingItem[] = [
  {
    id: "tr-1",
    title: "Manual Operacional: Navegação e Fluxos no EXACTA Smart Flow",
    description: "Guia completo passo a passo sobre todas as abas da plataforma: Gestão Visual, Kanban, OKRs, BI e Finanças.",
    category: "onboarding",
    type: "manual",
    duration_minutes: 15,
    level: "iniciante",
    download_url: "#",
    download_label: "Guia_Rapido_EXACTA_2026.pdf",
    checklist: [
      "Configurar perfil e foto de usuário",
      "Conectar projeto ativo no seletor de topo",
      "Criar primeira tarefa no Kanban",
      "Explorar a aba de Gestão Visual e Mapas Mentais",
    ],
    content_markdown: `
# Manual Operacional do EXACTA Smart Flow

Bem-vindo ao centro nevrálgico de produtividade e gestão da sua organização. O **EXACTA Smart Flow** foi construído para unificar o fluxo de ponta a ponta: do planejamento estratégico à execução tática e controle financeiro.

---

### 1. Filosofia Operacional
A plataforma opera sob o princípio da **Gestão Visual e Autonomia Alinhada**:
- **Visibilidade Total**: Todos os membros sabem exatamente quais iniciativas estão ativas e seus prazos.
- **Rastro de Auditoria**: Cada alteração, movimentação e pagamento fica registrado de forma segura.
- **Inteligência Assistida**: Uso de IA para sintetizar ideias, gerar mapas conceituais e automatizar tarefas repetitivas.

---

### 2. Principais Áreas do Sistema
1. **Gestão Visual (/visual-management)**:
   - Mapas mentais com múltiplos layouts (Radial, Árvore, Ishikawa, Organograma).
   - Análises clássicas: Matriz SWOT, Matriz Eisenhower, 5W2H e Diagrama de Pareto.
2. **Finanças Pessoais e Corporativas (/finances)**:
   - Navegação mês a mês com projeção de lançamentos recorrentes.
   - Gestão integrada de Faturas de Cartão de Crédito e parcelamentos automáticos.
   - Botões instantâneos de **[PAGO]** e **[RECEBIDO]** com data gravada no clique.
   - Importação via planilha CSV com modelo pronto para download.
3. **BI e Análise de Dados (/analyze)**:
   - Conexão nativa com bancos SQL / MariaDB.
   - Geração de queries complexas com linguagem natural via IA.

---

### 3. Procedimento Diário Recomendado
- **Manhã**: Verificar notificações de vencimentos no pop-up inteligente e atualizar o quadro Kanban.
- **Tarde**: Registrar conclusões de tarefas e adicionar notas de alinhamento no chat colaborativo.
- **Fechamento**: Marcar baixas de pagamentos efetuados e planejar o próximo dia.
    `,
    created_at: new Date().toISOString(),
  },
  {
    id: "tr-2",
    title: "Treinamento em Vídeo: Gestão Ágil e Execução com Kanban & OKRs",
    description: "Aprenda na prática como decompor objetivos estratégicos em metas trimestrais e cards acionáveis no fluxo diário.",
    category: "operacional",
    type: "video",
    duration_minutes: 25,
    level: "intermediario",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Exemplo responsivo
    download_url: "#",
    download_label: "Slides_Gestao_Agil.pdf",
    checklist: [
      "Definir 3 Objetivos-Chave (OKRs) para o trimestre",
      "Vincular cada OKR a um projeto ativo no EXACTA",
      "Limitar o trabalho em progresso (WIP) no Kanban para 3 cards por membro",
    ],
    content_markdown: `
### Resumo da Sessão em Vídeo
Neste treinamento prático, abordamos os pilares da metodologia ágil aplicada ao EXACTA:
- **Diferença entre Tarefa e Meta**: Uma tarefa é um entregável operacional; um OKR mede o impacto no negócio.
- **Colunas do Kanban**: *A Fazer*, *Em Andamento*, *Revisão* e *Concluído*.
- **Subtarefas**: Use subtarefas para quebrar entregas complexas em passos rápidos de 30 minutos a 2 horas.
    `,
    created_at: new Date().toISOString(),
  },
  {
    id: "tr-3",
    title: "POP: Procedimento Padrão para Resolução de Problemas (Ishikawa & 5W2H)",
    description: "Metodologia estruturada para investigar desvios, falhas operacionais e implementar planos de contenção definitivos.",
    category: "gestao",
    type: "manual",
    duration_minutes: 20,
    level: "avancado",
    download_url: "#",
    download_label: "Template_Analise_Causa_Raiz.pdf",
    checklist: [
      "Definir o problema central com clareza na cabeça da espinha de peixe",
      "Levantar fatores nos 6Ms (Método, Máquina, Mão de Obra, Material, Meio Ambiente, Medição)",
      "Priorizar a causa raiz com a Matriz GUT",
      "Montar plano de ação 5W2H com responsáveis e prazos",
    ],
    content_markdown: `
# POP: Investigação e Resolução de Não-Conformidades

### Objetivo
Padronizar a investigação de gargalos, atrasos em projetos e perdas financeiras utilizando as ferramentas de Gestão Visual do EXACTA.

### Etapa 1: Abertura do Mapa Mental Ishikawa
1. Acesse a aba **Gestão Visual > Mapa Mental**.
2. No seletor de layout, escolha **Espinha de Peixe (Ishikawa)**.
3. No nó raiz (cabeça do peixe), descreva o efeito indesejado (Ex: *Atraso recorrente nas entregas de software*).
4. Em cada categoria, adicione os sub-nós identificados na reunião de alinhamento com a equipe.

### Etapa 2: Formulação do Plano 5W2H
Após identificar a causa raiz, migre para a aba **5W2H**:
- **What (O que)**: Qual ação corretiva será executada?
- **Why (Por que)**: Qual o benefício esperado?
- **Where (Onde)**: Qual departamento ou repositório?
- **When (Quando)**: Prazo fatal de execução.
- **Who (Quem)**: Responsável único direto.
- **How (Como)**: Passo a passo técnico.
- **How Much (Quanto)**: Custo financeiro estimado.
    `,
    created_at: new Date().toISOString(),
  },
  {
    id: "tr-4",
    title: "Manual: Melhores Práticas de Segurança da Informação e LGPD",
    description: "Diretrizes corporativas de proteção de senhas, compartilhamento de links de convite e confidencialidade de dados.",
    category: "tecnologia",
    type: "manual",
    duration_minutes: 18,
    level: "iniciante",
    checklist: [
      "Ativar autenticação forte",
      "Nunca compartilhar senhas corporativas por canais abertos",
      "Revogar tokens de convite expirados de projetos externos",
    ],
    content_markdown: `
# Manual de Segurança da Informação e Privacidade

A proteção dos ativos e dados dos nossos clientes é prioridade máxima. Este documento formaliza as regras mandatárias para uso da plataforma EXACTA.

### 1. Gestão de Acessos e Convidados
- Ao utilizar o **Modo Colaborativo** em projetos, convide terceiros preferencialmente com o papel de *Visualizador* ou *Convidado Externo (Guest)*.
- Links compartilháveis com token de acesso possuem prazo de expiração e devem ser enviados exclusivamente ao destinatário autorizado.

### 2. Dados Sensíveis e Financeiros
- Ao importar lançamentos via CSV na aba de Finanças, certifique-se de que a planilha não contém dados sensíveis desnecessários.
- Informações de cartão de crédito no sistema armazenam apenas a bandeira ou identificador (ex: *Mastercard Final 8892*), nunca o CVV ou numeração integral.
    `,
    created_at: new Date().toISOString(),
  },
  {
    id: "tr-5",
    title: "Treinamento em Vídeo: Como Conectar Bancos SQL no Módulo de BI",
    description: "Passo a passo visual para configurar conexões MariaDB e extrair relatórios executivos com a inteligência artificial.",
    category: "tecnologia",
    type: "video",
    duration_minutes: 16,
    level: "intermediario",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    checklist: [
      "Obter host, porta e credenciais de leitura do banco MariaDB",
      "Testar conectividade no botão 'Testar Conexão'",
      "Visualizar esquema de tabelas detectado",
      "Executar consulta com linguagem natural gerada por IA",
    ],
    content_markdown: `
### Guia Rápido de Configuração
- No menu lateral, acesse **Análise de Dados BI (/analyze)**.
- Clique em **Conectar Banco SQL / MariaDB**.
- Insira o endereço seguro do host e selecione a porta padrão 3306.
- A IA do EXACTA lerá o dicionário de dados e permitirá criar gráficos sem precisar escrever SELECT manualmente!
    `,
    created_at: new Date().toISOString(),
  },
];

export const Route = createFileRoute("/training")({
  component: () => (
    <AppShell>
      <TrainingPage />
    </AppShell>
  ),
});

function TrainingPage() {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<TrainingItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("exacta_trainings");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Erro ao carregar treinamentos", e);
        }
      }
    }
    return DEFAULT_TRAININGS;
  });

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("exacta_trainings_completed");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return ["tr-1"]; // Demonstração inicial com 1 concluído
  });

  // Filtros
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "video" | "manual">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");

  // Modais
  const [activeItem, setActiveItem] = useState<TrainingItem | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({});

  // Formulário de Novo Treinamento
  const [form, setForm] = useState<{
    title: string;
    description: string;
    category: "onboarding" | "operacional" | "vendas" | "tecnologia" | "gestao";
    type: "video" | "manual";
    duration_minutes: number;
    level: "iniciante" | "intermediario" | "avancado";
    video_url: string;
    download_url: string;
    download_label: string;
    content_markdown: string;
    checklist_raw: string;
  }>({
    title: "",
    description: "",
    category: "operacional",
    type: "manual",
    duration_minutes: 15,
    level: "iniciante",
    video_url: "",
    download_url: "",
    download_label: "",
    content_markdown: "",
    checklist_raw: "",
  });

  // Salvar no localStorage e tentar carregar do Supabase
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("exacta_trainings", JSON.stringify(trainings));
    }
  }, [trainings]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("exacta_trainings_completed", JSON.stringify(completedIds));
    }
  }, [completedIds]);

  // Carregar treinamentos salvos no Supabase na tabela documents se houver
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("type", "training_manual");

        if (data && data.length > 0) {
          const dbTrainings: TrainingItem[] = data.map((doc: any) => {
            const extra = doc.data || {};
            return {
              id: doc.id,
              title: doc.title,
              description: extra.description || "",
              category: extra.category || "operacional",
              type: extra.type || "manual",
              duration_minutes: extra.duration_minutes || 15,
              level: extra.level || "iniciante",
              video_url: extra.video_url || "",
              download_url: extra.download_url || "",
              download_label: extra.download_label || "",
              content_markdown: doc.content || "",
              checklist: extra.checklist || [],
              created_at: doc.created_at,
            };
          });

          // Mescla sem duplicar IDs
          setTrainings((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const fresh = dbTrainings.filter((t) => !existingIds.has(t.id));
            return [...prev, ...fresh];
          });
        }
      } catch (err) {
        console.warn("Supabase documents training load:", err);
      }
    }
    loadFromSupabase();
  }, []);

  // Alternar Conclusão
  const toggleComplete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCompletedIds((prev) => {
      const isCompleted = prev.includes(id);
      const next = isCompleted ? prev.filter((i) => i !== id) : [...prev, id];
      if (!isCompleted) {
        toast.success("Treinamento marcado como concluído! Parabéns! 🎓");
      } else {
        toast.info("Treinamento desmarcado.");
      }
      return next;
    });
  };

  // Cadastrar Novo Treinamento
  const handleCreateTraining = async () => {
    if (!form.title.trim()) {
      toast.warning("Informe o título do treinamento ou manual.");
      return;
    }

    const checklist = form.checklist_raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const newItem: TrainingItem = {
      id: `tr-${Date.now().toString(36)}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      type: form.type,
      duration_minutes: Number(form.duration_minutes) || 10,
      level: form.level,
      video_url: form.video_url.trim() || undefined,
      download_url: form.download_url.trim() || undefined,
      download_label: form.download_label.trim() || undefined,
      content_markdown: form.content_markdown.trim() || `# ${form.title}\n\nConteúdo a ser preenchido.`,
      checklist,
      created_at: new Date().toISOString(),
    };

    // Tentar persistir no Supabase (tabela documents)
    if (user) {
      try {
        await supabase.from("documents").insert({
          title: newItem.title,
          content: newItem.content_markdown,
          type: "training_manual",
          owner_id: user.id,
          data: {
            description: newItem.description,
            category: newItem.category,
            type: newItem.type,
            duration_minutes: newItem.duration_minutes,
            level: newItem.level,
            video_url: newItem.video_url,
            download_url: newItem.download_url,
            download_label: newItem.download_label,
            checklist: newItem.checklist,
          },
        });
      } catch (e) {
        console.warn("Could not insert to documents:", e);
      }
    }

    setTrainings((prev) => [newItem, ...prev]);
    toast.success("Novo treinamento cadastrado com sucesso!");
    setNewModalOpen(false);
    setForm({
      title: "",
      description: "",
      category: "operacional",
      type: "manual",
      duration_minutes: 15,
      level: "iniciante",
      video_url: "",
      download_url: "",
      download_label: "",
      content_markdown: "",
      checklist_raw: "",
    });
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este treinamento?")) return;
    setTrainings((prev) => prev.filter((t) => t.id !== id));
    setCompletedIds((prev) => prev.filter((i) => i !== id));
    if (activeItem?.id === id) setActiveItem(null);
    toast.success("Treinamento excluído.");
  };

  // Filtros aplicados
  const filtered = useMemo(() => {
    return trainings.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter === "completed" && !completedIds.includes(item.id)) return false;
      if (statusFilter === "pending" && completedIds.includes(item.id)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.content_markdown.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [trainings, categoryFilter, typeFilter, statusFilter, search, completedIds]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = trainings.length;
    const completed = completedIds.filter((id) => trainings.some((t) => t.id === id)).length;
    const videos = trainings.filter((t) => t.type === "video").length;
    const manuals = trainings.filter((t) => t.type === "manual").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, videos, manuals, percent };
  }, [trainings, completedIds]);

  // Converter URL do YouTube para Embed Responsivo
  const getEmbedVideoUrl = (url?: string) => {
    if (!url) return "";
    try {
      if (url.includes("youtube.com/watch")) {
        const v = new URL(url).searchParams.get("v");
        return `https://www.youtube.com/embed/${v}?autoplay=0&rel=0`;
      }
      if (url.includes("youtu.be/")) {
        const v = url.split("youtu.be/")[1]?.split("?")[0];
        return `https://www.youtube.com/embed/${v}?autoplay=0&rel=0`;
      }
      if (url.includes("vimeo.com/")) {
        const v = url.split("vimeo.com/")[1]?.split("?")[0];
        return `https://player.vimeo.com/video/${v}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Exportar Manual como PDF
  const manualPrintRef = useRef<HTMLDivElement>(null);
  const handleExportManualPDF = async () => {
    if (!manualPrintRef.current || !activeItem) return;
    try {
      toast.info("Gerando PDF do Manual...");
      const canvas = await html2canvas(manualPrintRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`manual-exacta-${activeItem.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`);
      toast.success("Manual baixado em PDF com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF do manual.");
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header Principal */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent text-sm font-semibold uppercase tracking-wider">
            <GraduationCap className="h-4 w-4" />
            <span>Capacitação & Conhecimento</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1 text-foreground">
            Central de Treinamento & Manuais
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-2xl">
            Acesse vídeos operacionais, manuais de procedimentos padrão (POPs), diretrizes de segurança
            e materiais da equipe em um único repositório inteligente.
          </p>
        </div>

        <Button
          onClick={() => setNewModalOpen(true)}
          className="gap-2 bg-gradient-to-r from-accent to-purple-600 text-white font-semibold shadow-glow"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Treinamento ou Manual</span>
        </Button>
      </header>

      {/* Cards de Métricas & Progresso do Usuário */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-white/5 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total de Módulos</p>
            <p className="text-2xl font-bold font-display mt-1">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Disponíveis na base</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <BookMarked className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-sm border-white/5 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Vídeos & Aulas</p>
            <p className="text-2xl font-bold font-display mt-1 text-blue-400">{stats.videos}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tutoriais práticos gravados</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Video className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-sm border-white/5 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Manuais & POPs</p>
            <p className="text-2xl font-bold font-display mt-1 text-emerald-400">{stats.manuals}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Documentos e procedimentos</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-sm border-white/5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Seu Progresso</p>
            <Badge className="bg-accent/20 text-accent hover:bg-accent/30 font-bold border-none text-[11px]">
              {stats.completed}/{stats.total} Concluídos
            </Badge>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Aproveitamento</span>
              <span className="text-accent">{stats.percent}%</span>
            </div>
            <Progress value={stats.percent} className="h-2 bg-muted/40" />
          </div>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-card/40 backdrop-blur-md rounded-xl border border-white/5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar treinamento, manual ou assunto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background/50 border-white/10 focus:border-accent"
            />
          </div>

          {/* Filtro de Categoria */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-9 text-xs bg-background/50 border-white/10">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas as Categorias</SelectItem>
              {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {info.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Status */}
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-background/50 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos Status</SelectItem>
              <SelectItem value="completed" className="text-xs">✅ Concluídos</SelectItem>
              <SelectItem value="pending" className="text-xs">⏳ Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Abas Rápidas por Tipo */}
        <div className="flex items-center gap-1 bg-background/50 p-1 rounded-lg border border-white/10">
          <Button
            size="sm"
            variant={typeFilter === "all" ? "default" : "ghost"}
            onClick={() => setTypeFilter("all")}
            className={cn("h-7 text-xs px-2.5", typeFilter === "all" && "bg-accent text-accent-foreground font-semibold")}
          >
            Todos ({trainings.length})
          </Button>
          <Button
            size="sm"
            variant={typeFilter === "video" ? "default" : "ghost"}
            onClick={() => setTypeFilter("video")}
            className={cn("h-7 text-xs px-2.5 gap-1.5", typeFilter === "video" && "bg-blue-600 text-white font-semibold")}
          >
            <Video className="h-3 w-3" />
            <span>Vídeos ({stats.videos})</span>
          </Button>
          <Button
            size="sm"
            variant={typeFilter === "manual" ? "default" : "ghost"}
            onClick={() => setTypeFilter("manual")}
            className={cn("h-7 text-xs px-2.5 gap-1.5", typeFilter === "manual" && "bg-emerald-600 text-white font-semibold")}
          >
            <BookOpen className="h-3 w-3" />
            <span>Manuais ({stats.manuals})</span>
          </Button>
        </div>
      </div>

      {/* Grade de Treinamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 && (
          <Card className="col-span-full p-12 text-center text-muted-foreground border-dashed bg-card/20">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30 text-accent" />
            <p className="font-semibold text-lg text-foreground">Nenhum treinamento encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou cadastre um novo material para a equipe.
            </p>
            <Button
              onClick={() => setNewModalOpen(true)}
              variant="outline"
              size="sm"
              className="mt-4 gap-2 border-accent text-accent hover:bg-accent/10"
            >
              <Plus className="h-4 w-4" /> Cadastrar Treinamento
            </Button>
          </Card>
        )}

        {filtered.map((item) => {
          const isCompleted = completedIds.includes(item.id);
          const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.operacional;
          const isVideo = item.type === "video";

          return (
            <Card
              key={item.id}
              onClick={() => setActiveItem(item)}
              className={cn(
                "p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer group relative overflow-hidden",
                "bg-card/40 hover:bg-card/70 border border-white/5 hover:border-accent/40 shadow-card hover:shadow-elegant",
                isCompleted && "border-emerald-500/30"
              )}
            >
              {/* Barra superior de acento */}
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 h-1",
                  isVideo ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                )}
              />

              <div className="space-y-3">
                {/* Cabeçalho do Card: Badges de Categoria e Tipo */}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={cn("text-[11px] font-semibold", cat.bg, cat.color)}>
                    {cat.label}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    {isVideo ? (
                      <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] gap-1">
                        <Video className="h-3 w-3" /> Vídeo
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] gap-1">
                        <BookOpen className="h-3 w-3" /> Manual
                      </Badge>
                    )}

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                      title="Excluir treinamento"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Título & Descrição */}
                <div>
                  <h3 className="font-display font-bold text-base text-foreground group-hover:text-accent transition leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Rodapé do Card */}
              <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-accent" />
                    {item.duration_minutes} min
                  </span>
                  <span>•</span>
                  <span className="capitalize">{item.level}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={isCompleted ? "outline" : "default"}
                    onClick={(e) => toggleComplete(item.id, e)}
                    className={cn(
                      "h-7 px-2.5 text-xs gap-1.5 font-semibold",
                      isCompleted
                        ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
                        : "bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30"
                    )}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Concluído</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Marcar Lido</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 rounded-lg group-hover:bg-accent group-hover:text-accent-foreground transition"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal Leitor / Player do Treinamento Ativo */}
      <Dialog open={!!activeItem} onOpenChange={(open) => !open && setActiveItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-sidebar/95 backdrop-blur-2xl border-white/10 p-0">
          {activeItem && (
            <div className="flex flex-col">
              {/* Header do Modal */}
              <div className="p-6 border-b border-white/10 bg-card/40 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold",
                        CATEGORY_MAP[activeItem.category]?.bg,
                        CATEGORY_MAP[activeItem.category]?.color
                      )}
                    >
                      {CATEGORY_MAP[activeItem.category]?.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="h-3 w-3 text-accent" /> {activeItem.duration_minutes} min
                    </Badge>
                    <Badge variant="outline" className="text-xs uppercase tracking-wider font-mono">
                      Nível: {activeItem.level}
                    </Badge>
                  </div>

                  <DialogTitle className="text-2xl font-display font-bold text-foreground">
                    {activeItem.title}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">{activeItem.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {activeItem.type === "manual" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportManualPDF}
                      className="gap-1.5 text-xs border-white/10 hover:border-accent"
                    >
                      <Download className="h-3.5 w-3.5 text-accent" />
                      <span>PDF</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => toggleComplete(activeItem.id)}
                    className={cn(
                      "gap-1.5 text-xs font-semibold",
                      completedIds.includes(activeItem.id)
                        ? "bg-emerald-600 text-white"
                        : "bg-accent text-accent-foreground"
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {completedIds.includes(activeItem.id)
                        ? "Concluído (Desmarcar)"
                        : "Marcar como Concluído"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Corpo: Vídeo Player ou Manual Markdown */}
              <div className="p-6 space-y-6">
                {/* Se for Vídeo: Player Embutido Responsivo */}
                {activeItem.type === "video" && (
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl">
                      {activeItem.video_url ? (
                        <iframe
                          src={getEmbedVideoUrl(activeItem.video_url)}
                          title={activeItem.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <Video className="h-12 w-12 mb-2 opacity-40 text-blue-400" />
                          <p>Nenhuma URL de vídeo configurada.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conteúdo Markdown / Manual */}
                <div
                  ref={manualPrintRef}
                  className="p-6 rounded-xl bg-card/30 border border-white/5 prose prose-invert prose-accent max-w-none text-foreground leading-relaxed text-sm"
                >
                  <ReactMarkdown>{activeItem.content_markdown}</ReactMarkdown>
                </div>

                {/* Checklist Operacional de Prática se houver */}
                {activeItem.checklist && activeItem.checklist.length > 0 && (
                  <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
                    <h4 className="text-sm font-bold text-accent flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Checklist Prático do Módulo
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Marque cada etapa após aplicar o procedimento na sua rotina diária:
                    </p>

                    <div className="space-y-2">
                      {activeItem.checklist.map((task, idx) => {
                        const key = `${activeItem.id}-${idx}`;
                        const isDone = !!checkedChecklist[key];
                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              setCheckedChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
                            }
                            className={cn(
                              "flex items-center gap-3 p-2.5 rounded-lg border transition cursor-pointer select-none",
                              isDone
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                : "bg-card/50 border-white/5 text-foreground hover:bg-card"
                            )}
                          >
                            <div
                              className={cn(
                                "h-4 w-4 rounded flex items-center justify-center border transition",
                                isDone
                                  ? "bg-emerald-500 border-emerald-500 text-black font-bold"
                                  : "border-muted-foreground/40"
                              )}
                            >
                              {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <span className={cn("text-xs font-medium", isDone && "line-through opacity-75")}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Material Complementar para Download se houver */}
                {activeItem.download_url && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-card/60 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {activeItem.download_label || "Material de Apoio do Treinamento"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Documento complementar / Slides</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-xs border-accent text-accent hover:bg-accent/10"
                      onClick={() => toast.success("Download iniciado!")}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Baixar Arquivo</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer do Modal */}
              <div className="p-4 border-t border-white/10 bg-card/40 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveItem(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cadastro de Novo Treinamento / Manual */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-sidebar/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-display font-bold">
              <GraduationCap className="h-5 w-5 text-accent" />
              Cadastrar Novo Treinamento ou Manual
            </DialogTitle>
            <DialogDescription>
              Adicione vídeos instrutivos ou manuais operacionais (POPs) para capacitação da sua equipe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Seletor Tipo: Vídeo vs Manual */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "manual" })}
                className={cn(
                  "p-3 rounded-xl border flex items-center gap-3 transition text-left",
                  form.type === "manual"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold shadow-md"
                    : "bg-card/40 border-white/10 text-muted-foreground hover:bg-card"
                )}
              >
                <BookOpen className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Manual Escrito (POP)</p>
                  <p className="text-[10px] opacity-75 font-normal">Procedimentos e guias passo a passo</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, type: "video" })}
                className={cn(
                  "p-3 rounded-xl border flex items-center gap-3 transition text-left",
                  form.type === "video"
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400 font-bold shadow-md"
                    : "bg-card/40 border-white/10 text-muted-foreground hover:bg-card"
                )}
              >
                <Video className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Treinamento em Vídeo</p>
                  <p className="text-[10px] opacity-75 font-normal">Links YouTube, Vimeo ou MP4</p>
                </div>
              </button>
            </div>

            {/* Título & Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Título do Treinamento *</Label>
                <Input
                  placeholder="Ex: Manual de Fechamento Financeiro Mensal"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 h-9 text-xs bg-background/50 border-white/10"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(val: any) => setForm({ ...form, category: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs bg-background/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descrição Curta */}
            <div>
              <Label className="text-xs font-semibold">Descrição / Objetivo</Label>
              <Input
                placeholder="Breve resumo sobre o que o colaborador aprenderá neste módulo..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 h-9 text-xs bg-background/50 border-white/10"
              />
            </div>

            {/* Duração & Nível */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Duração Estimada (minutos)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="mt-1 h-9 text-xs bg-background/50 border-white/10"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Nível de Dificuldade</Label>
                <Select
                  value={form.level}
                  onValueChange={(val: any) => setForm({ ...form, level: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs bg-background/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante" className="text-xs">Iniciante</SelectItem>
                    <SelectItem value="intermediario" className="text-xs">Intermediário</SelectItem>
                    <SelectItem value="avancado" className="text-xs">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campo URL do Vídeo (se aplicável) */}
            {form.type === "video" && (
              <div>
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-blue-400">
                  <Video className="h-3.5 w-3.5" /> URL do Vídeo (YouTube, Vimeo ou MP4)
                </Label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  className="mt-1 h-9 text-xs bg-background/50 border-white/10"
                />
              </div>
            )}

            {/* Conteúdo em Markdown */}
            <div>
              <Label className="text-xs font-semibold">
                Conteúdo do Manual / Roteiro (Markdown Suportado)
              </Label>
              <Textarea
                placeholder="# Título do Procedimento&#10;&#10;Descreva as instruções, passos numerados, dicas e links necessários..."
                rows={6}
                value={form.content_markdown}
                onChange={(e) => setForm({ ...form, content_markdown: e.target.value })}
                className="mt-1 text-xs bg-background/50 border-white/10 font-mono"
              />
            </div>

            {/* Checklist de Validação (1 por linha) */}
            <div>
              <Label className="text-xs font-semibold">
                Itens do Checklist de Aprendizado (1 por linha)
              </Label>
              <Textarea
                placeholder="Ex: Executar o primeiro backup&#10;Criar a conta no painel&#10;Validar permissões com o gestor"
                rows={3}
                value={form.checklist_raw}
                onChange={(e) => setForm({ ...form, checklist_raw: e.target.value })}
                className="mt-1 text-xs bg-background/50 border-white/10"
              />
            </div>

            {/* Material Complementar Download */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">URL de Download Complementar</Label>
                <Input
                  placeholder="https://drive.google.com/... ou link de arquivo"
                  value={form.download_url}
                  onChange={(e) => setForm({ ...form, download_url: e.target.value })}
                  className="mt-1 h-9 text-xs bg-background/50 border-white/10"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Nome do Arquivo / Rótulo</Label>
                <Input
                  placeholder="Ex: Planilha_Modelo.xlsx"
                  value={form.download_label}
                  onChange={(e) => setForm({ ...form, download_label: e.target.value })}
                  className="mt-1 h-9 text-xs bg-background/50 border-white/10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setNewModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTraining}
              className="bg-gradient-to-r from-accent to-purple-600 text-white font-semibold"
            >
              Publicar Treinamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

