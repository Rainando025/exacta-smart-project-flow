import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Dashboard, Row } from "./types";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeObject, sanitizeString } from "@/lib/security/sanitizer";

const generateDashboardSchema = z.object({
  name: z.string().max(255),
  fields: z.array(z.object({ name: z.string(), type: z.string() })),
  sample: z.array(z.record(z.any())),
  rowCount: z.number().nonnegative(),
}).strict();

const extractDocumentSchema = z.object({
  filename: z.string().max(255),
  mime: z.string().max(100),
  base64: z.string(),
}).strict();

export const generateDashboard = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    // 1. Rate Limiting check for AI routes (max 10 req/min)
    const rateCheck = checkRateLimit("ai_generate_dashboard", 10, 60000);
    if (!rateCheck.allowed) {
      throw new Error("Limite de requisições de IA excedido. Aguarde alguns segundos.");
    }
    // 2. Validate strict schema and sanitize input
    const validated = generateDashboardSchema.parse(input);
    return sanitizeObject(validated);
  })
  .handler(async ({ data }): Promise<Dashboard> => {
    const { callGateway, parseJson, DASHBOARD_SYSTEM } = await import("./ai.server");
    const payload = {
      arquivo: sanitizeString(data.name),
      totalRegistros: data.rowCount,
      colunas: data.fields,
      amostra: data.sample.slice(0, 40),
    };
    const text = await callGateway(DASHBOARD_SYSTEM, [
      { type: "text", text: JSON.stringify(payload) },
    ]);
    const parsed = parseJson<Partial<Dashboard>>(text, {});
    return {
      title: sanitizeString(parsed.title || data.name),
      subtitle: sanitizeString(parsed.subtitle || `${data.rowCount} registros analisados`),
      kpis: (parsed.kpis ?? []).map((k, i) => ({ ...k, id: `kpi-${i}`, accent: i })),
      charts: (parsed.charts ?? []).map((c, i) => ({ ...c, id: `chart-${i}`, palette: i })),
      insights: (parsed.insights ?? []).map(sanitizeString),
    };
  });

export const extractDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    // 1. Rate Limiting check
    const rateCheck = checkRateLimit("ai_extract_document", 10, 60000);
    if (!rateCheck.allowed) {
      throw new Error("Limite de requisições de IA excedido. Aguarde alguns segundos.");
    }
    // 2. Validate strict schema and sanitize input
    const validated = extractDocumentSchema.parse(input);
    return sanitizeObject(validated);
  })
  .handler(async ({ data }): Promise<{ rows: Row[] }> => {
    const { callGateway, parseJson, PDF_SYSTEM } = await import("./ai.server");
    const text = await callGateway(PDF_SYSTEM, [
      { type: "text", text: "Extraia os dados tabulares deste documento." },
      {
        type: "file",
        file: { filename: sanitizeString(data.filename), file_data: `data:${data.mime};base64,${data.base64}` },
      },
    ]);
    const parsed = parseJson<{ rows?: Row[] }>(text, {});
    return { rows: parsed.rows ?? [] };
  });

