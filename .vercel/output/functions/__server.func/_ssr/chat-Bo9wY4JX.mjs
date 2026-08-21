import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, P as Plus, S as Search, j as Trash2, d as LoaderCircle, g as Send, b as CircleAlert } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, ai as supabase, b as Button, a3 as cn, C as Card, B as Badge, $ as X, D as Dialog, o as DialogContent, r as DialogHeader, s as DialogTitle, L as Label$1, q as DialogFooter, a8 as createLucideIcon, aj as toast } from "./router-Bktayy9l.mjs";
import { u as useRole } from "./useRole-CfzsBAW-.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { A as Avatar, b as AvatarImage, a as AvatarFallback } from "./avatar-BK5WUjQQ.mjs";
import { S as ShieldCheck } from "./shield-check-B9wdJrTU.mjs";
import { E as EllipsisVertical } from "./ellipsis-vertical-DLjUckc2.mjs";
import { P as PenLine } from "./pen-line-CFs4a1Rv.mjs";
import { F as File, P as Paperclip } from "./paperclip-BgIjAsfH.mjs";
import { D as Download } from "./download-DABr9rdP.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
import "./index-CxZfSfQO.mjs";
const __iconNode$4 = [
  ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }],
  ["path", { d: "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8", key: "7n84p3" }]
];
const AtSign = createLucideIcon("at-sign", __iconNode$4);
const __iconNode$3 = [
  ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1", key: "tgr4d6" }],
  [
    "path",
    {
      d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
      key: "116196"
    }
  ],
  ["path", { d: "m9 14 2 2 4-4", key: "df797q" }]
];
const ClipboardCheck = createLucideIcon("clipboard-check", __iconNode$3);
const __iconNode$2 = [
  ["line", { x1: "4", x2: "20", y1: "9", y2: "9", key: "4lhtct" }],
  ["line", { x1: "4", x2: "20", y1: "15", y2: "15", key: "vyu0kd" }],
  ["line", { x1: "10", x2: "8", y1: "3", y2: "21", key: "1ggp8o" }],
  ["line", { x1: "16", x2: "14", y1: "3", y2: "21", key: "weycgp" }]
];
const Hash = createLucideIcon("hash", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "M20 18v-2a4 4 0 0 0-4-4H4", key: "5vmcpk" }],
  ["path", { d: "m9 17-5-5 5-5", key: "nvlc11" }]
];
const Reply = createLucideIcon("reply", __iconNode$1);
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M8 14s1.5 2 4 2 4-2 4-2", key: "1y1vjs" }],
  ["line", { x1: "9", x2: "9.01", y1: "9", y2: "9", key: "yxxnd0" }],
  ["line", { x1: "15", x2: "15.01", y1: "9", y2: "9", key: "1p4y9e" }]
];
const Smile = createLucideIcon("smile", __iconNode);
const REACTIONS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];
function ChatPage() {
  const {
    user
  } = useAuth();
  const {
    isGestor
  } = useRole();
  const [channels, setChannels] = reactExports.useState([]);
  const [activeChannel, setActiveChannel] = reactExports.useState(null);
  const [messages, setMessages] = reactExports.useState([]);
  const [profiles, setProfiles] = reactExports.useState({});
  const [text, setText] = reactExports.useState("");
  const [replyTo, setReplyTo] = reactExports.useState(null);
  const [editingMsg, setEditingMsg] = reactExports.useState(null);
  const [editText, setEditText] = reactExports.useState("");
  const [uploading, setUploading] = reactExports.useState(false);
  const [sending, setSending] = reactExports.useState(false);
  const [newChanOpen, setNewChanOpen] = reactExports.useState(false);
  const [newChan, setNewChan] = reactExports.useState({
    name: "",
    description: "",
    type: "general"
  });
  const [auditOpen, setAuditOpen] = reactExports.useState(false);
  const [auditForm, setAuditForm] = reactExports.useState({
    os: "",
    report: ""
  });
  const bottomRef = reactExports.useRef(null);
  const fileRef = reactExports.useRef(null);
  const loadChannels = reactExports.useCallback(async () => {
    const {
      data
    } = await supabase.from("chat_channels").select("*").eq("is_archived", false);
    if (data) {
      setChannels(data);
      if (!activeChannel && data.length > 0) setActiveChannel(data[0]);
    }
  }, [activeChannel]);
  const loadMessages = reactExports.useCallback(async (channelId) => {
    const query = supabase.from("chat_messages").select(`*, attachments:chat_attachments(*), reactions:chat_reactions(*), audit:chat_audits(*)`).eq("channel_id", channelId).eq("is_deleted", false).order("created_at", {
      ascending: true
    });
    const {
      data
    } = await query;
    if (!data) return;
    const ids = [...new Set(data.map((m) => m.sender_id))];
    if (ids.length) {
      const {
        data: ps
      } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids);
      if (ps) setProfiles((prev) => ({
        ...prev,
        ...Object.fromEntries(ps.map((p) => [p.id, p]))
      }));
    }
    const processed = data.map((m) => ({
      ...m,
      audit: m.audit && m.audit.length > 0 ? m.audit[0] : null
    }));
    setMessages(processed);
  }, []);
  reactExports.useEffect(() => {
    loadChannels();
  }, []);
  reactExports.useEffect(() => {
    if (!activeChannel) return;
    loadMessages(activeChannel.id);
    const sub = supabase.channel(`chat:${activeChannel.id}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "chat_messages",
      filter: `channel_id=eq.${activeChannel.id}`
    }, () => loadMessages(activeChannel.id)).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "chat_reactions"
    }, () => loadMessages(activeChannel.id)).subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [activeChannel?.id]);
  reactExports.useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  const sendMessage = async () => {
    if (!text.trim() && !uploading || !activeChannel || !user || sending) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      channel_id: activeChannel.id,
      sender_id: user.id,
      content: text.trim() || "",
      reply_to_id: replyTo?.id ?? null,
      type: "text"
    });
    setSending(false);
    setText("");
    setReplyTo(null);
  };
  const sendAudit = async () => {
    if (!auditForm.os || !auditForm.report || !activeChannel || !user) return;
    setSending(true);
    const {
      data: msg
    } = await supabase.from("chat_messages").insert({
      channel_id: activeChannel.id,
      sender_id: user.id,
      content: "",
      type: "audit"
    }).select().single();
    if (msg) {
      await supabase.from("chat_audits").insert({
        message_id: msg.id,
        channel_id: activeChannel.id,
        os_number: auditForm.os,
        report_content: auditForm.report,
        created_by: user.id
      });
    }
    setSending(false);
    setAuditOpen(false);
    setAuditForm({
      os: "",
      report: ""
    });
  };
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChannel || !user) return;
    setUploading(true);
    const path = `chat/${activeChannel.id}/${Date.now()}_${file.name}`;
    await supabase.storage.from("attachments").upload(path, file);
    const {
      data: msg
    } = await supabase.from("chat_messages").insert({
      channel_id: activeChannel.id,
      sender_id: user.id,
      content: "",
      type: "text"
    }).select().single();
    if (msg) {
      await supabase.from("chat_attachments").insert({
        message_id: msg.id,
        channel_id: activeChannel.id,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: path,
        file_type: file.type,
        file_size: file.size
      });
    }
    setUploading(false);
  };
  const deleteMessage = async (id) => {
    if (!confirm("Excluir esta mensagem permanentemente?")) return;
    const {
      error
    } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Mensagem excluída");
      if (activeChannel) loadMessages(activeChannel.id);
    }
  };
  const toggleReaction = async (msgId, emoji) => {
    if (!user) return;
    const existing = messages.find((m) => m.id === msgId)?.reactions?.find((r) => r.emoji === emoji && r.user_id === user.id);
    const table = supabase.from("chat_reactions");
    if (existing) {
      await table.delete().eq("message_id", msgId).eq("user_id", user.id).eq("emoji", emoji);
    } else {
      await table.insert({
        message_id: msgId,
        user_id: user.id,
        emoji
      });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full w-full bg-background overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "w-72 flex flex-col border-r border-border/60 bg-muted/20 shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold shadow-sm", children: "E" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-bold text-lg tracking-tight", children: "Chat" })
        ] }),
        isGestor && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", onClick: () => setNewChanOpen(true), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-accent transition" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar conversas...", className: "h-9 pl-9 bg-muted/50 border-transparent focus:bg-background transition-all rounded-full text-xs" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex-1 overflow-y-auto mt-2", children: ["general", "department", "direct"].map((type) => {
        const group = channels.filter((c) => c.type === type);
        if (!group.length) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 mb-1 flex items-center justify-between group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60", children: type === "general" ? "Canais" : type === "department" ? "Setores" : "Mensagens" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer transition" })
          ] }),
          group.map((ch) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveChannel(ch), className: cn("w-full flex items-center gap-3 px-5 py-2 text-sm transition-all relative group", activeChannel?.id === ch.id ? "bg-accent/10 text-accent font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-accent" : "text-muted-foreground hover:bg-muted/50"), children: [
            type === "direct" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-5 rounded-full bg-muted border flex items-center justify-center text-[10px]", children: ch.name.slice(0, 1) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { className: "h-4 w-4 opacity-40" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: ch.name })
          ] }, ch.id))
        ] }, type);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col min-w-0 bg-background relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "h-14 border-b border-border/60 flex items-center justify-between px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full bg-accent/5 flex items-center justify-center border border-accent/10", children: activeChannel?.type === "direct" ? /* @__PURE__ */ jsxRuntimeExports.jsx(AtSign, { className: "h-5 w-5 text-accent" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { className: "h-5 w-5 text-accent" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold text-base truncate leading-tight", children: activeChannel?.name || "Selecione uma conversa" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground truncate", children: activeChannel?.description || "Início da conversa" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          isGestor && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setAuditOpen(true), className: "h-8 gap-2 rounded-full border-border/60 text-xs font-bold hover:bg-accent hover:text-accent-foreground transition-all", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3.5 w-3.5" }),
            " Auditoria"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "h-4 w-4" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-8 py-6 space-y-1", children: [
        messages.map((msg, idx) => {
          const sender = profiles[msg.sender_id];
          const prev = messages[idx - 1];
          const isMe = msg.sender_id === user?.id;
          const isSameAuthor = prev?.sender_id === msg.sender_id && new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 12e4;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("group relative flex gap-3 hover:bg-muted/30 transition-colors py-1.5 px-6 rounded-lg -mx-6", !isSameAuthor ? "mt-5" : "mt-0"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-6 top-1 opacity-0 group-hover:opacity-100 flex items-center bg-background border rounded-lg shadow-elegant z-20 p-1 transition-all duration-200", children: [
              REACTIONS.slice(0, 4).map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toggleReaction(msg.id, e), className: "h-7 w-7 flex items-center justify-center hover:bg-muted rounded text-sm transition-transform hover:scale-110", children: e }, e)),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-4 bg-border mx-1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setReplyTo(msg), className: "h-7 w-7 flex items-center justify-center hover:bg-muted rounded transition-colors", title: "Responder", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Reply, { className: "h-3.5 w-3.5 text-muted-foreground" }) }),
              (isMe || isGestor) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                isMe && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
                  setEditingMsg(msg);
                  setEditText(msg.content || "");
                }, className: "h-7 w-7 flex items-center justify-center hover:bg-muted rounded transition-colors", title: "Editar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3.5 w-3.5 text-muted-foreground" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => deleteMessage(msg.id), className: "h-7 w-7 flex items-center justify-center hover:bg-muted rounded transition-colors", title: "Excluir", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-destructive/60" }) })
              ] })
            ] }),
            !isSameAuthor ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-9 w-9 rounded-full shrink-0 mt-1 ring-2 ring-background border shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: sender?.avatar_url }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "bg-accent/10 text-accent font-bold text-xs", children: (sender?.full_name || "?").slice(0, 2).toUpperCase() })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 shrink-0 flex items-start justify-center pt-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity", children: new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              !isSameAuthor && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-[13px] text-foreground/90 hover:underline cursor-pointer", children: sender?.full_name || "Usuário" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground font-medium", children: new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                }) })
              ] }),
              editingMsg?.id === msg.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: editText, onChange: (e) => setEditText(e.target.value), className: "text-sm min-h-[60px] bg-muted/30", autoFocus: true }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => setEditingMsg(null), className: "h-7 text-[10px] font-bold", children: "CANCELAR" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: async () => {
                    await supabase.from("chat_messages").update({
                      content: editText,
                      is_edited: true
                    }).eq("id", msg.id);
                    setEditingMsg(null);
                    loadMessages(activeChannel.id);
                  }, className: "h-7 text-[10px] font-bold bg-accent", children: "SALVAR" })
                ] })
              ] }) : msg.type === "audit" && msg.audit ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "my-2 border border-accent/20 bg-accent/5 overflow-hidden max-w-xl shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-accent/10 px-3 py-1.5 flex items-center justify-between border-b border-accent/10", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardCheck, { className: "h-3.5 w-3.5 text-accent" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-accent", children: "Ordem de Auditoria Técnica" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-accent/80", children: [
                    "O.S #",
                    msg.audit.os_number
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm italic font-medium leading-relaxed text-foreground/80", children: [
                    '"',
                    msg.audit.report_content,
                    '"'
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-accent/5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] uppercase font-bold border-accent/20 text-accent h-5", children: msg.audit.status }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "h-7 text-[10px] font-bold text-accent hover:bg-accent/10 transition-colors", children: "GERENCIAR CORREÇÃO" })
                  ] })
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[14px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-words", children: msg.content }),
              msg.attachments?.map((att) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/30 hover:bg-muted/50 transition cursor-pointer max-w-md group/file", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-lg bg-background flex items-center justify-center text-accent shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(File, { className: "h-5 w-5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate", children: att.file_name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                    (att.file_size / 1024).toFixed(1),
                    " KB"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 text-muted-foreground opacity-0 group-hover/file:opacity-100 transition" })
              ] }, att.id)),
              msg.reactions && msg.reactions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: Object.entries(msg.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {})).map(([emoji, count]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toggleReaction(msg.id, emoji), className: "flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-muted/40 hover:bg-muted hover:border-accent/30 transition text-[11px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: emoji }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold opacity-60", children: count })
              ] }, emoji)) })
            ] })
          ] }, msg.id);
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: bottomRef, className: "h-10" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "px-8 pb-8 pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto", children: [
        replyTo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 py-2 bg-accent/5 border-x border-t rounded-t-2xl text-[11px] border-accent/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 truncate", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Reply, { className: "h-3 w-3 text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-accent", children: [
              profiles[replyTo.sender_id]?.full_name,
              ":"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground truncate", children: replyTo.content || "Mídia" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3 cursor-pointer hover:text-destructive", onClick: () => setReplyTo(null) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("bg-muted/40 border border-border/60 shadow-sm focus-within:shadow-md focus-within:border-accent/40 transition-all p-2", replyTo ? "rounded-b-3xl rounded-t-none" : "rounded-3xl"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: text, onChange: (e) => setText(e.target.value), onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }, placeholder: `Enviar mensagem em #${activeChannel?.name || "..."}`, rows: 1, className: "min-h-[44px] max-h-[200px] border-0 bg-transparent focus-visible:ring-0 resize-none px-4 py-3 text-sm" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-2 pt-1 pb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileRef, type: "file", className: "hidden", onChange: handleFile }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9 rounded-full hover:bg-background text-muted-foreground hover:text-accent transition", onClick: () => fileRef.current?.click(), children: uploading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Paperclip, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9 rounded-full hover:bg-background text-muted-foreground hover:text-accent transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Smile, { className: "h-4 w-4" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !text.trim() || sending, onClick: sendMessage, className: "h-9 w-9 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow p-0 shrink-0", children: sending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4 ml-0.5" }) })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: auditOpen, onOpenChange: setAuditOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5 text-accent" }),
        " Auditoria Técnica"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-accent/5 border border-accent/10 rounded-lg text-xs text-muted-foreground flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-accent shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Relate problemas ou correções necessárias em Ordens de Serviço (OS) diretamente para a equipe." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Número da O.S" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: auditForm.os, onChange: (e) => setAuditForm({
            ...auditForm,
            os: e.target.value
          }), placeholder: "Ex: OS-2026-X" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Relatório de Correção" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: auditForm.report, onChange: (e) => setAuditForm({
            ...auditForm,
            report: e.target.value
          }), placeholder: "O que precisa ser arrumado?", rows: 4 })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: sendAudit, className: "w-full bg-gradient-primary", children: "Encaminhar para o Setor" }) })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChatPage, {}) });
export {
  SplitComponent as component
};
