// Global loading UI shown during page transitions (Next.js Suspense boundary).
// Intentionally minimal — page-specific skeletons live alongside their pages.
export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
