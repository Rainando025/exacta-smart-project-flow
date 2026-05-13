import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY, dangerouslyAllowBrowser: true }) : null;

export async function askGemini(prompt: string) {
  if (!genAI) throw new Error("Gemini API Key not configured");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function askGroq(prompt: string) {
  if (!groq) throw new Error("Groq API Key not configured");
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });
  return chatCompletion.choices[0].message.content;
}

export async function analyzeDashboardData(data: any) {
  const prompt = `
    Analise os seguintes dados do dashboard do sistema EXACTA e forneça 3 insights rápidos e uma recomendação de produtividade.
    Dados: ${JSON.stringify(data)}
    
    Responda em português, de forma executiva e profissional.
  `;
  
  // Prefer Groq for speed if available, fallback to Gemini
  try {
    return await askGroq(prompt);
  } catch {
    return await askGemini(prompt);
  }
}
