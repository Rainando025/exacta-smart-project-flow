import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Brain,
  Sparkles,
  Plus,
  Target,
  MessageSquare,
  Video,
  VideoOff,
  Copy,
  Check,
  ExternalLink,
  Users,
  Timer,
  Play,
  Pause,
  RotateCcw,
  ThumbsUp,
  Trash2,
  Edit3,
  ArrowRight,
  ArrowLeft,
  Search,
  Tag,
  X,
  RefreshCw,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  Calendar,
  Layers,
  Share2,
  CheckCircle2,
  Radio,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { askAI } from "@/lib/ai";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brainstorming")({
  component: () => (
    <AppShell>
      <BrainstormingPage />
    </AppShell>
  ),
});

// ─── Tipos e Interfaces ────────────────────────────────────────────────────────

export interface BrainstormIdea {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  color: "yellow" | "blue" | "green" | "pink" | "purple" | "orange";
  votes: string[]; // IDs dos usuários que votaram
  createdAt: string;
}

export interface BrainstormColumn {
  id: string;
  title: string;
  color?: string;
  description?: string;
}

export interface BrainstormSessionData {
  columns: BrainstormColumn[];
  ideas: BrainstormIdea[];
}

export interface BrainstormSession {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  template: string | null;
  meet_url: string | null;
  data: BrainstormSessionData | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  department_id?: string | null;
}

export interface PresenceUser {
  user_id: string;
  name: string;
  avatar_url?: string | null;
  online_at: string;
}

export interface BrainstormTemplate {
  id: string;
  title: string;
  desc: string;
  badge: string;
  columns: { id: string; title: string; color: string; description: string }[];
}

// ─── Templates Oficiais ────────────────────────────────────────────────────────

export const BRAINSTORM_TEMPLATES: BrainstormTemplate[] = [
  {
    id: "swot",
    title: "Matriz SWOT (FOFA)",
    desc: "Mapeie Forças internas, Fraquezas a corrigir, Oportunidades de crescimento e Ameaças externas.",
    badge: "Estratégia",
    columns: [
      { id: "strengths", title: "💪 Forças (Strengths)", color: "emerald", description: "Vantagens competitivas e diferenciais internos" },
      { id: "weaknesses", title: "⚠️ Fraquezas (Weaknesses)", color: "amber", description: "Pontos fracos e gargalos operacionais" },
      { id: "opportunities", title: "🚀 Oportunidades (Opportunities)", color: "sky", description: "Cenários favoráveis e novas frentes de mercado" },
      { id: "threats", title: "🛡️ Ameaças (Threats)", color: "rose", description: "Riscos externos e concorrentes" },
    ],
  },
  {
    id: "design_sprint",
    title: "Design Sprint (5 Fases)",
    desc: "Framework comprovado da Google Ventures para resolver problemas e testar ideias em 5 etapas.",
    badge: "Inovação",
    columns: [
      { id: "understand", title: "1. 🔍 Compreender", color: "purple", description: "Mapear o desafio e definir o foco prioritário" },
      { id: "sketch", title: "2. ✏️ Divergir / Esboçar", color: "sky", description: "Geração livre de caminhos e ideias" },
      { id: "decide", title: "3. 🗳️ Decidir", color: "amber", description: "Votação e seleção das ideias mais viáveis" },
      { id: "prototype", title: "4. 🛠️ Prototipar", color: "indigo", description: "Como tangibilizar a solução rapidamente" },
      { id: "test", title: "5. 🧪 Testar & Validar", color: "emerald", description: "Critérios de aceitação e feedback de usuários" },
    ],
  },
  {
    id: "brainwriting",
    title: "Brainwriting 6-3-5",
    desc: "Geração silenciosa e sequencial de ideias em equipe para garantir máxima participação de todos.",
    badge: "Ideação em Grupo",
    columns: [
      { id: "round1", title: "💡 Rodada 1: Ideias Iniciais", color: "sky", description: "Propostas primárias trazidas pelos participantes" },
      { id: "round2", title: "🔄 Rodada 2: Desdobramentos", color: "purple", description: "Construir e expandir em cima das ideias anteriores" },
      { id: "round3", title: "🎯 Rodada 3: Refinamentos", color: "emerald", description: "Soluções finais polidas e prontas para ação" },
    ],
  },
  {
    id: "lean_5w2h",
    title: "Lean Problem Solving (5W2H)",
    desc: "Investigação aprofundada de causas raiz e elaboração de planos de teste e ação sem rodeios.",
    badge: "Qualidade & Processos",
    columns: [
      { id: "what_why", title: "❓ O que & Por que?", color: "amber", description: "Definição objetiva da dor e impacto gerado" },
      { id: "who_where", title: "👥 Quem & Onde?", color: "sky", description: "Público impactado e setor/local de ocorrência" },
      { id: "how_much", title: "⚙️ Como & Custos", color: "purple", description: "Recursos, esforço estimado e requisitos" },
      { id: "action_plan", title: "✅ Plano de Teste & Execução", color: "emerald", description: "Próximos passos imediatos com responsáveis" },
    ],
  },
  {
    id: "scamper",
    title: "SCAMPER (Criatividade Radical)",
    desc: "Perguntas estimulantes para reinventar produtos, ofertas ou processos existentes.",
    badge: "Criatividade",
    columns: [
      { id: "sub_comb", title: "🔀 Substituir & Combinar", color: "sky", description: "O que podemos trocar ou juntar?" },
      { id: "adapt_mod", title: "📐 Adaptar & Modificar", color: "purple", description: "O que pode ser aumentado ou ajustado?" },
      { id: "put_other", title: "🌐 Propor Novos Usos", color: "amber", description: "Quem mais pode se beneficiar desta solução?" },
      { id: "elim_reorg", title: "⚡ Eliminar & Reorganizar", color: "rose", description: "O que podemos simplificar ou inverter?" },
    ],
  },
  {
    id: "freeform",
    title: "Post-its Ágeis / Quadro Livre",
    desc: "Quadro flexível de ideação com post-its para reuniões dinâmicas, dinâmicas de time e retrospectivas.",
    badge: "Flexível",
    columns: [
      { id: "ideas", title: "💡 Caixa de Ideias", color: "amber", description: "Todas as ideias sem nenhum julgamento prévio" },
      { id: "discussing", title: "💬 Em Discussão", color: "sky", description: "Ideias sendo avaliadas pelo time na meet" },
      { id: "approved", title: "⭐ Selecionadas", color: "emerald", description: "Consenso da equipe para colocar em prática" },
      { id: "actions", title: "🚀 Plano de Execução", color: "purple", description: "Ações concretas a serem desdobradas em tarefas" },
    ],
  },
];

