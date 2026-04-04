"use client";

import { useState } from "react";
import { supabase } from "../../supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StarRating from "./StarRating";
import { CheckCircle2 } from "lucide-react";

type Review = {
  id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

type Props = {
  venueId: number;
  venueName: string;
  onSuccess: (review: Review) => void;
};

export default function ReviewForm({ venueId, venueName, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const valid = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && rating > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("venue_reviews")
      .insert({ venue_id: venueId, reviewer_name: name.trim(), email: email.trim().toLowerCase(), rating, comment: comment.trim() })
      .select("id, reviewer_name, rating, comment, created_at")
      .single();

    setSubmitting(false);

    if (err) {
      if (err.code === "23505") {
        setError("You've already reviewed this venue.");
      } else {
        setError("Something went wrong — please try again.");
      }
      return;
    }

    if (data) {
      onSuccess(data as Review);
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border bg-emerald-50 px-6 py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="text-sm font-semibold text-emerald-800">Thanks for your review!</p>
        <p className="text-xs text-emerald-700">Your feedback helps others find great courts.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-5">
      <h3 className="mb-4 text-sm font-bold">Write a review for {venueName}</h3>

      {/* Star picker */}
      <div className="mb-4">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Your rating <span className="text-destructive">*</span></p>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
        {rating > 0 && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
          </p>
        )}
      </div>

      {/* Name + email */}
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Name <span className="text-destructive">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-9 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Email <span className="text-destructive">*</span>
            <span className="ml-1 font-normal text-muted-foreground/60">(not shown publicly)</span>
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-9 text-sm"
            required
          />
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Comment <span className="font-normal text-muted-foreground/60">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was the court? Parking, cleanliness, staff..."
          maxLength={500}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
        />
        <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{comment.length}/500</p>
      </div>

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <Button type="submit" disabled={!valid || submitting} className="w-full sm:w-auto">
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
