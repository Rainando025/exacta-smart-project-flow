import { useState, useEffect, useMemo, useRef } from "react";
import {
  Users, UserPlus, Share2, Copy, Check, Shield, Globe, Clock,
  Send, Trash2, Eye, Edit3, Crown, UserCheck, MessageSquare,
  Sparkles, Radio, ExternalLink, Mail, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ProjectRole = "owner" | "editor" | "viewer" | "guest";

export interface ProjectCollaborator {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  role: ProjectRole;
  is_guest?: boolean;
  avatar_url?: string;
  added_at: string;
  invited_by?: string;
}

export interface LivePresenceUser {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  online_at: string;
}

export interface CollabMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  avatar_url?: string;
  text: string;
  created_at: string;
}

interface CollaborativeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    description?: string | null;
    owner_id: string;
    color?: string;
  };
}

export function CollaborativeModal({
  open,
  onOpenChange,
  project,
}: CollaborativeModalProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("members");

  // Estado de colaboradores
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [profilesList, setProfilesList] = useState<any[]>([]);

  // Presença em tempo real (Supabase Realtime)
  const [onlineUsers, setOnlineUsers] = useState<LivePresenceUser[]>([]);

  // Mural ao vivo em tempo real
  const [messages, setMessages] = useState<CollabMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Formulário de adição de membro
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("editor");

  // Link de Convidado Externo (Guest)
  const [guestRole, setGuestRole] = useState<"viewer" | "editor">("viewer");
  const [guestExpiration, setGuestExpiration] = useState<"24h" | "7d" | "30d" | "never">("7d");
  const [copiedLink, setCopiedLink] = useState(false);

  // Gerar chave de persistência local para backup resiliente
  const storageKey = `exacta_project_collab_${project.id}`;
  const messagesKey = `exacta_project_collab_msgs_${project.id}`;

  // 1. Carregar colaboradores salvos
  useEffect(() => {
    if (!open) return;

    // Carregar do localStorage inicial
    const saved = localStorage.getItem(storageKey);
    let initialCollabs: ProjectCollaborator[] = [];

    if (saved) {
      try {
        initialCollabs = JSON.parse(saved);
      } catch (e) {}
    }

    // Se estiver vazio, garante o proprietário na lista
    if (initialCollabs.length === 0 && user) {
      initialCollabs = [
        {
          id: `owner-${user.id}`,
          user_id: user.id,
          name: profile?.full_name || user.email || "Proprietário",
          email: user.email || "",
          role: "owner",
          is_guest: false,
          avatar_url: profile?.avatar_url || undefined,
          added_at: new Date().toISOString(),
        },
      ];
    }
    setCollaborators(initialCollabs);

    // Carregar mensagens do mural
    const savedMsgs = localStorage.getItem(messagesKey);
    if (savedMsgs) {
      try {
        setMessages(JSON.parse(savedMsgs));
      } catch (e) {}
    }

    // Carregar lista de perfis do sistema para autocomplete
    async function loadProfiles() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, job_title")
          .limit(50);
        if (data) setProfilesList(data);
      } catch (e) {
        console.warn("Could not load profiles:", e);
      }
    }
    loadProfiles();
  }, [open, project.id, user, profile, storageKey, messagesKey]);

  // Salvar alterações de colaboradores no cache
  useEffect(() => {
    if (collaborators.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(collaborators));
    }
  }, [collaborators, storageKey]);

  // Salvar histórico de mensagens no cache
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(messagesKey, JSON.stringify(messages));
    }
  }, [messages, messagesKey]);

  // 2. Conectar ao Supabase Realtime Channel (Presence + Broadcast)
  useEffect(() => {
    if (!open || !project.id || !user) return;

    const channelName = `project-collab:${project.id}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: user.id },
      },
    });

    // Escuta sincronização de presença online
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeList: LivePresenceUser[] = [];

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p && p.user_id) {
              activeList.push({
                user_id: p.user_id,
                full_name: p.full_name || "Colaborador",
                email: p.email || "",
                avatar_url: p.avatar_url,
                role: p.role || "editor",
                online_at: p.online_at || new Date().toISOString(),
              });
            }
          });
        });
        setOnlineUsers(activeList);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const joined = newPresences[0] as any;
        if (joined && joined.user_id !== user.id) {
          toast.info(`${joined.full_name || "Um colaborador"} entrou no projeto agora.`);
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const left = leftPresences[0] as any;
        if (left && left.user_id !== user.id) {
          // opcional feedback silencioso
        }
      })
      // Escuta mensagens do mural ao vivo
      .on("broadcast", { event: "collab-message" }, ({ payload }) => {
        if (payload) {
          setMessages((prev) => [...prev, payload]);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Rastrear a presença do usuário atual
          await channel.track({
            user_id: user.id,
            full_name: profile?.full_name || user.email?.split("@")[0] || "Usuário",
            email: user.email || "",
            avatar_url: profile?.avatar_url,
            role: user.id === project.owner_id ? "owner" : "colaborador",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [open, project.id, project.owner_id, user, profile]);

  // 3. Gerar URL de Link de Convidado Externo
  const generatedInviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    const payload = {
      projectId: project.id,
      role: guestRole,
      exp: guestExpiration,
      created: Date.now(),
    };
    const token = btoa(JSON.stringify(payload));
    return `${window.location.origin}/projects?collab=${token}&pid=${project.id}`;
  }, [project.id, guestRole, guestExpiration]);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedInviteLink);
      setCopiedLink(true);
      toast.success("Link de acesso colaborativo copiado!");
      setTimeout(() => setCopiedLink(false), 2500);

      // Adiciona o convite na lista se ainda não tiver
      const guestEmail = `convidado-${Math.random().toString(36).substring(2, 6)}@convidado.exacta`;
      const newGuest: ProjectCollaborator = {
        id: `guest-${Date.now()}`,
        name: `Convidado (${guestRole === "editor" ? "Editor" : "Visualizador"})`,
        email: guestEmail,
        role: guestRole === "editor" ? "editor" : "guest",
        is_guest: true,
        added_at: new Date().toISOString(),
        invited_by: user?.email || undefined,
      };
      setCollaborators((prev) => [newGuest, ...prev]);
    } catch (e) {
      toast.error("Erro ao copiar link.");
    }
  };

  // 4. Adicionar Membro Interno
  const handleAddMember = () => {
    if (!selectedUserEmail.trim()) {
      toast.warning("Selecione ou digite o e-mail do colaborador.");
      return;
    }

    // Verificar se já está na lista
    if (collaborators.some((c) => c.email.toLowerCase() === selectedUserEmail.trim().toLowerCase())) {
      toast.info("Este colaborador já possui acesso a este projeto.");
      return;
    }

    const matchedProfile = profilesList.find(
      (p) => p.full_name?.toLowerCase() === selectedUserEmail.toLowerCase()
    );

    const newCollab: ProjectCollaborator = {
      id: `collab-${Date.now()}`,
      name: matchedProfile?.full_name || selectedUserEmail.split("@")[0],
      email: selectedUserEmail.trim(),
      role: selectedRole,
      is_guest: false,
      avatar_url: matchedProfile?.avatar_url,
      added_at: new Date().toISOString(),
      invited_by: user?.email || undefined,
    };

    setCollaborators((prev) => [...prev, newCollab]);
    setSelectedUserEmail("");
    toast.success(`${newCollab.name} adicionado ao projeto como ${newCollab.role}!`);
  };

  // 5. Remover Membro
  const handleRemoveMember = (id: string, name: string) => {
    if (!confirm(`Remover acesso de ${name} a este projeto?`)) return;
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
    toast.success("Colaborador removido.");
  };

  // 6. Atualizar Papel de um Membro
  const handleUpdateRole = (id: string, newRole: ProjectRole) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.id === id ? { ...c, role: newRole } : c))
    );
    toast.success("Permissão atualizada.");
  };

  // 7. Enviar Mensagem no Mural ao Vivo
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const msgPayload: CollabMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender_name: profile?.full_name || user.email?.split("@")[0] || "Eu",
      sender_email: user.email || "",
      avatar_url: profile?.avatar_url || undefined,
      text: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    // Atualiza estado local
    setMessages((prev) => [...prev, msgPayload]);
    setNewMessage("");

    // Envia via Realtime Broadcast para todos que estiverem no canal
    try {
      const channel = supabase.channel(`project-collab:${project.id}`);
      await channel.send({
        type: "broadcast",
        event: "collab-message",
        payload: msgPayload,
      });
    } catch (e) {
      console.warn("Broadcast error:", e);
    }

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-sidebar/95 backdrop-blur-2xl border-white/10 p-0">
        {/* Cabeçalho do Modal Colaborativo */}
        <div className="p-6 border-b border-white/10 bg-card/40 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: project.color || "#06b6d4" }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Modo Colaborativo
              </span>
            </div>

            <DialogTitle className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <span>{project.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Convide sua equipe ou parceiros externos (convidados) para co-planejar, editar e executar tarefas simultaneamente.
            </DialogDescription>
          </div>

          {/* Indicador de Presença em Tempo Real ("Ao Mesmo Tempo") */}
          <div className="flex items-center gap-2 bg-background/60 border border-emerald-500/30 px-3 py-1.5 rounded-full shadow-glow">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {onlineUsers.length > 0
                ? `${onlineUsers.length} online agora`
                : "Aguardando presença..."}
            </span>

            {/* Mini Avatares dos membros online */}
            <div className="flex -space-x-1.5 ml-1">
              {onlineUsers.slice(0, 4).map((ou, idx) => (
                <Avatar
                  key={idx}
                  className="h-5 w-5 border-2 border-background ring-1 ring-emerald-500"
                  title={`${ou.full_name} (${ou.email})`}
                >
                  <AvatarImage src={ou.avatar_url} />
                  <AvatarFallback className="text-[9px] bg-emerald-700 text-white font-bold">
                    {ou.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>

        {/* Abas: Colaboradores, Link Externo e Mural ao Vivo */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-3 border-b border-white/5 bg-background/20">
            <TabsList className="bg-transparent p-0 gap-4">
              <TabsTrigger
                value="members"
                className="data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none pb-2 text-xs font-semibold gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Membros & Equipe ({collaborators.length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="invite-link"
                className="data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none pb-2 text-xs font-semibold gap-1.5"
              >
                <Globe className="h-3.5 w-3.5 text-blue-400" />
                <span>Link de Convidado Externo</span>
              </TabsTrigger>

              <TabsTrigger
                value="live-chat"
                className="data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none pb-2 text-xs font-semibold gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5 text-accent" />
                <span>Mural ao Vivo ({messages.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ABA 1: Membros e Colaboradores */}
          <TabsContent value="members" className="p-6 space-y-6 mt-0">
            {/* Adicionar Novo Membro da Equipe */}
            <div className="p-4 rounded-xl bg-card/40 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-accent" />
                Adicionar Colaborador da Empresa
              </h4>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[220px]">
                  <Input
                    placeholder="Digite o e-mail ou nome do colega…"
                    value={selectedUserEmail}
                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                    className="h-9 text-xs bg-background/50 border-white/10"
                    list="team-profiles"
                  />
                  <datalist id="team-profiles">
                    {profilesList.map((p) => (
                      <option key={p.id} value={p.full_name}>
                        {p.job_title ? `${p.job_title}` : "Equipe"}
                      </option>
                    ))}
                  </datalist>
                </div>

                <Select
                  value={selectedRole}
                  onValueChange={(val: ProjectRole) => setSelectedRole(val)}
                >
                  <SelectTrigger className="w-[150px] h-9 text-xs bg-background/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor" className="text-xs">
                      ✏️ Editor (Edição)
                    </SelectItem>
                    <SelectItem value="viewer" className="text-xs">
                      👁️ Visualizador
                    </SelectItem>
                    <SelectItem value="guest" className="text-xs">
                      🤝 Convidado
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleAddMember}
                  className="h-9 text-xs gap-1.5 bg-accent text-accent-foreground font-semibold"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>
            </div>

            {/* Lista de Colaboradores com Papéis */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pessoas com Acesso a este Projeto:
              </h4>

              <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-card/30">
                {collaborators.map((c) => {
                  const isOnline = onlineUsers.some(
                    (ou) =>
                      (ou.user_id && ou.user_id === c.user_id) ||
                      (ou.email && ou.email.toLowerCase() === c.email.toLowerCase())
                  );

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-card/50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <Avatar className="h-9 w-9 border border-white/10">
                            <AvatarImage src={c.avatar_url} />
                            <AvatarFallback className="text-xs font-bold bg-accent/20 text-accent">
                              {c.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background"
                              title="Online no projeto agora"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                            {c.role === "owner" && (
                              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] gap-1 px-1.5 py-0">
                                <Crown className="h-2.5 w-2.5" /> Dono
                              </Badge>
                            )}
                            {c.is_guest && (
                              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] px-1.5 py-0">
                                Externo
                              </Badge>
                            )}
                            {isOnline && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[9px] px-1.5 py-0 animate-pulse">
                                Ativo agora
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                        </div>
                      </div>

                      {/* Controle de Papel / Permissão */}
                      <div className="flex items-center gap-2">
                        {c.role === "owner" ? (
                          <span className="text-xs text-muted-foreground font-semibold px-2">
                            Controle Total
                          </span>
                        ) : (
                          <Select
                            value={c.role}
                            onValueChange={(val: ProjectRole) => handleUpdateRole(c.id, val)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs bg-background/50 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor" className="text-xs">
                                ✏️ Editor
                              </SelectItem>
                              <SelectItem value="viewer" className="text-xs">
                                👁️ Visualizador
                              </SelectItem>
                              <SelectItem value="guest" className="text-xs">
                                🤝 Convidado
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {c.role !== "owner" && (
                          <button
                            onClick={() => handleRemoveMember(c.id, c.name)}
                            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted/40 transition"
                            title="Remover acesso"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ABA 2: Link de Compartilhamento para Convidados Externos */}
          <TabsContent value="invite-link" className="p-6 space-y-6 mt-0">
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-950/30 to-purple-950/20 border border-blue-500/20 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">
                    Link de Compartilhamento Seguro com Convidados
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Envie este link para clientes, fornecedores ou freelancers que não possuem conta completa no sistema.
                    Eles poderão visualizar ou colaborar em tempo real com as permissões que você definir abaixo.
                  </p>
                </div>
              </div>

              {/* Opções de Permissão do Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <Label className="text-xs font-semibold">Nível de Permissão do Convidado:</Label>
                  <Select
                    value={guestRole}
                    onValueChange={(val: any) => setGuestRole(val)}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-background/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer" className="text-xs">
                        👁️ Apenas Visualizar (Cronograma, Entregas, Status)
                      </SelectItem>
                      <SelectItem value="editor" className="text-xs">
                        ✏️ Convidado Editor (Concluir Tarefas, Comentar)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Validade do Convite:</Label>
                  <Select
                    value={guestExpiration}
                    onValueChange={(val: any) => setGuestExpiration(val)}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-background/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h" className="text-xs">Expira em 24 horas</SelectItem>
                      <SelectItem value="7d" className="text-xs">Expira em 7 dias</SelectItem>
                      <SelectItem value="30d" className="text-xs">Expira em 30 dias</SelectItem>
                      <SelectItem value="never" className="text-xs">Permanente (até revogação)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Caixa com o Link Gerado e Botão de Cópia */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Link de Acesso Direto com Token:
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={generatedInviteLink}
                    className="h-9 text-xs font-mono bg-black/40 border-white/10 select-all"
                  />
                  <Button
                    onClick={copyInviteLink}
                    className={cn(
                      "h-9 px-4 text-xs font-semibold gap-1.5 shrink-0 transition",
                      copiedLink
                        ? "bg-emerald-600 text-white"
                        : "bg-gradient-to-r from-accent to-purple-600 text-white shadow-glow"
                    )}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copiar Link</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ABA 3: Mural ao Vivo (Realtime Chat/Check-in) */}
          <TabsContent value="live-chat" className="p-6 space-y-4 mt-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-accent animate-pulse" />
                Mural de alinhamento em tempo real do projeto
              </span>
              <span>Visível para todos os colaboradores</span>
            </div>

            {/* Feed de Mensagens */}
            <div className="h-64 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-card/30 border border-white/5">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs text-center">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-30 text-accent" />
                  <p className="font-semibold text-foreground">Nenhuma mensagem ainda</p>
                  <p>Troque recados rápidos, notas de alinhamento e check-ins com os colaboradores.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_email === user?.email;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-start gap-2.5",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isMe && (
                        <Avatar className="h-7 w-7 mt-0.5 border border-white/10">
                          <AvatarImage src={m.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-accent/20 text-accent font-bold">
                            {m.sender_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "max-w-[75%] p-2.5 rounded-xl text-xs space-y-0.5",
                          isMe
                            ? "bg-accent text-accent-foreground rounded-tr-none font-medium"
                            : "bg-card/70 border border-white/10 rounded-tl-none text-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                          <span className="font-bold">{isMe ? "Você" : m.sender_name}</span>
                          <span>
                            {new Date(m.created_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed break-words">{m.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para envio de mensagem rápida */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enviar nota rápida para a equipe no projeto…"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="h-9 text-xs bg-background/50 border-white/10 focus:border-accent"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="h-9 px-3 gap-1.5 bg-accent text-accent-foreground font-semibold"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer do Modal */}
        <DialogFooter className="p-4 border-t border-white/10 bg-card/40 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

