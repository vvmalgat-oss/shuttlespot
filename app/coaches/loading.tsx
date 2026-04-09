// Skeleton shown while the coaches server page fetches from Supabase.
export default function CoachesLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header skeleton */}
      <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="mb-6 h-4 w-40 animate-pulse rounded bg-muted" />

      {/* Filter row skeleton */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[120, 100, 110, 90].map((w) => (
          <div key={w} className="h-9 animate-pulse rounded-lg bg-muted" style={{ width: w }} />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-2xl border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-4 p-5 pb-4">
              <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-muted" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </div>
              <div className="space-y-1 text-right">
                <div className="h-5 w-12 animate-pulse rounded bg-muted ml-auto" />
                <div className="h-3 w-8 animate-pulse rounded bg-muted ml-auto" />
              </div>
            </div>
            {/* Bio */}
            <div className="space-y-1.5 px-5">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            </div>
            {/* Tags */}
            <div className="mt-3 flex gap-1.5 px-5">
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
            </div>
            {/* Session types */}
            <div className="mt-2.5 mb-4 flex gap-1.5 px-5">
              <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
            </div>
            {/* Footer */}
            <div className="border-t px-5 py-3">
              <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
