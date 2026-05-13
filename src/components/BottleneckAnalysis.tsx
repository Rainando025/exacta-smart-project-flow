import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap, Loader2, BarChart3, RefreshCw } from "lucide-react";
import { askGroq, askGemini } from "@/lib/ai";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export function BottleneckAnalysis({ data }: { data: any }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `
        Analise os seguintes dados do sistema de gestão EXACTA e identifique GARGALOS (problemas de produtividade, atrasos, sobrecarga).
        Dados: ${JSON.stringify(data)}
        
        Para cada gargalo encontrado:
        1. Descreva o problema.
        2. Explique o impacto.
        3. Sugira como solucionar/selecionar a melhor abordagem.
        
        Use um tom profissional, direto e executivo. Responda em Markdown com emojis.
      `;
      
      let response;
      try {
        response = await askGroq(prompt);
      } catch {
        response = await askGemini(prompt);
      }
      setAnalysis(response || "Não foi possível gerar a análise.");
    } catch (error) {
      toast.error("Erro ao analisar gargalos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 shadow-card border-destructive/20 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <AlertTriangle className="h-24 w-24 text-destructive" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Análise de Gargalos</h3>
              <p className="text-sm text-muted-foreground">Identifique problemas antes que eles parem seu time.</p>
            </div>
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90 gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Analisar Agora
          </Button>
        </div>

        {analysis ? (
          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{analysis}</ReactMarkdown>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)} className="text-xs uppercase tracking-widest">Limpar</Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground">
            <Zap className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">Clique em "Analisar Agora" para processar os dados com IA.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
