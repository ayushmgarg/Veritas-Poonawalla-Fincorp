import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

interface LLMResponse {
  text: string;
  provider: "groq" | "gemini";
}

export async function queryLLM(prompt: string): Promise<LLMResponse> {
  if (groqClient) {
    try {
      return await queryGroq(prompt);
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error && error.message?.includes("429");
      if (isRateLimit && geminiClient) {
        return await queryGemini(prompt);
      }
      throw error;
    }
  }

  if (geminiClient) {
    return await queryGemini(prompt);
  }

  throw new Error(
    "No LLM provider configured. Set GROQ_API_KEY or GEMINI_API_KEY."
  );
}

async function queryGroq(prompt: string): Promise<LLMResponse> {
  const completion = await groqClient!.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  return {
    text: completion.choices[0]?.message?.content || "{}",
    provider: "groq",
  };
}

async function queryGemini(prompt: string): Promise<LLMResponse> {
  const model = geminiClient!.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return { text, provider: "gemini" };
}

export function parseLLMJson<T>(response: LLMResponse): T {
  const cleaned = response.text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
