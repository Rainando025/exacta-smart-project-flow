import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Send, Bot, User, Loader2, X, MessageSquare,
  Settings2, Key, CheckCircle2, AlertCircle, RefreshCw,
  Maximize2, Minimize2, Trash2, HelpCircle, ExternalLink, Lightbulb
} from "lucide-react";
import { askAI, getAIConfig, saveAIConfig, testAIConnection, type AIConfig } from "@/lib/ai";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const STORAGE_CHAT_KEY = "exacta_ai_chat_messages";

export function AIChat({ contextData }: { contextData?: any }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "welcome-1",
        role: "assistant",
        content: "­ƒæï Olá! Sou o **Agente IA da EXACTA**.\n\nEstou pronto para analisar seus projetos, calcular prazos, diagnosticar gargalos e sugerir planos de ação. Como posso te ajudar hoje?",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // AI config state
  const [aiConfig, setAiConfigState] = useState<AIConfig>(getAIConfig);
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [groqKeyInput, setGroqKeyInput] = useState("");
  const [preferredProviderInput, setPreferredProviderInput] = useState<"gemini" | "groq" | "auto">("auto");
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Scroll to bottom on message
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, isOpen]);

  const openSettings = () => {
    const cfg = getAIConfig();
    setAiConfigState(cfg);
    setGeminiKeyInput(cfg.geminiKey || "");
    setGroqKeyInput(cfg.groqKey || "");
    setPreferredProviderInput(cfg.preferredProvider || "auto");
    setTestResult(null);
    setSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    const updated = saveAIConfig({
      geminiKey: geminiKeyInput.trim(),
      groqKey: groqKeyInput.trim(),
      preferredProvider: preferredProviderInput,
    });
    setAiConfigState(updated);
    toast.success("Configurações de IA salvas com sucesso!");
    setSettingsOpen(false);
  };

  const handleTestKey = async (provider: "gemini" | "groq") => {
    setTestingProvider(provider);
    setTestResult(null);
    const key = provider === "gemini" ? geminiKeyInput : groqKeyInput;
    const res = await testAIConnection(provider, key);
    setTestingProvider(null);
    setTestResult({ provider, success: res.success, message: res.message });
    if (res.success) {
      toast.success(`Chave ${provider.toUpperCase()} validada com sucesso!`);
    } else {
      toast.error(res.message);
    }
  };

  const handleClearHistory = () => {
    const initial: Message[] = [
      {
        id: "welcome-new",
        role: "assistant",
        content: "Histórico limpo. Como posso ajudar com seus projetos agora?",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }
    ];
    setMessages(initial);
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(initial));
    } catch {}
    toast.success("Conversa reiniciada");
  };

  const handleSend = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    const userMessage: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: promptText,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const fullPrompt = `
        Contexto do Usuário e Sistema EXACTA (JSON): ${JSON.stringify(contextData || {})}
        
        Solicitação do Usuário: ${promptText}
        
        Você é o assistente oficial de gestão inteligente de projetos e produtividade da EXACTA.
        Seja analítico, objetivo, propositivo e responda em português brasileiro com formatação Markdown limpa e elegante.
      `;

      const aiResponse = await askAI(fullPrompt, "chat_interaction");

      const botMessage: Message = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      toast.error("Erro ao obter resposta da IA");
      setMessages((prev) => [
        ...prev,
        {
          id: "bot-err-" + Date.now(),
          role: "assistant",
          content: "ÔÜá´©Å Tive uma instabilidade ao processar sua pergunta. Verifique suas chaves de API nas configurações ou tente novamente.",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "­ƒöì Diagnosticar gargalos atuais",
    "­ƒôà Estruturar cronograma de entrega",
    "ÔÜí Dicas para acelerar tarefas atrasadas",
    "­ƒÄ» Sugerir metas e OKRs trimestrais"
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 px-5 rounded-full bg-gradient-primary shadow-glow hover:shadow-elegant transition-all duration-300 gap-3 border border-white/20 group animate-in fade-in zoom-in-90"
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-black tracking-wider uppercase text-primary-foreground leading-tight">Agente IA</p>
              <p className="text-[10px] text-primary-foreground/80 font-medium leading-tight">EXACTA Copilot</p>
            </div>
          </Button>
        )}
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed z-50 shadow-2xl border-white/15 bg-card/95 backdrop-blur-2xl transition-all duration-300 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in",
          isExpanded
            ? "bottom-4 right-4 left-4 top-16 sm:left-auto sm:w-[680px] sm:h-[85vh] sm:top-auto sm:bottom-4"
            : "bottom-6 right-6 w-[92vw] sm:w-[440px] h-[580px] max-h-[90vh] rounded-2xl"
        )}>
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-primary/20 via-accent/15 to-transparent border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-inner">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm leading-none">Agente IA EXACTA</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/20 text-accent border border-accent/30">
                    {aiConfig.geminiKey ? "Gemini" : aiConfig.groqKey ? "Groq" : "Ativo"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Assistente Executivo de Gestão</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                title="Configurar Chaves de IA"
                onClick={openSettings}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                title="Limpar Conversa"
                onClick={handleClearHistory}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg hidden sm:flex"
                title={isExpanded ? "Reduzir" : "Expandir"}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                title="Fechar"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-2.5 max-w-[90%]",
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-sm",
                    isUser ? "bg-accent text-accent-foreground" : "bg-muted/80 text-foreground border border-white/10"
                  )}>
                    {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-accent" />}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm",
                        isUser
                          ? "bg-accent text-accent-foreground font-medium rounded-tr-none"
                          : "bg-muted/50 border border-white/10 text-foreground rounded-tl-none prose prose-invert prose-xs max-w-none"
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <div className="space-y-2">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] text-muted-foreground block px-1",
                      isUser ? "text-right" : "text-left"
                    )}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 mr-auto">
                <div className="h-7 w-7 rounded-lg bg-muted/80 border border-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-accent animate-spin" />
                </div>
                <div className="bg-muted/50 border border-white/10 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  <span className="text-xs text-muted-foreground font-medium">Analisando dados do projeto...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions (if only welcome message) */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-white/5 bg-muted/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-accent" /> Sugestões Rápidas:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(s.replace(/^[^\s]+\s/, ""))}
                    className="text-[11px] bg-muted/40 hover:bg-accent/20 hover:text-accent border border-white/5 rounded-lg px-2.5 py-1 text-left transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-white/10 bg-card/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre tarefas, gargalos, prazos ou estratégias..."
                disabled={loading}
                className="h-10 text-xs sm:text-sm bg-muted/30 border-white/10 focus:border-accent/40 rounded-xl"
              />
              <Button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-10 px-4 bg-gradient-primary text-primary-foreground shadow-glow rounded-xl font-bold gap-1.5 shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* AI Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5 text-accent" />
              Configuração do Agente IA
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure chaves de API para Google Gemini ou Groq para liberar todo o potencial generativo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preferred Provider */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Provedor Preferencial
              </Label>
              <Select
                value={preferredProviderInput}
                onValueChange={(val: any) => setPreferredProviderInput(val)}
              >
                <SelectTrigger className="h-9 bg-muted/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático (Groq se disponível, senão Gemini)</SelectItem>
                  <SelectItem value="gemini">Google Gemini 1.5 Flash</SelectItem>
                  <SelectItem value="groq">Groq (Llama 3.3 70B - Ultra Rápido)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gemini Key */}
            <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-white/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-accent" /> Google Gemini API Key
                </Label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-accent hover:underline flex items-center gap-1"
                >
                  Obter grátis <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  className="h-8 text-xs bg-muted/40 border-white/10"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingProvider === "gemini" || !geminiKeyInput.trim()}
                  onClick={() => handleTestKey("gemini")}
                  className="h-8 text-xs shrink-0"
                >
                  {testingProvider === "gemini" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Testar"}
                </Button>
              </div>
            </div>

            {/* Groq Key */}
            <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-white/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-accent" /> Groq API Key
                </Label>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-accent hover:underline flex items-center gap-1"
                >
                  Obter grátis <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="gsk_..."
                  value={groqKeyInput}
                  onChange={(e) => setGroqKeyInput(e.target.value)}
                  className="h-8 text-xs bg-muted/40 border-white/10"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingProvider === "groq" || !groqKeyInput.trim()}
                  onClick={() => handleTestKey("groq")}
                  className="h-8 text-xs shrink-0"
                >
                  {testingProvider === "groq" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Testar"}
                </Button>
              </div>
            </div>

            {/* Test Feedback */}
            {testResult && (
              <div className={cn(
                "p-2.5 rounded-lg text-xs flex items-start gap-2 border",
                testResult.success
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              )}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-tight">{testResult.message}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-white/5">
            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveSettings} className="bg-gradient-primary shadow-glow font-bold">
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
