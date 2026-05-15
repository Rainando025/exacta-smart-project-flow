import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  Plus, Search, Filter, MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  description: string | null;
  remind_at: string;
  priority: string;
}

export function CalendarScheduler({ isTeam = false }: { isTeam?: boolean }) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  const saveEvent = async () => {
    if (!user || !selectedDate || !title.trim()) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
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

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-card/30 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Button variant="outline" size="sm" className="font-bold border-white/10 h-9" onClick={() => setCurrentMonth(new Date())}>Hoje</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={nextMonth}><ChevronRight className="h-5 w-5" /></Button>
          </div>
          <h2 className="text-xl font-bold font-display capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative mr-4 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar compromissos..." className="h-9 w-64 bg-muted/20 border-white/5 pl-9 text-xs" />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-gradient-primary gap-2 shadow-glow font-bold h-9">
            <Plus className="h-4 w-4" /> Criar
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return (
      <div className="grid grid-cols-7 border-b border-border">
        {days.map(day => (
          <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground bg-muted/30 border-r border-border last:border-r-0">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayEvents = events.filter(e => isSameDay(new Date(e.remind_at), cloneDay));

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[140px] border-r border-b border-border p-3 transition-colors hover:bg-accent/5 cursor-pointer relative group",
              !isSameMonth(day, monthStart) ? "bg-muted/40 opacity-30" : "",
              isSameDay(day, new Date()) ? "bg-accent/10" : ""
            )}
            onClick={() => {
              setSelectedDate(cloneDay);
              setIsModalOpen(true);
            }}
          >
            <div className={cn(
              "flex h-7 w-7 items-center justify-center text-xs font-bold rounded-full mb-1",
              isSameDay(day, new Date()) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}>
              {formattedDate}
            </div>
            <div className="space-y-1 overflow-hidden">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold truncate border flex items-center gap-1.5",
                    event.priority === 'urgente' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      event.priority === 'alta' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-accent/10 text-accent border-accent/20"
                  )}
                >
                  <div className={cn("h-1.5 w-1.5 rounded-full",
                    event.priority === 'urgente' ? "bg-red-500" :
                      event.priority === 'alta' ? "bg-amber-500" : "bg-accent"
                  )} />
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-[9px] font-bold text-muted-foreground pl-2 italic">
                  + {dayEvents.length - 3} mais
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex-1 overflow-y-auto">{rows}</div>;
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      {/* Sidebar - Detailed Google Style */}
      <aside className="w-72 border-r border-border flex flex-col hidden lg:flex bg-card/50">
        <div className="p-6 space-y-8 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Agendas
              <Filter className="h-3 w-3" />
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="h-4 w-4 rounded bg-accent group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Pessoal</span>
                <input type="checkbox" defaultChecked className="hidden" />
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="h-4 w-4 rounded bg-purple-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Equipe</span>
                <input type="checkbox" defaultChecked className="hidden" />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Próximos</h3>
            {events.slice(0, 4).map(e => (
              <div key={e.id} className="p-3 rounded-xl bg-muted/10 border border-white/5 hover:bg-muted/20 transition-all cursor-pointer">
                <p className="text-xs font-bold truncate">{e.title}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> {format(new Date(e.remind_at), "dd MMM, HH:mm", { locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Grid */}
      <main className="flex-1 flex flex-col min-w-0">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </main>

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] bg-card/98 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Plus className="h-6 w-6 text-accent" />
              </div>
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Título</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Reunião de Alinhamento"
                className="h-11 bg-muted/40 border-white/10 text-base focus:border-accent/50 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Horário</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  className="h-10 bg-muted/40 border-white/10 focus:border-accent/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="h-10 bg-muted/40 border-white/10 focus:border-accent/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {isTeam ? "Responsável" : "Participantes (Opcional)"}
              </Label>
              {isTeam ? (
                <Select value={collaborator} onValueChange={setCollaborator}>
                  <SelectTrigger className="h-10 bg-muted/40 border-white/10 focus:border-accent/50"><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
                  <SelectContent>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.full_name}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={collaborator}
                  onChange={e => setCollaborator(e.target.value)}
                  placeholder="Ex: João, Cliente X..."
                  className="h-10 bg-muted/40 border-white/10 focus:border-accent/50"
                />
              )}
            </div>
          </div>
          <DialogFooter className="border-t border-white/5 pt-6 mt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold">Cancelar</Button>
            <Button onClick={saveEvent} className="bg-gradient-primary shadow-glow px-8 font-bold">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
