import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  description: string | null;
  remind_at: string;
  priority: string;
}

export function CalendarScheduler({ isTeam = false }: { isTeam?: boolean }) {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("media");
  const [collaborator, setCollaborator] = useState("");
  const [members, setMembers] = useState<any[]>([]);

  const loadEvents = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .order("remind_at", { ascending: true });
    if (data) setEvents(data);
  };

  const loadMembers = async () => {
    if (!isTeam) return;
    const { data } = await supabase.from("profiles").select("id, full_name");
    if (data) setMembers(data);
  };

  useEffect(() => {
    loadEvents();
    loadMembers();
  }, [user?.id, isTeam]);

  const handleDayClick = (day: Date) => {
    setDate(day);
    setTitle("");
    setCollaborator("");
    setSelectedTime("12:00");
    setIsModalOpen(true);
  };

  const saveEvent = async () => {
    if (!user || !date || !title.trim()) return;
    const dateStr = date.toISOString().split("T")[0];
    const remindAt = new Date(`${dateStr}T${selectedTime}:00`).toISOString();
    
    let desc = "Agendamento pelo Calendário";
    if (collaborator) desc += ` | Responsável: ${collaborator}`;

    const { error } = await supabase.from("reminders").insert({
      user_id: user.id,
      title: title.trim(),
      description: desc,
      remind_at: remindAt,
      priority,
      completed: false
    });

    if (error) {
      toast.error("Erro ao agendar: " + error.message);
    } else {
      toast.success("Agendamento criado com sucesso!");
      setIsModalOpen(false);
      loadEvents();
    }
  };

  // Filter events for the selected day
  const selectedDateStr = date?.toISOString().split("T")[0];
  const dayEvents = events.filter(e => e.remind_at.startsWith(selectedDateStr || ""));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="col-span-1 border-white/10 bg-card/50 backdrop-blur-md shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-accent" />
            Calendário {isTeam && "da Equipe"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && handleDayClick(d)}
            className="rounded-md border-0 bg-transparent"
          />
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2 border-white/10 bg-card/50 backdrop-blur-md shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg">
            Compromissos para {date?.toLocaleDateString("pt-BR")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dayEvents.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
              Nenhum agendamento para este dia.
            </div>
          ) : (
            dayEvents.map(e => (
              <div key={e.id} className="p-4 rounded-xl border border-white/5 bg-background/50 hover:bg-background transition-colors flex justify-between items-center">
                <div>
                  <h4 className="font-bold">{e.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{e.description}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-[10px] uppercase font-bold
                    ${e.priority === 'urgente' ? 'bg-red-500/20 text-red-500' : 
                      e.priority === 'alta' ? 'bg-amber-500/20 text-amber-500' : 
                      'bg-accent/20 text-accent'}
                  `}>
                    {e.priority}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-mono bg-sidebar p-1.5 rounded-lg border border-white/5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {new Date(e.remind_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agendar Compromisso</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Agendamento</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reunião de Alinhamento" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isTeam && (
              <div className="space-y-2">
                <Label>Responsável / Colaborador</Label>
                <Select value={collaborator} onValueChange={setCollaborator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um membro" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.full_name}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!isTeam && (
               <div className="space-y-2">
                 <Label>Participantes (Opcional)</Label>
                 <Input value={collaborator} onChange={e => setCollaborator(e.target.value)} placeholder="Ex: Cliente X, João..." />
               </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveEvent} className="bg-gradient-primary">Salvar Agendamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
