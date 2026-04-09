/**
 * Environment variable validation.
 * Throws at module-load time (server startup / build) with a clear message
 * if a required variable is missing, rather than crashing silently later.
 *
 * Import this at the top of any server-side file that needs env vars,
 * or call validateEnv() in your app startup path.
 */

type EnvSpec = {
  key: string;
  required: boolean;
  serverOnly?: boolean; // true = must NOT have NEXT_PUBLIC_ prefix
  description: string;
};

const SPECS: EnvSpec[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL",   required: true,  description: "Supabase project URL" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, description: "Supabase anon/public key" },
  { key: "SUPABASE_SERVICE_ROLE_KEY",  required: true,  serverOnly: true, description: "Supabase service-role key (never expose to browser)" },
  { key: "NEXT_PUBLIC_GOOGLE_MAPS_KEY", required: true, description: "Google Maps API key" },
  { key: "ADMIN_EMAILS",               required: true,  serverOnly: true, description: "Comma-separated admin email addresses" },
  { key: "CRON_SECRET",                required: true,  serverOnly: true, description: "Secret for Vercel cron job authentication" },
  // Optional — gracefully skipped when absent
  { key: "RESEND_API_KEY",             required: false, serverOnly: true, description: "Resend API key for email notifications" },
];

export function validateEnv(): void {
  // Only run server-side (this module may be imported by client bundles too)
  if (typeof window !== "undefined") return;

  const missing: string[] = [];
  const warnings: string[] = [];

  for (const spec of SPECS) {
    const val = process.env[spec.key];

    if (!val && spec.required) {
      missing.push(`  ✗ ${spec.key} — ${spec.description}`);
    }

    // Warn if a server-only var has been accidentally made public (NEXT_PUBLIC_ prefix)
    if (spec.serverOnly && spec.key.startsWith("NEXT_PUBLIC_")) {
      warnings.push(`  ⚠ ${spec.key} has NEXT_PUBLIC_ prefix — it will be exposed in browser bundles`);
    }
  }

  if (warnings.length) {
    console.warn("[env] Security warnings:\n" + warnings.join("\n"));
  }

  if (missing.length) {
    throw new Error(
      `[env] Missing required environment variables. Add them to .env.local (dev) or Vercel dashboard (prod):\n${missing.join("\n")}`
    );
  }
}

/** Typed, validated env accessor — safe to use after validateEnv() has been called. */
export const env = {
  supabaseUrl:        process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey:    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  googleMapsKey:      process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
  adminEmails:        (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean),
  cronSecret:         process.env.CRON_SECRET!,
  resendApiKey:       process.env.RESEND_API_KEY ?? null,  // optional
} as const;
