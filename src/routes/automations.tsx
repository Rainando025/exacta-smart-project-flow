import { createFileRoute } from "@tanstack/react-router";
import {
  Cpu, Plus, Zap, Mail, UserPlus, ArrowRight, Settings2, Trash2,
  Loader2, RefreshCw, CheckCircle2, AlertCircle, Play, Clock, ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/automations")({
  component: () => <AppShell><AutomationsPage /></AppShell>,
});

interface Automation {
  id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, any> | null;
  action_type: string;
  action_config: Record<string, any> | null;
  is_active: boolean | null;
  created_by: string;
  created_at: string;
}

const TRIGGER_OPTIONS = [
  { value: "task_created", label: "Tarefa criada" },
  { value: "task_status_changed", label: "Status da tarefa alterado" },
  { value: "task_deadline_soon", label: "Prazo vencendo em < 24h" },
  { value: "task_assigned", label: "Tarefa atribuída a membro" },
  { value: "project_status_changed", label: "Status do projeto alterado" },
];

const ACTION_OPTIONS = [
  { value: "send_notification", label: "Enviar notificação" },
  { value: "change_priority", label: "Alterar prioridade da tarefa" },
  { value: "assign_member", label: "Atribuir membro à tarefa" },
  { value: "send_email", label: "Enviar e-mail" },
  { value: "move_to_status", label: "Mover tarefa de status" },
];

const TRIGGER_ICONS: Record<string, any> = {
  task_created: Plus,
  task_status_changed: ArrowRight,
  task_deadline_soon: AlertCircle,
  task_assigned: UserPlus,
  project_status_changed: ArrowDownRight,
};

const ACTION_ICONS: Record<string, any> = {
  send_notification: Zap,
  change_priority: AlertCircle,
  assign_member: UserPlus,
  send_email: Mail,
  move_to_status: ArrowRight,
};

const PREBUILT_TEMPLATES = [
  {
    id: "tpl_1",
    name: "Alerta de Prazo Próximo (24h)",
    description: "Notifica a equipe automaticamente quando o prazo de uma tarefa expirar em menos de 24h.",
    trigger_type: "task_deadline_soon",
    trigger_detail: "24 horas",
    action_type: "send_notification",
    action_detail: "Prazo da tarefa próximo",
    category: "Populares",
  },
  {
    id: "tpl_2",
    name: "Prioridade Urgente em Novas Tarefas",
    description: "Define automaticamente a prioridade como 'Alta' quando uma nova tarefa for criada.",
    trigger_type: "task_created",
    trigger_detail: "Todas as tarefas",
    action_type: "change_priority",
    action_detail: "Alta",
    category: "Produtividade",
  },
  {
    id: "tpl_3",
    name: "Notificar Colaborador ao Atribuir",
    description: "Envia notificação instantânea quando uma tarefa for atribuída a um membro.",
    trigger_type: "task_assigned",
    trigger_detail: "Membro da equipe",
    action_type: "send_notification",
    action_detail: "Você recebeu uma nova tarefa",
    category: "Comunicação",
  },
  {
    id: "tpl_4",
    name: "Alerta de Mudança de Status do Projeto",
    description: "Envia um e-mail para a gestão quando o status de um projeto for alterado.",
    trigger_type: "project_status_changed",
    trigger_detail: "Status do Projeto",
    action_type: "send_email",
    action_detail: "gestao@empresa.com",
    category: "Gestão",
  },
];

function getLabel(options: { value: string; label: string }[], value: string): string {
  return options.find(o => o.value === value)?.label || value;
}

