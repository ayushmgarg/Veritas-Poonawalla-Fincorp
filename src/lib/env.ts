import { z } from "zod";

/**
 * Server-side environment validation.
 * Import this in any server code to ensure all required env vars exist.
 * Throws a descriptive error at startup if vars are missing.
 */

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),

  // LLM
  GROQ_API_KEY: z.string().startsWith("gsk_"),
  GEMINI_API_KEY: z.string().startsWith("AIza"),

  // Security
  ENCRYPTION_MASTER_KEY: z.string().length(64, "Must be 32 bytes hex (64 chars)"),
  SESSION_SIGNING_SECRET: z.string().min(32),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  INDIA_STACK_MODE: z.enum(["mock", "sandbox", "production"]).default("mock"),

  // Optional - Twilio
  TWILIO_ACCOUNT_SID: z.string().startsWith("AC").optional(),
  TWILIO_AUTH_TOKEN: z.string().min(10).optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  TWILIO_ADMIN_WHATSAPP: z.string().optional(),

  // Optional - Setu AA
  SETU_CLIENT_ID: z.string().uuid().optional(),
  SETU_CLIENT_SECRET: z.string().optional(),
  SETU_AA_BASE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `\n❌ Environment validation failed:\n${missing}\n\nCheck .env.local against .env.example\n`
    );
  }
  return result.data;
}

export const env = validateEnv();
