"use client";

import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "./StarRating";

type Review = {
  id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700",
];

function avatarColor(name: string) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

type Props = { reviews: Review[]; isLoading: boolean };

export default function ReviewList({ reviews, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No reviews yet. Be the first to share your experience!
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {reviews.map((r) => (
        <div key={r.id} className="flex gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(r.reviewer_name)}`}>
            {initials(r.reviewer_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{r.reviewer_name}</span>
              <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
            </div>
            <StarRating rating={r.rating} size="xs" />
            {r.comment && (
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