function AutomationsPage() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [actionType, setActionType] = useState("");
  const [triggerDetail, setTriggerDetail] = useState("");
  const [actionDetail, setActionDetail] = useState("");

  const loadAutomations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("automations")
      .select("*")
      .order("created_at", { ascending: false });
    setAutomations((data || []) as Automation[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAutomations();
  }, [loadAutomations]);

  const handleActivateTemplate = async (tpl: typeof PREBUILT_TEMPLATES[0]) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("automations").insert({
      name: tpl.name,
      trigger_type: tpl.trigger_type,
      trigger_config: { detail: tpl.trigger_detail },
      action_type: tpl.action_type,
      action_config: { detail: tpl.action_detail },
      is_active: true,
      created_by: user.id,
    });
    setSaving(false);
    if (error) {
      toast.error(`Erro ao ativar modelo: ${error.message}`);
    } else {
      toast.success(`Automação "${tpl.name}" ativada!`);
      await loadAutomations();
    }
  };

  const handleCustomizeTemplate = (tpl: typeof PREBUILT_TEMPLATES[0]) => {
    setName(tpl.name);
    setTriggerType(tpl.trigger_type);
    setTriggerDetail(tpl.trigger_detail);
    setActionType(tpl.action_type);
    setActionDetail(tpl.action_detail);
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!user || !name.trim() || !triggerType || !actionType) return;
    setSaving(true);
    const { error } = await supabase.from("automations").insert({
      name: name.trim(),
      trigger_type: triggerType,
      trigger_config: triggerDetail ? { detail: triggerDetail } : null,
      action_type: actionType,
      action_config: actionDetail ? { detail: actionDetail } : null,
      is_active: true,
      created_by: user.id,
    });

    if (error) {
      toast.error(`Erro ao criar automação: ${error.message}`);
    } else {
      toast.success("Automação criada com sucesso!");
      setShowCreate(false);
      setName(""); setTriggerType(""); setActionType(""); setTriggerDetail(""); setActionDetail("");
      await loadAutomations();
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from("automations").update({ is_active: !current }).eq("id", id);
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("automations").delete().eq("id", id);
    if (!error) {
      setAutomations(prev => prev.filter(a => a.id !== id));
      setDeleteId(null);
      toast.success("Automação excluída.");
    }
  };

  const activeCount = automations.filter(a => a.is_active).length;

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Cpu className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Automações</h1>
          </div>
          <p className="text-muted-foreground">Automatize fluxos de trabalho, mudanças de status e notificações.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadAutomations}>
            <RefreshCw className="h-4 w-4 mr-1" />
          </Button>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:opacity-90"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Criar Automação
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="h-12 w-12 text-amber-500" />
          </div>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{automations.length}</CardTitle>
            <CardDescription>Total de automações</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-500 font-medium">{activeCount} ativas</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{activeCount}</CardTitle>
            <CardDescription>Automações ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">De {automations.length} configuradas</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{automations.length - activeCount}</CardTitle>
            <CardDescription>Automações inativas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Pausadas ou desativadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Pre-built Templates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Modelos Prontos de Automação</h2>
            <p className="text-xs text-muted-foreground">Escolha uma regra pré-configurada para ativar com 1 clique.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PREBUILT_TEMPLATES.map(tpl => {
            const TriggerIcon = TRIGGER_ICONS[tpl.trigger_type] || Zap;
            const ActionIcon = ACTION_ICONS[tpl.action_type] || Zap;
            return (
              <Card key={tpl.id} className="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300 relative group overflow-hidden">
                <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                          <TriggerIcon className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-sm text-foreground">{tpl.name}</h3>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold border-amber-500/30 text-amber-500">
                        {tpl.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{tpl.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <Badge variant="secondary" className="bg-background/60">SE: {getLabel(TRIGGER_OPTIONS, tpl.trigger_type)}</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">ENTÃO: {getLabel(ACTION_OPTIONS, tpl.action_type)}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <Button
                      size="sm"
                      onClick={() => handleActivateTemplate(tpl)}
                      disabled={saving}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold h-8"
                    >
                      <Zap className="h-3.5 w-3.5 mr-1" /> Ativar Modelo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCustomizeTemplate(tpl)}
                      className="text-xs h-8"
                    >
                      Personalizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Minhas Automações</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : automations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center bg-accent/5">
            <Cpu className="h-10 w-10 mx-auto mb-3 text-amber-500/40" />
            <h3 className="font-semibold mb-1">Nenhuma automação criada</h3>
            <p className="text-sm text-muted-foreground mb-4">Crie sua primeira automação para começar a poupar tempo.</p>
            <Button onClick={() => setShowCreate(true)} className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="mr-2 h-4 w-4" /> Criar Primeira Automação
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {automations.map(a => {
              const TriggerIcon = TRIGGER_ICONS[a.trigger_type] || Zap;
              const ActionIcon = ACTION_ICONS[a.action_type] || Zap;
              return (
                <Card
                  key={a.id}
                  className={`border-white/5 bg-card/30 hover:bg-card/50 transition-all duration-300 ${!a.is_active ? "opacity-60" : ""}`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-2xl bg-sidebar flex items-center justify-center text-amber-500 shadow-lg border border-white/5 flex-shrink-0">
                          <TriggerIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{a.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-white/5 text-[10px]">
                              SE: {getLabel(TRIGGER_OPTIONS, a.trigger_type)}
                              {a.trigger_config?.detail ? ` — ${a.trigger_config.detail}` : ""}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-[10px]">
                              ENTÃO: {getLabel(ACTION_OPTIONS, a.action_type)}
                              {a.action_config?.detail ? ` — ${a.action_config.detail}` : ""}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            Criada em {format(parseISO(a.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 border-l border-white/5 pl-6">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Status</span>
                            <Switch
                              checked={a.is_active ?? false}
                              onCheckedChange={() => handleToggle(a.id, a.is_active ?? false)}
                            />
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteId(a.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* External integrations CTA */}
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-accent/5">
        <Play className="h-8 w-8 mx-auto mb-3 text-accent/40" />
        <h3 className="font-semibold">Precisa de algo mais complexo?</h3>
        <p className="text-sm text-muted-foreground mb-4">Conecte com Zapier, Make ou use nossa API nativa para automações avançadas.</p>
        <Button variant="outline" size="sm">Explorar Integrações</Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-amber-500" />
              Nova Automação
            </DialogTitle>
            <DialogDescription>Configure o gatilho (SE) e a ação (ENTÃO) para criar uma regra automática.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da automação</Label>
              <Input
                placeholder="Ex: Auto-atribuir Designer"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SE (Gatilho)</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger><SelectValue placeholder="Escolha o gatilho" /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ENTÃO (Ação)</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger><SelectValue placeholder="Escolha a ação" /></SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Detalhe do gatilho (opcional)</Label>
                <Input
                  placeholder="Ex: projeto Marketing"
                  value={triggerDetail}
                  onChange={e => setTriggerDetail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Detalhe da ação (opcional)</Label>
                <Input
                  placeholder="Ex: @MarianaDesign"
                  value={actionDetail}
                  onChange={e => setActionDetail(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || !triggerType || !actionType || saving}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar Automação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir automação?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              <Trash2 className="h-4 w-4 mr-2" />Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
