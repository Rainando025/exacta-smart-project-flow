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
  ShieldCheck, AlertCircle, ClipboardCheck, Search, AtSign
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  const loadChannels = useCallback(async () => {
    const { data } = await (supabase.from("chat_channels" as any)).select("*").eq("is_archived", false);
    if (data && data.length > 0) {
      setChannels(data as unknown as Channel[]);
      if (!activeChannel) setActiveChannel(data[0] as unknown as Channel);
    } else if (data && data.length === 0 && user) {
      const { data: newChan } = await (supabase.from("chat_channels" as any)).insert({
        name: "Geral",
        description: "Canal de comunicação geral da equipe",
        type: "general"
      } as any).select().single();
      if (newChan) {
        setChannels([newChan as unknown as Channel]);
        setActiveChannel(newChan as unknown as Channel);
      }
    }
  }, [activeChannel, user]);

  const loadMessages = useCallback(async (channelId: string) => {
    const query: any = supabase.from("chat_messages" as any)
      .select(`*, attachments:chat_attachments(*), reactions:chat_reactions(*), audit:chat_audits(*)`)
      .eq("channel_id", channelId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });
    
    const { data } = await query;
    if (!data) return;

    const ids = [...new Set(data.map((m: any) => m.sender_id))];
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids as string[]);
      if (ps) setProfiles(prev => ({ ...prev, ...Object.fromEntries(ps.map(p => [p.id, p])) }));
    }
    
    const processed = data.map((m: any) => ({
      ...m,
      audit: m.audit && m.audit.length > 0 ? m.audit[0] : null
    }));
    setMessages(processed);
  }, []);

  useEffect(() => { loadChannels(); }, []);

  useEffect(() => {
    if (!activeChannel) return;
    loadMessages(activeChannel.id);
    const sub = supabase.channel(`chat:${activeChannel.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages", filter: `channel_id=eq.${activeChannel.id}` }, () => loadMessages(activeChannel.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reactions" }, () => loadMessages(activeChannel.id))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeChannel?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !activeChannel || !user || sending) return;
    setSending(true);
    const contentToSend = text.trim();
    const { error } = await (supabase.from("chat_messages" as any)).insert({
      channel_id: activeChannel.id,
      sender_id: user.id,
      content: contentToSend,
      reply_to_id: replyTo?.id ?? null,
      type: "text"
    } as any);
    setSending(false);
    if (error) {
      toast.error("Erro ao enviar mensagem: " + error.message);
      return;
    }
    setText("");
    setReplyTo(null);
    loadMessages(activeChannel.id);
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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChannel || !user) return;
    setUploading(true);
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
    setUploading(false);
    loadMessages(activeChannel.id);
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

  const deleteChannel = async (id: string) => {
    if (!confirm("Excluir este canal e todas as suas mensagens? Esta ação não pode ser desfeita.")) return;
    const { error } = await (supabase.from("chat_channels" as any)).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
        toast.success("Canal excluído");
        loadChannels();
        setActiveChannel(null);
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

  return (
    <div className="flex h-[calc(100vh-57px)] w-full bg-background overflow-hidden relative">
      
      {/* ── Gmail Style Sidebar ── */}
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
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setNewChanOpen(true)}>
                    <Plus className="h-4 w-4" />
                </Button>
            )}
        </div>

        <div className="px-3 py-2">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-accent transition" />
                <Input placeholder="Buscar conversas..." className="h-9 pl-9 bg-muted/50 border-transparent focus:bg-background transition-all rounded-full text-xs" />
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
                  <button key={ch.id} onClick={() => { setActiveChannel(ch); setShowSidebarMobile(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-2 text-sm transition-all relative group text-left",
                      activeChannel?.id === ch.id 
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

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative h-full">
        
        {/* Simple Header */}
        <header className="h-14 border-b border-border/60 flex items-center justify-between px-4 md:px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 min-w-0">
             <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 rounded-full" onClick={() => setShowSidebarMobile(!showSidebarMobile)}>
               <Users className="h-4 w-4" />
             </Button>
             <div className="h-9 w-9 rounded-full bg-accent/5 flex items-center justify-center border border-accent/10 shrink-0">
                {activeChannel?.type === 'direct' ? <AtSign className="h-4 w-4 text-accent" /> : <Hash className="h-4 w-4 text-accent" />}
             </div>
             <div className="min-w-0">
                <h2 className="font-bold text-sm md:text-base truncate leading-tight">{activeChannel?.name || "Selecione uma conversa"}</h2>
                <p className="text-[11px] text-muted-foreground truncate">{activeChannel?.description || "Início da conversa"}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isGestor && (
                <Button variant="outline" size="sm" onClick={() => setAuditOpen(true)} className="h-8 gap-1.5 rounded-full border-border/60 text-xs font-bold hover:bg-accent hover:text-accent-foreground transition-all">
                    <ShieldCheck className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Auditoria</span>
                </Button>
            )}
          </div>
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-sm">Nenhuma mensagem ainda neste canal.</p>
              <p className="text-xs text-muted-foreground mt-1">Envie uma mensagem abaixo para iniciar a conversa.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const sender = profiles[msg.sender_id];
              const prev = messages[idx - 1];
              const isMe = msg.sender_id === user?.id;
              const isSameAuthor = prev?.sender_id === msg.sender_id && 
                (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 120000;

              return (
                <div key={msg.id} className={cn(
                  "group relative flex gap-3 hover:bg-muted/30 transition-colors py-1.5 px-3 md:px-6 rounded-lg -mx-3 md:-mx-6",
                  !isSameAuthor ? "mt-4" : "mt-0"
                )}>
                  
                  {/* Floating Actions */}
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
                              {(sender?.full_name || "?").slice(0, 2).toUpperCase()}
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

        {/* Input Area (Fixed at bottom) */}
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
                        placeholder={`Enviar mensagem em #${activeChannel?.name || "..."}`}
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
      </div>

      {/* ── Dialogs ── */}
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
            <Button onClick={sendAudit} className="w-full bg-gradient-primary">Encaminhar para o Setor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
