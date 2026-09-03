import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AlertNotifyPayload = {
  pageName: string;
  ruleName: string;
  description: string;
  severity: "critical" | "warning";
  count: number;
  total: number;
  at: string;
};

export type NotifyResult = {
  webhook: "sent" | "skipped" | "error" | "off";
  email: "sent" | "skipped" | "error" | "off" | "unconfigured";
  detail?: string;
};

/**
 * Envia a notificação de um alerta para os canais configurados pelo usuário
 * (webhook e/ou e-mail), respeitando as preferências salvas na nuvem.
 */
export const dispatchAlertNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AlertNotifyPayload) => input)
  .handler(async ({ data, context }): Promise<NotifyResult> => {
    const { supabase, userId } = context;
    const { data: prefs } = await (supabase as any)
      .from("bi_alert_notify_prefs")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!prefs || !prefs.enabled) return { webhook: "off", email: "off" };
    const severities = (prefs.severities ?? []) as string[];
    if (severities.length && !severities.includes(data.severity)) {
      return { webhook: "skipped", email: "skipped", detail: "Severidade não selecionada" };
    }

    const result: NotifyResult = { webhook: "off", email: "off" };

    if (prefs.webhook_enabled && prefs.webhook_url) {
      try {
        const res = await fetch(prefs.webhook_url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "alert", ...data }),
        });
        result.webhook = res.ok ? "sent" : "error";
        if (!res.ok) result.detail = `Webhook respondeu ${res.status}`;
      } catch (e) {
        result.webhook = "error";
        result.detail = (e as Error).message;
      }
    }

    if (prefs.email_enabled && prefs.email_to) {
      const key = process.env["RESEND_API_KEY"];
      if (!key) {
        result.email = "unconfigured";
      } else {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
            body: JSON.stringify({
              from: process.env["ALERT_EMAIL_FROM"] ?? "Alertas <onboarding@resend.dev>",
              to: [prefs.email_to],
              subject: `[${data.severity === "critical" ? "Crítico" : "Atenção"}] ${data.ruleName}`,
              html: `<h2>${data.ruleName}</h2>
                <p>${data.description}</p>
                <p><strong>${data.count}</strong> de ${data.total} registros na página <strong>${data.pageName}</strong>.</p>
                <p>${new Date(data.at).toLocaleString("pt-BR")}</p>`,
            }),
          });
          result.email = res.ok ? "sent" : "error";
          if (!res.ok) result.detail = `E-mail respondeu ${res.status}`;
        } catch (e) {
          result.email = "error";
          result.detail = (e as Error).message;
        }
      }
    }

    return result;
  });
