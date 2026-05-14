import { createFileRoute } from "@tanstack/react-router";
import { FileText, Plus, Search, Star, Clock, FileEdit, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/docs")({
  component: () => <AppShell><DocsPage /></AppShell>,
});

function DocsPage() {
  const docs = [
    { id: 1, title: "POP - Onboarding de Clientes", type: "Processo", owner: "Marketing", updated: "3h atrás", starred: true },
    { id: 2, title: "Diretrizes de Marca EXACTA", type: "Design", owner: "Design", updated: "Ontem", starred: true },
    { id: 3, title: "Roteiro de Vendas Q2", type: "Vendas", owner: "Vendas", updated: "2 dias atrás", starred: false },
    { id: 4, title: "Manual de Infraestrutura", type: "TI", owner: "DevOps", updated: "1 semana atrás", starred: false },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          </div>
          <p className="text-muted-foreground">Crie e colabore em POPs, manuais e roteiros em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" /> Compartilhados
          </Button>
          <Button className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" /> Novo Documento
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl p-2 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar documentos, processos ou manuais..." className="pl-10 border-none bg-transparent focus-visible:ring-0" />
        </div>
        <div className="flex gap-1 pr-2">
          <Button variant="ghost" size="icon" className="h-8 w-8"><Clock className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Star className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 border-white/5 bg-sidebar/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Favoritos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {docs.filter(d => d.starred).map(d => (
              <div key={d.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer">
                <FileEdit className="h-4 w-4 text-accent" />
                <span className="text-sm truncate">{d.title}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Todos os Documentos</h2>
            <div className="flex gap-2">
               <Badge variant="outline" className="cursor-pointer hover:bg-accent/10">Processos</Badge>
               <Badge variant="outline" className="cursor-pointer hover:bg-accent/10">Manuais</Badge>
               <Badge variant="outline" className="cursor-pointer hover:bg-accent/10">Roteiros</Badge>
            </div>
          </div>

          <div className="grid gap-3">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-card/50 hover:bg-card hover:shadow-elegant transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium group-hover:text-accent transition-colors">{d.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-semibold text-accent/80">{d.type}</span>
                      <span>•</span>
                      <span>Proprietário: {d.owner}</span>
                      <span>•</span>
                      <span>{d.updated}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Share2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
