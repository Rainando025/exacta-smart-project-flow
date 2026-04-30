import { supabase } from "@/integrations/supabase/client";

export type NotifyType = "task_assigned" | "task_updated" | "task_due" | "feedback" | "info";

interface NotifyParams {
  user_id: string;
  type: NotifyType;
  title: string;
  message?: string;
  link?: string;
  task_id?: string;
}

/**
 * Cria uma notificação para outro usuário (ou para si mesmo).
 * Falhas são silenciosas — notificações não devem quebrar fluxos.
 */
export async function notify(params: NotifyParams) {
  try {
    await supabase.from("notifications").insert({
      user_id: params.user_id,
      type: params.type,
      title: params.title,
      message: params.message || null,
      link: params.link || null,
      task_id: params.task_id || null,
    });
  } catch {
    // silencioso
  }
}