export const STICKY_COLORS = {
  yellow: {
    bg: "bg-amber-100/90 dark:bg-amber-950/40",
    border: "border-amber-300 dark:border-amber-700/60",
    text: "text-amber-950 dark:text-amber-100",
    accent: "bg-amber-400",
    label: "Amarelo",
  },
  blue: {
    bg: "bg-sky-100/90 dark:bg-sky-950/40",
    border: "border-sky-300 dark:border-sky-700/60",
    text: "text-sky-950 dark:text-sky-100",
    accent: "bg-sky-400",
    label: "Azul",
  },
  green: {
    bg: "bg-emerald-100/90 dark:bg-emerald-950/40",
    border: "border-emerald-300 dark:border-emerald-700/60",
    text: "text-emerald-950 dark:text-emerald-100",
    accent: "bg-emerald-400",
    label: "Verde",
  },
  pink: {
    bg: "bg-pink-100/90 dark:bg-pink-950/40",
    border: "border-pink-300 dark:border-pink-700/60",
    text: "text-pink-950 dark:text-pink-100",
    accent: "bg-pink-400",
    label: "Rosa",
  },
  purple: {
    bg: "bg-purple-100/90 dark:bg-purple-950/40",
    border: "border-purple-300 dark:border-purple-700/60",
    text: "text-purple-950 dark:text-purple-100",
    accent: "bg-purple-400",
    label: "Roxo",
  },
  orange: {
    bg: "bg-orange-100/90 dark:bg-orange-950/40",
    border: "border-orange-300 dark:border-orange-700/60",
    text: "text-orange-950 dark:text-orange-100",
    accent: "bg-orange-400",
    label: "Laranja",
  },
};

// ─── Componente Principal ─────────────────────────────────────────────────────

