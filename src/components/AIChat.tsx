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
import { askAI, getAIConfig, saveAIConfig, testAIConnection, AIConfig } from "@/lib/ai";
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
        content: "👋 Olá! Sou o **Agente IA da EXACTA**.\n\nEstou pronto para analisar seus projetos, calcular prazos, diagnosticar gargalos e sugerir planos de ação. Como posso te ajudar hoje?",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Key configuration state
  const [aiConfig, setAiConfigState] = useState<AIConfig>(getAIConfig);
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [groqKeyInput, setGroqKeyInput] = useState("");
  const [testingKey, setTestingKey] = useState<"gemini" | "groq" | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {}
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const openSettings = () => {
    const cfg = getAIConfig();
    setAiConfigState(cfg);
    setGeminiKeyInput(cfg.geminiKey || "");
    setGroqKeyInput(cfg.groqKey || "");
    setTestResult(null);
    setSettingsOpen(true);
  };

  const handleSaveKeys = () => {
    const updated = saveAIConfig({
      geminiKey: geminiKeyInput.trim(),
      groqKey: groqKeyInput.trim(),
      preferredProvider: aiConfig.preferredProvider,
    });
    setAiConfigState(updated);
    toast.success("Configurações de IA salvas com sucesso!");
    setSettingsOpen(false);
  };

  const handleTestProvider = async (provider: "gemini" | "groq") => {
    setTestingKey(provider);
    setTestResult(null);
    const keyToTest = provider === "gemini" ? geminiKeyInput : groqKeyInput;
    const res = await testAIConnection(provider, keyToTest);
    setTestingKey(null);
    setTestResult({ provider, success: res.success, message: res.message });
    if (res.success) {
      toast.success(`Chave ${provider.toUpperCase()} validada com sucesso!`);
    } else {
      toast.error(res.message);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    setInput("");
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const fullPrompt = `
Contexto Geral do Usuário no Sistema EXACTA (JSON):
${JSON.stringify(contextData || {})}

Mensagem do Usuário:
${userMsg.content}

Instruções para a IA:
- Aja como um especialista em Gestão de Projetos Ágeis e Estratégicos do EXACTA.
- Responda em Português do Brasil de forma clara, profissional, prática e bem estruturada com Markdown (títulos, listas com marcadores e negrito).
- Dê orientações acionáveis.
`;

      const aiText = await askAI(fullPrompt, contextData);

      const assistantMsg: Message = {
        id: "msg-ai-" + Date.now(),
        role: "assistant",
        content: aiText || "Não foi possível processar a resposta no momento.",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: "msg-err-" + Date.now(),
        role: "assistant",
        content: `⚠️ **Aviso de Conexão:** ${error?.message || "Erro ao consultar a IA."}\n\nVocê pode cadastrar sua chave gratuita do **Google Gemini** ou **Groq** clicando no ícone de engrenagem ⚙️ acima.`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    const initial: Message = {
      id: "welcome-1",
      role: "assistant",
      content: "Histórico limpo. Como posso te apoiar agora?",
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
    setMessages([initial]);
    try {
      localStorage.removeItem(STORAGE_CHAT_KEY);
    } catch {}
    toast.info("Histórico de conversa reiniciado");
  };

  const quickPrompts = [
    { label: "📊 Resumo de Prazos", prompt: "Faça um resumo dos meus prazos e tarefas prioritárias desta semana." },
    { label: "⚡ Identificar Gargalos", prompt: "Analise possíveis gargalos e me recomende 3 ações para destravar projetos." },
    { label: "📅 Dicas de Produtividade", prompt: "Quais as melhores práticas para organizar meu calendário e reuniões?" },
    { label: "🎯 Gerar Plano de Ação", prompt: "Monte um plano de ação ágil em 3 etapas para entregar o projeto atual no prazo." },
  ];

  const hasConfiguredKey = Boolean(aiConfig.geminiKey || aiConfig.groqKey);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
        <button
          onClick={() => setIsOpen(true)}
          className="relative h-14 w-14 rounded-full bg-gradient-to-r from-accent via-indigo-500 to-purple-600 text-white shadow-glow hover:shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 animate-in fade-in"
          title="Abrir Agente IA EXACTA"
        >
          <Sparkles className="h-6 w-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-background"></span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      <Card
        className={cn(
          "fixed bottom-6 right-6 z-50 flex flex-col shadow-2xl border-white/10 backdrop-blur-2xl bg-card/95 overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-6",
          isExpanded
            ? "w-[min(90vw,700px)] h-[min(85vh,750px)]"
            : "w-[min(95vw,420px)] h-[min(80vh,560px)]"
        )}
      >
        {/* Header */}
        <header className="p-3.5 bg-gradient-to-r from-accent/90 via-indigo-600/90 to-purple-700/90 text-white flex items-center justify-between shadow-md select-none">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm leading-none">Agente IA EXACTA</h3>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                  hasConfiguredKey ? "bg-emerald-500/30 text-emerald-100 border border-emerald-400/30" : "bg-blue-500/30 text-blue-100 border border-blue-400/30"
                )}>
                  {hasConfiguredKey ? "Online" : "Smart Fallback"}
                </span>
              </div>
              <p className="text-[10px] text-white/75 mt-0.5">Assistente de Projetos & Produtividade</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/15 rounded-md"
              onClick={openSettings}
              title="Configurar Chaves de IA (Gemini / Groq)"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/15 rounded-md"
              onClick={handleClearHistory}
              title="Limpar Histórico"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/15 rounded-md hidden sm:inline-flex"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Reduzir" : "Expandir"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/15 rounded-md"
              onClick={() => setIsOpen(false)}
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Message Area */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/20">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex flex-col animate-in fade-in duration-300",
                m.role === "user" ? "items-end" : "items-start"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-muted-foreground">
                {m.role === "user" ? (
                  <>
                    <span>Você</span>
                    <User className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3 text-accent" />
                    <span className="font-bold text-accent">EXACTA IA</span>
                  </>
                )}
                <span>• {m.timestamp}</span>
              </div>

              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm",
                  m.role === "user"
                    ? "bg-accent text-accent-foreground font-medium rounded-tr-none"
                    : "bg-card border border-white/10 text-card-foreground rounded-tl-none prose prose-xs dark:prose-invert prose-p:my-1 prose-headings:my-1.5 prose-ul:my-1 prose-li:my-0.5"
                )}
              >
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex flex-col items-start animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-muted-foreground">
                <Bot className="h-3 w-3 text-accent" />
                <span className="font-bold text-accent">EXACTA IA está pensando...</span>
              </div>
              <div className="bg-card border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="text-xs text-muted-foreground">Processando análise inteligente...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-background/80 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp.prompt)}
              disabled={loading}
              className="text-[10px] font-medium whitespace-nowrap px-2.5 py-1 rounded-full bg-muted hover:bg-accent/15 hover:text-accent border border-white/5 transition-all text-muted-foreground active:scale-95"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Footer Input */}
        <footer className="p-3 border-t border-white/10 bg-card/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Digite sua dúvida ou instrução para a IA..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="h-10 text-xs bg-muted/40 border-white/10 focus:border-accent"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-10 px-4 bg-gradient-to-r from-accent to-indigo-600 shadow-glow shrink-0 font-bold gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </footer>
      </Card>

      {/* AI Key Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card/98 backdrop-blur-2xl border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Key className="h-5 w-5 text-accent" />
              Configuração do Agente de IA
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conecte suas chaves de API do <strong>Google Gemini</strong> ou <strong>Groq</strong> para ativar o modelo de linguagem de última geração sem limites.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3 text-xs">
            {/* Gemini Section */}
            <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-white/5">
              <div className="flex items-center justify-between">
                <Label className="font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Google Gemini API Key
                </Label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-accent flex items-center gap-1 hover:underline font-medium"
                >
                  Obter chave grátis <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Cole sua chave AIzaSy..."
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  className="h-9 text-xs bg-background border-white/10"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestProvider("gemini")}
                  disabled={testingKey === "gemini" || !geminiKeyInput.trim()}
                  className="h-9 text-[11px] shrink-0"
                >
                  {testingKey === "gemini" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Testar"}
                </Button>
              </div>
            </div>

            {/* Groq Section */}
            <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-white/5">
              <div className="flex items-center justify-between">
                <Label className="font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Groq API Key (Ultra Rápido Llama 3.3)
                </Label>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-accent flex items-center gap-1 hover:underline font-medium"
                >
                  Obter chave grátis <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Cole sua chave gsk_..."
                  value={groqKeyInput}
                  onChange={(e) => setGroqKeyInput(e.target.value)}
                  className="h-9 text-xs bg-background border-white/10"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestProvider("groq")}
                  disabled={testingKey === "groq" || !groqKeyInput.trim()}
                  className="h-9 text-[11px] shrink-0"
                >
                  {testingKey === "groq" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Testar"}
                </Button>
              </div>
            </div>

            {/* Test Result feedback */}
            {testResult && (
              <div
                className={cn(
                  "p-3 rounded-xl flex items-start gap-2 text-xs",
                  testResult.success
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-destructive/10 border border-destructive/20 text-destructive"
                )}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-tight">{testResult.message}</span>
              </div>
            )}

            {/* Info note */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px]">
              <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
              <span>
                As chaves são guardadas localmente e com segurança no seu navegador. Caso não configure nenhuma chave, o sistema utilizará o motor inteligente heurístico integrado.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveKeys} className="bg-gradient-primary shadow-glow font-bold">
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
