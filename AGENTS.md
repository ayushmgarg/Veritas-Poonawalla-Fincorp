# VERITAS — Agentic V-CIP Platform

Built with Next.js 15 App Router. All routes use the `params: Promise<{...}>` pattern — always `await params` before destructuring.

API routes are in `src/app/api/`. All DB calls use the Supabase service role client from `lib/supabase.ts`. Never use the anon client in API routes.
