import { NextResponse } from "next/server";

/**
 * Standardized API response envelope.
 * Ensures consistent shape across all 26 endpoints.
 */

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status: number = 400,
  details?: unknown
) {
  return NextResponse.json(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export function notFoundResponse(resource: string = "Resource") {
  return errorResponse(`${resource} not found`, 404);
}

export function serverErrorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  return errorResponse(message, 500);
}
