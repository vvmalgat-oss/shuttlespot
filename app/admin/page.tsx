"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, X, CheckCircle2, MapPin } from "lucide-react";
import type { User } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Venue = {
  id: number;
  name: string;
  suburb: string;
  city: string;
  state: string;
  address: string;
  courts: number | null;
  price: string | null;
  booking_url: string | null;
  opening_hours: string | null;
  open_hour: number | null;
  close_hour: number | null;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
};

const EMPTY: Omit<Venue, "id"> = {
  name: "", suburb: "", city: "", state: "VIC", address: "",
  courts: null, price: null, booking_url: null,
  opening_hours: null, open_hour: 9, close_hour: 22,
  lat: null, lng: null, photo_url: null,
};

const STATES = ["VIC", "NSW", "QLD", "WA", "SA", "ACT", "TAS", "NT"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function callApi(method: string, body: object, token: string) {
  const res = await fetch("/api/admin/venues", {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [user, setUser] = useState<User | null | "loading">("loading");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [form, setForm] = useState<Omit<Venue, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [fetchingPlace, setFetchingPlace] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!user || user === "loading") return;
    supabase.from("venues").select("*").order("name").then(({ data }) => {
      if (data) setVenues(data as Venue[]);
    });
  }, [user]);

  const filtered = venues.filter((v) => {
    const q = search.toLowerCase();
    return !q || v.name.toLowerCase().includes(q) || v.suburb?.toLowerCase().includes(q) || v.state.toLowerCase().includes(q);
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setFormOpen(true); };
  const openEdit = (v: Venue) => { setEditing(v); setForm({ ...v }); setError(""); setFormOpen(true); };

  const set = (k: keyof typeof EMPTY, val: unknown) => setForm((f) => ({ ...f, [k]: val }));

  const fetchFromPlaces = async () => {
    if (!form.name) return;
    setFetchingPlace(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const q = encodeURIComponent(`${form.name} ${form.suburb || ""} ${form.state} Australia`);
      const res = await fetch(`/api/places-lookup?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.lat) set("lat", data.lat);
      if (data.lng) set("lng", data.lng);
      if (data.address) set("address", data.address);
      if (data.photo_url) set("photo_url", data.photo_url);
      if (data.website) set("booking_url", data.website);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not fetch place details");
    } finally {
      setFetchingPlace(false);
    }
  };

  const save = async () => {
    if (!form.name || !form.state) { setError("Name and state are required"); return; }
    setSaving(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      // Auto-generate opening_hours text
      const oh = form.open_hour != null && form.close_hour != null
        ? `Mon–Sun ${fmtHour(form.open_hour)} – ${fmtHour(form.close_hour)}`
        : form.opening_hours;

      const payload = { ...form, opening_hours: oh, courts: form.courts ? Number(form.courts) : null };

      if (editing) {
        const updated = await callApi("PUT", { id: editing.id, ...payload }, token);
        setVenues((vs) => vs.map((v) => (v.id === editing.id ? updated : v)));
      } else {
        const created = await callApi("POST", payload, token);
        setVenues((vs) => [...vs, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setFormOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    await callApi("DELETE", { id: deleteId }, token);
    setVenues((vs) => vs.filter((v) => v.id !== deleteId));
    setDeleteId(null);
  };

  // ── Auth gate ──
  if (user === "loading") {
    return <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const isAdmin = user && adminEmails.includes(user.email?.toLowerCase() || "");

  if (!user) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-lg font-bold">Admin access required</p>
        <p className="text-sm text-muted-foreground">Sign in to manage venues</p>
        <Button onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } })}>
          Sign in with Google
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg font-bold">Access denied</p>
        <p className="text-sm text-muted-foreground">You don&apos;t have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Venue Admin</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{venues.length} venues total</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add venue
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search venues…" className="pl-9 h-9 text-sm" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
      </div>

      {/* Venue table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3 hidden sm:table-cell">Location</th>
              <th className="px-4 py-3 hidden md:table-cell">Courts</th>
              <th className="px-4 py-3 hidden lg:table-cell">Price</th>
              <th className="px-4 py-3 hidden lg:table-cell">Status</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <tr key={v.id} className={`border-b last:border-0 hover:bg-muted/20 transition ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {v.photo_url ? (
                      <img src={v.photo_url} alt="" className="h-8 w-10 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-10 shrink-0 rounded bg-muted" />
                    )}
                    <span className="font-medium leading-tight">{v.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {v.suburb}, <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0">{v.state}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{v.courts ?? "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell font-medium text-primary">{v.price ?? "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {v.booking_url
                    ? <span className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Online</span>
                    : <span className="text-[11px] text-muted-foreground">Enquire</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(v.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No venues found</div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { if (!v) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto gap-0 p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editing ? `Edit: ${editing.name}` : "Add new venue"}</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            {/* Auto-fill button */}
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              <span className="flex-1">Fill in Name + State then auto-fetch coordinates, address &amp; photo from Google Places.</span>
              <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={fetchFromPlaces} disabled={fetchingPlace || !form.name}>
                {fetchingPlace ? "Fetching…" : "Auto-fill from Google"}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium">Venue name *</label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Melbourne Badminton Centre" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Suburb *</label>
                <Input value={form.suburb} onChange={(e) => set("suburb", e.target.value)} placeholder="e.g. Blackburn North" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">City</label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Melbourne" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">State *</label>
                <select
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Courts</label>
                <Input type="number" min={1} value={form.courts ?? ""} onChange={(e) => set("courts", e.target.value ? parseInt(e.target.value) : null)} placeholder="e.g. 6" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium">Address</label>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. 123 Main St, Suburb VIC 3000" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Latitude</label>
                <Input type="number" step="any" value={form.lat ?? ""} onChange={(e) => set("lat", e.target.value ? parseFloat(e.target.value) : null)} placeholder="-37.8136" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Longitude</label>
                <Input type="number" step="any" value={form.lng ?? ""} onChange={(e) => set("lng", e.target.value ? parseFloat(e.target.value) : null)} placeholder="144.9631" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Open hour (0–24)</label>
                <Input type="number" min={0} max={24} value={form.open_hour ?? ""} onChange={(e) => set("open_hour", e.target.value ? parseInt(e.target.value) : null)} placeholder="9" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Close hour (0–24)</label>
                <Input type="number" min={0} max={24} value={form.close_hour ?? ""} onChange={(e) => set("close_hour", e.target.value ? parseInt(e.target.value) : null)} placeholder="22" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Price</label>
                <Input value={form.price ?? ""} onChange={(e) => set("price", e.target.value || null)} placeholder="e.g. $15/hr" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Booking URL</label>
                <Input value={form.booking_url ?? ""} onChange={(e) => set("booking_url", e.target.value || null)} placeholder="https://…" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium">Photo URL</label>
                <Input value={form.photo_url ?? ""} onChange={(e) => set("photo_url", e.target.value || null)} placeholder="https://…" />
                {form.photo_url && (
                  <img src={form.photo_url} alt="preview" className="mt-2 h-24 w-full rounded-md object-cover" />
                )}
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add venue"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-sm gap-0 p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Delete venue?</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">This will permanently delete the venue and all associated reviews. This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function fmtHour(h: number): string {
  if (h === 0 || h === 24) return "midnight";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}
