import {
  fetchRemindersServerFn,
  saveReminderServerFn,
  deleteReminderServerFn,
  toggleReminderServerFn,
  type ReminderRecord,
} from "./reminders.server";
import { supabase } from "@/integrations/supabase/client";

export type Reminder = ReminderRecord;

function getCacheKey(userId: string) {
  return `exacta_reminders_cache_${userId}`;
}

export function getCachedReminders(userId: string): Reminder[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(getCacheKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to read reminders cache:", e);
  }
  return [];
}

export function setCachedReminders(userId: string, items: Reminder[]) {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(getCacheKey(userId), JSON.stringify(items));
  } catch (e) {
    console.warn("Failed to write reminders cache:", e);
  }
}

/**
 * Busca todos os lembretes do usuário via Server Function com fallback gracioso
 */
export async function fetchUserReminders(userId: string): Promise<Reminder[]> {
  if (!userId) return [];

  try {
    // 1. Tenta buscar via Server Function (acesso privilegiado com bypass de RLS)
    const serverItems = await fetchRemindersServerFn({ data: { userId } });
    if (Array.isArray(serverItems)) {
      setCachedReminders(userId, serverItems);
      return serverItems;
    }
  } catch (err) {
    console.warn("fetchUserReminders ServerFn error, falling back to direct Supabase / cache:", err);
  }

  // 2. Fallback para client Supabase
  try {
    const { data: clientItems } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .order("remind_at", { ascending: true });

    if (clientItems && clientItems.length > 0) {
      setCachedReminders(userId, clientItems as Reminder[]);
      return clientItems as Reminder[];
    }
  } catch (err) {
    console.warn("fetchUserReminders direct supabase fallback error:", err);
  }

  // 3. Fallback final para cache local
  return getCachedReminders(userId);
}

/**
 * Cria ou atualiza um lembrete com sincronização imediata
 */
export async function saveUserReminder(params: {
  id?: string;
  userId: string;
  title: string;
  description?: string | null;
  remindAt: string;
  repeat?: string;
  priority?: string;
}): Promise<Reminder> {
  let savedItem: Reminder | null = null;

  try {
    // 1. Tenta salvar via Server Function
    savedItem = await saveReminderServerFn({
      data: {
        id: params.id,
        userId: params.userId,
        title: params.title,
        description: params.description,
        remindAt: params.remindAt,
        repeat: params.repeat || "none",
        priority: params.priority || "media",
      },
    });
  } catch (serverErr) {
    console.warn("saveUserReminder ServerFn error, trying direct supabase:", serverErr);

    // 2. Fallback para client Supabase
    const payload = {
      user_id: params.userId,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      remind_at: params.remindAt,
      repeat: params.repeat || "none",
      priority: params.priority || "media",
    };

    if (params.id) {
      const { data, error } = await supabase
        .from("reminders")
        .update(payload)
        .eq("id", params.id)
        .select()
        .single();
      if (!error && data) savedItem = data as Reminder;
    } else {
      const { data, error } = await supabase
        .from("reminders")
        .insert(payload)
        .select()
        .single();
      if (!error && data) savedItem = data as Reminder;
    }
  }

  // Se mesmo assim não retornou, gera objeto local resiliente
  if (!savedItem) {
    savedItem = {
      id: params.id || `rem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: params.userId,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      remind_at: params.remindAt,
      repeat: params.repeat || "none",
      completed: false,
      priority: params.priority || "media",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Atualiza cache local
  const current = getCachedReminders(params.userId);
  const exists = current.some((r) => r.id === savedItem!.id);
  const next = exists
    ? current.map((r) => (r.id === savedItem!.id ? savedItem! : r))
    : [...current, savedItem];

  setCachedReminders(params.userId, next);
  return savedItem;
}

/**
 * Remove um lembrete com sincronização
 */
export async function deleteUserReminder(id: string, userId: string): Promise<void> {
  try {
    await deleteReminderServerFn({ data: { id, userId } });
  } catch (err) {
    console.warn("deleteUserReminder ServerFn error, trying direct supabase:", err);
    try {
      await supabase.from("reminders").delete().eq("id", id);
    } catch {}
  }

  // Remove do cache
  const current = getCachedReminders(userId);
  setCachedReminders(
    userId,
    current.filter((r) => r.id !== id)
  );
}

/**
 * Alterna status de conclusão do lembrete
 */
export async function toggleUserReminder(
  id: string,
  userId: string,
  completed: boolean
): Promise<void> {
  try {
    await toggleReminderServerFn({ data: { id, userId, completed } });
  } catch (err) {
    console.warn("toggleUserReminder ServerFn error, trying direct supabase:", err);
    try {
      await supabase.from("reminders").update({ completed }).eq("id", id);
    } catch {}
  }

  // Atualiza no cache
  const current = getCachedReminders(userId);
  setCachedReminders(
    userId,
    current.map((r) => (r.id === id ? { ...r, completed } : r))
  );
}
