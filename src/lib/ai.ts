import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export interface AIConfig {
  geminiKey?: string;
  groqKey?: string;
  preferredProvider: "gemini" | "groq" | "auto";
  modelName?: string;
}

const STORAGE_KEY = "exacta_ai_config";

export function getAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Erro ao ler config de IA do localStorage", e);
  }

  return {
    geminiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
    groqKey: import.meta.env.VITE_GROQ_API_KEY || "",
    preferredProvider: "auto",
    modelName: "gemini-1.5-flash",
  };
}

export function saveAIConfig(config: Partial<AIConfig>): AIConfig {
  const current = getAIConfig();
  const updated: AIConfig = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Erro ao salvar config de IA", e);
  }
  return updated;
}

export async function testAIConnection(provider: "gemini" | "groq", key: string): Promise<{ success: boolean; message: string }> {
  if (!key.trim()) {
    return { success: false, message: "Chave de API n├úo informada." };
  }

  try {
    if (provider === "gemini") {
      const client = new GoogleGenerativeAI(key.trim());
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Responda apenas: OK");
      const text = result.response.text();
      return { success: true, message: `Conex├úo bem sucedida com Google Gemini! Resposta: ${text.slice(0, 20)}` };
    } else {
      const client = new Groq({ apiKey: key.trim(), dangerouslyAllowBrowser: true });
      const res = await client.chat.completions.create({
        messages: [{ role: "user", content: "Responda apenas: OK" }],
        model: "llama-3.3-70b-versatile",
      });
      const text = res.choices[0]?.message?.content || "";
      return { success: true, message: `Conex├úo bem sucedida com Groq! Resposta: ${text.slice(0, 20)}` };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || "Falha na conex├úo com o provedor." };
  }
}

export async function askGemini(prompt: string, customKey?: string) {
  const cfg = getAIConfig();
  const key = customKey || cfg.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("Chave de API do Google Gemini n├úo configurada.");

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function askGroq(prompt: string, customKey?: string) {
  const cfg = getAIConfig();
  const key = customKey || cfg.groqKey || import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error("Chave de API da Groq n├úo configurada.");

  const client = new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
  const chatCompletion = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });
  return chatCompletion.choices[0]?.message?.content || "";
}

/**
 * Smart unified AI query:
 * - Checks configured provider (Groq / Gemini)
 * - Tries provider API
 * - If keys are missing or API fails, uses smart built-in heuristic reasoning fallback
 */
export async function askAI(prompt: string, contextDescription?: string): Promise<string> {
  const cfg = getAIConfig();
  const preferred = cfg.preferredProvider || "auto";

  // Try preferred or available providers first
  if (preferred === "groq" || (preferred === "auto" && cfg.groqKey)) {
    try {
      return await askGroq(prompt);
    } catch (e) {
      console.warn("Groq failed, trying Gemini fallback...", e);
    }
  }

  if (preferred === "gemini" || cfg.geminiKey) {
    try {
      return await askGemini(prompt);
    } catch (e) {
      console.warn("Gemini failed, trying Groq fallback...", e);
    }
  }

  if (preferred === "auto" && cfg.groqKey) {
    try {
      return await askGroq(prompt);
    } catch (e) {
      console.warn("Auto Groq fallback failed", e);
    }
  }

  // Smart Heuristic Fallback (Offline / Zero-Config Assistant)
  return generateHeuristicResponse(prompt, contextDescription);
}

export interface GeneratedTask {
  title: string;
  description?: string;
  priority: "baixa" | "media" | "alta" | "urgente";
  due_date: string;
}

