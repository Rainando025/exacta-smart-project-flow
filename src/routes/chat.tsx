import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, Hash, Plus, Send, Paperclip, Reply,
  X, Trash2, Edit3, Users,
  Download, File, Loader2,
  ShieldCheck, AlertCircle, ClipboardCheck, Search, AtSign,
  Clock, AlertTriangle, CheckCircle2, Share2, Filter
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/chat")({
  component: () => <AppShell><ChatPage /></AppShell>,
});

const REACTIONS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];

type Channel = {
  id: string; name: string; description?: string;
  type: "general" | "department" | "direct";
  department_id?: string;
};

type Message = {
  id: string; channel_id: string; sender_id: string; content: string | null;
  type: "text" | "audit" | "system" | "pendency";
  reply_to_id?: string; is_edited: boolean; is_deleted: boolean;
  created_at: string; updated_at: string;
  sender?: { full_name: string; avatar_url?: string };
  reply_to?: { content: string; sender?: { full_name: string } };
  attachments?: Attachment[];
  reactions?: Reaction[];
  audit?: ChatAudit;
  pendency?: ChatPendency;
};

type Attachment = {
  id: string; file_name: string; file_path: string; file_type?: string; file_size: number;
};

type Reaction = { emoji: string; user_id: string; };

type ChatAudit = {
  os_number: string;
  report_content: string;
  status: string;
};

type ChatPendency = {
  id: string;
  title: string;
  description: string;
  priority: "critica" | "alta" | "media" | "baixa";
  status: "pendente" | "em_andamento" | "concluido";
  channel_id?: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  creator_name?: string;
  channel_name?: string;
};

