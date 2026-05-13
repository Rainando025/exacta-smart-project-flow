import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Bot, User, Loader2, X, MessageSquare } from "lucide-react";
import { askGroq, askGemini } from "@/lib/ai";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIChat({ contextData }: { contextData?: any }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Sou o assistente inteligente da EXACTA. Como posso ajudar com seus projetos hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const fullPrompt = `
        Contexto do Usuário (JSON): ${JSON.stringify(contextData || {})}
        Pergunta: ${userMessage}
        
        Aja como um consultor de gestão de projetos sênior. Seja conciso, profissional e use dados se disponíveis.
        Responda em Markdown.
      `;
      
      let aiResponse;
      try {
        aiResponse = await askGroq(fullPrompt);
      } catch {
        aiResponse = await askGemini(fullPrompt);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse || "Desculpe, tive um problema ao processar sua solicitação." }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erro na conexão com a IA. Verifique suas chaves de API." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:scale-110 transition-all z-50 animate-bounce-slow"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[400px] h-[500px] flex flex-col shadow-2xl z-50 border-accent/20 overflow-hidden animate-in slide-in-from-bottom-10">
      <header className="bg-gradient-primary p-4 text-primary-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="font-display font-bold">Assistente EXACTA IA</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 rounded-full p-1 transition">
          <X className="h-5 w-5" />
        </button>
      </header>

      <ScrollArea className="flex-1 p-4 bg-background">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user" 
                  ? "bg-accent text-accent-foreground" 
                  : "bg-muted text-foreground"
              }`}>
                <div className="flex items-center gap-1.5 mb-1 opacity-50">
                  {m.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  <span className="text-[10px] font-bold uppercase">{m.role === "user" ? "Você" : "IA"}</span>
                </div>
                <div className="prose prose-xs dark:prose-invert">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input 
            placeholder="Pergunte qualquer coisa..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon" className="shrink-0 bg-gradient-primary">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </Card>
  );
}
