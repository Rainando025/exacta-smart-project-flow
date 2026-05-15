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
import {
  MessageSquare, Hash, Plus, Send, Paperclip, Smile, Reply,
  X, Trash2, Edit3, Check, ChevronRight, Users, Building2,
  Globe, Lock, Download, File, Image, MoreVertical, Loader2,
  ShieldCheck, AlertCircle, ClipboardCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

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
  type: "text" | "audit" | "system";
  reply_to_id?: string; is_edited: boolean; is_deleted: boolean;
  created_at: string; updated_at: string;
  sender?: { full_name: string; avatar_url?: string };
  reply_to?: { content: string; sender?: { full_name: string } };
  attachments?: Attachment[];
  reactions?: Reaction[];
  audit?: ChatAudit;
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

function ChatPage() {
  const { user } = useAuth();
  const { isGestor } = useRole();
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
  const [sideOpen, setSideOpen] = useState(true);
  
  // Auditoria state
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditForm, setAuditForm] = useState({ os: "", report: "" });

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load channels ──
  const loadChannels = useCallback(async () => {
    const { data } = await (supabase
      .from("chat_channels" as any))
      .select("*")
      .eq("is_archived", false)
      .order("type" as any)
      .order("name" as any);
    if (data) {
      setChannels(data as unknown as Channel[]);
      if (!activeChannel && data.length > 0) setActiveChannel(data[0] as unknown as Channel);
    }
  }, [activeChannel]);

  // ── Load messages ──
  const loadMessages = useCallback(async (channelId: string) => {
    const { data } = await (supabase
      .from("chat_messages" as any))
      .select(`*, attachments:chat_attachments(*), reactions:chat_reactions(*), audit:chat_audits(*)`)
      .eq("channel_id" as any, channelId)
      .eq("is_deleted" as any, false)
      .order("created_at", { ascending: true });
    if (!data) return;

    const ids = [...new Set(data.map((m: any) => m.sender_id))];
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids);
      if (ps) setProfiles(prev => ({ ...prev, ...Object.fromEntries(ps.map(p => [p.id, p])) }));
    }
    
    // Process audit data to be single object instead of array from join
    const processed = data.map((m: any) => ({
      ...m,
      audit: m.audit && m.audit.length > 0 ? m.audit[0] : null
    }));
    
    setMessages(processed as unknown as Message[]);
  }, []);

  useEffect(() => { loadChannels(); }, []);

  useEffect(() => {
    if (!activeChannel) return;
    loadMessages(activeChannel.id);

    const sub = supabase
      .channel(`chat:${activeChannel.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "chat_messages",
        filter: `channel_id=eq.${activeChannel.id}`
      }, () => loadMessages(activeChannel.id))
      .on("postgres_changes", {
        event: "*", schema: "public", table: "chat_reactions"
      }, () => loadMessages(activeChannel.id))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeChannel?.id]);

  useEffect(() => {
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── Send message ──
  const sendMessage = async () => {
    if ((!text.trim() && !uploading) || !activeChannel || !user || sending) return;
    setSending(true);
    const { error } = await (supabase.from("chat_messages" as any)).insert({
      channel_id: activeChannel.id,
      sender_id: user.id,
      content: text.trim() || "",
      reply_to_id: replyTo?.id ?? null,
      type: "text"
    } as any);
    setSending(false);
    if (error) { toast.error("Erro ao enviar mensagem"); return; }
    setText("");
    setReplyTo(null);
  };

  // ── Send Audit ──
  const sendAudit = async () => {
    if (!auditForm.os || !auditForm.report || !activeChannel || !user) return;
    setSending(true);
    
    // 1. Create message
    const { data: msg, error: msgErr } = await (supabase.from("chat_messages" as any)).insert({
      channel_id: activeChannel.id,
      sender_id: user.id,
      content: "",
      type: "audit"
    } as any).select().single();

    if (msgErr || !msg) {
      toast.error("Erro ao criar auditoria");
      setSending(false);
      return;
    }

    // 2. Create audit record
    const { error: audErr } = await (supabase.from("chat_audits" as any)).insert({
      message_id: (msg as any).id,
      channel_id: activeChannel.id,
      os_number: auditForm.os,
      report_content: auditForm.report,
      created_by: user.id
    } as any);

    setSending(false);
    if (audErr) {
      toast.error("Erro ao registrar detalhes da auditoria");
      return;
    }

    toast.success("Auditoria encaminhada!");
    setAuditOpen(false);
    setAuditForm({ os: "", report: "" });
  };

  // ── Upload file ──
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChannel || !user) return;
    setUploading(true);
    const path = `chat/${activeChannel.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
    if (upErr) { toast.error("Erro ao enviar arquivo"); setUploading(false); return; }

    const { data: msg } = await (supabase.from("chat_messages" as any)).insert({
      channel_id: activeChannel.id, sender_id: user.id,
      content: "", reply_to_id: replyTo?.id ?? null,
      type: "text"
    } as any).select().single();

    if (msg) {
      await (supabase.from("chat_attachments" as any)).insert({
        message_id: (msg as any).id, channel_id: activeChannel.id,
        uploaded_by: user.id, file_name: file.name,
        file_path: path, file_type: file.type, file_size: file.size,
      } as any);
    }
    setUploading(false);
    setReplyTo(null);
    e.target.value = "";
  };

  const saveEdit = async () => {
    if (!editingMsg || !editText.trim()) return;
    await (supabase.from("chat_messages" as any)).update({ content: editText.trim(), is_edited: true } as any).eq("id", editingMsg.id);
    setEditingMsg(null);
  };

  const deleteMsg = async (id: string) => {
    await (supabase.from("chat_messages" as any)).update({ is_deleted: true } as any).eq("id", id);
  };

  const toggleReaction = async (msgId: string, emoji: string) => {
    if (!user) return;
    const existing = messages.find(m => m.id === msgId)
      ?.reactions?.find(r => r.emoji === emoji && r.user_id === user.id);
    if (existing) {
      await (supabase.from("chat_reactions" as any)).delete()
        .eq("message_id" as any, msgId).eq("user_id" as any, user.id).eq("emoji" as any, emoji);
    } else {
      await (supabase.from("chat_reactions" as any)).insert({ message_id: msgId, user_id: user.id, emoji } as any);
    }
  };

  const createChannel = async () => {
    if (!newChan.name.trim() || !user) return;
    const { error } = await (supabase.from("chat_channels" as any)).insert({
      name: newChan.name.trim(), description: newChan.description,
      type: newChan.type, created_by: user.id,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Canal criado!");
    setNewChanOpen(false);
    setNewChan({ name: "", description: "", type: "general" });
    loadChannels();
  };

  const channelIcon = (type: Channel["type"]) => {
    if (type === "general") return <Globe className="h-3.5 w-3.5" />;
    if (type === "department") return <Building2 className="h-3.5 w-3.5" />;
    return <Lock className="h-3.5 w-3.5" />;
  };

  const fileUrl = (path: string) => {
    const { data } = supabase.storage.from("attachments").getPublicUrl(path);
    return data.publicUrl;
  };

  const isImage = (type?: string) => type?.startsWith("image/");

  const groupByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach(m => {
      const d = new Date(m.created_at).toLocaleDateString("pt-BR");
      const last = groups[groups.length - 1];
      if (last?.date === d) last.messages.push(m);
      else groups.push({ date: d, messages: [m] });
    });
    return groups;
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">

      {/* ── Sidebar: channels ── */}
      <aside className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 shrink-0",
        sideOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            <span className="font-display font-bold text-sm">Canais</span>
          </div>
          {isGestor && (
            <button onClick={() => setNewChanOpen(true)}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-accent transition"
              title="Novo canal">
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 space-y-4 px-3">
          {(["general", "department", "direct"] as const).map(type => {
            const group = channels.filter(c => c.type === type);
            if (!group.length) return null;
            const label = type === "general" ? "Gerais" : type === "department" ? "Setores" : "Diretas";
            return (
              <div key={type} className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-sidebar-foreground/40 px-2 mb-1">{label}</p>
                {group.map(ch => (
                  <button key={ch.id}
                    onClick={() => setActiveChannel(ch)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-left transition-all",
                      activeChannel?.id === ch.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                    )}>
                    <span className="text-accent/80">{channelIcon(ch.type)}</span>
                    <span className="truncate font-medium">{ch.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
          {channels.length === 0 && (
            <div className="py-10 text-center">
                <p className="text-xs text-muted-foreground italic">Nenhum canal ativo.</p>
            </div>
          )}
        </nav>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex flex-1 flex-col min-w-0 h-full relative bg-background/50">

        {/* Chat header */}
        <header className="flex items-center justify-between px-4 h-14 border-b bg-card/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSideOpen(v => !v)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground transition shrink-0">
              <ChevronRight className={cn("h-4 w-4 transition-transform duration-300", sideOpen && "rotate-180")} />
            </button>
            {activeChannel && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-accent shrink-0">{channelIcon(activeChannel.type)}</span>
                <span className="font-display font-bold truncate text-base">{activeChannel.name}</span>
                {activeChannel.description && (
                  <span className="text-xs text-muted-foreground hidden lg:inline truncate border-l pl-2 border-border ml-1">
                    {activeChannel.description}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {activeChannel && isGestor && (
             <Button variant="outline" size="sm" onClick={() => setAuditOpen(true)} className="gap-2 h-8 border-accent/20 hover:border-accent hover:bg-accent/5 text-accent">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Auditoria</span>
             </Button>
          )}
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 scrollbar-thin scrollbar-thumb-muted overscroll-contain">
          {!activeChannel && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-4">
              <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center">
                <MessageSquare className="h-10 w-10" />
              </div>
              <p className="text-sm font-medium tracking-wide">Selecione um canal para interagir</p>
            </div>
          )}

          {activeChannel && groupByDate(messages).map(group => (
            <div key={group.date} className="space-y-6">
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold px-3 py-1 bg-muted/50 rounded-full">{group.date}</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
              </div>

              {group.messages.map((msg, idx) => {
                const sender = profiles[msg.sender_id];
                const isMe = msg.sender_id === user?.id;
                const prev = group.messages[idx - 1];
                const isSameAuthor = prev?.sender_id === msg.sender_id &&
                  (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 300000;

                const reactionGroups: Record<string, Reaction[]> = {};
                (msg.reactions || []).forEach(r => {
                  reactionGroups[r.emoji] = [...(reactionGroups[r.emoji] || []), r];
                });

                return (
                  <div key={msg.id} className={cn(
                    "group flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300", 
                    isMe && "flex-row-reverse", 
                    isSameAuthor ? "mt-1" : "mt-6"
                  )}>

                    {/* Avatar */}
                    {!isSameAuthor ? (
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm",
                        isMe ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {sender?.avatar_url ? (
                            <img src={sender.avatar_url} className="h-full w-full rounded-xl object-cover" />
                        ) : (sender?.full_name || "?").slice(0, 2).toUpperCase()}
                      </div>
                    ) : <div className="w-10 shrink-0" />}

                    <div className={cn("max-w-[85%] lg:max-w-[70%] space-y-1", isMe && "items-end flex flex-col")}>
                      {!isSameAuthor && (
                        <div className={cn("flex items-baseline gap-2 mb-1", isMe && "flex-row-reverse")}>
                          <span className="text-xs font-bold text-foreground/80">{isMe ? "Você" : (sender?.full_name || "Usuário")}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}

                      {/* Reply preview */}
                      {msg.reply_to_id && (
                        <div className="text-[11px] text-muted-foreground border-l-2 border-accent/40 pl-3 mb-1 italic bg-accent/5 py-1 rounded-r-md max-w-md truncate">
                          Respondendo a: {msg.reply_to?.content || "Anexo"}
                        </div>
                      )}

                      {/* Audit Message Type */}
                      {msg.type === "audit" && msg.audit ? (
                        <Card className="border-accent/40 bg-accent/5 overflow-hidden shadow-elegant max-w-md">
                            <div className="bg-accent px-3 py-1.5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-accent-foreground text-xs font-bold">
                                    <ClipboardCheck className="h-4 w-4" />
                                    <span>ORDEM DE AUDITORIA</span>
                                </div>
                                <span className="text-[10px] font-bold text-accent-foreground/80">#{msg.audit.os_number}</span>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Relatório de Correção</p>
                                    <p className="text-sm font-medium leading-relaxed italic">"{msg.audit.report_content}"</p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-accent/10">
                                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[9px] h-5">{msg.audit.status}</Badge>
                                    <button className="text-[10px] font-bold text-accent hover:underline">VISUALIZAR DETALHES</button>
                                </div>
                            </div>
                        </Card>
                      ) : (
                        /* Standard Message Bubble */
                        <div className={cn(
                          "relative rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all group-hover:shadow-md",
                          isMe
                            ? "bg-accent text-accent-foreground rounded-tr-none"
                            : "bg-card border border-border/60 rounded-tl-none"
                        )}>
                          {editingMsg?.id === msg.id ? (
                            <div className="flex flex-col gap-2 min-w-[240px]">
                              <Textarea value={editText} onChange={e => setEditText(e.target.value)}
                                className="text-xs min-h-[60px] bg-background/50 border-accent/30" autoFocus />
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setEditingMsg(null)} className="h-7 text-[10px] uppercase font-bold">Cancelar</Button>
                                <Button size="sm" onClick={saveEdit} className="h-7 text-[10px] uppercase font-bold bg-accent">Salvar</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {msg.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}

                              {msg.attachments?.map(att => (
                                <div key={att.id} className="mt-3">
                                  {isImage(att.file_type) ? (
                                    <div className="relative group/img overflow-hidden rounded-lg border border-border/20 shadow-sm">
                                        <img src={fileUrl(att.file_path)} alt={att.file_name}
                                          className="max-w-full max-h-[400px] object-contain hover:scale-105 transition-transform duration-500 cursor-zoom-in" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" size="sm" className="h-8 gap-2" asChild>
                                                <a href={fileUrl(att.file_path)} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /> Abrir</a>
                                            </Button>
                                        </div>
                                    </div>
                                  ) : (
                                    <a href={fileUrl(att.file_path)} target="_blank" rel="noreferrer"
                                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/40 px-4 py-3 text-xs hover:bg-accent/5 hover:border-accent/30 transition group/file">
                                      <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover/file:bg-accent group-hover/file:text-accent-foreground transition">
                                        <File className="h-5 w-5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate">{att.file_name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{(att.file_size / 1024).toFixed(1)} KB • {att.file_type?.split('/')[1]}</p>
                                      </div>
                                      <Download className="h-4 w-4 text-muted-foreground group-hover/file:text-accent transition" />
                                    </a>
                                  )}
                                </div>
                              ))}

                              {msg.is_edited && <span className="text-[9px] opacity-40 font-bold uppercase ml-1">(editado)</span>}
                            </>
                          )}

                          {/* Hover Actions Bar */}
                          <div className={cn(
                            "absolute top-[-14px] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background border border-border rounded-full p-1 shadow-elegant z-20",
                            isMe ? "right-2" : "left-2"
                          )}>
                            {REACTIONS.map(em => (
                              <button key={em} onClick={() => toggleReaction(msg.id, em)}
                                className="h-7 w-7 flex items-center justify-center text-sm hover:scale-125 transition-transform leading-none hover:bg-muted rounded-full">
                                {em}
                              </button>
                            ))}
                            <div className="w-px h-4 bg-border mx-1" />
                            <button onClick={() => setReplyTo(msg)}
                              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-accent transition" title="Responder">
                              <Reply className="h-3.5 w-3.5" />
                            </button>
                            {isMe && msg.type !== "audit" && (
                              <>
                                <button onClick={() => { setEditingMsg(msg); setEditText(msg.content || ""); }}
                                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-accent transition" title="Editar">
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => deleteMsg(msg.id)}
                                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted text-destructive transition" title="Deletar">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Reactions Display */}
                      {Object.keys(reactionGroups).length > 0 && (
                        <div className={cn("flex flex-wrap gap-1.5 mt-1", isMe && "justify-end")}>
                          {Object.entries(reactionGroups).map(([emoji, rs]) => {
                            const mine = rs.some(r => r.user_id === user?.id);
                            return (
                              <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] border transition-all shadow-sm",
                                  mine ? "bg-accent/15 border-accent/40 text-accent font-bold" : "bg-card border-border/60 hover:border-accent/30 text-muted-foreground"
                                )}>
                                <span>{emoji}</span> 
                                <span className="opacity-80">{rs.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef} className="h-10" />
        </div>

        {/* Input Controls */}
        <footer className="px-4 pb-6 pt-2 bg-gradient-to-t from-background to-transparent sticky bottom-0 z-30">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Reply bar */}
            {replyTo && (
              <div className="flex items-center gap-3 rounded-t-xl bg-accent/5 border-x border-t border-accent/20 px-4 py-2.5 text-xs animate-in slide-in-from-bottom-2">
                <Reply className="h-4 w-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                    <span className="text-muted-foreground font-medium">Respondendo a <span className="text-accent font-bold">{profiles[replyTo.sender_id]?.full_name}</span></span>
                    <p className="truncate text-foreground/70 mt-0.5">{replyTo.content || "[Mídia]"}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center transition"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            {/* Main Input */}
            <div className={cn(
                "flex items-end gap-3 bg-card border border-border shadow-elegant transition-all duration-300 focus-within:border-accent/40 p-2.5",
                replyTo ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"
            )}>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
              
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-accent transition shrink-0 bg-muted/30"
                title="Anexar mídia">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
              </button>

              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder={activeChannel ? `Mensagem em #${activeChannel.name}…` : "Escolha um canal…"}
                disabled={!activeChannel}
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent py-2.5 focus-visible:ring-0 text-sm min-h-[44px] max-h-[160px] leading-relaxed"
              />

              <div className="flex gap-1.5 pb-1 pr-1">
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || !activeChannel || sending}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition shadow-glow disabled:opacity-30 shrink-0">
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between px-2">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Pressione ENTER para enviar</p>
                {activeChannel && <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5"><Users className="h-3 w-3" /> Online agora</p>}
            </div>
          </div>
        </footer>
      </div>

      {/* ── Auditoria Dialog ── */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-accent">
                <ShieldCheck className="h-5 w-5" />
                <span>Encaminhar Auditoria</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="p-3 bg-accent/5 rounded-lg border border-accent/10 flex gap-3">
                <AlertCircle className="h-5 w-5 text-accent shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Esta ferramenta é de uso exclusivo para gestores. Ao encaminhar uma auditoria, um registro formal será criado no canal ativo com os detalhes de correção.
                </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Número da Ordem de Serviço (O.S)</Label>
              <Input value={auditForm.os} onChange={e => setAuditForm({ ...auditForm, os: e.target.value })}
                placeholder="Ex: OS-2026-001" className="h-11 font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Relatório de Correção / O que arrumar</Label>
              <Textarea value={auditForm.report} onChange={e => setAuditForm({ ...auditForm, report: e.target.value })}
                placeholder="Descreva detalhadamente o que precisa ser corrigido..." className="min-h-[120px] leading-relaxed" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setAuditOpen(false)} className="uppercase text-[10px] font-bold tracking-widest">Cancelar</Button>
            <Button onClick={sendAudit} disabled={sending || !auditForm.os || !auditForm.report} 
                className="bg-accent text-accent-foreground uppercase text-[10px] font-bold tracking-widest px-8">
                {sending ? "Encaminhando..." : "Encaminhar para o Time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Channel Dialog ── */}
      <Dialog open={newChanOpen} onOpenChange={setNewChanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Criar novo canal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do canal</Label>
              <Input value={newChan.name} onChange={e => setNewChan({ ...newChan, name: e.target.value })}
                placeholder="ex: marketing, suporte, diretoria" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={newChan.description} onChange={e => setNewChan({ ...newChan, description: e.target.value })}
                placeholder="Qual o objetivo do canal?" />
            </div>
            <div className="space-y-2">
              <Label>Visibilidade</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["general", "department", "direct"] as const).map(v => (
                  <button key={v} onClick={() => setNewChan({ ...newChan, type: v })}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs transition-all",
                      newChan.type === v ? "border-accent bg-accent/5 text-accent shadow-sm" : "border-border hover:bg-muted"
                    )}>
                    {channelIcon(v)}
                    <span className="capitalize font-bold">{v === 'general' ? 'Geral' : v === 'department' ? 'Setor' : 'Privado'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createChannel} className="w-full bg-gradient-primary">Criar Canal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
