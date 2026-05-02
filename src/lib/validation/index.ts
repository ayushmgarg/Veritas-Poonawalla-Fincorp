import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

/**
 * Validates request body against a Zod schema.
 * Returns parsed data on success, or a 400 NextResponse on failure.
 */
export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }

  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return {
        success: false,
        response: NextResponse.json(
          { error: "Validation failed", issues },
          { status: 400 }
        ),
      };
    }
    return {
      success: false,
      response: NextResponse.json(
        { error: "Validation error" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validates a URL parameter (e.g., session ID from dynamic route).
 * Returns the validated string or a 400 response.
 */
export function validateParam(
  value: string,
  paramName: string = "id"
): ValidationResult<string> {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `Invalid ${paramName} format` },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: value };
}

export * from "./schemas";
