import { validateEnv } from "./lib/env";

export function register() {
  // Runs once at server startup — crashes early with a clear message if env vars are missing
  validateEnv();
}
