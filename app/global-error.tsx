"use client";

import { useEffect } from "react";

// global-error.tsx wraps the root layout itself — must supply its own <html>/<body>.
// Triggered only for errors thrown from layout.tsx or template.tsx.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#f8fafc" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            textAlign: "center",
            padding: "1rem",
          }}
        >
          <p style={{ fontSize: "3rem" }}>🏸</p>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "1rem 0 0.5rem" }}>
            ShuttleSpot is having a moment
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.875rem", maxWidth: "24rem" }}>
            A critical error occurred. Our team has been notified.
          </p>
          {error.digest && (
            <p style={{ color: "#94a3b8", fontSize: "0.65rem", marginTop: "0.25rem", fontFamily: "monospace" }}>
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1.25rem",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
