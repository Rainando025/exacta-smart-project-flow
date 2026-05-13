import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/okrs")({
  component: () => <AppShell><OKRsPage /></AppShell>,
});

function OKRsPage() {
  const { user } = useAuth();
  const [okrs, setOkrs] = useState<any[]>([]);

  const load = async () => {
    // Mock data for demo since table might not exist
    const mockOKRs = [
      { id: "1", objective: "Aumentar faturamento em 20%", progress: 65, status: "em_andamento", kr: "Atingir R$ 500k em vendas" },
      { id: "2", objective: "Lançar novo módulo de IA", progress: 90, status: "quase_la", kr: "Integrar Gemini e Groq" },
      { id: "3", objective: "Melhorar satisfação do cliente", progress: 40, status: "atrasado", kr: "NPS acima de 70" }
    ];
    setOkrs(mockOKRs);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Estratégia</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Metas e OKRs</h1>
          <p className="text-muted-foreground mt-2">Alinhamento estratégico e resultados-chave.</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground gap-2">
          <Plus className="h-4 w-4" /> Novo OKR
        </Button>
      </header>

      <div className="grid gap-6">
        {okrs.map((okr) => (
          <Card key={okr.id} className="p-6 shadow-card border-l-4 border-l-accent">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl">{okr.objective}</h3>
                  <p className="text-sm text-muted-foreground">KR: {okr.kr}</p>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {okr.status.replace("_", " ")}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Progresso Geral</span>
                <span className="font-bold">{okr.progress}%</span>
              </div>
              <Progress value={okr.progress} className="h-2" />
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-success" /> 
                <span>+5% desde a última semana</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> 
                <span>2 de 4 tarefas concluídas</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
