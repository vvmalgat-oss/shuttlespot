"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabase";
import type { User } from "@supabase/supabase-js";

export function useSavedVenues() {
  const [user, setUser] = useState<User | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => l.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return; }
    supabase
      .from("saved_venues")
      .select("venue_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setSavedIds(new Set(data.map((r: { venue_id: number }) => r.venue_id)));
      });
  }, [user]);

  const toggleSave = useCallback(async (venueId: number, onNeedAuth?: () => void) => {
    if (!user) { onNeedAuth?.(); return; }
    const isSaved = savedIds.has(venueId);
    if (isSaved) {
      setSavedIds((prev) => { const next = new Set(prev); next.delete(venueId); return next; });
      await supabase.from("saved_venues").delete().eq("user_id", user.id).eq("venue_id", venueId);
    } else {
      setSavedIds((prev) => new Set(prev).add(venueId));
      await supabase.from("saved_venues").insert({ user_id: user.id, venue_id: venueId });
    }
  }, [user, savedIds]);

  return { savedIds, toggleSave, user };
}
