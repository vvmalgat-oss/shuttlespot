"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in dev; swap for Sentry.captureException(error) when you add monitoring
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-4 pb-16 text-center md:pb-0">
      <span className="text-6xl">😬</span>
      <h2 className="mt-6 text-2xl font-bold tracking-tight">Something went wrong</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        We hit an unexpected error. It&apos;s been noted — please try again.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">ref: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Go home
        </Button>
      </div>
    </div>
  );
}