export async function generateStructuredTasks(goalPrompt: string): Promise<GeneratedTask[]> {
  const prompt = `
    Voc├¬ ├® um especialista em gest├úo de projetos.
    Com base no seguinte objetivo: "${goalPrompt}", gere um plano de a├º├úo composto por 3 a 5 tarefas objetivas e pr├íticas.
    
    Retorne EXCLUSIVAMENTE um array JSON v├ílido (sem tags markdown de bloco de c├│digo, sem texto extra) com este formato:
    [
      {
        "title": "T├¡tulo da tarefa",
        "description": "Explica├º├úo curta do que fazer",
        "priority": "alta",
        "due_date": "YYYY-MM-DD"
      }
    ]
    
    Considere as prioridades entre "baixa", "media", "alta", "urgente" e distribua as datas de prazo entre os pr├│ximos 3 a 28 dias a partir de hoje (${new Date().toISOString().slice(0, 10)}).
  `;

  try {
    const raw = await askAI(prompt, "task_generation");
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(t => ({
          title: String(t.title || "Nova Tarefa"),
          description: t.description ? String(t.description) : undefined,
          priority: (["baixa", "media", "alta", "urgente"].includes(t.priority) ? t.priority : "media") as any,
          due_date: t.due_date || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        }));
      }
    }
  } catch (e) {
    console.warn("Failed parsing structured AI tasks, using heuristic tasks", e);
  }

  // Fallback generator
  const now = new Date();
  const d1 = new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10);
  const d2 = new Date(now.getTime() + 5 * 86400000).toISOString().slice(0, 10);
  const d3 = new Date(now.getTime() + 10 * 86400000).toISOString().slice(0, 10);

  return [
    {
      title: `Planejamento e Levantamento de Requisitos: ${goalPrompt.slice(0, 40)}`,
      description: `Mapear escopo, stakeholders e recursos necess├írios para: ${goalPrompt}`,
      priority: "alta",
      due_date: d1,
    },
    {
      title: `Execu├º├úo da Etapa Principal: ${goalPrompt.slice(0, 40)}`,
      description: `Desenvolver as entregas essenciais e mitigar riscos identificados.`,
      priority: "media",
      due_date: d2,
    },
    {
      title: `Valida├º├úo, Testes e Apresenta├º├úo de Resultados`,
      description: `Revisar conformidade com os objetivos e coletar feedback final.`,
      priority: "media",
      due_date: d3,
    },
  ];
}

export async function analyzeDashboardData(data: any) {
  const prompt = `
    Analise os seguintes dados do dashboard do sistema EXACTA e forne├ºa 3 insights r├ípidos e uma recomenda├º├úo de produtividade.
    Dados: ${JSON.stringify(data)}
    
    Responda em portugu├¬s, de forma executiva, objetiva e profissional em Markdown.
  `;
  
  return await askAI(prompt, "dashboard_analytics");
}

function generateHeuristicResponse(prompt: string, context?: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("ol├í") || lower.includes("oi") || lower.includes("bom dia") || lower.includes("boa tarde")) {
    return `Ol├í! ­ƒæï Sou o **Assistente Inteligente da EXACTA**.\n\nEstou pronto para apoiar na coordena├º├úo de projetos, an├ílise de gargalos, distribui├º├úo de tarefas e planejamento de prazos.\n\n­ƒÆí *Dica: Voc├¬ pode configurar uma chave gratuita do Google Gemini ou Groq nas Configura├º├Áes do Sistema para habilitar racioc├¡nio generativo avan├ºado.*`;
  }

  if (lower.includes("tarefa") || lower.includes("projeto") || lower.includes("prioridade") || lower.includes("prazo")) {
    return `### ­ƒôï An├ílise Executiva de Gest├úo & Prioriza├º├úo\n\n1. **Foco em Valor (Matriz Eisenhower):** Concentre esfor├ºos primeiro nas tarefas com status de urg├¬ncia alta ou prazos inferiores a 48h.\n2. **Elimina├º├úo de Impedimentos:** Verifique depend├¬ncias bloqueantes antes de iniciar sprints ou novas fases de projetos.\n3. **Ritmo de Entrega:** Mantenha tarefas subdivididas em ciclos de no m├íximo 3 a 5 dias para garantir previsibilidade e feedback cont├¡nuo.\n\nPrecisa de um desdobramento espec├¡fico para alguma iniciativa em andamento?`;
  }

  if (lower.includes("gargalo") || lower.includes("atraso") || lower.includes("produtividade") || lower.includes("bottleneck")) {
    return `### ÔÜí Diagn├│stico de Produtividade & Gargalos\n\n- **Identifica├º├úo de Sobrecarga:** Observe a concentra├º├úo de tarefas 'em andamento' por respons├ível. Limitar o WIP (Work In Progress) acelera a vaz├úo geral.\n- **Pontos de Espera:** Tarefas em revis├úo ou aprova├º├úo externa costumam ser a principal fonte oculta de atrasos.\n- **A├º├úo Recomendada:** Realinhe as datas de entrega nos cards do Kanban e redistribua itens bloqueados entre a equipe.`;
  }

  return `### ­ƒÆí An├ílise Estrat├®gica EXACTA\n\nCom base na sua solicita├º├úo sobre **"${prompt.slice(0, 60)}"**:\n\n1. **Alinhamento de Escopo:** Certifique-se de que os marcos e entreg├íveis est├úo claros para todos os envolvidos no projeto.\n2. **Acompanhamento de Metas:** Vincule as entregas operacionais aos OKRs correspondentes no painel de metas.\n3. **Pr├│ximo Passo Recomendado:** Acesse a ├írea de *Tarefas* ou *Calend├írio* para registrar os compromissos e monitorar a execu├º├úo em tempo real.\n\n*(Para respostas com modelos de linguagem de ├║ltima gera├º├úo, configure sua API Key no menu de Configura├º├Áes).*`;
}
