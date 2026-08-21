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
  const [taskDeadlines, setTaskDeadlines] = useState<CalendarItem[]>([]);
  const [projectDeadlines, setProjectDeadlines] = useState<CalendarItem[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Modal State for New / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null);
  const [modalDate, setModalDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [modalStartTime, setModalStartTime] = useState("09:00");
  const [modalEndTime, setModalEndTime] = useState("10:00");
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalPriority, setModalPriority] = useState<string>("media");
  const [modalCategory, setModalCategory] = useState<string>("pessoal");
  const [modalCollaborator, setModalCollaborator] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Modal State for View Details
  const [viewItem, setViewItem] = useState<CalendarItem | null>(null);

  // Load from local storage immediately on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEvents(parsed);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar do cache local de eventos:", e);
    }
  }, []);

  // Fetch from Supabase and sync with local storage
  const loadEvents = useCallback(async () => {
    try {
      let query = supabase.from("reminders").select("*").order("remind_at", { ascending: true });
      if (!isTeam && user?.id) {
        query = query.eq("user_id", user.id);
      }

      const { data: dbReminders, error } = await query;
      if (error) {
        console.warn("Supabase reminders query warning:", error.message);
      }

      const rawItems: CalendarItem[] = (dbReminders || []).map((r) => {
        let cat = "lembrete";
        let coll = "";
        if (r.description && r.description.includes("| Responsável:")) {
          coll = r.description.split("| Responsável:")[1]?.trim() || "";
        }
        if (r.description && r.description.includes("[Categoria:")) {
          const match = r.description.match(/\[Categoria:\s*([^\]]+)\]/);
          if (match) cat = match[1].toLowerCase();
        }

        return {
          id: r.id,
          title: r.title,
          description: r.description,
          remind_at: r.remind_at,
          priority: r.priority || "media",
          completed: r.completed,
          user_id: r.user_id,
          source: "reminder",
          category: cat,
          assignee_name: coll,
        };
      });

      // Also merge any local-only events that might not have reached DB
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
        if (cached) {
          const localList: CalendarItem[] = JSON.parse(cached);
          const dbIds = new Set(rawItems.map(i => i.id));
          const localOnly = localList.filter(l => !dbIds.has(l.id) && l.id.startsWith("local-"));
          rawItems.push(...localOnly);
        }
      } catch {}

      setEvents(rawItems);
      localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(rawItems));
    } catch (err) {
      console.error("Erro ao carregar compromissos:", err);
    }
  }, [user?.id, isTeam]);

  // Load external deadlines (Tasks & Projects) for overlay
  const loadExternalDeadlines = useCallback(async () => {
    try {
      // 1. Tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, due_date, priority, status")
        .not("due_date", "is", null);

      if (tasks) {
        const taskEvents: CalendarItem[] = tasks
          .filter(t => t.due_date && t.status !== "done")
          .map(t => ({
            id: `task-${t.id}`,
            title: `[Tarefa] ${t.title}`,
            description: `Prazo de entrega da tarefa (Status: ${t.status})`,
            remind_at: `${t.due_date}T18:00:00`,
            priority: t.priority || "media",
            source: "task",
            category: "prazo"
          }));
        setTaskDeadlines(taskEvents);
      }

      // 2. Projects
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, due_date, status")
        .not("due_date", "is", null);

      if (projects) {
        const projEvents: CalendarItem[] = projects
          .filter(p => p.due_date && p.status !== "completed")
          .map(p => ({
            id: `proj-${p.id}`,
            title: `🚀 [Projeto] ${p.name}`,
            description: `Marco de entrega do projeto (Status: ${p.status})`,
            remind_at: `${p.due_date}T23:59:00`,
            priority: "alta",
            source: "project",
            category: "prazo"
          }));
        setProjectDeadlines(projEvents);
      }
    } catch (e) {
      console.warn("Could not load external deadlines", e);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const { data } = await supabase.from("profiles").select("id, full_name");
      if (data) setMembers(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadEvents();
    loadExternalDeadlines();
    loadMembers();
  }, [loadEvents, loadExternalDeadlines, loadMembers]);

  // Open modal for creating new event on specific date
  const handleOpenCreateModal = (date?: Date) => {
    const targetDate = date || selectedDate || new Date();
    setSelectedDate(targetDate);
    setEditingItem(null);
    setModalDate(format(targetDate, "yyyy-MM-dd"));
    setModalStartTime("09:00");
    setModalEndTime("10:00");
    setModalTitle("");
    setModalDescription("");
    setModalPriority("media");
    setModalCategory(isTeam ? "equipe" : "pessoal");
    setModalCollaborator("");
    setIsModalOpen(true);
  };

  // Open modal for editing existing event
  const handleOpenEditModal = (item: CalendarItem) => {
    if (item.source === "task" || item.source === "project") {
      toast.info("Este prazo é sincronizado diretamente pelo módulo correspondente.");
      return;
    }

    setEditingItem(item);
    try {
      const d = parseISO(item.remind_at);
      setModalDate(format(d, "yyyy-MM-dd"));
      setModalStartTime(format(d, "HH:mm"));
    } catch {
      setModalDate(format(new Date(), "yyyy-MM-dd"));
      setModalStartTime("09:00");
    }

    setModalTitle(item.title);
    setModalDescription(item.description ? item.description.replace(/\[Categoria:\s*[^\]]+\]/, "").replace(/\|\s*Responsável:\s*.*$/, "").trim() : "");
    setModalPriority(item.priority || "media");
    setModalCategory(item.category || "pessoal");
    setModalCollaborator(item.assignee_name || "");
    setViewItem(null);
    setIsModalOpen(true);
  };

  // Save Event (Create or Update)
  const handleSaveEvent = async () => {
    if (!modalTitle.trim()) {
      toast.error("Por favor, informe o título do agendamento.");
      return;
    }

    setIsSaving(true);
    const dateFormatted = modalDate || format(new Date(), "yyyy-MM-dd");
    const timeFormatted = modalStartTime || "09:00";
    const remindAtIso = `${dateFormatted}T${timeFormatted}:00`;

    let fullDesc = modalDescription.trim();
    if (modalCategory) fullDesc += ` [Categoria: ${modalCategory}]`;
    if (modalCollaborator) fullDesc += ` | Responsável: ${modalCollaborator}`;

    try {
      if (editingItem) {
        // UPDATE
        const updatedItem: CalendarItem = {
          ...editingItem,
          title: modalTitle.trim(),
          description: fullDesc,
          remind_at: remindAtIso,
          priority: modalPriority,
          category: modalCategory,
          assignee_name: modalCollaborator,
        };

        // If it's a supabase item
        if (!editingItem.id.startsWith("local-")) {
          await supabase.from("reminders").update({
            title: updatedItem.title,
            description: updatedItem.description,
            remind_at: updatedItem.remind_at,
            priority: updatedItem.priority,
          }).eq("id", editingItem.id);
        }

        // Update local list
        setEvents((prev) => {
          const next = prev.map(ev => ev.id === editingItem.id ? updatedItem : ev);
          localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(next));
          return next;
        });

        toast.success("Agendamento atualizado com sucesso!");
      } else {
        // CREATE
        const newLocalId = `local-${Date.now()}`;
        const newItem: CalendarItem = {
          id: newLocalId,
          title: modalTitle.trim(),
          description: fullDesc,
          remind_at: remindAtIso,
          priority: modalPriority,
          category: modalCategory,
          completed: false,
          user_id: user?.id,
          source: "reminder",
          assignee_name: modalCollaborator,
        };

        // Try insert into Supabase
        if (user?.id) {
          const { data, error } = await supabase.from("reminders").insert({
            user_id: user.id,
            title: newItem.title,
            description: newItem.description,
            remind_at: newItem.remind_at,
            priority: newItem.priority,
            completed: false,
          }).select().single();

          if (!error && data) {
            newItem.id = data.id;
          }
        }

        // Update state and localStorage
        setEvents((prev) => {
          const next = [...prev, newItem];
          localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(next));
          return next;
        });

        toast.success("Agendamento registrado com sucesso!");
      }

      setIsModalOpen(false);
      loadEvents();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err?.message || "falha desconhecida"));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Deseja realmente remover este agendamento?")) return;

    try {
      if (!id.startsWith("local-")) {
        await supabase.from("reminders").delete().eq("id", id);
      }

      setEvents((prev) => {
        const next = prev.filter(e => e.id !== id);
        localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(next));
        return next;
      });

      setViewItem(null);
      toast.success("Agendamento removido.");
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    }
  };

  // Toggle complete
  const handleToggleComplete = async (item: CalendarItem) => {
    const nextCompleted = !item.completed;
    try {
      if (!item.id.startsWith("local-")) {
        await supabase.from("reminders").update({ completed: nextCompleted }).eq("id", item.id);
      }

      setEvents((prev) => {
        const next = prev.map(e => e.id === item.id ? { ...e, completed: nextCompleted } : e);
        localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(next));
        return next;
      });

      if (viewItem?.id === item.id) {
        setViewItem(prev => prev ? { ...prev, completed: nextCompleted } : null);
      }

      toast.success(nextCompleted ? "Marcado como concluído!" : "Reaberto!");
    } catch (e: any) {
      toast.error("Erro ao atualizar status.");
    }
  };

  // Combine and filter all events
  const allDisplayEvents = useMemo(() => {
    let combined = [...events, ...taskDeadlines, ...projectDeadlines];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.assignee_name && e.assignee_name.toLowerCase().includes(q))
      );
    }

    if (activeFilter === "pessoal") {
      combined = combined.filter(e => e.category === "pessoal" || e.category === "lembrete");
    } else if (activeFilter === "equipe") {
      combined = combined.filter(e => e.category === "equipe" || e.category === "reuniao" || !!e.assignee_name);
    } else if (activeFilter === "prazos") {
      combined = combined.filter(e => e.source === "task" || e.source === "project" || e.category === "prazo");
    }

    return combined;
  }, [events, taskDeadlines, projectDeadlines, searchQuery, activeFilter]);

  // Navigation handlers
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
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
        const dateKey = format(cloneDay, "yyyy-MM-dd");

        // Filter events for this day
        const dayEvents = allDisplayEvents.filter((ev) => {
          try {
            const evDate = format(parseISO(ev.remind_at), "yyyy-MM-dd");
            return evDate === dateKey;
          } catch {
            return false;
          }
        });

        const isCurrentMonth = isSameMonth(cloneDay, monthStart);
        const isCurrentDay = isToday(cloneDay);
        const isSelected = isSameDay(cloneDay, selectedDate);

        days.push(
          <div
            key={day.toISOString()}
            onClick={() => setSelectedDate(cloneDay)}
            onDoubleClick={() => handleOpenCreateModal(cloneDay)}
            className={cn(
              "min-h-[110px] sm:min-h-[135px] border-r-2 border-b-2 border-zinc-300 dark:border-zinc-700 p-1.5 sm:p-2 transition-all group relative flex flex-col justify-between",
              !isCurrentMonth && "bg-muted/30 opacity-40 hover:opacity-75",
              isCurrentDay && "bg-accent/10 border-accent/30",
              isSelected && "ring-1 ring-accent/60 bg-accent/5",
              "hover:bg-accent/10 cursor-pointer"
            )}
          >
            {/* Header of cell */}
            <div className="flex items-center justify-between">
              <span className={cn(
                "h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                isCurrentDay
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : isSelected
                    ? "bg-muted text-foreground ring-1 ring-accent/50"
                    : "text-muted-foreground group-hover:text-foreground"
              )}>
                {formattedDate}
              </span>

              {/* Quick Add Button on Hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCreateModal(cloneDay);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent/20 rounded-md text-muted-foreground hover:text-accent transition-all"
                title="Novo Agendamento neste dia"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Event Pills */}
            <div className="space-y-1 my-1 overflow-hidden flex-1">
              {dayEvents.slice(0, 3).map((event) => {
                const isTask = event.source === "task";
                const isProject = event.source === "project";

                let bgClass = "bg-muted/80 text-foreground border-white/10";
                if (event.priority === "urgente" || event.priority === "alta") {
                  bgClass = "bg-destructive/15 text-destructive border-destructive/30";
                } else if (isProject) {
                  bgClass = "bg-purple-500/15 text-purple-400 border-purple-500/30";
                } else if (isTask) {
                  bgClass = "bg-blue-500/15 text-blue-400 border-blue-500/30";
                } else if (event.category === "equipe" || event.category === "reuniao") {
                  bgClass = "bg-accent/15 text-accent border-accent/30";
                }

                let timeLabel = "";
                try {
                  timeLabel = format(parseISO(event.remind_at), "HH:mm");
                } catch {}

                return (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewItem(event);
                    }}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium truncate border flex items-center gap-1 shadow-xs hover:scale-[1.02] transition-transform",
                      bgClass,
                      event.completed && "line-through opacity-50"
                    )}
                    title={`${event.title} (${timeLabel})`}
                  >
                    {timeLabel && timeLabel !== "00:00" && (
                      <span className="text-[9px] opacity-75 font-mono shrink-0">{timeLabel}</span>
                    )}
                    <span className="truncate">{event.title}</span>
                  </div>
                );
              })}

              {dayEvents.length > 3 && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(cloneDay);
                  }}
                  className="text-[9px] font-bold text-accent px-1 hover:underline cursor-pointer"
                >
                  +{dayEvents.length - 3} mais compromissos
                </div>
              )}
            </div>

            {/* Bottom Indicator */}
            {dayEvents.length > 0 && (
              <div className="flex gap-1 items-center justify-end opacity-60 text-[9px]">
                <span>{dayEvents.length} {dayEvents.length === 1 ? "item" : "itens"}</span>
              </div>
            )}
          </div>
        );

        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toISOString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="border-t-2 border-l-2 border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden bg-card/40">{rows}</div>;
  };

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Top Bar / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-white/5 bg-card/40 backdrop-blur-md">
        {/* Month Navigation */}
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
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={prevMonth}
              title="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={nextMonth}
              title="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <h2 className="text-xl font-bold font-display capitalize pl-2">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
        </div>

        {/* Filter, Search & Create Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Layer Filter Chips */}
          <div className="hidden lg:flex items-center bg-muted/40 p-1 rounded-xl border border-white/5 gap-1">
            <button
              onClick={() => setActiveFilter("all")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                activeFilter === "all" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter("pessoal")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                activeFilter === "pessoal" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pessoal
            </button>
            <button
              onClick={() => setActiveFilter("equipe")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                activeFilter === "equipe" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Equipe & Reuniões
            </button>
            <button
              onClick={() => setActiveFilter("prazos")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                activeFilter === "prazos" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tarefas & Projetos
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar compromisso..."
              className="h-9 w-40 sm:w-56 bg-muted/30 border-white/10 pl-9 text-xs rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Create Button */}
          <Button
            onClick={() => handleOpenCreateModal()}
            className="bg-gradient-primary text-primary-foreground font-bold shadow-glow h-9 px-4 gap-1.5 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Agendamento</span>
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b-2 border-zinc-300 dark:border-zinc-700 bg-card/60">
        {daysOfWeek.map((dayName, idx) => (
          <div
            key={dayName}
            className={cn(
              "py-2.5 text-center text-[11px] font-black uppercase tracking-wider text-muted-foreground border-r-2 border-zinc-300 dark:border-zinc-700 last:border-r-0",
              (idx === 0 || idx === 6) && "text-muted-foreground/60"
            )}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        {renderCalendarCells()}
      </div>

      {/* ÔöÇÔöÇ CREATE / EDIT MODAL ÔöÇÔöÇ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card/98 backdrop-blur-2xl border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold font-display">
              <div className="h-9 w-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                {editingItem ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              {editingItem ? "Editar Agendamento" : "Novo Agendamento"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha as informações do compromisso para salvar no calendário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Título do Compromisso *
              </Label>
              <Input
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                placeholder="Ex: Reunião de Alinhamento Semanal"
                className="h-10 bg-muted/40 border-white/10"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Data *
                </Label>
                <Input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="h-10 bg-muted/40 border-white/10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Horário de Início
                </Label>
                <Input
                  type="time"
                  value={modalStartTime}
                  onChange={(e) => setModalStartTime(e.target.value)}
                  className="h-10 bg-muted/40 border-white/10"
                />
              </div>
            </div>

            {/* Priority & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Prioridade
                </Label>
                <Select value={modalPriority} onValueChange={setModalPriority}>
                  <SelectTrigger className="h-10 bg-muted/40 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">⚪ Baixa</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="alta">🟠 Alta</SelectItem>
                    <SelectItem value="urgente">🔴 Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Categoria
                </Label>
                <Select value={modalCategory} onValueChange={setModalCategory}>
                  <SelectTrigger className="h-10 bg-muted/40 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pessoal">👤 Pessoal</SelectItem>
                    <SelectItem value="equipe">👥 Equipe</SelectItem>
                    <SelectItem value="reuniao">🎯 Reunião / Cliente</SelectItem>
                    <SelectItem value="prazo">⏰ Prazo Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Collaborator / Responsável */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isTeam ? "Responsável / Membro da Equipe" : "Participantes (Opcional)"}
              </Label>
              {isTeam && members.length > 0 ? (
                <Select value={modalCollaborator} onValueChange={setModalCollaborator}>
                  <SelectTrigger className="h-10 bg-muted/40 border-white/10">
                    <SelectValue placeholder="Selecione um colaborador..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">👥 Toda a Equipe</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.full_name}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={modalCollaborator}
                  onChange={(e) => setModalCollaborator(e.target.value)}
                  placeholder="Ex: João Silva, Diretoria, Cliente X..."
                  className="h-10 bg-muted/40 border-white/10"
                />
              )}
            </div>

            {/* Notes / Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Observações / Pauta
              </Label>
              <Textarea
                value={modalDescription}
                onChange={(e) => setModalDescription(e.target.value)}
                placeholder="Detalhes sobre a reunião, links de videoconferência ou notas..."
                rows={3}
                className="bg-muted/40 border-white/10 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-white/10 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={handleSaveEvent}
              className="bg-gradient-primary font-bold shadow-glow px-6"
            >
              {isSaving ? "Salvando..." : (editingItem ? "Salvar Alterações" : "Criar Agendamento")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ÔöÇÔöÇ VIEW EVENT DETAILS MODAL ÔöÇÔöÇ */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        {viewItem && (
          <DialogContent className="sm:max-w-[440px] bg-card/98 backdrop-blur-2xl border-white/20 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                  viewItem.priority === "urgente" || viewItem.priority === "alta"
                    ? "bg-destructive/20 text-destructive"
                    : "bg-accent/20 text-accent"
                )}>
                  Prioridade: {viewItem.priority === "urgente" ? "🔴 Urgente" : viewItem.priority === "alta" ? "🟠 Alta" : viewItem.priority === "media" ? "🟡 Média" : "⚪ Baixa"}
                </span>
                {viewItem.category && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                    Categoria: {viewItem.category === "pessoal" ? "👤 Pessoal" : viewItem.category === "equipe" ? "👥 Equipe" : viewItem.category === "reuniao" ? "🎯 Reunião" : viewItem.category === "prazo" ? "⏰ Prazo Crítico" : viewItem.category}
                  </span>
                )}
              </div>
              <DialogTitle className={cn(
                "text-lg font-bold mt-2",
                viewItem.completed && "line-through text-muted-foreground"
              )}>
                {viewItem.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4 text-accent" />
                <span>
                  {(() => {
                    try {
                      return format(parseISO(viewItem.remind_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
                    } catch {
                      return viewItem.remind_at;
                    }
                  })()}
                </span>
              </div>

              {viewItem.assignee_name && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-4 w-4 text-accent" />
                  <span>Responsável: <strong>{viewItem.assignee_name}</strong></span>
                </div>
              )}

              {viewItem.description && (
                <div className="p-3 bg-muted/30 rounded-xl border border-white/5 text-xs leading-relaxed whitespace-pre-wrap">
                  {viewItem.description}
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-white/10 flex-row justify-between sm:justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {viewItem.source === "reminder" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleComplete(viewItem)}
                    className="gap-1.5 text-xs font-bold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    {viewItem.completed ? "Reabrir" : "Concluir"}
                  </Button>
                )}
                {viewItem.source === "reminder" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteEvent(viewItem.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {viewItem.source === "reminder" && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenEditModal(viewItem)}
                    className="bg-gradient-primary shadow-glow font-bold text-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewItem(null)}
                >
                  Fechar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
