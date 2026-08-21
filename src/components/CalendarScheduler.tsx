import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  Plus, Search, Filter, Trash2, Edit3, CheckCircle2, User, Users,
  FolderKanban, CheckSquare, Sparkles, AlertCircle, Tag, MapPin, X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CalendarItem {
  id: string;
  title: string;
  description: string | null;
  remind_at: string;
  end_time?: string | null;
  priority: "baixa" | "media" | "alta" | "urgente" | string;
  category?: "pessoal" | "equipe" | "reuniao" | "prazo" | "lembrete" | string;
  completed?: boolean;
  user_id?: string;
  source?: "reminder" | "task" | "project";
  assignee_name?: string;
}

const LOCAL_STORAGE_EVENTS_KEY = "exacta_calendar_events_v2";

export function CalendarScheduler({ isTeam = false }: { isTeam?: boolean }) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [tasksEvents, setTasksEvents] = useState<CalendarItem[]>([]);
  const [projectsEvents, setProjectsEvents] = useState<CalendarItem[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [showPersonal, setShowPersonal] = useState(true);
  const [showTeam, setShowTeam] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showProjects, setShowProjects] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null);
  const [detailItem, setDetailItem] = useState<CalendarItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formTime, setFormTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formPriority, setFormPriority] = useState<string>("media");
  const [formCategory, setFormCategory] = useState<string>(isTeam ? "equipe" : "pessoal");
  const [formCollaborator, setFormCollaborator] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Load from local storage backup initially
  const loadLocalBackup = useCallback((): CalendarItem[] => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao ler backup do calendário", e);
    }
    return [];
  }, []);

  const saveLocalBackup = useCallback((items: CalendarItem[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Erro ao salvar backup do calendário", e);
    }
  }, []);

  // Fetch Reminders / Events from Supabase & LocalStorage
  const loadEvents = useCallback(async () => {
    const localBackup = loadLocalBackup();
    let dbEvents: CalendarItem[] = [];

    try {
      let query = supabase.from("reminders").select("*").order("remind_at", { ascending: true });
      if (user && !isTeam) {
        query = query.eq("user_id", user.id);
      }
      const { data, error } = await query;
      if (!error && data) {
        dbEvents = data.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          remind_at: r.remind_at,
          priority: r.priority || "media",
          completed: r.completed || false,
          user_id: r.user_id,
          source: "reminder",
          category: r.description?.includes("Equipe") ? "equipe" : "pessoal",
        }));
      }
    } catch (e) {
      console.warn("Supabase fetch failed, using local backup", e);
    }

    // Merge DB events and local-only events
    const combinedMap = new Map<string, CalendarItem>();
    localBackup.forEach(item => combinedMap.set(item.id, item));
    dbEvents.forEach(item => combinedMap.set(item.id, item));

    const finalEvents = Array.from(combinedMap.values());
    setEvents(finalEvents);
    saveLocalBackup(finalEvents);
  }, [user, isTeam, loadLocalBackup, saveLocalBackup]);

  // Load tasks with due dates
  const loadTasksAndProjects = useCallback(async () => {
    try {
      const [{ data: tasksData }, { data: projectsData }, { data: profilesData }] = await Promise.all([
        supabase.from("tasks").select("id, title, description, due_date, priority, status, assignee_id").not("due_date", "is", null),
        supabase.from("projects").select("id, name, description, due_date, status").not("due_date", "is", null),
        supabase.from("profiles").select("id, full_name")
      ]);

      if (profilesData) setMembers(profilesData);

      if (tasksData) {
        const taskItems: CalendarItem[] = tasksData.map((t: any) => ({
          id: `task-${t.id}`,
          title: `[Tarefa] ${t.title}`,
          description: t.description || `Status: ${t.status}`,
          remind_at: `${t.due_date}T18:00:00`,
          priority: t.priority || "media",
          completed: t.status === "done",
          source: "task",
          category: "prazo"
        }));
        setTasksEvents(taskItems);
      }

      if (projectsData) {
        const projItems: CalendarItem[] = projectsData.map((p: any) => ({
          id: `proj-${p.id}`,
          title: `[Projeto] ${p.name}`,
          description: p.description || `Status: ${p.status}`,
          remind_at: `${p.due_date}T18:00:00`,
          priority: "urgente",
          completed: p.status === "completed",
          source: "project",
          category: "equipe"
        }));
        setProjectsEvents(projItems);
      }
    } catch (e) {
      console.error("Erro ao carregar tarefas/projetos para o calendário", e);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    loadTasksAndProjects();
  }, [loadEvents, loadTasksAndProjects]);

  // Open modal to create event on a specific date
  const openCreateModal = (date?: Date) => {
    const targetDate = date || selectedDate || new Date();
    setEditingItem(null);
    setFormTitle("");
    setFormDate(format(targetDate, "yyyy-MM-dd"));
    setFormTime("09:00");
    setFormEndTime("10:00");
    setFormPriority("media");
    setFormCategory(isTeam ? "equipe" : "pessoal");
    setFormCollaborator("");
    setFormDescription("");
    setIsModalOpen(true);
  };

  // Open modal to edit existing event
  const openEditModal = (item: CalendarItem) => {
    setDetailItem(null);
    setEditingItem(item);
    setFormTitle(item.title.replace(/^\[(Tarefa|Projeto)\]\s*/, ""));
    try {
      const parsedDate = new Date(item.remind_at);
      setFormDate(format(parsedDate, "yyyy-MM-dd"));
      setFormTime(format(parsedDate, "HH:mm"));
    } catch {
      setFormDate(format(new Date(), "yyyy-MM-dd"));
      setFormTime("09:00");
    }
    setFormEndTime(item.end_time || "10:00");
    setFormPriority(item.priority || "media");
    setFormCategory(item.category || "pessoal");
    setFormCollaborator(item.assignee_name || "");
    setFormDescription(item.description || "");
    setIsModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!formTitle.trim()) {
      toast.error("Por favor, informe o título do agendamento.");
      return;
    }

    setSaving(true);
    const dateStr = formDate || format(new Date(), "yyyy-MM-dd");
    const remindAt = `${dateStr}T${formTime || "09:00"}:00`;

    let desc = formDescription.trim();
    if (formCollaborator) {
      desc = desc ? `${desc} | Responsável: ${formCollaborator}` : `Responsável: ${formCollaborator}`;
    }

    const newItemId = editingItem ? editingItem.id : (user ? `ev-${Date.now()}` : `local-${Date.now()}`);
    const eventPayload: CalendarItem = {
      id: newItemId,
      title: formTitle.trim(),
      description: desc || null,
      remind_at: remindAt,
      end_time: formEndTime,
      priority: formPriority,
      category: formCategory,
      completed: editingItem?.completed || false,
      user_id: user?.id,
      source: "reminder",
      assignee_name: formCollaborator,
    };

    // 1. Save to local state and local backup immediately
    let updatedEvents = [...events];
    if (editingItem) {
      updatedEvents = updatedEvents.map(e => e.id === editingItem.id ? eventPayload : e);
    } else {
      updatedEvents.unshift(eventPayload);
    }
    setEvents(updatedEvents);
    saveLocalBackup(updatedEvents);

    // 2. Persist to Supabase if authenticated
    try {
      if (user) {
        if (editingItem && !editingItem.id.startsWith("local-") && !editingItem.id.startsWith("task-") && !editingItem.id.startsWith("proj-")) {
          await supabase.from("reminders").update({
            title: eventPayload.title,
            description: eventPayload.description,
            remind_at: new Date(remindAt).toISOString(),
            priority: eventPayload.priority,
          }).eq("id", editingItem.id);
        } else {
          const { data, error } = await supabase.from("reminders").insert({
            user_id: user.id,
            title: eventPayload.title,
            description: eventPayload.description,
            remind_at: new Date(remindAt).toISOString(),
            priority: eventPayload.priority,
            completed: false,
          }).select().single();

          if (data) {
            // Update local ID with real DB ID
            const syncList = updatedEvents.map(e => e.id === newItemId ? { ...e, id: data.id } : e);
            setEvents(syncList);
            saveLocalBackup(syncList);
          }
        }
      }
    } catch (e) {
      console.warn("Aviso ao sincronizar no banco (salvo localmente)", e);
    }

    setSaving(false);
    setIsModalOpen(false);
    toast.success(editingItem ? "Agendamento atualizado com sucesso!" : "Agendamento criado no calendário!");
  };

  const handleDeleteEvent = async (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveLocalBackup(updated);
    setDetailItem(null);

    try {
      if (user && !id.startsWith("local-") && !id.startsWith("task-") && !id.startsWith("proj-")) {
        await supabase.from("reminders").delete().eq("id", id);
      }
    } catch (e) {
      console.error("Erro ao deletar no servidor", e);
    }
    toast.success("Agendamento excluído.");
  };

  const handleToggleComplete = async (item: CalendarItem) => {
    const newStatus = !item.completed;
    const updated = events.map(e => e.id === item.id ? { ...e, completed: newStatus } : e);
    setEvents(updated);
    saveLocalBackup(updated);
    if (detailItem?.id === item.id) {
      setDetailItem({ ...detailItem, completed: newStatus });
    }

    try {
      if (user && !item.id.startsWith("local-") && !item.id.startsWith("task-") && !item.id.startsWith("proj-")) {
        await supabase.from("reminders").update({ completed: newStatus }).eq("id", item.id);
      }
    } catch (e) {}
    toast.info(newStatus ? "Marcado como concluído!" : "Reaberto!");
  };

  // Combine and filter all calendar items
  const allDisplayItems = useMemo(() => {
    let list: CalendarItem[] = [];

    events.forEach(e => {
      if (e.category === "equipe" && !showTeam) return;
      if (e.category === "pessoal" && !showPersonal) return;
      list.push(e);
    });

    if (showTasks) list.push(...tasksEvents);
    if (showProjects) list.push(...projectsEvents);

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item =>
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [events, tasksEvents, projectsEvents, showPersonal, showTeam, showTasks, showProjects, searchTerm]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Render Calendar Grid Cells
  const renderCalendarCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(cloneDay, "d");
        const isCurrentMonth = isSameMonth(cloneDay, monthStart);
        const isSelected = isSameDay(cloneDay, selectedDate);
        const isDayToday = isToday(cloneDay);

        // Find events on this date
        const dayEvents = allDisplayItems.filter(item => {
          try {
            const itemDate = typeof item.remind_at === "string" && item.remind_at.includes("T")
              ? item.remind_at.split("T")[0]
              : format(new Date(item.remind_at), "yyyy-MM-dd");
            const cellDate = format(cloneDay, "yyyy-MM-dd");
            return itemDate === cellDate;
          } catch {
            return false;
          }
        });

        days.push(
          <div
            key={cloneDay.toISOString()}
            onClick={() => {
              setSelectedDate(cloneDay);
            }}
            onDoubleClick={() => openCreateModal(cloneDay)}
            className={cn(
              "min-h-[120px] p-2 border-r border-b border-white/5 transition-all flex flex-col justify-between group cursor-pointer relative",
              !isCurrentMonth ? "bg-muted/10 opacity-35" : "bg-card/40 hover:bg-accent/5",
              isSelected && "ring-2 ring-accent/60 bg-accent/5 z-10",
              isDayToday && "bg-accent/10 font-bold"
            )}
          >
            {/* Cell Header */}
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform",
                  isDayToday
                    ? "bg-accent text-accent-foreground shadow-glow scale-110"
                    : isSelected
                      ? "bg-white/20 text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {formattedDate}
              </span>

              {/* Quick Add Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateModal(cloneDay);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent/20 rounded text-accent transition-opacity"
                title="Agendar neste dia"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Cell Events List */}
            <div className="space-y-1 my-1 overflow-hidden flex-1">
              {dayEvents.slice(0, 3).map((item) => {
                let timeDisplay = "";
                try {
                  if (item.remind_at.includes("T")) {
                    timeDisplay = item.remind_at.split("T")[1].slice(0, 5);
                  }
                } catch {}

                const isUrgent = item.priority === "urgente";
                const isHigh = item.priority === "alta";
                const isTask = item.source === "task";
                const isProject = item.source === "project";

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailItem(item);
                    }}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 border transition-all hover:scale-[1.02] shadow-xs select-none",
                      item.completed ? "line-through opacity-40 bg-muted border-white/5" :
                      isProject ? "bg-purple-500/15 text-purple-300 border-purple-500/30" :
                      isTask ? "bg-blue-500/15 text-blue-300 border-blue-500/30" :
                      isUrgent ? "bg-red-500/15 text-red-400 border-red-500/30" :
                      isHigh ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                      "bg-accent/15 text-accent-foreground border-accent/30"
                    )}
                  >
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      isProject ? "bg-purple-400" :
                      isTask ? "bg-blue-400" :
                      isUrgent ? "bg-red-500" :
                      isHigh ? "bg-amber-500" : "bg-accent"
                    )} />
                    {timeDisplay && <span className="text-[9px] opacity-70">{timeDisplay}</span>}
                    <span className="truncate">{item.title}</span>
                  </div>
                );
              })}

              {dayEvents.length > 3 && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(cloneDay);
                  }}
                  className="text-[9px] font-bold text-accent hover:underline pl-1 cursor-pointer"
                >
                  +{dayEvents.length - 3} mais
                </div>
              )}
            </div>

            {/* Bottom Indicator for tasks count */}
            {dayEvents.length > 0 && (
              <div className="text-[9px] text-muted-foreground/60 text-right pr-1">
                {dayEvents.length} {dayEvents.length === 1 ? "item" : "itens"}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex-1 overflow-y-auto">{rows}</div>;
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      {/* Sidebar Filters & Quick View */}
      <aside className="w-80 border-r border-white/5 bg-card/30 flex flex-col hidden md:flex shrink-0">
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Mini Calendar */}
          <div className="bg-card/50 rounded-2xl p-3 border border-white/5 shadow-sm">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) {
                  setSelectedDate(d);
                  setCurrentMonth(d);
                }
              }}
              locale={ptBR}
              className="w-full flex justify-center text-xs"
            />
          </div>

          {/* Agenda Filters */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Camadas da Agenda</span>
              <Filter className="h-3 w-3" />
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-xs font-medium cursor-pointer p-2 rounded-lg hover:bg-white/5 transition">
                <input
                  type="checkbox"
                  checked={showPersonal}
                  onChange={(e) => setShowPersonal(e.target.checked)}
                  className="rounded border-white/20 bg-muted text-accent focus:ring-accent"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                <span>Compromissos Pessoais</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-medium cursor-pointer p-2 rounded-lg hover:bg-white/5 transition">
                <input
                  type="checkbox"
                  checked={showTeam}
                  onChange={(e) => setShowTeam(e.target.checked)}
                  className="rounded border-white/20 bg-muted text-emerald-500 focus:ring-emerald-500"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Reuniões & Equipe</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-medium cursor-pointer p-2 rounded-lg hover:bg-white/5 transition">
                <input
                  type="checkbox"
                  checked={showTasks}
                  onChange={(e) => setShowTasks(e.target.checked)}
                  className="rounded border-white/20 bg-muted text-blue-500 focus:ring-blue-500"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span>Prazos de Tarefas</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-medium cursor-pointer p-2 rounded-lg hover:bg-white/5 transition">
                <input
                  type="checkbox"
                  checked={showProjects}
                  onChange={(e) => setShowProjects(e.target.checked)}
                  className="rounded border-white/20 bg-muted text-purple-500 focus:ring-purple-500"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span>Entregas de Projetos</span>
              </label>
            </div>
          </div>

          {/* Selected Date Summary */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openCreateModal(selectedDate)}
                className="h-6 text-[10px] text-accent hover:bg-accent/10 px-2"
              >
                <Plus className="h-3 w-3 mr-1" /> Agendar
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {allDisplayItems.filter(i => {
                const iDate = i.remind_at.includes("T") ? i.remind_at.split("T")[0] : format(new Date(i.remind_at), "yyyy-MM-dd");
                return iDate === format(selectedDate, "yyyy-MM-dd");
              }).length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center bg-muted/10 rounded-xl">
                  Nenhum compromisso marcado para este dia.
                </p>
              ) : (
                allDisplayItems.filter(i => {
                  const iDate = i.remind_at.includes("T") ? i.remind_at.split("T")[0] : format(new Date(i.remind_at), "yyyy-MM-dd");
                  return iDate === format(selectedDate, "yyyy-MM-dd");
                }).map(item => (
                  <div
                    key={item.id}
                    onClick={() => setDetailItem(item)}
                    className="p-2.5 rounded-xl bg-card border border-white/5 hover:border-accent/40 cursor-pointer transition shadow-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate flex-1">{item.title}</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ml-2",
                        item.priority === "urgente" ? "bg-red-500/20 text-red-400" :
                        item.priority === "alta" ? "bg-amber-500/20 text-amber-400" : "bg-accent/20 text-accent"
                      )}>
                        {item.priority}
                      </span>
                    </div>
                    {item.remind_at.includes("T") && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {item.remind_at.split("T")[1].slice(0, 5)}
                        {item.end_time ? ` - ${item.end_time}` : ""}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Calendar View */}
      <main className="flex-1 flex flex-col min-w-0 bg-card/10">
        {/* Top Header */}
        <header className="p-4 border-b border-white/5 bg-card/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="font-bold border-white/10 h-9"
            >
              Hoje
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg md:text-xl font-bold capitalize font-display ml-2">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar compromisso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-xs bg-muted/40 border-white/10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <Button
              onClick={() => openCreateModal(selectedDate)}
              className="bg-gradient-primary shadow-glow h-9 font-bold gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Agendamento</span>
            </Button>
          </div>
        </header>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-card/60">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayName) => (
            <div
              key={dayName}
              className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-r border-white/5 last:border-r-0"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Monthly Cells */}
        {renderCalendarCells()}
      </main>

      {/* Create / Edit Event Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card/98 backdrop-blur-2xl border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
              <div className="h-9 w-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                {editingItem ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              {editingItem ? "Editar Agendamento" : "Novo Agendamento"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os detalhes do compromisso ou reunião no seu calendário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="font-bold">Título do Compromisso *</Label>
              <Input
                placeholder="Ex: Reunião de Alinhamento Estratégico"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-10 text-sm bg-muted/40 border-white/10"
              />
            </div>

            {/* Date & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold">Data *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="h-9 bg-muted/40 border-white/10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">Categoria</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="h-9 bg-muted/40 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pessoal">Pessoal</SelectItem>
                    <SelectItem value="equipe">Reunião / Equipe</SelectItem>
                    <SelectItem value="prazo">Entrega / Prazo</SelectItem>
                    <SelectItem value="estrategia">Estratégia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Start Time, End Time & Priority */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label className="font-bold">Início</Label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="h-9 bg-muted/40 border-white/10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">Término</Label>
                <Input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="h-9 bg-muted/40 border-white/10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">Prioridade</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger className="h-9 bg-muted/40 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Collaborator / Responsible */}
            <div className="space-y-1.5">
              <Label className="font-bold">Responsável / Participantes</Label>
              {members.length > 0 ? (
                <Select value={formCollaborator} onValueChange={setFormCollaborator}>
                  <SelectTrigger className="h-9 bg-muted/40 border-white/10 text-xs">
                    <SelectValue placeholder="Selecione um membro ou digite..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geral">Todos da Equipe</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.full_name || m.id}>
                        {m.full_name || "Membro"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Ex: João, Diretoria, Cliente..."
                  value={formCollaborator}
                  onChange={(e) => setFormCollaborator(e.target.value)}
                  className="h-9 bg-muted/40 border-white/10 text-xs"
                />
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="font-bold">Observações / Pauta</Label>
              <Textarea
                placeholder="Pauta da reunião, links de acesso ou notas adicionais..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="bg-muted/40 border-white/10 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEvent}
              disabled={saving || !formTitle.trim()}
              className="bg-gradient-primary shadow-glow font-bold"
            >
              {saving ? "Salvando..." : "Salvar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={Boolean(detailItem)} onOpenChange={(open) => !open && setDetailItem(null)}>
        {detailItem && (
          <DialogContent className="sm:max-w-[440px] bg-card/98 backdrop-blur-2xl border-white/20 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                  detailItem.priority === "urgente" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                  detailItem.priority === "alta" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                  "bg-accent/20 text-accent border border-accent/30"
                )}>
                  Prioridade {detailItem.priority}
                </span>
                {detailItem.source && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-bold text-muted-foreground">
                    {detailItem.source === "task" ? "Tarefa" : detailItem.source === "project" ? "Projeto" : "Agenda"}
                  </span>
                )}
              </div>
              <DialogTitle className={cn("text-lg font-bold", detailItem.completed && "line-through opacity-60")}>
                {detailItem.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-white/5">
                <CalendarIcon className="h-4 w-4 text-accent" />
                <span className="font-medium">
                  {detailItem.remind_at.includes("T")
                    ? format(parseISO(detailItem.remind_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : detailItem.remind_at}
                </span>
              </div>

              {detailItem.remind_at.includes("T") && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-white/5">
                  <Clock className="h-4 w-4 text-accent" />
                  <span>
                    Horário: <strong>{detailItem.remind_at.split("T")[1].slice(0, 5)}</strong>
                    {detailItem.end_time ? ` até ${detailItem.end_time}` : ""}
                  </span>
                </div>
              )}

              {detailItem.description && (
                <div className="p-3 rounded-xl bg-muted/20 border border-white/5 space-y-1">
                  <p className="font-bold text-[11px] text-muted-foreground uppercase">Detalhes:</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{detailItem.description}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-3 border-t border-white/5">
              <div className="flex gap-1.5">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(detailItem.id)}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(detailItem)}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Editar
                </Button>
              </div>

              <Button
                variant={detailItem.completed ? "outline" : "default"}
                size="sm"
                onClick={() => handleToggleComplete(detailItem)}
                className="h-8 px-3 text-xs gap-1 font-bold"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {detailItem.completed ? "Reabrir" : "Concluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
