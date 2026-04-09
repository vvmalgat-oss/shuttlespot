"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CoachesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[coaches/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-4 pb-16 text-center md:pb-0">
      <span className="text-5xl">🏸</span>
      <h2 className="mt-5 text-xl font-bold">Couldn&apos;t load coaches</h2>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        Something went wrong fetching the coaches list. Please try again.
      </p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