function BrainstormingPage() {
  const { user, profile } = useAuth();
  const { isAdmin, isGestor } = useRole();

  // Estado das Sessões
  const [sessions, setSessions] = useState<BrainstormSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [activeSession, setActiveSession] = useState<BrainstormSession | null>(null);

  // Filtros de listagem
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string | null>(null);

  // Modais de Criação & Edição
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newTemplateId, setNewTemplateId] = useState<string>("swot");
  const [newMeetUrl, setNewMeetUrl] = useState("");
  const [savingSession, setSavingSession] = useState(false);

  // Modal de IA (Geração de Ideias)
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTargetColumn, setAiTargetColumn] = useState<string>("all");
  const [generatingAI, setGeneratingAI] = useState(false);

  // Modal de Adicionar/Editar Ideia (Post-it)
  const [ideaDialogOpen, setIdeaDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<BrainstormIdea | null>(null);
  const [ideaColumnId, setIdeaColumnId] = useState<string>("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDesc, setIdeaDesc] = useState("");
  const [ideaColor, setIdeaColor] = useState<BrainstormIdea["color"]>("yellow");

  // Colaboração ao Vivo & Realtime
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [isConnectedRealtime, setIsConnectedRealtime] = useState(false);
  const realtimeChannelRef = useRef<any>(null);

  // Meet ao Vivo (Janela Embutida / PiP)
  const [showEmbeddedMeet, setShowEmbeddedMeet] = useState(false);
  const [meetLinkDialogOpen, setMeetLinkDialogOpen] = useState(false);
  const [tempMeetUrl, setTempMeetUrl] = useState("");

  // Timer de Ideação (Cronômetro Sprint)
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 min padrão
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  // Salvar debounce no Supabase
  const saveTimeoutRef = useRef<any>(null);

  // ── Carregar Sessões do Supabase ──────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from("brainstorming_sessions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar sessões:", error);
        toast.error("Não foi possível carregar as sessões de brainstorming.");
      } else {
        setSessions((data as any) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  // ── Conexão Realtime com a Sessão Ativa ───────────────────────────────────────
  useEffect(() => {
    if (!activeSession || !user) {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      setIsConnectedRealtime(false);
      setPresenceUsers([]);
      return;
    }

    const roomId = `brainstorm_room_${activeSession.id}`;
    const channel = supabase.channel(roomId, {
      config: {
        presence: { key: user.id },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const usersList: PresenceUser[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id) {
              usersList.push({
                user_id: p.user_id,
                name: p.name || "Colaborador",
                avatar_url: p.avatar_url,
                online_at: p.online_at || new Date().toISOString(),
              });
            }
          });
        });
        setPresenceUsers(usersList);
      })
      .on("broadcast", { event: "board_update" }, ({ payload }) => {
        if (payload.sender !== user.id && payload.session_id === activeSession.id) {
          setActiveSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              data: payload.data,
              updated_at: new Date().toISOString(),
            };
          });
        }
      })
      .on("broadcast", { event: "meet_update" }, ({ payload }) => {
        if (payload.session_id === activeSession.id) {
          setActiveSession((prev) => (prev ? { ...prev, meet_url: payload.meet_url } : prev));
          toast.info("Link da Meet ao vivo atualizado pelos participantes.");
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnectedRealtime(true);
          await channel.track({
            user_id: user.id,
            name: profile?.full_name || user.email?.split("@")[0] || "Usuário",
            avatar_url: profile?.avatar_url,
            online_at: new Date().toISOString(),
          });
        } else {
          setIsConnectedRealtime(false);
        }
      });

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
      setIsConnectedRealtime(false);
    };
  }, [activeSession?.id, user, profile]);

  // ── Timer de Ideação ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            toast.success("⏰ Tempo de ideação encerrado! Hora de compartilhar e votar.", {
              duration: 6000,
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ── Salvar Alterações da Sessão (com debounce) ─────────────────────────────────
  const persistSessionData = useCallback(
    (nextData: BrainstormSessionData) => {
      if (!activeSession) return;

      // Atualiza estado local imediatamente
      setActiveSession((prev) => (prev ? { ...prev, data: nextData } : prev));

      // Emite broadcast para sincronização instantânea com a equipe
      if (realtimeChannelRef.current && isConnectedRealtime) {
        realtimeChannelRef.current.send({
          type: "broadcast",
          event: "board_update",
          payload: {
            session_id: activeSession.id,
            data: nextData,
            sender: user?.id,
          },
        });
      }

      // Salva no banco de dados com debounce
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await supabase
            .from("brainstorming_sessions")
            .update({
              data: nextData as any,
              updated_at: new Date().toISOString(),
            })
            .eq("id", activeSession.id);
        } catch (e) {
          console.error("Falha ao salvar sessão no Supabase:", e);
        }
      }, 400);
    },
    [activeSession, isConnectedRealtime, user?.id]
  );

  // ── Criar Nova Sessão ─────────────────────────────────────────────────────────
  const handleCreateSession = async () => {
    if (!newTitle.trim()) {
      toast.error("Informe um título para a sessão.");
      return;
    }

    if (!user) {
      toast.error("Você precisa estar autenticado.");
      return;
    }

    setSavingSession(true);
    try {
      const template = BRAINSTORM_TEMPLATES.find((t) => t.id === newTemplateId) || BRAINSTORM_TEMPLATES[0];

      const initialData: BrainstormSessionData = {
        columns: template.columns.map((c) => ({
          id: c.id,
          title: c.title,
          color: c.color,
          description: c.description,
        })),
        ideas: [],
      };

      const parsedTags = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const meetToSave = newMeetUrl.trim() || `https://meet.jit.si/exacta-brainstorm-${Math.random().toString(36).slice(2, 10)}`;

      const { data, error } = await supabase
        .from("brainstorming_sessions")
        .insert({
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          tags: parsedTags.length > 0 ? parsedTags : [template.badge],
          template: template.id,
          meet_url: meetToSave,
          data: initialData as any,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        toast.error("Erro ao criar sessão", { description: error.message });
      } else if (data) {
        toast.success("Sessão criada com sucesso!", {
          description: `Template: ${template.title} · Meet ao vivo configurada.`,
        });
        const created = data as any;
        setSessions((prev) => [created, ...prev]);
        setActiveSession(created);
        setCreateDialogOpen(false);
        setNewTitle("");
        setNewDesc("");
        setNewTags("");
        setNewMeetUrl("");
      }
    } catch (e: any) {
      toast.error("Falha ao criar sessão", { description: e?.message });
    } finally {
      setSavingSession(false);
    }
  };

  // ── Excluir Sessão ────────────────────────────────────────────────────────────
  const handleDeleteSession = async (sessionToDelete: BrainstormSession, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const canDelete = isAdmin || isGestor || sessionToDelete.created_by === user?.id;
    if (!canDelete) {
      toast.error("Permissão negada. Apenas gestores ou o criador podem excluir a sessão.");
      return;
    }

    if (!confirm(`Deseja realmente excluir a sessão "${sessionToDelete.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("brainstorming_sessions").delete().eq("id", sessionToDelete.id);
      if (error) {
        toast.error("Erro ao excluir", { description: error.message });
      } else {
        toast.success("Sessão excluída com sucesso.");
        setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
        if (activeSession?.id === sessionToDelete.id) {
          setActiveSession(null);
        }
      }
    } catch (err: any) {
      toast.error("Falha ao excluir", { description: err?.message });
    }
  };

  // ── Adicionar ou Editar Ideia (Post-it) ─────────────────────────────────────────
  const handleOpenAddIdea = (colId: string) => {
    setEditingIdea(null);
    setIdeaColumnId(colId);
    setIdeaTitle("");
    setIdeaDesc("");
    setIdeaColor("yellow");
    setIdeaDialogOpen(true);
  };

  const handleOpenEditIdea = (idea: BrainstormIdea) => {
    setEditingIdea(idea);
    setIdeaColumnId(idea.columnId);
    setIdeaTitle(idea.title);
    setIdeaDesc(idea.description || "");
    setIdeaColor(idea.color);
    setIdeaDialogOpen(true);
  };

  const handleSaveIdea = () => {
    if (!activeSession || !user) return;
    if (!ideaTitle.trim()) {
      toast.error("Informe a ideia ou sugestão.");
      return;
    }

    const currentData = activeSession.data || { columns: [], ideas: [] };
    let nextIdeas = [...(currentData.ideas || [])];

    if (editingIdea) {
      nextIdeas = nextIdeas.map((i) =>
        i.id === editingIdea.id
          ? {
              ...i,
              title: ideaTitle.trim(),
              description: ideaDesc.trim() || undefined,
              color: ideaColor,
              columnId: ideaColumnId || i.columnId,
            }
          : i
      );
      toast.success("Post-it atualizado.");
    } else {
      const newIdea: BrainstormIdea = {
        id: `idea_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        columnId: ideaColumnId,
        title: ideaTitle.trim(),
        description: ideaDesc.trim() || undefined,
        authorId: user.id,
        authorName: profile?.full_name || user.email?.split("@")[0] || "Colaborador",
        authorAvatar: profile?.avatar_url,
        color: ideaColor,
        votes: [],
        createdAt: new Date().toISOString(),
      };
      nextIdeas.push(newIdea);
      toast.success("Ideia adicionada ao quadro!");
    }

    persistSessionData({ ...currentData, ideas: nextIdeas });
    setIdeaDialogOpen(false);
  };

  // ── Excluir Ideia ─────────────────────────────────────────────────────────────
  const handleDeleteIdea = (ideaId: string) => {
    if (!activeSession) return;
    const currentData = activeSession.data || { columns: [], ideas: [] };
    const nextIdeas = (currentData.ideas || []).filter((i) => i.id !== ideaId);
    persistSessionData({ ...currentData, ideas: nextIdeas });
    toast.info("Post-it removido.");
  };

  // ── Votar / Curtir Ideia ──────────────────────────────────────────────────────
  const handleToggleVote = (ideaId: string) => {
    if (!activeSession || !user) return;
    const currentData = activeSession.data || { columns: [], ideas: [] };
    const nextIdeas = (currentData.ideas || []).map((idea) => {
      if (idea.id !== ideaId) return idea;
      const hasVoted = idea.votes?.includes(user.id);
      const newVotes = hasVoted ? idea.votes.filter((id) => id !== user.id) : [...(idea.votes || []), user.id];
      return { ...idea, votes: newVotes };
    });

    persistSessionData({ ...currentData, ideas: nextIdeas });
  };

  // ── Mover Ideia entre Colunas ──────────────────────────────────────────────────
  const handleMoveIdea = (ideaId: string, targetColId: string) => {
    if (!activeSession) return;
    const currentData = activeSession.data || { columns: [], ideas: [] };
    const nextIdeas = (currentData.ideas || []).map((i) => (i.id === ideaId ? { ...i, columnId: targetColId } : i));
    persistSessionData({ ...currentData, ideas: nextIdeas });
  };

  // ── Gerar Ideias com IA ───────────────────────────────────────────────────────
  const handleGenerateIdeasWithAI = async () => {
    if (!activeSession || !user) return;
    if (!aiTopic.trim()) {
      toast.error("Informe o desafio ou pergunta para a IA.");
      return;
    }

    setGeneratingAI(true);
    try {
      const templateId = activeSession.template || "freeform";
      const template = BRAINSTORM_TEMPLATES.find((t) => t.id === templateId) || BRAINSTORM_TEMPLATES[0];
      const currentCols = activeSession.data?.columns || template.columns;

      const colsPrompt = currentCols.map((c) => `- ID "${c.id}": ${c.title} (${c.description || ""})`).join("\n");

      const prompt = `
Você é um consultor líder de inovação, estratégia e facilitação de Design Sprints.
Com base no desafio fornecido pela equipe: "${aiTopic.trim()}"
Template da Sessão: "${template.title}"

Colunas disponíveis no quadro:
${colsPrompt}

Gere de 4 a 6 ideias criativas, práticas, inovadoras e acionáveis.
Para cada ideia, distribua na coluna mais adequada do quadro ${
        aiTargetColumn !== "all" ? `(ou prioritariamente na coluna de ID "${aiTargetColumn}")` : ""
      }.

Retorne EXCLUSIVAMENTE um array JSON válido (sem tags markdown de código, sem blocos de texto explicativos adicionais) com a seguinte estrutura:
[
  {
    "columnId": "id_da_coluna_correspondente",
    "title": "Título conciso da ideia",
    "description": "Explicação prática e impacto esperado da ideia em 1 ou 2 frases.",
    "color": "yellow"
  }
]
Cores aceitas: "yellow", "blue", "green", "pink", "purple", "orange".
`;

      const responseText = await askAI(prompt, "brainstorming_ideas");
      const cleanJson = responseText.replace(/```json\s*|```/g, "").trim();
      const generatedList = JSON.parse(cleanJson);

      if (!Array.isArray(generatedList) || generatedList.length === 0) {
        throw new Error("A IA não retornou ideias no formato esperado.");
      }

      const validColIds = new Set(currentCols.map((c) => c.id));
      const fallbackColId = currentCols[0]?.id || "ideas";

      const newIdeas: BrainstormIdea[] = generatedList.map((item: any, idx: number) => ({
        id: `ai_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        columnId: validColIds.has(item.columnId) ? item.columnId : fallbackColId,
        title: String(item.title || "Ideia IA"),
        description: item.description ? String(item.description) : undefined,
        authorId: user.id,
        authorName: "Nexus AI Copilot",
        authorAvatar: null,
        color: (["yellow", "blue", "green", "pink", "purple", "orange"].includes(item.color)
          ? item.color
          : "purple") as any,
        votes: [],
        createdAt: new Date().toISOString(),
      }));

      const currentData = activeSession.data || { columns: currentCols, ideas: [] };
      const nextIdeas = [...(currentData.ideas || []), ...newIdeas];

      persistSessionData({ ...currentData, ideas: nextIdeas });
      toast.success(`${newIdeas.length} ideias geradas pela IA e adicionadas ao quadro!`);
      setAiDialogOpen(false);
      setAiTopic("");
    } catch (e: any) {
      console.error(e);
      toast.error("Falha ao gerar ideias com IA", {
        description: e?.message || "Tente refinar sua pergunta ou tente novamente.",
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  // ── Salvar Link da Meet ───────────────────────────────────────────────────────
  const handleSaveMeetUrl = async () => {
    if (!activeSession) return;
    const finalUrl = tempMeetUrl.trim();
    try {
      const { error } = await supabase
        .from("brainstorming_sessions")
        .update({ meet_url: finalUrl || null, updated_at: new Date().toISOString() })
        .eq("id", activeSession.id);

      if (error) {
        toast.error("Erro ao salvar link da meet", { description: error.message });
      } else {
        setActiveSession((prev) => (prev ? { ...prev, meet_url: finalUrl || null } : prev));
        toast.success("Link da Meet atualizado com sucesso!");
        if (realtimeChannelRef.current && isConnectedRealtime) {
          realtimeChannelRef.current.send({
            type: "broadcast",
            event: "meet_update",
            payload: { session_id: activeSession.id, meet_url: finalUrl },
          });
        }
        setMeetLinkDialogOpen(false);
      }
    } catch (e: any) {
      toast.error("Falha ao atualizar meet", { description: e?.message });
    }
  };

  // ── Filtragem de Sessões ──────────────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        !searchTerm.trim() ||
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTag = !selectedTag || (s.tags && s.tags.includes(selectedTag));
      const matchesTpl = !selectedTemplateFilter || s.template === selectedTemplateFilter;

      return matchesSearch && matchesTag && matchesTpl;
    });
  }, [sessions, searchTerm, selectedTag, selectedTemplateFilter]);

  const allAvailableTags = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      (s.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [sessions]);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDERIZAÇÃO: MODO QUADRO / SESSÃO ATIVA
  // ══════════════════════════════════════════════════════════════════════════════
  if (activeSession) {
    const templateInfo =
      BRAINSTORM_TEMPLATES.find((t) => t.id === activeSession.template) || BRAINSTORM_TEMPLATES[0];

    const currentColumns = activeSession.data?.columns || templateInfo.columns;
    const currentIdeas = activeSession.data?.ideas || [];

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {/* Header da Sessão */}
        <header className="border-b border-border/70 bg-card/60 backdrop-blur-md px-4 py-3 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Título & Info */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSession(null)}
                className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> Todas as Sessões
              </Button>

              <div className="h-4 w-px bg-border/60" />

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-foreground truncate max-w-md">
                    {activeSession.title}
                  </h1>
                  <Badge variant="outline" className="text-[11px] font-normal bg-primary/10 text-primary border-primary/20">
                    {templateInfo.title}
                  </Badge>
                  {isConnectedRealtime ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Ao Vivo
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <RefreshCw className="size-3 animate-spin" /> Conectando...
                    </span>
                  )}
                </div>
                {activeSession.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-xl mt-0.5">
                    {activeSession.description}
                  </p>
                )}
              </div>
            </div>

            {/* Barra de Ações: Presença, Timer, Meet e IA */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Presença da Equipe */}
              <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-lg border border-border/50 text-xs">
                <Users className="size-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium">
                  {presenceUsers.length || 1} online:
                </span>
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {presenceUsers.map((p, idx) => (
                    <Avatar key={`${p.user_id}-${idx}`} className="size-6 border-2 border-background ring-1 ring-emerald-500/50">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">
                        {p.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>

              {/* Timer de Ideação */}
              <div className="flex items-center gap-1 bg-muted/40 px-2.5 py-1 rounded-lg border border-border/50 text-xs font-mono">
                <Timer className="size-3.5 text-primary" />
                <span className={cn("text-xs font-semibold tracking-wider", timerSeconds <= 30 && timerRunning ? "text-destructive animate-pulse" : "text-foreground")}>
                  {formatTimer(timerSeconds)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 ml-0.5"
                  onClick={() => setTimerRunning(!timerRunning)}
                  title={timerRunning ? "Pausar cronômetro" : "Iniciar cronômetro"}
                >
                  {timerRunning ? <Pause className="size-3 text-amber-500" /> : <Play className="size-3 text-emerald-500" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-6" title="Ajustar tempo">
                      <RotateCcw className="size-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    <DropdownMenuItem onClick={() => { setTimerSeconds(180); setTimerRunning(false); }}>
                      Sprint Rápido (3 minutos)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setTimerSeconds(300); setTimerRunning(false); }}>
                      Padrão (5 minutos)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setTimerSeconds(600); setTimerRunning(false); }}>
                      Aprofundado (10 minutos)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setTimerSeconds(900); setTimerRunning(false); }}>
                      Completo (15 minutos)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Meet ao Vivo (Vídeo / Google Meet / Jitsi) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant={activeSession.meet_url ? "default" : "outline"}
                    className={cn(
                      "h-8 text-xs gap-1.5 shadow-sm",
                      activeSession.meet_url
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    <Video className="size-3.5" />
                    <span>Meet ao Vivo</span>
                    {activeSession.meet_url && (
                      <span className="size-1.5 rounded-full bg-white animate-ping ml-0.5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 text-xs">
                  {activeSession.meet_url ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => setShowEmbeddedMeet(!showEmbeddedMeet)}
                        className="gap-2 cursor-pointer font-medium"
                      >
                        {showEmbeddedMeet ? <VideoOff className="size-3.5 text-destructive" /> : <Maximize2 className="size-3.5 text-primary" />}
                        {showEmbeddedMeet ? "Ocultar Vídeo na Tela" : "Abrir Vídeo na Tela (PiP)"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open(activeSession.meet_url!, "_blank")}
                        className="gap-2 cursor-pointer"
                      >
                        <ExternalLink className="size-3.5 text-muted-foreground" />
                        Abrir em Nova Aba
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          void navigator.clipboard.writeText(activeSession.meet_url!);
                          toast.success("Link da Meet copiado para a área de transferência!");
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Copy className="size-3.5 text-muted-foreground" />
                        Copiar Link da Reunião
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setTempMeetUrl(activeSession.meet_url || "");
                          setMeetLinkDialogOpen(true);
                        }}
                        className="gap-2 cursor-pointer text-muted-foreground"
                      >
                        <Share2 className="size-3.5" />
                        Alterar Link da Meet
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          const autoMeet = `https://meet.jit.si/exacta-brainstorm-${activeSession.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`;
                          setTempMeetUrl(autoMeet);
                          setMeetLinkDialogOpen(true);
                        }}
                        className="gap-2 cursor-pointer font-medium text-emerald-600"
                      >
                        <Video className="size-3.5" />
                        Gerar Sala Automática Grátis
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setTempMeetUrl("");
                          setMeetLinkDialogOpen(true);
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Share2 className="size-3.5 text-muted-foreground" />
                        Inserir Google Meet / Teams
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botão de Ideação com IA */}
              <Button
                size="sm"
                onClick={() => {
                  setAiTopic(activeSession.title);
                  setAiTargetColumn("all");
                  setAiDialogOpen(true);
                }}
                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95 shadow-sm"
              >
                <Sparkles className="size-3.5" /> Ideias com IA
              </Button>
            </div>
          </div>
        </header>

        {/* Área Principal do Quadro & Painel de Vídeo (Meet) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Colunas do Board */}
          <div className="flex-1 overflow-x-auto p-4 md:p-6 bg-muted/10">
            <div className="flex items-start gap-4 min-w-max h-full pb-6">
              {currentColumns.map((col) => {
                const columnIdeas = currentIdeas.filter((i) => i.columnId === col.id);

                return (
                  <div
                    key={col.id}
                    className="w-80 md:w-88 flex flex-col max-h-full rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-sm overflow-hidden"
                  >
                    {/* Header da Coluna */}
                    <div className="p-3.5 border-b border-border/60 bg-muted/30 shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground">{col.title}</h3>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold">
                            {columnIdeas.length}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenAddIdea(col.id)}
                          className="h-7 px-2 text-xs gap-1 hover:bg-primary/10 hover:text-primary"
                        >
                          <Plus className="size-3.5" /> Ideia
                        </Button>
                      </div>
                      {col.description && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {col.description}
                        </p>
                      )}
                    </div>

                    {/* Lista de Post-its da Coluna */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {columnIdeas.length === 0 ? (
                        <div
                          onClick={() => handleOpenAddIdea(col.id)}
                          className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center text-muted-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                        >
                          <Plus className="size-6 mx-auto mb-1 opacity-40" />
                          <p className="text-xs font-medium">Nenhum post-it nesta coluna</p>
                          <p className="text-[10px] opacity-70 mt-0.5">Clique para adicionar uma ideia</p>
                        </div>
                      ) : (
                        columnIdeas.map((idea) => {
                          const style = STICKY_COLORS[idea.color] || STICKY_COLORS.yellow;
                          const hasVoted = user && idea.votes?.includes(user.id);

                          return (
                            <div
                              key={idea.id}
                              className={cn(
                                "group relative rounded-xl p-3.5 border transition-all duration-200 shadow-sm hover:shadow-md",
                                style.bg,
                                style.border
                              )}
                            >
                              {/* Barra superior do Post-it */}
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h4 className={cn("text-xs font-bold leading-snug break-words flex-1", style.text)}>
                                  {idea.title}
                                </h4>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground transition"
                                    >
                                      <MoreHorizontal className="size-3.5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="text-xs w-44">
                                    <DropdownMenuItem onClick={() => handleOpenEditIdea(idea)} className="gap-2">
                                      <Edit3 className="size-3.5 text-muted-foreground" /> Editar Conteúdo
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                                      Mover para coluna:
                                    </div>
                                    {currentColumns
                                      .filter((c) => c.id !== col.id)
                                      .map((target) => (
                                        <DropdownMenuItem
                                          key={target.id}
                                          onClick={() => handleMoveIdea(idea.id, target.id)}
                                          className="text-xs truncate"
                                        >
                                          {target.title}
                                        </DropdownMenuItem>
                                      ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteIdea(idea.id)}
                                      className="gap-2 text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="size-3.5" /> Excluir Post-it
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Descrição do Post-it */}
                              {idea.description && (
                                <p className={cn("text-[11px] leading-relaxed mb-3 whitespace-pre-wrap break-words opacity-90", style.text)}>
                                  {idea.description}
                                </p>
                              )}

                              {/* Rodapé: Autor & Votação */}
                              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-[10px]">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Avatar className="size-4">
                                    <AvatarImage src={idea.authorAvatar || undefined} />
                                    <AvatarFallback className="text-[8px] font-bold">
                                      {idea.authorName.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate max-w-[100px]">{idea.authorName}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleToggleVote(idea.id)}
                                  className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all text-[10px] font-medium",
                                    hasVoted
                                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                      : "bg-background/80 hover:bg-background text-muted-foreground border-border/60"
                                  )}
                                  title={hasVoted ? "Remover voto" : "Votar nesta ideia"}
                                >
                                  <ThumbsUp className="size-3" />
                                  <span>{idea.votes?.length || 0}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Painel de Vídeo Embutido (Meet PiP / Sidecar) */}
          {showEmbeddedMeet && activeSession.meet_url && (
            <aside className="w-full md:w-96 border-l border-border/80 bg-background flex flex-col shrink-0 shadow-2xl z-20 animate-in slide-in-from-right-6 duration-300">
              <div className="p-3 border-b border-border/60 flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-foreground">Meet ao Vivo da Equipe</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => window.open(activeSession.meet_url!, "_blank")}
                    title="Abrir em tela cheia / nova aba"
                  >
                    <ExternalLink className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setShowEmbeddedMeet(false)}
                    title="Fechar painel"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 bg-black relative">
                <iframe
                  src={activeSession.meet_url}
                  allow="camera; microphone; display-capture; autoplay; clipboard-write"
                  className="w-full h-full border-0"
                  title="Reunião ao Vivo da Sessão de Brainstorming"
                />
              </div>

              <div className="p-2.5 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Colaborando em tempo real</span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(activeSession.meet_url!);
                    toast.success("Link copiado!");
                  }}
                  className="text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <Copy className="size-3" /> Copiar Link
                </button>
              </div>
            </aside>
          )}
        </div>

        {/* Modal de Adicionar/Editar Post-it */}
        <Dialog open={ideaDialogOpen} onOpenChange={setIdeaDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{editingIdea ? "Editar Post-it" : "Nova Ideia para o Quadro"}</DialogTitle>
              <DialogDescription>
                Compartilhe sua contribuição para a sessão. Todos os membros verão instantaneamente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Coluna de Destino</label>
                <select
                  value={ideaColumnId}
                  onChange={(e) => setIdeaColumnId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {currentColumns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Título ou Ideia Principal *</label>
                <Input
                  placeholder="ex: Programa de indicações com recompensas instantâneas"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Detalhes ou Justificativa (Opcional)</label>
                <Textarea
                  placeholder="Explique como funcionaria, ganhos esperados ou pontos de atenção..."
                  value={ideaDesc}
                  onChange={(e) => setIdeaDesc(e.target.value)}
                  className="text-xs min-h-[90px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Cor do Post-it</label>
                <div className="flex items-center gap-2">
                  {(Object.keys(STICKY_COLORS) as (keyof typeof STICKY_COLORS)[]).map((colKey) => {
                    const c = STICKY_COLORS[colKey];
                    const isSelected = ideaColor === colKey;
                    return (
                      <button
                        key={colKey}
                        type="button"
                        onClick={() => setIdeaColor(colKey)}
                        className={cn(
                          "size-7 rounded-full transition-all border-2",
                          c.accent,
                          isSelected ? "border-foreground ring-2 ring-primary/40 scale-110" : "border-transparent opacity-80 hover:opacity-100"
                        )}
                        title={c.label}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIdeaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveIdea}>
                {editingIdea ? "Salvar Alterações" : "Colocar no Quadro"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Gerar Ideias com IA */}
        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <DialogTitle>Gerador de Ideias com IA</DialogTitle>
                  <DialogDescription>
                    Nossa IA analisa o framework da sessão e gera ideias estruturadas para acelerar seu brainstorming.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Qual é o objetivo, dor ou desafio a ser explorado? *</label>
                <Textarea
                  placeholder="ex: Como reduzir a taxa de churn em 25% no primeiro trimestre mantendo o custo de aquisição estável?"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="text-xs min-h-[90px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Distribuir em qual coluna?</label>
                <select
                  value={aiTargetColumn}
                  onChange={(e) => setAiTargetColumn(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="all">Distribuir automaticamente em todas as colunas do template</option>
                  {currentColumns.map((c) => (
                    <option key={c.id} value={c.id}>
                      Apenas na coluna: {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setAiDialogOpen(false)} disabled={generatingAI}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleGenerateIdeasWithAI}
                disabled={generatingAI || !aiTopic.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                {generatingAI ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Gerando Ideias...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" /> Gerar Post-its com IA
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Configurar Link da Meet */}
        <Dialog open={meetLinkDialogOpen} onOpenChange={setMeetLinkDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="size-5 text-emerald-500" />
                Configurar Sala de Vídeo (Meet)
              </DialogTitle>
              <DialogDescription>
                Conecte uma sala de reunião para que os participantes conversem por áudio e vídeo enquanto colaboram no quadro.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Link da Reunião (Jitsi, Google Meet, Teams, Zoom)</label>
                <Input
                  placeholder="https://meet.google.com/abc-defg-hij ou https://meet.jit.si/..."
                  value={tempMeetUrl}
                  onChange={(e) => setTempMeetUrl(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-2 text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> Sala Instantânea Gratuita (Jitsi Meet)
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Não tem link do Google Meet? O Nexus pode gerar uma sala exclusiva e gratuita do Jitsi Meet em 1 clique que funciona diretamente embutida no quadro.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  onClick={() => {
                    const autoUrl = `https://meet.jit.si/exacta-brainstorm-${activeSession.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`;
                    setTempMeetUrl(autoUrl);
                  }}
                >
                  Usar Sala Automática Jitsi
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setMeetLinkDialogOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveMeetUrl}>
                Salvar Link da Reunião
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDERIZAÇÃO: LISTAGEM DE SESSÕES & SELEÇÃO DE TEMPLATES
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Brain className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Brainstorming & Ideação</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Crie sessões colaborativas com templates comprovados (SWOT, Design Sprint, 5W2H) e reuniões ao vivo integradas.
          </p>
        </div>

        <Button
          onClick={() => {
            setNewTitle("");
            setNewDesc("");
            setNewTags("");
            setNewTemplateId("swot");
            setNewMeetUrl("");
            setCreateDialogOpen(true);
          }}
          className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90 gap-1.5"
        >
          <Plus className="h-4 w-4" /> Nova Sessão
        </Button>
      </div>

      {/* Cards de Acesso Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: IA */}
        <Card className="bg-gradient-to-br from-purple-500/10 via-card to-transparent border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="size-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">Brainstorming com IA</CardTitle>
            <CardDescription className="text-xs">
              Expanda suas ideias em segundos com geração estruturada de propostas e contrapropostas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewTitle("Sessão Exploratória com IA");
                setNewTemplateId("freeform");
                setCreateDialogOpen(true);
              }}
              className="w-full text-xs border-purple-500/30 hover:bg-purple-500/10"
            >
              Iniciar Sessão com IA
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Modelos & Frameworks */}
        <Card className="bg-gradient-to-br from-primary/10 via-card to-transparent border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="size-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-2 shadow-sm">
              <Target className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">Modelos & Frameworks</CardTitle>
            <CardDescription className="text-xs">
              Matriz SWOT, Google Design Sprint, Brainwriting 6-3-5, 5W2H e SCAMPER prontos para usar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCreateDialogOpen(true);
              }}
              className="w-full text-xs border-primary/30 hover:bg-primary/10"
            >
              Ver e Escolher Template
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Colaboração & Meets */}
        <Card className="bg-gradient-to-br from-emerald-500/10 via-card to-transparent border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-sm">
              <Video className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">Colaboração & Meets</CardTitle>
            <CardDescription className="text-xs">
              Reuniões ao vivo com vídeo embutido, post-its sincronizados em tempo real e votação de ideias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewTitle("Reunião de Ideação da Equipe");
                setNewTemplateId("design_sprint");
                setCreateDialogOpen(true);
              }}
              className="w-full text-xs border-emerald-500/30 hover:bg-emerald-500/10"
            >
              Criar Reunião ao Vivo
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">Sessões da Equipe ({filteredSessions.length})</h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Layers className="size-3.5 text-muted-foreground" />
                  <span>{selectedTemplateFilter ? BRAINSTORM_TEMPLATES.find((t) => t.id === selectedTemplateFilter)?.title : "Todos os Modelos"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs w-56">
                <DropdownMenuItem onClick={() => setSelectedTemplateFilter(null)}>
                  Todos os Modelos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {BRAINSTORM_TEMPLATES.map((tpl) => (
                  <DropdownMenuItem key={tpl.id} onClick={() => setSelectedTemplateFilter(tpl.id)}>
                    {tpl.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedTag && (
              <Badge
                variant="secondary"
                className="h-8 px-2 text-xs gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setSelectedTag(null)}
              >
                Tag: {selectedTag} <X className="size-3" />
              </Badge>
            )}
          </div>
        </div>

        {/* Tags Populares */}
        {allAvailableTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground text-[11px] font-medium mr-1">Filtrar por tag:</span>
            {allAvailableTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                className={cn(
                  "text-[11px] px-2.5 py-0.5 rounded-full border transition",
                  selectedTag === t
                    ? "bg-primary text-primary-foreground border-primary font-medium"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
                )}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* Grid de Sessões */}
        {loadingSessions ? (
          <div className="p-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin text-primary" /> Carregando sessões...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="border border-dashed border-border/80 rounded-2xl p-12 text-center bg-card/40">
            <Brain className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-foreground">Nenhuma sessão encontrada</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Crie uma nova sessão colaborativa escolhendo entre a Matriz SWOT, Design Sprint ou quadro livre.
            </p>
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="bg-primary text-primary-foreground text-xs"
            >
              <Plus className="size-3.5 mr-1" /> Criar Primeira Sessão
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((s) => {
              const tpl = BRAINSTORM_TEMPLATES.find((t) => t.id === s.template) || BRAINSTORM_TEMPLATES[0];
              const totalIdeas = s.data?.ideas?.length || 0;
              const hasMeet = Boolean(s.meet_url);
              const canDelete = isAdmin || isGestor || s.created_by === user?.id;

              return (
                <Card
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className="group relative cursor-pointer hover:shadow-elegant hover:border-primary/50 transition-all duration-300 border-border/70 bg-card/60 backdrop-blur-sm flex flex-col justify-between overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary border-primary/20"
                        >
                          {tpl.title}
                        </Badge>
                        <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {s.title}
                        </CardTitle>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(s, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition"
                          title="Excluir sessão"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>

                    {s.description && (
                      <CardDescription className="text-xs line-clamp-2 mt-1.5 leading-relaxed">
                        {s.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    {/* Tags */}
                    {s.tags && s.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {s.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rodapé do Card */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium">
                          <MessageSquare className="size-3.5 text-primary" /> {totalIdeas} post-it(s)
                        </span>

                        {hasMeet && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Video className="size-3.5" /> Meet ativa
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] group-hover:text-foreground transition flex items-center gap-0.5">
                        Abrir <ArrowRight className="size-3 group-hover:translate-x-0.5 transition" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Criação de Sessão */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="size-5 text-primary" /> Nova Sessão de Brainstorming
            </DialogTitle>
            <DialogDescription>
              Escolha um modelo estratégico comprovado e convide seu time para ideação colaborativa ao vivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Título & Descrição */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Título da Sessão *</label>
                <Input
                  placeholder="ex: Planejamento Estratégico Q4 ou Refatoração da Jornada de Compra"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Objetivo / Descrição</label>
                <Textarea
                  placeholder="Qual problema estamos resolvendo ou qual o resultado esperado dessa reunião?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>
            </div>

            {/* Seleção do Template */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Escolha o Modelo / Framework</span>
                <span className="text-muted-foreground font-normal text-[11px]">
                  {BRAINSTORM_TEMPLATES.length} modelos disponíveis
                </span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BRAINSTORM_TEMPLATES.map((tpl) => {
                  const isSelected = newTemplateId === tpl.id;

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setNewTemplateId(tpl.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left cursor-pointer transition-all space-y-2",
                        isSelected
                          ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/30"
                          : "bg-muted/20 border-border/70 hover:border-primary/40 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold px-1.5 py-0 mb-1">
                            {tpl.badge}
                          </Badge>
                          <h4 className="text-xs font-bold text-foreground">{tpl.title}</h4>
                        </div>
                        {isSelected && <Check className="size-4 text-primary shrink-0" />}
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {tpl.desc}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {tpl.columns.map((c) => (
                          <span
                            key={c.id}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-background/80 border border-border/50 text-foreground font-medium"
                          >
                            {c.title.split(" ")[1] || c.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Meet ao Vivo & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center justify-between">
                  <span>Sala de Meet ao Vivo (Opcional)</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">Grátis & Instantâneo</span>
                </label>
                <Input
                  placeholder="Deixe em branco para gerar sala Jitsi automática"
                  value={newMeetUrl}
                  onChange={(e) => setNewMeetUrl(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tags (separadas por vírgula)</label>
                <Input
                  placeholder="Marketing, Growth, Q4, Produto"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)} disabled={savingSession}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreateSession} disabled={savingSession || !newTitle.trim()}>
              {savingSession ? <RefreshCw className="size-3.5 animate-spin mr-1" /> : <Plus className="size-3.5 mr-1" />}
              Criar Sessão e Abrir Quadro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
