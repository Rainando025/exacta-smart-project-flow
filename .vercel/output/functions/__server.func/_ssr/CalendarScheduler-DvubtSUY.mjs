import { S as reactExports, I as jsxRuntimeExports } from "./index.mjs";
import { g as format, C as Calendar, p as ptBR, a as ChevronLeft, c as addMonths, s as startOfMonth, e as endOfMonth, k as startOfWeek, f as endOfWeek, h as isSameMonth, i as isSameDay, b as addDays, t as toDate, d as constructFrom, m as millisecondsInHour, j as millisecondsInMinute } from "./calendar-B9iwqwlp.mjs";
import { ak as useAuth, ai as supabase, b as Button, a3 as cn, l as Clock, i as ChevronRight, $ as X, D as Dialog, o as DialogContent, r as DialogHeader, s as DialogTitle, p as DialogDescription, L as Label$1, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, q as DialogFooter, k as CircleCheck, aj as toast } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { F as Funnel } from "./funnel-DDdTvvLZ.mjs";
import { P as Plus, S as Search, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { P as PenLine } from "./pen-line-CFs4a1Rv.mjs";
import { C as Calendar$1 } from "./calendar-DYvPAJmB.mjs";
function constructNow(date) {
  return constructFrom(date, Date.now());
}
function isToday(date, options) {
  return isSameDay(
    constructFrom(date, date),
    constructNow(date)
  );
}
function parseISO(argument, options) {
  const invalidDate = () => constructFrom(options?.in, NaN);
  const additionalDigits = 2;
  const dateStrings = splitDateString(argument);
  let date;
  if (dateStrings.date) {
    const parseYearResult = parseYear(dateStrings.date, additionalDigits);
    date = parseDate(parseYearResult.restDateString, parseYearResult.year);
  }
  if (!date || isNaN(+date)) return invalidDate();
  const timestamp = +date;
  let time = 0;
  let offset;
  if (dateStrings.time) {
    time = parseTime(dateStrings.time);
    if (isNaN(time)) return invalidDate();
  }
  if (dateStrings.timezone) {
    offset = parseTimezone(dateStrings.timezone);
    if (isNaN(offset)) return invalidDate();
  } else {
    const tmpDate = new Date(timestamp + time);
    const result = toDate(0, options?.in);
    result.setFullYear(
      tmpDate.getUTCFullYear(),
      tmpDate.getUTCMonth(),
      tmpDate.getUTCDate()
    );
    result.setHours(
      tmpDate.getUTCHours(),
      tmpDate.getUTCMinutes(),
      tmpDate.getUTCSeconds(),
      tmpDate.getUTCMilliseconds()
    );
    return result;
  }
  return toDate(timestamp + time + offset, options?.in);
}
const patterns = {
  dateTimeDelimiter: /[T ]/,
  timeZoneDelimiter: /[Z ]/i,
  timezone: /([Z+-].*)$/
};
const dateRegex = /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/;
const timeRegex = /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/;
const timezoneRegex = /^([+-])(\d{2})(?::?(\d{2}))?$/;
function splitDateString(dateString) {
  const dateStrings = {};
  const array = dateString.split(patterns.dateTimeDelimiter);
  let timeString;
  if (array.length > 2) {
    return dateStrings;
  }
  if (/:/.test(array[0])) {
    timeString = array[0];
  } else {
    dateStrings.date = array[0];
    timeString = array[1];
    if (patterns.timeZoneDelimiter.test(dateStrings.date)) {
      dateStrings.date = dateString.split(patterns.timeZoneDelimiter)[0];
      timeString = dateString.substr(
        dateStrings.date.length,
        dateString.length
      );
    }
  }
  if (timeString) {
    const token = patterns.timezone.exec(timeString);
    if (token) {
      dateStrings.time = timeString.replace(token[1], "");
      dateStrings.timezone = token[1];
    } else {
      dateStrings.time = timeString;
    }
  }
  return dateStrings;
}
function parseYear(dateString, additionalDigits) {
  const regex = new RegExp(
    "^(?:(\\d{4}|[+-]\\d{" + (4 + additionalDigits) + "})|(\\d{2}|[+-]\\d{" + (2 + additionalDigits) + "})$)"
  );
  const captures = dateString.match(regex);
  if (!captures) return { year: NaN, restDateString: "" };
  const year = captures[1] ? parseInt(captures[1]) : null;
  const century = captures[2] ? parseInt(captures[2]) : null;
  return {
    year: century === null ? year : century * 100,
    restDateString: dateString.slice((captures[1] || captures[2]).length)
  };
}
function parseDate(dateString, year) {
  if (year === null) return /* @__PURE__ */ new Date(NaN);
  const captures = dateString.match(dateRegex);
  if (!captures) return /* @__PURE__ */ new Date(NaN);
  const isWeekDate = !!captures[4];
  const dayOfYear = parseDateUnit(captures[1]);
  const month = parseDateUnit(captures[2]) - 1;
  const day = parseDateUnit(captures[3]);
  const week = parseDateUnit(captures[4]);
  const dayOfWeek = parseDateUnit(captures[5]) - 1;
  if (isWeekDate) {
    if (!validateWeekDate(year, week, dayOfWeek)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    return dayOfISOWeekYear(year, week, dayOfWeek);
  } else {
    const date = /* @__PURE__ */ new Date(0);
    if (!validateDate(year, month, day) || !validateDayOfYearDate(year, dayOfYear)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    date.setUTCFullYear(year, month, Math.max(dayOfYear, day));
    return date;
  }
}
function parseDateUnit(value) {
  return value ? parseInt(value) : 1;
}
function parseTime(timeString) {
  const captures = timeString.match(timeRegex);
  if (!captures) return NaN;
  const hours = parseTimeUnit(captures[1]);
  const minutes = parseTimeUnit(captures[2]);
  const seconds = parseTimeUnit(captures[3]);
  if (!validateTime(hours, minutes, seconds)) {
    return NaN;
  }
  return hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * 1e3;
}
function parseTimeUnit(value) {
  return value && parseFloat(value.replace(",", ".")) || 0;
}
function parseTimezone(timezoneString) {
  if (timezoneString === "Z") return 0;
  const captures = timezoneString.match(timezoneRegex);
  if (!captures) return 0;
  const sign = captures[1] === "+" ? -1 : 1;
  const hours = parseInt(captures[2]);
  const minutes = captures[3] && parseInt(captures[3]) || 0;
  if (!validateTimezone(hours, minutes)) {
    return NaN;
  }
  return sign * (hours * millisecondsInHour + minutes * millisecondsInMinute);
}
function dayOfISOWeekYear(isoWeekYear, week, day) {
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCFullYear(isoWeekYear, 0, 4);
  const fourthOfJanuaryDay = date.getUTCDay() || 7;
  const diff = (week - 1) * 7 + day + 1 - fourthOfJanuaryDay;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}
const daysInMonths = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapYearIndex(year) {
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
}
function validateDate(year, month, date) {
  return month >= 0 && month <= 11 && date >= 1 && date <= (daysInMonths[month] || (isLeapYearIndex(year) ? 29 : 28));
}
function validateDayOfYearDate(year, dayOfYear) {
  return dayOfYear >= 1 && dayOfYear <= (isLeapYearIndex(year) ? 366 : 365);
}
function validateWeekDate(_year, week, day) {
  return week >= 1 && week <= 53 && day >= 0 && day <= 6;
}
function validateTime(hours, minutes, seconds) {
  if (hours === 24) {
    return minutes === 0 && seconds === 0;
  }
  return seconds >= 0 && seconds < 60 && minutes >= 0 && minutes < 60 && hours >= 0 && hours < 25;
}
function validateTimezone(_hours, minutes) {
  return minutes >= 0 && minutes <= 59;
}
function subMonths(date, amount, options) {
  return addMonths(date, -1, options);
}
const LOCAL_STORAGE_EVENTS_KEY = "exacta_calendar_events_v2";
function CalendarScheduler({ isTeam = false }) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = reactExports.useState(/* @__PURE__ */ new Date());
  const [selectedDate, setSelectedDate] = reactExports.useState(/* @__PURE__ */ new Date());
  const [events, setEvents] = reactExports.useState([]);
  const [tasksEvents, setTasksEvents] = reactExports.useState([]);
  const [projectsEvents, setProjectsEvents] = reactExports.useState([]);
  const [members, setMembers] = reactExports.useState([]);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [showPersonal, setShowPersonal] = reactExports.useState(true);
  const [showTeam, setShowTeam] = reactExports.useState(true);
  const [showTasks, setShowTasks] = reactExports.useState(true);
  const [showProjects, setShowProjects] = reactExports.useState(true);
  const [isModalOpen, setIsModalOpen] = reactExports.useState(false);
  const [editingItem, setEditingItem] = reactExports.useState(null);
  const [detailItem, setDetailItem] = reactExports.useState(null);
  const [formTitle, setFormTitle] = reactExports.useState("");
  const [formDate, setFormDate] = reactExports.useState(format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"));
  const [formTime, setFormTime] = reactExports.useState("09:00");
  const [formEndTime, setFormEndTime] = reactExports.useState("10:00");
  const [formPriority, setFormPriority] = reactExports.useState("media");
  const [formCategory, setFormCategory] = reactExports.useState(isTeam ? "equipe" : "pessoal");
  const [formCollaborator, setFormCollaborator] = reactExports.useState("");
  const [formDescription, setFormDescription] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const loadLocalBackup = reactExports.useCallback(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao ler backup do calendário", e);
    }
    return [];
  }, []);
  const saveLocalBackup = reactExports.useCallback((items) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Erro ao salvar backup do calendário", e);
    }
  }, []);
  const loadEvents = reactExports.useCallback(async () => {
    const localBackup = loadLocalBackup();
    let dbEvents = [];
    try {
      let query = supabase.from("reminders").select("*").order("remind_at", { ascending: true });
      if (user && !isTeam) {
        query = query.eq("user_id", user.id);
      }
      const { data, error } = await query;
      if (!error && data) {
        dbEvents = data.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          remind_at: r.remind_at,
          priority: r.priority || "media",
          completed: r.completed || false,
          user_id: r.user_id,
          source: "reminder",
          category: r.description?.includes("Equipe") ? "equipe" : "pessoal"
        }));
      }
    } catch (e) {
      console.warn("Supabase fetch failed, using local backup", e);
    }
    const combinedMap = /* @__PURE__ */ new Map();
    localBackup.forEach((item) => combinedMap.set(item.id, item));
    dbEvents.forEach((item) => combinedMap.set(item.id, item));
    const finalEvents = Array.from(combinedMap.values());
    setEvents(finalEvents);
    saveLocalBackup(finalEvents);
  }, [user, isTeam, loadLocalBackup, saveLocalBackup]);
  const loadTasksAndProjects = reactExports.useCallback(async () => {
    try {
      const [{ data: tasksData }, { data: projectsData }, { data: profilesData }] = await Promise.all([
        supabase.from("tasks").select("id, title, description, due_date, priority, status, assignee_id").not("due_date", "is", null),
        supabase.from("projects").select("id, name, description, due_date, status").not("due_date", "is", null),
        supabase.from("profiles").select("id, full_name")
      ]);
      if (profilesData) setMembers(profilesData);
      if (tasksData) {
        const taskItems = tasksData.map((t) => ({
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
        const projItems = projectsData.map((p) => ({
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
  reactExports.useEffect(() => {
    loadEvents();
    loadTasksAndProjects();
  }, [loadEvents, loadTasksAndProjects]);
  const openCreateModal = (date) => {
    const targetDate = date || selectedDate || /* @__PURE__ */ new Date();
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
  const openEditModal = (item) => {
    setDetailItem(null);
    setEditingItem(item);
    setFormTitle(item.title.replace(/^\[(Tarefa|Projeto)\]\s*/, ""));
    try {
      const parsedDate = new Date(item.remind_at);
      setFormDate(format(parsedDate, "yyyy-MM-dd"));
      setFormTime(format(parsedDate, "HH:mm"));
    } catch {
      setFormDate(format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"));
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
    const dateStr = formDate || format(/* @__PURE__ */ new Date(), "yyyy-MM-dd");
    const remindAt = `${dateStr}T${formTime || "09:00"}:00`;
    let desc = formDescription.trim();
    if (formCollaborator) {
      desc = desc ? `${desc} | Responsável: ${formCollaborator}` : `Responsável: ${formCollaborator}`;
    }
    const newItemId = editingItem ? editingItem.id : user ? `ev-${Date.now()}` : `local-${Date.now()}`;
    const eventPayload = {
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
      assignee_name: formCollaborator
    };
    let updatedEvents = [...events];
    if (editingItem) {
      updatedEvents = updatedEvents.map((e) => e.id === editingItem.id ? eventPayload : e);
    } else {
      updatedEvents.unshift(eventPayload);
    }
    setEvents(updatedEvents);
    saveLocalBackup(updatedEvents);
    try {
      if (user) {
        if (editingItem && !editingItem.id.startsWith("local-") && !editingItem.id.startsWith("task-") && !editingItem.id.startsWith("proj-")) {
          await supabase.from("reminders").update({
            title: eventPayload.title,
            description: eventPayload.description,
            remind_at: new Date(remindAt).toISOString(),
            priority: eventPayload.priority
          }).eq("id", editingItem.id);
        } else {
          const { data, error } = await supabase.from("reminders").insert({
            user_id: user.id,
            title: eventPayload.title,
            description: eventPayload.description,
            remind_at: new Date(remindAt).toISOString(),
            priority: eventPayload.priority,
            completed: false
          }).select().single();
          if (data) {
            const syncList = updatedEvents.map((e) => e.id === newItemId ? { ...e, id: data.id } : e);
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
  const handleDeleteEvent = async (id) => {
    const updated = events.filter((e) => e.id !== id);
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
  const handleToggleComplete = async (item) => {
    const newStatus = !item.completed;
    const updated = events.map((e) => e.id === item.id ? { ...e, completed: newStatus } : e);
    setEvents(updated);
    saveLocalBackup(updated);
    if (detailItem?.id === item.id) {
      setDetailItem({ ...detailItem, completed: newStatus });
    }
    try {
      if (user && !item.id.startsWith("local-") && !item.id.startsWith("task-") && !item.id.startsWith("proj-")) {
        await supabase.from("reminders").update({ completed: newStatus }).eq("id", item.id);
      }
    } catch (e) {
    }
    toast.info(newStatus ? "Marcado como concluído!" : "Reaberto!");
  };
  const allDisplayItems = reactExports.useMemo(() => {
    let list = [];
    events.forEach((e) => {
      if (e.category === "equipe" && !showTeam) return;
      if (e.category === "pessoal" && !showPersonal) return;
      list.push(e);
    });
    if (showTasks) list.push(...tasksEvents);
    if (showProjects) list.push(...projectsEvents);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) => item.title.toLowerCase().includes(q) || item.description && item.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, tasksEvents, projectsEvents, showPersonal, showTeam, showTasks, showProjects, searchTerm]);
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth));
  const goToToday = () => {
    const today = /* @__PURE__ */ new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };
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
        const dayEvents = allDisplayItems.filter((item) => {
          try {
            const itemDate = typeof item.remind_at === "string" && item.remind_at.includes("T") ? item.remind_at.split("T")[0] : format(new Date(item.remind_at), "yyyy-MM-dd");
            const cellDate = format(cloneDay, "yyyy-MM-dd");
            return itemDate === cellDate;
          } catch {
            return false;
          }
        });
        days.push(
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: () => {
                setSelectedDate(cloneDay);
              },
              onDoubleClick: () => openCreateModal(cloneDay),
              className: cn(
                "min-h-[120px] p-2 border-r border-b border-white/5 transition-all flex flex-col justify-between group cursor-pointer relative",
                !isCurrentMonth ? "bg-muted/10 opacity-35" : "bg-card/40 hover:bg-accent/5",
                isSelected && "ring-2 ring-accent/60 bg-accent/5 z-10",
                isDayToday && "bg-accent/10 font-bold"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: cn(
                        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform",
                        isDayToday ? "bg-accent text-accent-foreground shadow-glow scale-110" : isSelected ? "bg-white/20 text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      ),
                      children: formattedDate
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        openCreateModal(cloneDay);
                      },
                      className: "opacity-0 group-hover:opacity-100 p-1 hover:bg-accent/20 rounded text-accent transition-opacity",
                      title: "Agendar neste dia",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 my-1 overflow-hidden flex-1", children: [
                  dayEvents.slice(0, 3).map((item) => {
                    let timeDisplay = "";
                    try {
                      if (item.remind_at.includes("T")) {
                        timeDisplay = item.remind_at.split("T")[1].slice(0, 5);
                      }
                    } catch {
                    }
                    const isUrgent = item.priority === "urgente";
                    const isHigh = item.priority === "alta";
                    const isTask = item.source === "task";
                    const isProject = item.source === "project";
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          setDetailItem(item);
                        },
                        className: cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 border transition-all hover:scale-[1.02] shadow-xs select-none",
                          item.completed ? "line-through opacity-40 bg-muted border-white/5" : isProject ? "bg-purple-500/15 text-purple-300 border-purple-500/30" : isTask ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : isUrgent ? "bg-red-500/15 text-red-400 border-red-500/30" : isHigh ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-accent/15 text-accent-foreground border-accent/30"
                        ),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            isProject ? "bg-purple-400" : isTask ? "bg-blue-400" : isUrgent ? "bg-red-500" : isHigh ? "bg-amber-500" : "bg-accent"
                          ) }),
                          timeDisplay && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] opacity-70", children: timeDisplay }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: item.title })
                        ]
                      },
                      item.id
                    );
                  }),
                  dayEvents.length > 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        setSelectedDate(cloneDay);
                      },
                      className: "text-[9px] font-bold text-accent hover:underline pl-1 cursor-pointer",
                      children: [
                        "+",
                        dayEvents.length - 3,
                        " mais"
                      ]
                    }
                  )
                ] }),
                dayEvents.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[9px] text-muted-foreground/60 text-right pr-1", children: [
                  dayEvents.length,
                  " ",
                  dayEvents.length === 1 ? "item" : "itens"
                ] })
              ]
            },
            cloneDay.toISOString()
          )
        );
        day = addDays(day, 1);
      }
      rows.push(
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-7", children: days }, day.toISOString())
      );
      days = [];
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto", children: rows });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full w-full bg-background overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "w-80 border-r border-white/5 bg-card/30 flex flex-col hidden md:flex shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-6 overflow-y-auto flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-card/50 rounded-2xl p-3 border border-white/5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Calendar,
        {
          mode: "single",
          selected: selectedDate,
          onSelect: (d) => {
            if (d) {
              setSelectedDate(d);
              setCurrentMonth(d);
            }
          },
          locale: ptBR,
          className: "w-full flex justify-center text-xs"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Camadas da Agenda" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-3 w-3" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 text-xs font-medium cursor-pointer p-2 rounded-lg hover:bg-white/5 transition", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: showPersonal,
                onChange: (e) => setShowPersonal(e.target.checked),
                className: "rounded border-white/20 bg-muted text-accent focus:ring-accent"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Compromissos Pessoais" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 text-xs font-medium cursor-pointer p-2 rounded-lg hover:bg-white/5 transition", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: showTeam,
                onChange: (e) => setShowTeam(e.target.checked),
                className: "rounded border-white/20 bg-muted text-emerald-500 focus:ring-emerald-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-emerald-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Reuniões & Equipe" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 text-xs font-medium cursor-pointer p-2 rounded-lg hover:bg-white/5 transition", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: showTasks,
                onChange: (e) => setShowTasks(e.target.checked),
                className: "rounded border-white/20 bg-muted text-blue-500 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-blue-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Prazos de Tarefas" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 text-xs font-medium cursor-pointer p-2 rounded-lg hover:bg-white/5 transition", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: showProjects,
                onChange: (e) => setShowProjects(e.target.checked),
                className: "rounded border-white/20 bg-muted text-purple-500 focus:ring-purple-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-purple-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Entregas de Projetos" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-2 border-t border-white/5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => openCreateModal(selectedDate),
              className: "h-6 text-[10px] text-accent hover:bg-accent/10 px-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1" }),
                " Agendar"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-56 overflow-y-auto pr-1", children: allDisplayItems.filter((i) => {
          const iDate = i.remind_at.includes("T") ? i.remind_at.split("T")[0] : format(new Date(i.remind_at), "yyyy-MM-dd");
          return iDate === format(selectedDate, "yyyy-MM-dd");
        }).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic py-3 text-center bg-muted/10 rounded-xl", children: "Nenhum compromisso marcado para este dia." }) : allDisplayItems.filter((i) => {
          const iDate = i.remind_at.includes("T") ? i.remind_at.split("T")[0] : format(new Date(i.remind_at), "yyyy-MM-dd");
          return iDate === format(selectedDate, "yyyy-MM-dd");
        }).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => setDetailItem(item),
            className: "p-2.5 rounded-xl bg-card border border-white/5 hover:border-accent/40 cursor-pointer transition shadow-xs space-y-1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold truncate flex-1", children: item.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
                  "text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ml-2",
                  item.priority === "urgente" ? "bg-red-500/20 text-red-400" : item.priority === "alta" ? "bg-amber-500/20 text-amber-400" : "bg-accent/20 text-accent"
                ), children: item.priority })
              ] }),
              item.remind_at.includes("T") && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
                " ",
                item.remind_at.split("T")[1].slice(0, 5),
                item.end_time ? ` - ${item.end_time}` : ""
              ] })
            ]
          },
          item.id
        )) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "flex-1 flex flex-col min-w-0 bg-card/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "p-4 border-b border-white/5 bg-card/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: goToToday,
              className: "font-bold border-white/10 h-9",
              children: "Hoje"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", onClick: prevMonth, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", onClick: nextMonth, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg md:text-xl font-bold capitalize font-display ml-2", children: format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-48 sm:w-64", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: "Buscar compromisso...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "h-9 pl-9 text-xs bg-muted/40 border-white/10"
              }
            ),
            searchTerm && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setSearchTerm(""),
                className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => openCreateModal(selectedDate),
              className: "bg-gradient-primary shadow-glow h-9 font-bold gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Novo Agendamento" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-7 border-b border-white/5 bg-card/60", children: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayName) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-r border-white/5 last:border-r-0",
          children: dayName
        },
        dayName
      )) }),
      renderCalendarCells()
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[480px] bg-card/98 backdrop-blur-2xl border-white/20 shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2.5 text-lg font-bold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent", children: editingItem ? /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-5 w-5" }) }),
          editingItem ? "Editar Agendamento" : "Novo Agendamento"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-xs", children: "Preencha os detalhes do compromisso ou reunião no seu calendário." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "font-bold", children: "Título do Compromisso *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: "Ex: Reunião de Alinhamento Estratégico",
              value: formTitle,
              onChange: (e) => setFormTitle(e.target.value),
              className: "h-10 text-sm bg-muted/40 border-white/10"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "font-bold", children: "Data *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "date",
                value: formDate,
                onChange: (e) => setFormDate(e.target.value),
                className: "h-9 bg-muted/40 border-white/10 text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "font-bold", children: "Categoria" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formCategory, onValueChange: setFormCategory, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 bg-muted/40 border-white/10 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pessoal", children: "Pessoal" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "equipe", children: "Reunião / Equipe" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "prazo", children: "Entrega / Prazo" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "estrategia", children: "Estratégia" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "font-bold", children: "Início" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "time",
                value: formTime,
                onChange: (e) => setFormTime(e.target.value),
                className: "h-9 bg-muted/40 border-white/10 text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "font-bold", children: "Término" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "time",
                value: formEndTime,
                onChange: (e) => setFormEndTime(e.target.value),
                className: "h-9 bg-muted/40 border-white/10 text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "font-bold", children: "Prioridade" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formPriority, onValueChange: setFormPriority, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 bg-muted/40 border-white/10 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "baixa", children: "Baixa" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "media", children: "Média" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "alta", children: "Alta" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "urgente", children: "Urgente" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "font-bold", children: "Responsável / Participantes" }),
          members.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formCollaborator, onValueChange: setFormCollaborator, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 bg-muted/40 border-white/10 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione um membro ou digite..." }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Geral", children: "Todos da Equipe" }),
              members.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: m.full_name || m.id, children: m.full_name || "Membro" }, m.id))
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: "Ex: João, Diretoria, Cliente...",
              value: formCollaborator,
              onChange: (e) => setFormCollaborator(e.target.value),
              className: "h-9 bg-muted/40 border-white/10 text-xs"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "font-bold", children: "Observações / Pauta" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              placeholder: "Pauta da reunião, links de acesso ou notas adicionais...",
              value: formDescription,
              onChange: (e) => setFormDescription(e.target.value),
              rows: 3,
              className: "bg-muted/40 border-white/10 text-xs"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0 pt-2 border-t border-white/5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: () => setIsModalOpen(false), children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleSaveEvent,
            disabled: saving || !formTitle.trim(),
            className: "bg-gradient-primary shadow-glow font-bold",
            children: saving ? "Salvando..." : "Salvar Agendamento"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: Boolean(detailItem), onOpenChange: (open) => !open && setDetailItem(null), children: detailItem && /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[440px] bg-card/98 backdrop-blur-2xl border-white/20 shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn(
            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
            detailItem.priority === "urgente" ? "bg-red-500/20 text-red-400 border border-red-500/30" : detailItem.priority === "alta" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-accent/20 text-accent border border-accent/30"
          ), children: [
            "Prioridade ",
            detailItem.priority
          ] }),
          detailItem.source && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-muted font-bold text-muted-foreground", children: detailItem.source === "task" ? "Tarefa" : detailItem.source === "project" ? "Projeto" : "Agenda" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: cn("text-lg font-bold", detailItem.completed && "line-through opacity-60"), children: detailItem.title })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 py-3 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-white/5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar$1, { className: "h-4 w-4 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: detailItem.remind_at.includes("T") ? format(parseISO(detailItem.remind_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : detailItem.remind_at })
        ] }),
        detailItem.remind_at.includes("T") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-white/5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Horário: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: detailItem.remind_at.split("T")[1].slice(0, 5) }),
            detailItem.end_time ? ` até ${detailItem.end_time}` : ""
          ] })
        ] }),
        detailItem.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-muted/20 border border-white/5 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[11px] text-muted-foreground uppercase", children: "Detalhes:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap leading-relaxed", children: detailItem.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "flex flex-row justify-between items-center gap-2 pt-3 border-t border-white/5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "destructive",
              size: "sm",
              onClick: () => handleDeleteEvent(detailItem.id),
              className: "h-8 px-2.5 text-xs gap-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
                " Excluir"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => openEditModal(detailItem),
              className: "h-8 px-2.5 text-xs gap-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3.5 w-3.5" }),
                " Editar"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: detailItem.completed ? "outline" : "default",
            size: "sm",
            onClick: () => handleToggleComplete(detailItem),
            className: "h-8 px-3 text-xs gap-1 font-bold",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
              detailItem.completed ? "Reabrir" : "Concluir"
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  CalendarScheduler as C
};
