import { z } from "zod";

// ─── Primitives ──────────────────────────────────────────────────────────────

/** Indian mobile: starts with 6-9, exactly 10 digits */
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number");

/** UUID v4 format */
export const uuidSchema = z.string().uuid("Invalid session ID format");

/** Session ID used across most routes */
export const sessionIdBody = z.object({
  session_id: uuidSchema,
});

// ─── Session ─────────────────────────────────────────────────────────────────

export const sessionCreateSchema = z.object({
  phone: phoneSchema,
  geo: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional(),
  }).optional(),
});

export const sessionStepSchema = z.object({
  step: z.number().int().min(0).max(20),
});

// ─── Consent ─────────────────────────────────────────────────────────────────

export const consentSchema = z.object({
  consent_type: z.enum(["kyc", "data_sharing", "offer_acceptance", "recording", "verbal_kyc"]),
  consent_text: z.string().max(1000).optional(),
  language: z.string().min(2).max(10).optional(),
});

// ─── Fraud / Liveness ────────────────────────────────────────────────────────

export const livenessSchema = z.object({
  session_id: uuidSchema,
  blink_count: z.number().int().min(0).max(500),
  micro_movement_count: z.number().int().min(0).max(10000),
  head_yaw: z.number().min(-180).max(180).optional(),
  head_pitch: z.number().min(-90).max(90).optional(),
  face_confidence: z.number().min(0).max(1),
});

export const spoofCheckSchema = z.object({
  session_id: uuidSchema,
  micro_movements: z.number().int().min(0).max(10000),
  face_confidence: z.number().min(0).max(1),
  depth_variance: z.number().min(0).max(100),
});

export const intentDriftSchema = z.object({
  session_id: uuidSchema,
  current_entities: z
    .record(z.string(), z.union([z.string(), z.number()]).optional())
    .optional(),
  transcript: z.string().max(50000).optional(),
});

// ─── Speech ──────────────────────────────────────────────────────────────────

export const speechProcessSchema = z.object({
  session_id: uuidSchema,
  text: z.string().min(1).max(5000),
  language: z.string().min(2).max(10).optional(),
  confidence: z.number().min(0).max(1).optional(),
  timestamp_ms: z.number().int().positive().optional(),
});

// ─── Offer ───────────────────────────────────────────────────────────────────

export const offerNegotiateSchema = z.object({
  session_id: uuidSchema,
  offer_id: uuidSchema,
  new_tenure: z.number().int().min(6).max(360).optional(),
  new_amount: z.number().min(50000).max(75000000).optional(),
  message: z.string().max(2000).optional(),
});

// ─── WhatsApp Notification ───────────────────────────────────────────────────

export const whatsappNotifySchema = z.object({
  session_id: uuidSchema,
  offer_id: uuidSchema,
});
