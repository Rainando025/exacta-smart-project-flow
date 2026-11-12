import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://kavileyrwfuiaaubrutc.supabase.co";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdmlsZXlyd2Z1aWFhdWJydXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY3ODAxOSwiZXhwIjoyMDk0MjU0MDE5fQ.CpWAmA69yKYu7UDGMjaul4qmWK-hgPDI-PiM63ygVco";

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface ReminderRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  remind_at: string;
  repeat: string;
  completed: boolean;
  priority: string;
  created_at: string;
  updated_at: string;
  task_id?: string | null;
}

const fetchSchema = z.object({
  userId: z.string().min(1),
});

export const fetchRemindersServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => fetchSchema.parse(input))
  .handler(async ({ data }): Promise<ReminderRecord[]> => {
    try {
      const admin = getAdminClient();
      const { data: rows, error } = await admin
        .from("reminders")
        .select("*")
        .eq("user_id", data.userId)
        .order("remind_at", { ascending: true });

      if (error) {
        console.error("fetchRemindersServerFn error:", error);
        throw new Error(error.message);
      }
      return (rows || []) as ReminderRecord[];
    } catch (err: any) {
      console.error("fetchRemindersServerFn exception:", err);
      throw new Error(err?.message || "Falha ao buscar lembretes no servidor.");
    }
  });

const saveSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  remindAt: z.string().min(1),
  repeat: z.string().default("none"),
  priority: z.string().default("media"),
});

export const saveReminderServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data }): Promise<ReminderRecord> => {
    try {
      const admin = getAdminClient();
      const payload = {
        user_id: data.userId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        remind_at: data.remindAt,
        repeat: data.repeat,
        priority: data.priority,
      };

      if (data.id) {
        const { data: updated, error } = await admin
          .from("reminders")
          .update(payload)
          .eq("id", data.id)
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        return updated as ReminderRecord;
      } else {
        const { data: created, error } = await admin
          .from("reminders")
          .insert(payload)
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        return created as ReminderRecord;
      }
    } catch (err: any) {
      console.error("saveReminderServerFn exception:", err);
      throw new Error(err?.message || "Falha ao salvar lembrete no servidor.");
    }
  });

const deleteSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});

export const deleteReminderServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => deleteSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    try {
      const admin = getAdminClient();
      const { error } = await admin
        .from("reminders")
        .delete()
        .eq("id", data.id)
        .eq("user_id", data.userId);
      if (error) throw new Error(error.message);
      return { success: true };
    } catch (err: any) {
      console.error("deleteReminderServerFn exception:", err);
      throw new Error(err?.message || "Falha ao excluir lembrete.");
    }
  });

const toggleSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  completed: z.boolean(),
});

export const toggleReminderServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => toggleSchema.parse(input))
  .handler(async ({ data }): Promise<ReminderRecord> => {
    try {
      const admin = getAdminClient();
      const { data: updated, error } = await admin
        .from("reminders")
        .update({ completed: data.completed })
        .eq("id", data.id)
        .eq("user_id", data.userId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return updated as ReminderRecord;
    } catch (err: any) {
      console.error("toggleReminderServerFn exception:", err);
      throw new Error(err?.message || "Falha ao atualizar status do lembrete.");
    }
  });
