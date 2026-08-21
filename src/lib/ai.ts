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
    return { success: false, message: "Chave de API não informada." };
  }

  try {
    if (provider === "gemini") {
      const client = new GoogleGenerativeAI(key.trim());
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Responda apenas: OK");
      const text = result.response.text();
      return { success: true, message: `Conexão bem sucedida com Google Gemini! Resposta: ${text.slice(0, 20)}` };
    } else {
      const client = new Groq({ apiKey: key.trim(), dangerouslyAllowBrowser: true });
      const res = await client.chat.completions.create({
        messages: [{ role: "user", content: "Responda apenas: OK" }],
        model: "llama-3.3-70b-versatile",
      });
      const text = res.choices[0]?.message?.content || "";
      return { success: true, message: `Conexão bem sucedida com Groq! Resposta: ${text.slice(0, 20)}` };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || "Falha na conexão com o provedor." };
  }
}

export async function askGemini(prompt: string, customKey?: string) {
  const cfg = getAIConfig();
  const key = customKey || cfg.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("Chave de API do Google Gemini não configurada.");

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function askGroq(prompt: string, customKey?: string) {
  const cfg = getAIConfig();
  const key = customKey || cfg.groqKey || import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error("Chave de API da Groq não configurada.");

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
    Você é um especialista em gestão de projetos.
    Com base no seguinte objetivo: "${goalPrompt}", gere um plano de ação composto por 3 a 5 tarefas objetivas e práticas.
    
    Retorne EXCLUSIVAMENTE um array JSON válido (sem tags markdown de bloco de código, sem texto extra) com este formato:
    [
      {
        "title": "Título da tarefa",
        "description": "Explicação curta do que fazer",
        "priority": "alta",
        "due_date": "YYYY-MM-DD"
      }
    ]
    
    Considere as prioridades entre "baixa", "media", "alta", "urgente" e distribua as datas de prazo entre os próximos 3 a 28 dias a partir de hoje (${new Date().toISOString().slice(0, 10)}).
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
      description: `Mapear escopo, stakeholders e recursos necessários para: ${goalPrompt}`,
      priority: "alta",
      due_date: d1,
    },
    {
      title: `Execução da Etapa Principal: ${goalPrompt.slice(0, 40)}`,
      description: `Desenvolver as entregas essenciais e mitigar riscos identificados.`,
      priority: "media",
      due_date: d2,
    },
    {
      title: `Validação, Testes e Apresentação de Resultados`,
      description: `Revisar conformidade com os objetivos e coletar feedback final.`,
      priority: "media",
      due_date: d3,
    },
  ];
}

export async function analyzeDashboardData(data: any) {
  const prompt = `
    Analise os seguintes dados do dashboard do sistema EXACTA e forneça 3 insights rápidos e uma recomendação de produtividade.
    Dados: ${JSON.stringify(data)}
    
    Responda em português, de forma executiva, objetiva e profissional em Markdown.
  `;
  
  return await askAI(prompt, "dashboard_analytics");
}

function generateHeuristicResponse(prompt: string, context?: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("olá") || lower.includes("oi") || lower.includes("bom dia") || lower.includes("boa tarde")) {
    return `Olá! ­ƒæï Sou o **Assistente Inteligente da EXACTA**.\n\nEstou pronto para apoiar na coordenação de projetos, análise de gargalos, distribuição de tarefas e planejamento de prazos.\n\n­ƒÆí *Dica: Você pode configurar uma chave gratuita do Google Gemini ou Groq nas Configurações do Sistema para habilitar raciocínio generativo avançado.*`;
  }

  if (lower.includes("tarefa") || lower.includes("projeto") || lower.includes("prioridade") || lower.includes("prazo")) {
    return `### ­ƒôï Análise Executiva de Gestão & Priorização\n\n1. **Foco em Valor (Matriz Eisenhower):** Concentre esforços primeiro nas tarefas com status de urgência alta ou prazos inferiores a 48h.\n2. **Eliminação de Impedimentos:** Verifique dependências bloqueantes antes de iniciar sprints ou novas fases de projetos.\n3. **Ritmo de Entrega:** Mantenha tarefas subdivididas em ciclos de no máximo 3 a 5 dias para garantir previsibilidade e feedback contínuo.\n\nPrecisa de um desdobramento específico para alguma iniciativa em andamento?`;
  }

  if (lower.includes("gargalo") || lower.includes("atraso") || lower.includes("produtividade") || lower.includes("bottleneck")) {
    return `### ÔÜí Diagnóstico de Produtividade & Gargalos\n\n- **Identificação de Sobrecarga:** Observe a concentração de tarefas 'em andamento' por responsável. Limitar o WIP (Work In Progress) acelera a vazão geral.\n- **Pontos de Espera:** Tarefas em revisão ou aprovação externa costumam ser a principal fonte oculta de atrasos.\n- **Ação Recomendada:** Realinhe as datas de entrega nos cards do Kanban e redistribua itens bloqueados entre a equipe.`;
  }

  return `### ­ƒÆí Análise Estratégica EXACTA\n\nCom base na sua solicitação sobre **"${prompt.slice(0, 60)}"**:\n\n1. **Alinhamento de Escopo:** Certifique-se de que os marcos e entregáveis estão claros para todos os envolvidos no projeto.\n2. **Acompanhamento de Metas:** Vincule as entregas operacionais aos OKRs correspondentes no painel de metas.\n3. **Próximo Passo Recomendado:** Acesse a área de *Tarefas* ou *Calendário* para registrar os compromissos e monitorar a execução em tempo real.\n\n*(Para respostas com modelos de linguagem de última geração, configure sua API Key no menu de Configurações).*`;
}
