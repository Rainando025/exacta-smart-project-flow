import { createServerFn } from "@tanstack/react-start";
import type { Dashboard, Row } from "./types";

export const generateDashboard = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { name: string; fields: { name: string; type: string }[]; sample: Row[]; rowCount: number }) => input,
  )
  .handler(async ({ data }): Promise<Dashboard> => {
    const { callGateway, parseJson, DASHBOARD_SYSTEM } = await import("./ai.server");
    const payload = {
      arquivo: data.name,
      totalRegistros: data.rowCount,
      colunas: data.fields,
      amostra: data.sample.slice(0, 40),
    };
    const text = await callGateway(DASHBOARD_SYSTEM, [
      { type: "text", text: JSON.stringify(payload) },
    ]);
    const parsed = parseJson<Partial<Dashboard>>(text, {});
    return {
      title: parsed.title || data.name,
      subtitle: parsed.subtitle || `${data.rowCount} registros analisados`,
      kpis: (parsed.kpis ?? []).map((k, i) => ({ ...k, id: `kpi-${i}`, accent: i })),
      charts: (parsed.charts ?? []).map((c, i) => ({ ...c, id: `chart-${i}`, palette: i })),
      insights: parsed.insights ?? [],
    };
  });

export const extractDocument = createServerFn({ method: "POST" })
  .inputValidator((input: { filename: string; mime: string; base64: string }) => input)
  .handler(async ({ data }): Promise<{ rows: Row[] }> => {
    const { callGateway, parseJson, PDF_SYSTEM } = await import("./ai.server");
    const text = await callGateway(PDF_SYSTEM, [
      { type: "text", text: "Extraia os dados tabulares deste documento." },
      {
        type: "file",
        file: { filename: data.filename, file_data: `data:${data.mime};base64,${data.base64}` },
      },
    ]);
    const parsed = parseJson<{ rows?: Row[] }>(text, {});
    return { rows: parsed.rows ?? [] };
  });
