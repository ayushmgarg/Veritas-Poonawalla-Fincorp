import type { IndiaStackProvider } from "./types";
import { createMockProvider } from "./mock";
import { createSandboxProvider } from "./sandbox";

type Mode = "mock" | "sandbox" | "production";

let cachedProvider: IndiaStackProvider | null = null;
let cachedMode: Mode | null = null;

/**
 * Returns the India Stack provider based on INDIA_STACK_MODE env var.
 *
 * - mock: Deterministic persona-based responses (default, no external calls)
 * - sandbox: Real Setu AA sandbox + mock for other services
 * - production: Throws until production implementations are ready
 *
 * Provider is cached per mode for the lifetime of the process.
 */
export function getIndiaStackProvider(): IndiaStackProvider {
  const mode = (process.env.INDIA_STACK_MODE || "mock") as Mode;

  if (cachedProvider && cachedMode === mode) {
    return cachedProvider;
  }

  switch (mode) {
    case "mock":
      cachedProvider = createMockProvider();
      break;
    case "sandbox":
      cachedProvider = createSandboxProvider();
      break;
    case "production":
      throw new Error(
        "Production India Stack providers not yet implemented. " +
          "Set INDIA_STACK_MODE=mock or INDIA_STACK_MODE=sandbox"
      );
    default:
      throw new Error(`Unknown INDIA_STACK_MODE: ${mode}`);
  }

  cachedMode = mode;
  return cachedProvider;
}