export function ChatPage() {
  const { user } = useAuth();
  const { isGestor } = useRole();
  
  // Navigation tab: 'messages' or 'pendencies'
  const [activeTab, setActiveTab] = useState<"messages" | "pendencies">("messages");

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newChanOpen, setNewChanOpen] = useState(false);
  const [newChan, setNewChan] = useState({ name: "", description: "", type: "general" as Channel["type"] });
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditForm, setAuditForm] = useState({ os: "", report: "" });
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  // State for Pendências do Plantão
  const [pendencies, setPendencies] = useState<ChatPendency[]>([]);
  const [newPendencyOpen, setNewPendencyOpen] = useState(false);
  const [pendencyForm, setPendencyForm] = useState({
    title: "",
    description: "",
    priority: "media" as ChatPendency["priority"],
    channel_id: ""
  });
  const [pendencyFilterStatus, setPendencyFilterStatus] = useState<string>("all");
  const [pendencyFilterPriority, setPendencyFilterPriority] = useState<string>("all");
  const [pendencySearch, setPendencySearch] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 1. Carregar Canais com Fallback e validação de created_by
  const loadChannels = useCallback(async () => {
    try {
      const { data, error } = await (supabase.from("chat_channels" as any)).select("*").eq("is_archived", false);
      
      if (error) {
        console.error("Erro ao carregar canais do chat:", error);
      }

      if (data && data.length > 0) {
        setChannels(data as unknown as Channel[]);
        setActiveChannel(prev => {
          if (prev && data.some((c: any) => c.id === prev.id)) return prev;
          return data[0] as unknown as Channel;
        });
      } else if (user) {
        // Criar canal padrão "Geral" incluindo o created_by obrigatorio
        const { data: newChan, error: createError } = await (supabase.from("chat_channels" as any)).insert({
          name: "Geral",
          description: "Canal de comunicação geral da equipe",
          type: "general",
          created_by: user.id
        } as any).select().single();
        
        if (newChan) {
          setChannels([newChan as unknown as Channel]);
          setActiveChannel(newChan as unknown as Channel);
        } else if (createError) {
          console.error("Erro ao criar canal Geral:", createError);
          // Fallback local se RLS bloquear a criação
          const fallbackChan: Channel = { id: "general-fallback", name: "Geral", description: "Canal geral da equipe", type: "general" };
          setChannels([fallbackChan]);
          setActiveChannel(fallbackChan);
        }
      }
    } catch (err) {
      console.error("Exceção ao carregar canais:", err);
    }
  }, [user]);

  // 2. Carregar Mensagens do Canal Ativo
  const loadMessages = useCallback(async (channelId: string) => {
    if (!channelId) return;
    try {
      const query: any = supabase.from("chat_messages" as any)
        .select(`*, attachments:chat_attachments(*), reactions:chat_reactions(*), audit:chat_audits(*)`)
        .eq("channel_id", channelId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });
      
      const { data, error } = await query;
      if (error) {
        console.error("Erro ao carregar mensagens:", error);
        return;
      }

      if (!data) return;

      const ids = [...new Set(data.map((m: any) => m.sender_id))].filter(Boolean);
      if (ids.length) {
        const { data: ps } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids as string[]);
        if (ps) setProfiles(prev => ({ ...prev, ...Object.fromEntries(ps.map(p => [p.id, p])) }));
      }
      
      const processed = data.map((m: any) => ({
        ...m,
        audit: m.audit && m.audit.length > 0 ? m.audit[0] : null
      }));
      setMessages(processed);
    } catch (e) {
      console.error("Exceção ao carregar mensagens:", e);
    }
  }, []);

  // 3. Carregar Pendências do Plantão
  const loadPendencies = useCallback(async () => {
    try {
      const { data, error } = await (supabase.from("chat_pendencies" as any))
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.log("Tabela chat_pendencies ainda não criada ou inacessível:", error.message);
        return;
      }

      if (data) {
        // Buscar perfis dos criadores
        const creatorIds = [...new Set(data.map((p: any) => p.created_by))].filter(Boolean);
        if (creatorIds.length) {
          const { data: ps } = await supabase.from("profiles").select("id,full_name").in("id", creatorIds as string[]);
          if (ps) {
            const profileMap = Object.fromEntries(ps.map(p => [p.id, p.full_name]));
            const formatted = data.map((item: any) => ({
              ...item,
              creator_name: profileMap[item.created_by] || "Plantonista"
            }));
            setPendencies(formatted as ChatPendency[]);
            return;
          }
        }
        setPendencies(data as unknown as ChatPendency[]);
      }
    } catch (e) {
      console.error("Erro ao carregar pendências:", e);
    }
  }, []);

  useEffect(() => {
    loadChannels();
    loadPendencies();
  }, [loadChannels, loadPendencies]);

  useEffect(() => {
    if (!activeChannel) return;
    loadMessages(activeChannel.id);
    const sub = supabase.channel(`chat:${activeChannel.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages", filter: `channel_id=eq.${activeChannel.id}` }, () => loadMessages(activeChannel.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reactions" }, () => loadMessages(activeChannel.id))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeChannel?.id, loadMessages]);

  useEffect(() => {
    if (activeTab === "messages") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // 4. Envio de Mensagem Direta
  const sendMessage = async () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    if (!user) {
      toast.error("Sua sessão não foi encontrada. Faça login novamente.");
      return;
    }

    if (!activeChannel) {
      toast.error("Por favor, selecione ou crie um canal primeiro.");
      return;
    }

    if (sending) return;

    setSending(true);

    // Otimista: adiciona temporariamente a mensagem na tela
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      channel_id: activeChannel.id,
      sender_id: user.id,
      content: trimmedText,
      type: "text",
      reply_to_id: replyTo?.id ?? undefined,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: { full_name: user.user_metadata?.full_name || "Você" }
    };

    setMessages(prev => [...prev, tempMsg]);
    setText("");
    setReplyTo(null);

    try {
      const { error } = await (supabase.from("chat_messages" as any)).insert({
        channel_id: activeChannel.id,
        sender_id: user.id,
        content: trimmedText,
        reply_to_id: replyTo?.id ?? null,
        type: "text"
      } as any);

      if (error) {
        toast.error("Erro ao enviar mensagem: " + error.message);
        // Remover mensagem temporária se falhou
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setText(trimmedText); // restaurar o texto no input
      } else {
        loadMessages(activeChannel.id);
      }
    } catch (err: any) {
      toast.error("Falha na conexão ao enviar mensagem.");
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(trimmedText);
    } finally {
      setSending(false);
    }
  };

  const createChannel = async () => {
    if (!newChan.name.trim() || !user) return;
    const { data, error } = await (supabase.from("chat_channels" as any)).insert({
      name: newChan.name.trim(),
      description: newChan.description.trim(),
      type: newChan.type,
      created_by: user.id
    } as any).select().single();

    if (error) {
      toast.error("Erro ao criar canal: " + error.message);
    } else if (data) {
      toast.success(`Canal #${(data as any).name} criado com sucesso!`);
      setNewChanOpen(false);
      setNewChan({ name: "", description: "", type: "general" });
      loadChannels();
      setActiveChannel(data as unknown as Channel);
    }
  };

  const sendAudit = async () => {
    if (!auditForm.os || !auditForm.report || !activeChannel || !user) return;
    setSending(true);
    const { data: msg, error } = await (supabase.from("chat_messages" as any)).insert({
      channel_id: activeChannel.id, sender_id: user.id, content: "", type: "audit"
    } as any).select().single();
    if (error) {
      toast.error("Erro ao criar auditoria: " + error.message);
      setSending(false);
      return;
    }
    if (msg) {
      await (supabase.from("chat_audits" as any)).insert({
        message_id: (msg as any).id, channel_id: activeChannel.id,
        os_number: auditForm.os, report_content: auditForm.report, created_by: user.id
      } as any);
    }
    setSending(false);
    setAuditOpen(false);
    setAuditForm({ os: "", report: "" });
    loadMessages(activeChannel.id);
  };

  // 5. Criar Nova Pendência do Plantão
  const createPendency = async () => {
    if (!pendencyForm.title.trim() || !pendencyForm.description.trim() || !user) {
      toast.error("Preencha o título e os detalhes da pendência.");
      return;
    }

    const targetChannelId = pendencyForm.channel_id || activeChannel?.id || channels[0]?.id;

    try {
      const { data, error } = await (supabase.from("chat_pendencies" as any)).insert({
        title: pendencyForm.title.trim(),
        description: pendencyForm.description.trim(),
        priority: pendencyForm.priority,
        status: "pendente",
        channel_id: targetChannelId ?? null,
        created_by: user.id
      } as any).select().single();

      if (error) {
        console.error("Erro ao gravar pendência no banco:", error);
        // Fallback local se a tabela não tiver sido aplicada no banco ainda
        const localPendency: ChatPendency = {
          id: `local-${Date.now()}`,
          title: pendencyForm.title.trim(),
          description: pendencyForm.description.trim(),
          priority: pendencyForm.priority,
          status: "pendente",
          channel_id: targetChannelId,
          created_by: user.id,
          creator_name: user.user_metadata?.full_name || "Você",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setPendencies(prev => [localPendency, ...prev]);
        toast.success("Pendência registrada localmente para o próximo plantão!");
      } else {
        toast.success("Pendência de plantão registrada com sucesso!");
        loadPendencies();
      }

      setNewPendencyOpen(false);
      setPendencyForm({ title: "", description: "", priority: "media", channel_id: "" });
    } catch (e) {
      toast.error("Erro ao registrar pendência.");
    }
  };

  // 6. Atualizar Status da Pendência
  const updatePendencyStatus = async (id: string, newStatus: ChatPendency["status"]) => {
    try {
      const isResolved = newStatus === "concluido";
      const { error } = await (supabase.from("chat_pendencies" as any)).update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        resolved_at: isResolved ? new Date().toISOString() : null,
        resolved_by: isResolved && user ? user.id : null
      } as any).eq("id", id);

      if (error) {
        // Fallback para estado local
        setPendencies(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      } else {
        loadPendencies();
      }
      toast.success(`Status da pendência atualizado para ${newStatus === 'concluido' ? 'Concluído' : newStatus === 'em_andamento' ? 'Em Andamento' : 'Pendente'}`);
    } catch (e) {
      setPendencies(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    }
  };

  // 7. Encaminhar Pendência diretamente para o Chat da Equipe
  const forwardPendencyToChat = async (pendency: ChatPendency) => {
    if (!activeChannel || !user) {
      toast.error("Selecione um canal de conversa primeiro para compartilhar a pendência.");
      return;
    }

    const priorityLabel = pendency.priority.toUpperCase();
    const formattedContent = `📋 *PENDÊNCIA DE PLANTÃO - PRIORIDADE ${priorityLabel}*\n\n📌 *${pendency.title}*\n${pendency.description}\n\n👤 *Registrado por:* ${pendency.creator_name || "Plantonista"}\n⚙️ *Status:* ${pendency.status === 'concluido' ? '✅ Concluído' : pendency.status === 'em_andamento' ? '⏳ Em Andamento' : '🔴 Pendente'}`;

    try {
      const { error } = await (supabase.from("chat_messages" as any)).insert({
        channel_id: activeChannel.id,
        sender_id: user.id,
        content: formattedContent,
        type: "pendency"
      } as any);

      if (error) {
        toast.error("Erro ao encaminhar para o chat: " + error.message);
      } else {
        toast.success(`Pendência encaminhada para #${activeChannel.name}!`);
        setActiveTab("messages");
        loadMessages(activeChannel.id);
      }
    } catch (e) {
      toast.error("Não foi possível enviar para o chat.");
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChannel || !user) return;
    setUploading(true);
    try {
      const path = `chat/${activeChannel.id}/${Date.now()}_${file.name}`;
      await supabase.storage.from("attachments").upload(path, file);
      const { data: msg } = await (supabase.from("chat_messages" as any)).insert({
        channel_id: activeChannel.id, sender_id: user.id, content: "", type: "text"
      } as any).select().single();
      if (msg) {
        await (supabase.from("chat_attachments" as any)).insert({
          message_id: (msg as any).id, channel_id: activeChannel.id,
          uploaded_by: user.id, file_name: file.name, file_path: path,
          file_type: file.type, file_size: file.size,
        } as any);
      }
      loadMessages(activeChannel.id);
    } catch (e) {
      toast.error("Erro no envio do anexo");
    } finally {
      setUploading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Excluir esta mensagem permanentemente?")) return;
    const { error } = await (supabase.from("chat_messages" as any)).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Mensagem excluída");
      if (activeChannel) loadMessages(activeChannel.id);
    }
  };

  const toggleReaction = async (msgId: string, emoji: string) => {
    if (!user) return;
    const existing = messages.find(m => m.id === msgId)?.reactions?.find(r => r.emoji === emoji && r.user_id === user.id);
    const table: any = supabase.from("chat_reactions" as any);
    if (existing) {
      await table.delete().eq("message_id", msgId).eq("user_id", user.id).eq("emoji", emoji);
    } else {
      await table.insert({ message_id: msgId, user_id: user.id, emoji });
    }
  };

  // Filtragem de pendências
  const filteredPendencies = pendencies.filter(p => {
    if (pendencyFilterStatus !== "all" && p.status !== pendencyFilterStatus) return false;
    if (pendencyFilterPriority !== "all" && p.priority !== pendencyFilterPriority) return false;
    if (pendencySearch.trim()) {
      const q = pendencySearch.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  const activePendenciesCount = pendencies.filter(p => p.status !== "concluido").length;

  return (
    <div className="flex h-[calc(100vh-57px)] w-full bg-background overflow-hidden relative">
      
      {/* ── Sidebar de Canais e Navegação ── */}
      <aside className={cn(
        "w-72 flex flex-col border-r border-border/60 bg-muted/20 shrink-0 transition-all duration-300 z-20",
        showSidebarMobile ? "absolute inset-y-0 left-0 bg-background shadow-2xl w-80 z-30 flex" : "hidden md:flex"
      )}>
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold shadow-sm">E</div>
                <h1 className="font-display font-bold text-lg tracking-tight">Chat da Equipe</h1>
            </div>
            {isGestor && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setNewChanOpen(true)} title="Criar Novo Canal">
                    <Plus className="h-4 w-4" />
                </Button>
            )}
        </div>

        {/* Tab Switcher: Conversas vs Pendências do Plantão */}
        <div className="px-3 pb-3">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="messages" className="text-xs font-bold gap-1.5 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <MessageSquare className="h-3.5 w-3.5" /> Conversas
              </TabsTrigger>
              <TabsTrigger value="pendencies" className="text-xs font-bold gap-1.5 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm relative">
                <ClipboardCheck className="h-3.5 w-3.5" /> Pendências
                {activePendenciesCount > 0 && (
                  <Badge variant="destructive" className="h-4 px-1 min-w-[16px] text-[9px] font-black rounded-full ml-0.5">
                    {activePendenciesCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="px-3 py-1">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-accent transition" />
                <Input placeholder="Buscar..." className="h-9 pl-9 bg-muted/50 border-transparent focus:bg-background transition-all rounded-full text-xs" />
            </div>
        </div>

        <nav className="flex-1 overflow-y-auto mt-2">
          {(["general", "department", "direct"] as const).map(type => {
            const group = channels.filter(c => c.type === type);
            if (!group.length) return null;
            return (
              <div key={type} className="mb-4">
                <div className="px-5 mb-1 flex items-center justify-between group">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{type === 'general' ? 'Canais' : type === 'department' ? 'Setores' : 'Mensagens'}</span>
                </div>
                {group.map(ch => (
                  <button key={ch.id} onClick={() => { setActiveChannel(ch); setActiveTab("messages"); setShowSidebarMobile(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-2 text-sm transition-all relative group text-left",
                      activeChannel?.id === ch.id && activeTab === "messages"
                        ? "bg-accent/10 text-accent font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-accent" 
                        : "text-muted-foreground hover:bg-muted/50"
                    )}>
                    {type === 'direct' ? (
                        <div className="h-5 w-5 rounded-full bg-muted border flex items-center justify-center text-[10px]">{ch.name.slice(0, 1)}</div>
                    ) : <Hash className="h-4 w-4 opacity-40" />}
                    <span className="truncate">{ch.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Conteúdo Principal ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative h-full">
        
        {/* Simple Header */}
        <header className="h-14 border-b border-border/60 flex items-center justify-between px-4 md:px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 min-w-0">
             <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 rounded-full" onClick={() => setShowSidebarMobile(!showSidebarMobile)}>
               <Users className="h-4 w-4" />
             </Button>
             
             {activeTab === "messages" ? (
                <>
                  <div className="h-9 w-9 rounded-full bg-accent/5 flex items-center justify-center border border-accent/10 shrink-0">
                     {activeChannel?.type === 'direct' ? <AtSign className="h-4 w-4 text-accent" /> : <Hash className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="min-w-0">
                     <h2 className="font-bold text-sm md:text-base truncate leading-tight">{activeChannel?.name || "Selecione uma conversa"}</h2>
                     <p className="text-[11px] text-muted-foreground truncate">{activeChannel?.description || "Canal de comunicação da equipe"}</p>
                  </div>
                </>
             ) : (
                <>
                  <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                     <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                     <h2 className="font-bold text-sm md:text-base truncate leading-tight">Pendências do Plantão</h2>
                     <p className="text-[11px] text-muted-foreground truncate">Encaminhe tarefas importantes para o próximo plantonista</p>
                  </div>
                </>
             )}
          </div>
          
          <div className="flex items-center gap-2">
            {activeTab === "messages" && isGestor && (
                <Button variant="outline" size="sm" onClick={() => setAuditOpen(true)} className="h-8 gap-1.5 rounded-full border-border/60 text-xs font-bold hover:bg-accent hover:text-accent-foreground transition-all">
                    <ShieldCheck className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Auditoria</span>
                </Button>
            )}

            {activeTab === "pendencies" && (
              <Button size="sm" onClick={() => setNewPendencyOpen(true)} className="h-8 gap-1.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 shadow-sm text-xs font-bold">
                <Plus className="h-3.5 w-3.5" /> <span>Nova Pendência</span>
              </Button>
            )}
          </div>
        </header>

        {/* ── ABA 1: CHAT DE MENSAGENS ── */}
        {activeTab === "messages" && (
          <>
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-1">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="font-medium text-sm">Nenhuma mensagem ainda neste canal.</p>
                  <p className="text-xs text-muted-foreground mt-1">Envie uma mensagem abaixo para iniciar a conversa.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const sender = profiles[msg.sender_id] || msg.sender;
                  const prev = messages[idx - 1];
                  const isMe = msg.sender_id === user?.id;
                  const isSameAuthor = prev?.sender_id === msg.sender_id && 
                    (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 120000;

                  return (
                    <div key={msg.id} className={cn(
                      "group relative flex gap-3 hover:bg-muted/30 transition-colors py-1.5 px-3 md:px-6 rounded-lg -mx-3 md:-mx-6",
                      !isSameAuthor ? "mt-4" : "mt-0"
                    )}>
                      
                      {/* Actions flutuantes */}
                      <div className="absolute right-3 md:right-6 top-1 opacity-0 group-hover:opacity-100 flex items-center bg-background border rounded-lg shadow-elegant z-20 p-1 transition-all duration-200">
                          {REACTIONS.slice(0, 4).map(e => (
                              <button key={e} onClick={() => toggleReaction(msg.id, e)} className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded text-sm transition-transform hover:scale-110">{e}</button>
                          ))}
                          <div className="w-px h-4 bg-border mx-1" />
                          <button onClick={() => setReplyTo(msg)} className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded transition-colors" title="Responder"><Reply className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          {(isMe || isGestor) && (
                              <>
                                  {isMe && <button onClick={() => { setEditingMsg(msg); setEditText(msg.content || ""); }} className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded transition-colors" title="Editar"><Edit3 className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                                  <button onClick={() => deleteMessage(msg.id)} className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded transition-colors" title="Excluir"><Trash2 className="h-3.5 w-3.5 text-destructive/60" /></button>
                              </>
                          )}
                      </div>

                      {!isSameAuthor ? (
                          <Avatar className="h-8 w-8 md:h-9 md:w-9 rounded-full shrink-0 mt-1 ring-2 ring-background border shadow-sm">
                              <AvatarImage src={sender?.avatar_url} />
                              <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs">
                                  {(sender?.full_name || "U").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                          </Avatar>
                      ) : (
                          <div className="w-8 md:w-9 shrink-0 flex items-start justify-center pt-1.5">
                              <span className="text-[9px] text-muted-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                          </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {!isSameAuthor && (
                          <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-xs md:text-sm text-foreground/90 hover:underline cursor-pointer">{sender?.full_name || "Usuário"}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                          </div>
                        )}

                        {editingMsg?.id === msg.id ? (
                            <div className="flex flex-col gap-2 mt-1">
                                <Textarea value={editText} onChange={e => setEditText(e.target.value)} className="text-sm min-h-[60px] bg-muted/30" autoFocus />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setEditingMsg(null)} className="h-7 text-[10px] font-bold">CANCELAR</Button>
                                    <Button size="sm" onClick={async () => {
                                        await (supabase.from("chat_messages" as any)).update({ content: editText, is_edited: true } as any).eq("id", msg.id);
                                        setEditingMsg(null);
                                        loadMessages(activeChannel!.id);
                                    }} className="h-7 text-[10px] font-bold bg-accent">SALVAR</Button>
                                </div>
                            </div>
                        ) : msg.type === 'audit' && msg.audit ? (
                            <Card className="my-2 border border-accent/20 bg-accent/5 overflow-hidden max-w-xl shadow-sm">
                               <div className="bg-accent/10 px-3 py-1.5 flex items-center justify-between border-b border-accent/10">
                                   <div className="flex items-center gap-2">
                                       <ClipboardCheck className="h-3.5 w-3.5 text-accent" />
                                       <span className="text-[10px] font-black uppercase tracking-widest text-accent">Ordem de Auditoria Técnica</span>
                                   </div>
                                   <span className="text-[10px] font-bold text-accent/80">O.S #{msg.audit.os_number}</span>
                               </div>
                               <div className="p-4 space-y-3">
                                  <p className="text-sm italic font-medium leading-relaxed text-foreground/80">"{msg.audit.report_content}"</p>
                                  <div className="flex items-center justify-between pt-2 border-t border-accent/5">
                                      <Badge variant="outline" className="text-[9px] uppercase font-bold border-accent/20 text-accent h-5">{msg.audit.status}</Badge>
                                  </div>
                               </div>
                            </Card>
                        ) : msg.type === 'pendency' ? (
                            <Card className="my-2 border border-amber-500/30 bg-amber-500/5 overflow-hidden max-w-xl shadow-sm">
                              <div className="bg-amber-500/10 px-3 py-1.5 flex items-center justify-between border-b border-amber-500/20">
                                  <div className="flex items-center gap-2">
                                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Pendência de Plantão</span>
                                  </div>
                              </div>
                              <div className="p-4 space-y-2">
                                 <div className="text-sm whitespace-pre-wrap font-medium leading-relaxed text-foreground/90">{msg.content}</div>
                              </div>
                            </Card>
                        ) : (
                          <div className="text-[14px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
                              {msg.content}
                          </div>
                        )}

                        {/* Attachments */}
                        {msg.attachments?.map(att => (
                          <div key={att.id} className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/30 hover:bg-muted/50 transition cursor-pointer max-w-md group/file">
                              <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center text-accent shadow-sm">
                                  <File className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{att.file_name}</p>
                                  <p className="text-[10px] text-muted-foreground">{(att.file_size/1024).toFixed(1)} KB</p>
                              </div>
                              <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover/file:opacity-100 transition" />
                          </div>
                        ))}

                        {/* Reactions Display */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(msg.reactions.reduce((acc: any, r) => {
                                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                  return acc;
                              }, {})).map(([emoji, count]) => (
                                  <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)}
                                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-muted/40 hover:bg-muted hover:border-accent/30 transition text-[11px]">
                                      <span>{emoji}</span>
                                      <span className="font-bold opacity-60">{count as number}</span>
                                  </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} className="h-4" />
            </div>

            {/* Area do Input Footer */}
            <footer className="px-3 md:px-8 pb-3 pt-2 shrink-0 bg-background border-t border-border/40 z-10">
                <div className="max-w-4xl mx-auto">
                    {replyTo && (
                        <div className="flex items-center justify-between px-4 py-2 bg-accent/5 border-x border-t rounded-t-2xl text-[11px] border-accent/20">
                            <div className="flex items-center gap-2 truncate">
                                <Reply className="h-3 w-3 text-accent" />
                                <span className="font-bold text-accent">{profiles[replyTo.sender_id]?.full_name}:</span>
                                <span className="text-muted-foreground truncate">{replyTo.content || "Mídia"}</span>
                            </div>
                            <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setReplyTo(null)} />
                        </div>
                    )}
                    <div className={cn(
                        "bg-muted/40 border border-border/60 shadow-sm focus-within:shadow-md focus-within:border-accent/40 transition-all p-2",
                        replyTo ? "rounded-b-3xl rounded-t-none" : "rounded-3xl"
                    )}>
                        <Textarea 
                            value={text} 
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder={`Enviar mensagem em #${activeChannel?.name || "Geral"}`}
                            rows={1}
                            className="min-h-[44px] max-h-[160px] border-0 bg-transparent focus-visible:ring-0 resize-none px-4 py-2.5 text-sm"
                        />
                        <div className="flex items-center justify-between px-2 pt-1 pb-1">
                            <div className="flex items-center gap-1">
                                <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-background text-muted-foreground hover:text-accent transition" onClick={() => fileRef.current?.click()} title="Anexar arquivo">
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                                </Button>
                                <span className="text-[10px] text-muted-foreground/60 hidden sm:inline ml-2">Pressione <kbd className="px-1 py-0.5 rounded border bg-muted text-[9px]">Enter</kbd> para enviar</span>
                            </div>
                            <Button 
                                disabled={!text.trim() || sending} 
                                onClick={sendMessage}
                                className="h-9 w-9 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow p-0 shrink-0"
                                title="Enviar mensagem"
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </footer>
          </>
        )}

        {/* ── ABA 2: PENDÊNCIAS DO PLANTÃO ── */}
        {activeTab === "pendencies" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            
            {/* Metricas Rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 border-border/60 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Pendentes</span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">
                  {pendencies.filter(p => p.status === 'pendente').length}
                </div>
              </Card>

              <Card className="p-4 border-border/60 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Em Andamento</span>
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black mt-2 text-blue-600 dark:text-blue-400">
                  {pendencies.filter(p => p.status === 'em_andamento').length}
                </div>
              </Card>

              <Card className="p-4 border-border/60 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Concluídas</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
                  {pendencies.filter(p => p.status === 'concluido').length}
                </div>
              </Card>

              <Card className="p-4 border-border/60 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Críticas</span>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-2xl font-black mt-2 text-red-600 dark:text-red-400">
                  {pendencies.filter(p => p.priority === 'critica' && p.status !== 'concluido').length}
                </div>
              </Card>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-muted/30 p-3 rounded-2xl border border-border/50">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar pendências do plantão..."
                  value={pendencySearch}
                  onChange={e => setPendencySearch(e.target.value)}
                  className="pl-9 h-9 bg-background border-border/60 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Select value={pendencyFilterStatus} onValueChange={setPendencyFilterStatus}>
                  <SelectTrigger className="h-9 text-xs w-[130px] rounded-xl bg-background border-border/60">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pendencyFilterPriority} onValueChange={setPendencyFilterPriority}>
                  <SelectTrigger className="h-9 text-xs w-[130px] rounded-xl bg-background border-border/60">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Prioridades</SelectItem>
                    <SelectItem value="critica">🚨 Crítica</SelectItem>
                    <SelectItem value="alta">🟠 Alta</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="baixa">🔵 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista de Cards de Pendências */}
            {filteredPendencies.length === 0 ? (
              <div className="py-16 text-center border border-dashed rounded-2xl p-8 bg-muted/10">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-bold text-base">Nenhuma pendência encontrada</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  {pendencySearch || pendencyFilterStatus !== "all" || pendencyFilterPriority !== "all"
                    ? "Tente ajustar os filtros acima para encontrar pendências do plantão."
                    : "Cadastre as pendências do seu plantão para que a equipe que assume possa dar continuidade sem ruídos."}
                </p>
                <Button onClick={() => setNewPendencyOpen(true)} className="mt-4 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-bold">
                  <Plus className="h-4 w-4 mr-1" /> Nova Pendência
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPendencies.map(p => {
                  const priorityColors = {
                    critica: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
                    alta: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
                    media: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                    baixa: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
                  };

                  const statusBadges = {
                    pendente: { label: "Pendente", variant: "destructive" as const, icon: Clock },
                    em_andamento: { label: "Em Andamento", variant: "default" as const, icon: AlertCircle },
                    concluido: { label: "Concluído", variant: "outline" as const, icon: CheckCircle2 },
                  };

                  const StatusIcon = statusBadges[p.status].icon;

                  return (
                    <Card key={p.id} className="p-5 border-border/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border", priorityColors[p.priority])}>
                            {p.priority === 'critica' ? '🚨 Crítica' : p.priority === 'alta' ? '🟠 Alta' : p.priority === 'media' ? '🟡 Média' : '🔵 Baixa'}
                          </Badge>
                          
                          <Badge variant={statusBadges[p.status].variant} className="text-[10px] font-bold gap-1">
                            <StatusIcon className="h-3 w-3" /> {statusBadges[p.status].label}
                          </Badge>
                        </div>

                        <h4 className="font-bold text-base text-foreground leading-snug">{p.title}</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">{p.description}</p>
                      </div>

                      <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-muted-foreground">
                        <div>
                          <span>Por <strong>{p.creator_name || "Plantonista"}</strong> em {new Date(p.created_at).toLocaleDateString("pt-BR")} às {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {p.status !== "concluido" ? (
                            <Button size="sm" variant="outline" onClick={() => updatePendencyStatus(p.id, "concluido")} className="h-7 text-[10px] font-bold gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10">
                              <CheckCircle2 className="h-3 w-3" /> Concluir
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => updatePendencyStatus(p.id, "pendente")} className="h-7 text-[10px] font-bold text-muted-foreground">
                              Reabrir
                            </Button>
                          )}

                          <Button size="sm" variant="secondary" onClick={() => forwardPendencyToChat(p)} className="h-7 text-[10px] font-bold gap-1" title="Encaminhar para o chat">
                            <Share2 className="h-3 w-3" /> Chat
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Dialog Novo Canal ── */}
      <Dialog open={newChanOpen} onOpenChange={setNewChanOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Novo Canal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Canal</Label>
              <Input value={newChan.name} onChange={e => setNewChan({...newChan, name: e.target.value})} placeholder="Ex: plantao-manutencao" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={newChan.description} onChange={e => setNewChan({...newChan, description: e.target.value})} placeholder="Para que serve este canal?" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newChan.type} onValueChange={(val: any) => setNewChan({...newChan, type: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral (Todos têm acesso)</SelectItem>
                  <SelectItem value="department">Setor (Restrito ao departamento)</SelectItem>
                  <SelectItem value="direct">Mensagem Direta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createChannel} className="w-full bg-accent text-accent-foreground font-bold">Criar Canal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Nova Pendência do Plantão ── */}
      <Dialog open={newPendencyOpen} onOpenChange={setNewPendencyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <ClipboardCheck className="h-5 w-5" /> Registrar Pendência de Plantão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título / Do que se trata</Label>
              <Input
                value={pendencyForm.title}
                onChange={e => setPendencyForm({...pendencyForm, title: e.target.value})}
                placeholder="Ex: Verificar vazamento no trocador de calor T-04"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição Completa para o Próximo Plantonista</Label>
              <Textarea
                value={pendencyForm.description}
                onChange={e => setPendencyForm({...pendencyForm, description: e.target.value})}
                placeholder="Descreva detalhadamente o que já foi verificado e o que precisa ser feito..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select value={pendencyForm.priority} onValueChange={(val: any) => setPendencyForm({...pendencyForm, priority: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critica">🚨 Crítica (Urgente)</SelectItem>
                    <SelectItem value="alta">🟠 Alta</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="baixa">🔵 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Canal de Referência</Label>
                <Select value={pendencyForm.channel_id} onValueChange={(val) => setPendencyForm({...pendencyForm, channel_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Selecione um canal" /></SelectTrigger>
                  <SelectContent>
                    {channels.map(c => (
                      <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setNewPendencyOpen(false)}>Cancelar</Button>
            <Button onClick={createPendency} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Registrar Pendência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Auditoria ── */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> Auditoria Técnica</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-accent/5 border border-accent/10 rounded-lg text-xs text-muted-foreground flex gap-3">
                <AlertCircle className="h-4 w-4 text-accent shrink-0" />
                <p>Relate problemas ou correções necessárias em Ordens de Serviço (OS) diretamente para a equipe.</p>
            </div>
            <div className="space-y-2">
              <Label>Número da O.S</Label>
              <Input value={auditForm.os} onChange={e => setAuditForm({...auditForm, os: e.target.value})} placeholder="Ex: OS-2026-X" />
            </div>
            <div className="space-y-2">
              <Label>Relatório de Correção</Label>
              <Textarea value={auditForm.report} onChange={e => setAuditForm({...auditForm, report: e.target.value})} placeholder="O que precisa ser arrumado?" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={sendAudit} className="w-full bg-accent text-accent-foreground font-bold">Encaminhar para o Setor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
