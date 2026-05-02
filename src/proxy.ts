import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // HSTS - force HTTPS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy - restrict browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(self), payment=()"
  );
  // CSP - allow self + Supabase + Groq + inline styles (Tailwind)
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com https://generativelanguage.googleapis.com https://cdn.jsdelivr.net https://storage.googleapis.com",
      "media-src 'self' blob:",
      "worker-src 'self' blob: https://cdn.jsdelivr.net",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (pathname.startsWith("/api")) {
    const ip = getClientIP(request);

    // Determine rate limit tier
    let limitConfig = RATE_LIMITS.global;
    let limitKey = `global:${ip}`;

    if (pathname === "/api/session/create") {
      limitConfig = RATE_LIMITS.sessionCreate;
      limitKey = `session-create:${ip}`;
    } else if (
      pathname.includes("/credit/risk-classify") ||
      pathname.includes("/credit/shadow-score")
    ) {
      limitConfig = RATE_LIMITS.llm;
      limitKey = `llm:${ip}`;
    } else if (pathname.startsWith("/api/verify/")) {
      limitConfig = RATE_LIMITS.verification;
      limitKey = `verify:${ip}`;
    }

    const result = checkRateLimit(limitKey, limitConfig);

    if (!result.allowed) {
      const errorResponse = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      errorResponse.headers.set("Retry-After", String(Math.ceil(result.resetMs / 1000)));
      errorResponse.headers.set("X-RateLimit-Remaining", "0");
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    return addSecurityHeaders(response);
  }

  // Non-API routes: just add security headers
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    // Match all paths except static files and _next internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
