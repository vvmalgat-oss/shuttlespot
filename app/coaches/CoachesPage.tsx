"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/supabase";
import {
  Search, X, CheckCircle2, Star, MapPin, Clock, Users, Video, User,
  ChevronRight, ChevronLeft, Award, Sparkles, TrendingUp,
  MessageSquare, Send, Trash2, Pencil, Camera,
} from "lucide-react";
import AuthModal from "../components/AuthModal";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Coach = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  suburb: string;
  state: string;
  bio?: string | null;
  experience_years?: number | null;
  specialties: string[];
  coaching_levels: string[];
  session_types: string[];
  price_per_hour?: number | null;
  price_notes?: string | null;
  website?: string | null;
  photo_url?: string | null;
  verified: boolean;
  created_at: string;
  user_id?: string | null;
};

type CoachMessage = {
  id: number;
  coach_id: number;
  sender_user_id: string;
  sender_name: string;
  message: string;
  is_from_coach: boolean;
  thread_user_id: string;
  created_at: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATES = ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"];

const SPECIALTIES = [
  "Beginner Development","Junior Coaching","Intermediate","Advanced / Competitive",
  "Tournament Preparation","Fitness & Conditioning","Footwork & Agility",
  "Doubles Strategy","Singles Strategy","Stroke Technique",
];
const LEVELS = [
  "Juniors (Under 18)","Adult Beginner","Adult Intermediate",
  "Adult Advanced","Competitive / Tournament",
];
const SESSION_TYPES = [
  "Private 1-on-1","Group Sessions","Online / Video","On-court Sessions",
];
const GRADIENTS = [
  "from-blue-500 to-blue-700","from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700","from-amber-500 to-amber-600",
  "from-rose-500 to-rose-700","from-cyan-500 to-cyan-700",
  "from-indigo-500 to-indigo-700","from-teal-500 to-teal-700",
];
const SESSION_ICONS: Record<string, React.ReactNode> = {
  "Private 1-on-1":    <User className="h-3 w-3" />,
  "Group Sessions":    <Users className="h-3 w-3" />,
  "Online / Video":    <Video className="h-3 w-3" />,
  "On-court Sessions": <MapPin className="h-3 w-3" />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarGradient(name: string) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[h % GRADIENTS.length];
}
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function uploadCoachPhoto(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("coach-photos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error || !data) return null;
  const { data: { publicUrl } } = supabase.storage.from("coach-photos").getPublicUrl(data.path);
  return publicUrl;
}

// ─── Coach card ───────────────────────────────────────────────────────────────

function CoachCard({ coach, isOwn, onEnquire, onEdit, onDelete, onViewMessages }: {
  coach: Coach;
  isOwn: boolean;
  onEnquire: (coach: Coach) => void;
  onEdit: (coach: Coach) => void;
  onDelete: (id: number) => void;
  onViewMessages: (coach: Coach) => void;
}) {
  return (
    <div className={`group flex flex-col rounded-2xl border bg-card transition-all overflow-hidden ${
      isOwn
        ? "border-primary/40 ring-1 ring-primary/20 shadow-sm"
        : "hover:border-primary/30 hover:shadow-md"
    }`}>
      {/* Own-profile banner */}
      {isOwn && (
        <div className="flex items-center justify-between bg-primary/5 border-b border-primary/20 px-4 py-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <Award className="h-3 w-3" /> Your coaching profile
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(coach)}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 transition"
            >
              <Pencil className="h-2.5 w-2.5" /> Edit
            </button>
            <button
              onClick={() => onDelete(coach.id)}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-destructive hover:bg-destructive/10 transition"
            >
              <Trash2 className="h-2.5 w-2.5" /> Remove
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4 p-5 pb-4">
        {coach.photo_url ? (
          <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden">
            <Image src={coach.photo_url} alt={coach.name} fill sizes="56px" className="object-cover" unoptimized />
          </div>
        ) : (
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white ${avatarGradient(coach.name)}`}>
            {initials(coach.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-base font-bold leading-tight">{coach.name}</h3>
            {coach.verified && (
              <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                <CheckCircle2 className="h-2.5 w-2.5" /> Verified
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />{coach.suburb}, {coach.state}
          </p>
          {coach.experience_years != null && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              {coach.experience_years} year{coach.experience_years !== 1 ? "s" : ""} experience
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          {coach.price_per_hour != null ? (
            <>
              <p className="text-base font-bold text-primary">${coach.price_per_hour}</p>
              <p className="text-[10px] text-muted-foreground">/hr</p>
            </>
          ) : (
            <p className="text-[11px] font-medium text-muted-foreground">Contact<br/>for pricing</p>
          )}
        </div>
      </div>

      {coach.bio && (
        <p className="px-5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{coach.bio}</p>
      )}
      {coach.specialties?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 px-5">
          {coach.specialties.slice(0, 4).map(s => (
            <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/70">{s}</span>
          ))}
          {coach.specialties.length > 4 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">+{coach.specialties.length - 4}</span>
          )}
        </div>
      )}
      {coach.session_types?.length > 0 && (
        <div className="mt-2.5 mb-4 flex flex-wrap gap-1.5 px-5">
          {coach.session_types.map(t => (
            <span key={t} className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {SESSION_ICONS[t]} {t}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto">
        {isOwn ? (
          <div className="border-t px-5 py-3">
            <Button
              size="sm" variant="outline"
              className="w-full gap-1.5 text-xs"
              onClick={() => onViewMessages(coach)}
            >
              <MessageSquare className="h-3 w-3" /> View messages from players
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-t px-5 py-3">
            <Button size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => onEnquire(coach)}>
              <MessageSquare className="h-3 w-3" /> Enquire
            </Button>
            {coach.website && (
              <a href={coach.website} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="text-xs">Website</Button>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Enquire dialog (player → coach) ─────────────────────────────────────────

function EnquireDialog({ coach, user, open, onClose }: {
  coach: Coach | null; user: SupabaseUser | null;
  open: boolean; onClose: () => void;
}) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && coach && user) loadThread();
    if (!open) { setText(""); setMessages([]); setConfirmClear(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coach?.id]);

  const loadThread = async () => {
    if (!coach || !user) return;
    // Filter explicitly by thread_user_id so RLS and results are unambiguous
    const { data } = await supabase
      .from("coach_messages")
      .select("*")
      .eq("coach_id", coach.id)
      .eq("thread_user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data as CoachMessage[]);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
    }
  };

  const sendMessage = async () => {
    if (!coach || !user || !text.trim()) return;
    setSending(true);
    const senderName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Player";
    const msg = text.trim();
    const { error } = await supabase.from("coach_messages").insert({
      coach_id: coach.id,
      sender_user_id: user.id,
      sender_name: senderName,
      message: msg,
      is_from_coach: false,
      thread_user_id: user.id,
      coach_user_id: coach.user_id ?? null,
    });
    if (!error) {
      setText("");
      loadThread();
      // Fire-and-forget email notification to coach — never blocks the UI
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.access_token) return;
        fetch(`/api/coaches/${coach.id}/notify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ playerName: senderName, message: msg }),
        }).catch(() => {/* silently ignore */});
      });
    }
    setSending(false);
  };

  const clearThread = async () => {
    if (!coach || !user) return;
    setClearing(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      await fetch(`/api/coaches/${coach.id}/my-thread`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    setMessages([]);
    setConfirmClear(false);
    setClearing(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Message {coach?.name}</DialogTitle>
          <DialogDescription>Ask about availability, pricing, or what to expect — no email needed</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {messages.length > 0 && (
            <>
              {confirmClear ? (
                <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <span className="text-xs text-destructive">Clear this conversation?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmClear(false)} className="text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
                    <button onClick={clearThread} disabled={clearing} className="text-[11px] font-semibold text-destructive hover:underline">
                      {clearing ? "Clearing…" : "Clear"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Clear conversation
                  </button>
                </div>
              )}
              <div ref={scrollRef} className="max-h-52 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                {messages.map(m => {
                  const isMine = !m.is_from_coach && m.sender_user_id === user?.id;
                  return (
                    <div key={m.id} className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] text-muted-foreground">{m.is_from_coach ? coach?.name : m.sender_name}</span>
                      <span className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs leading-snug ${isMine ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
                        {m.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Message ${coach?.name?.split(" ")[0] ?? "coach"}…`}
              className="text-sm"
            />
            <Button size="icon" onClick={sendMessage} disabled={!text.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inbox dialog (coach view — all players grouped by thread) ────────────────

function CoachInboxDialog({ coach, user, open, onClose }: {
  coach: Coach | null; user: SupabaseUser | null;
  open: boolean; onClose: () => void;
}) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && coach) loadAllMessages();
    if (!open) { setMessages([]); setActiveThreadId(null); setReplyText(""); setConfirmClear(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coach?.id]);

  const loadAllMessages = async () => {
    if (!coach) return;
    // Use the server API route (service-role) — bypasses all RLS.
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/coaches/${coach.id}/inbox`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(data as CoachMessage[]);
    }
  };

  const threads = useMemo(() => {
    const map = new Map<string, { playerName: string; messages: CoachMessage[] }>();
    messages.forEach(m => {
      const entry = map.get(m.thread_user_id);
      if (!entry) {
        map.set(m.thread_user_id, { playerName: m.is_from_coach ? "Player" : m.sender_name, messages: [m] });
      } else {
        if (!m.is_from_coach) entry.playerName = m.sender_name;
        entry.messages.push(m);
      }
    });
    return [...map.entries()]
      .map(([id, { playerName, messages }]) => ({
        threadId: id, playerName, messages,
        latestAt: messages[messages.length - 1].created_at,
      }))
      .sort((a, b) => b.latestAt.localeCompare(a.latestAt));
  }, [messages]);

  const activeThread = threads.find(t => t.threadId === activeThreadId) ?? null;

  const sendReply = async () => {
    if (!coach || !user || !replyText.trim() || !activeThreadId) return;
    setSending(true);
    const { error } = await supabase.from("coach_messages").insert({
      coach_id: coach.id,
      sender_user_id: user.id,
      sender_name: coach.name,
      message: replyText.trim(),
      is_from_coach: true,
      thread_user_id: activeThreadId,
      coach_user_id: user.id,
    });
    if (!error) {
      setReplyText("");
      await loadAllMessages();
      setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
    }
    setSending(false);
  };

  const clearThread = async () => {
    if (!coach || !activeThreadId) return;
    setClearing(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      await fetch(`/api/coaches/${coach.id}/inbox?thread=${activeThreadId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    setMessages(prev => prev.filter(m => m.thread_user_id !== activeThreadId));
    setActiveThreadId(null);
    setReplyText("");
    setConfirmClear(false);
    setClearing(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          {activeThread ? (
            <>
              <div className="mb-1 flex items-center justify-between">
                <button onClick={() => { setActiveThreadId(null); setReplyText(""); setConfirmClear(false); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-3 w-3" /> Back to inbox
                </button>
                {confirmClear ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-destructive">Clear thread?</span>
                    <button onClick={() => setConfirmClear(false)} className="text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
                    <button onClick={clearThread} disabled={clearing} className="text-[11px] font-semibold text-destructive hover:underline">
                      {clearing ? "Clearing…" : "Clear"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Clear thread
                  </button>
                )}
              </div>
              <DialogTitle>{activeThread.playerName}</DialogTitle>
              <DialogDescription>Enquiry via ShuttleSpot</DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle>Your inbox</DialogTitle>
              <DialogDescription>
                {threads.length === 0 ? "No messages yet" : `${threads.length} conversation${threads.length !== 1 ? "s" : ""} from players`}
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {activeThread ? (
          <div className="space-y-3">
            <div ref={scrollRef} className="max-h-52 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
              {activeThread.messages.map(m => (
                <div key={m.id} className={`flex flex-col gap-0.5 ${m.is_from_coach ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-muted-foreground">{m.is_from_coach ? "You" : m.sender_name}</span>
                  <span className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs leading-snug ${m.is_from_coach ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
                    {m.message}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Reply…" className="text-sm" />
              <Button size="icon" onClick={sendReply} disabled={!replyText.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-lg border bg-muted/30 p-6 text-center">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Players who enquire will appear here.</p>
          </div>
        ) : (
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {threads.map(thread => {
              const latest = thread.messages[thread.messages.length - 1];
              return (
                <button key={thread.threadId}
                  onClick={() => { setActiveThreadId(thread.threadId); setTimeout(() => scrollRef.current?.scrollTo({ top: 99999 }), 50); }}
                  className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition hover:bg-accent">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {initials(thread.playerName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{thread.playerName}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(thread.latestAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {latest.is_from_coach ? "You: " : ""}{latest.message}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 self-center text-muted-foreground" />
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Coach profile modal (register + edit) ────────────────────────────────────

type FormState = {
  name: string; email: string; phone: string; suburb: string; state: string;
  experience_years: string; bio: string; price_per_hour: string; price_notes: string;
  website: string; photo_url: string;
  specialties: string[]; coaching_levels: string[]; session_types: string[];
};

const BLANK_FORM: FormState = {
  name: "", email: "", phone: "", suburb: "", state: "",
  experience_years: "", bio: "", price_per_hour: "", price_notes: "", website: "", photo_url: "",
  specialties: [], coaching_levels: [], session_types: [],
};

function coachToForm(c: Coach): FormState {
  return {
    name: c.name, email: c.email, phone: c.phone ?? "", suburb: c.suburb, state: c.state,
    experience_years: c.experience_years != null ? String(c.experience_years) : "",
    bio: c.bio ?? "", price_per_hour: c.price_per_hour != null ? String(c.price_per_hour) : "",
    price_notes: c.price_notes ?? "", website: c.website ?? "", photo_url: c.photo_url ?? "",
    specialties: c.specialties ?? [], coaching_levels: c.coaching_levels ?? [],
    session_types: c.session_types ?? [],
  };
}

function toggle(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

function CheckboxGroup({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <Label className="mb-2 block text-xs font-semibold">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const on = selected.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => onChange(toggle(selected, opt))}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CoachProfileModal({ open, onClose, onSuccess, user, existingCoach }: {
  open: boolean; onClose: () => void; onSuccess: () => void;
  user: SupabaseUser | null; existingCoach?: Coach | null;
}) {
  const isEdit = !!existingCoach;
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill when editing or set email from auth
  useEffect(() => {
    if (open) {
      if (isEdit && existingCoach) {
        setForm(coachToForm(existingCoach));
        setPhotoPreview(existingCoach.photo_url ?? "");
      } else {
        setForm(f => ({ ...BLANK_FORM, email: user?.email ?? f.email }));
        setPhotoPreview("");
      }
      setPhotoFile(null);
      setStep(1);
      setSuccess(false);
      setError("");
    }
  }, [open, isEdit, existingCoach, user]);

  const set = (k: keyof FormState) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Photo must be under 2 MB."); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleClose = () => {
    setForm(BLANK_FORM); setStep(1); setSuccess(false); setError("");
    setPhotoFile(null); setPhotoPreview("");
    onClose();
  };

  const step1Valid = form.name.trim() && form.email.trim() && form.suburb.trim() && form.state;

  const handleSubmit = async () => {
    setSubmitting(true); setError("");
    try {
      // Upload photo if a new file was selected
      let photoUrl = form.photo_url || null;
      if (photoFile && user) {
        const uploaded = await uploadCoachPhoto(photoFile, user.id);
        if (uploaded) photoUrl = uploaded;
      }

      const payload: Record<string, unknown> = {
        name: form.name.trim(), email: form.email.trim(),
        suburb: form.suburb.trim(), state: form.state,
        bio: form.bio.trim() || null,
        specialties: form.specialties,
        coaching_levels: form.coaching_levels,
        session_types: form.session_types,
        photo_url: photoUrl,
      };
      if (form.phone.trim())       payload.phone = form.phone.trim();
      if (form.experience_years)   payload.experience_years = parseInt(form.experience_years);
      if (form.price_per_hour)     payload.price_per_hour = parseInt(form.price_per_hour);
      if (form.price_notes.trim()) payload.price_notes = form.price_notes.trim();
      if (form.website.trim())     payload.website = form.website.trim();

      if (isEdit && existingCoach) {
        const { error: err } = await supabase.from("coaches").update(payload).eq("id", existingCoach.id);
        if (err) throw err;
      } else {
        payload.verified = false;
        payload.active = true;
        if (user?.id) payload.user_id = user.id;
        const { error: err } = await supabase.from("coaches").insert(payload);
        if (err) throw err;
      }

      setSuccess(true);
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentPhoto = photoPreview || form.photo_url;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg">
            {success ? (isEdit ? "Profile updated!" : "You're listed!") : isEdit ? "Edit your profile" : step === 1 ? "Register as a Coach" : "Your coaching details"}
          </DialogTitle>
          <DialogDescription>
            {success
              ? isEdit ? "Your coaching profile has been updated." : "Your coaching profile is now visible on ShuttleSpot."
              : isEdit ? "Update your profile — changes are live immediately."
              : step === 1 ? "Step 1 of 2 — Basic information" : "Step 2 of 2 — Specialties & pricing"}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold">{isEdit ? "Profile saved!" : "You're live on ShuttleSpot!"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isEdit ? "Players will see your updated profile." : "Players can now message you directly through the app."}
            </p>
            <Button className="mt-6" onClick={handleClose}>Done</Button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4 px-6 py-5">
            {/* Photo upload */}
            <div>
              <Label className="mb-1.5 block text-xs font-semibold">
                Profile photo <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <div className="flex items-center gap-4">
                {currentPhoto ? (
                  <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border">
                    <Image src={currentPhoto} alt="Preview" fill sizes="64px" className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed bg-muted text-muted-foreground">
                    <Camera className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1">
                  {user ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleFileChange}
                        className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20 cursor-pointer"
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground">JPG, PNG or WebP · max 2 MB</p>
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Sign in to add a photo</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="c-name" className="mb-1.5 block text-xs font-semibold">Full name *</Label>
                <Input id="c-name" placeholder="Jane Smith" value={form.name} onChange={e => set("name")(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label htmlFor="c-email" className="mb-1.5 block text-xs font-semibold">Contact email *</Label>
                <Input id="c-email" type="email" placeholder="jane@example.com" value={form.email} onChange={e => set("email")(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label htmlFor="c-phone" className="mb-1.5 block text-xs font-semibold">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="c-phone" type="tel" placeholder="04XX XXX XXX" value={form.phone} onChange={e => set("phone")(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="c-suburb" className="mb-1.5 block text-xs font-semibold">Suburb *</Label>
                <Input id="c-suburb" placeholder="Clayton" value={form.suburb} onChange={e => set("suburb")(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label htmlFor="c-state" className="mb-1.5 block text-xs font-semibold">State *</Label>
                <Select value={form.state} onValueChange={set("state")}>
                  <SelectTrigger id="c-state" className="h-9 text-sm"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="c-exp" className="mb-1.5 block text-xs font-semibold">Years of experience *</Label>
              <Input id="c-exp" type="number" min="0" max="50" placeholder="e.g. 8" value={form.experience_years} onChange={e => set("experience_years")(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label htmlFor="c-bio" className="mb-1.5 block text-xs font-semibold">About you *</Label>
              <Textarea id="c-bio"
                placeholder="Tell players about your background, coaching philosophy, and what makes your sessions unique..."
                value={form.bio} onChange={e => set("bio")(e.target.value)}
                className="min-h-[90px] text-sm resize-none" />
              <p className="mt-1 text-[11px] text-muted-foreground">{form.bio.length}/300 characters</p>
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!step1Valid} className="gap-2">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 px-6 py-5">
            <CheckboxGroup label="Specialties" options={SPECIALTIES} selected={form.specialties} onChange={v => setForm(f => ({ ...f, specialties: v }))} />
            <CheckboxGroup label="Coaching levels" options={LEVELS} selected={form.coaching_levels} onChange={v => setForm(f => ({ ...f, coaching_levels: v }))} />
            <CheckboxGroup label="Session types" options={SESSION_TYPES} selected={form.session_types} onChange={v => setForm(f => ({ ...f, session_types: v }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="c-price" className="mb-1.5 block text-xs font-semibold">Hourly rate (AUD) <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input id="c-price" type="number" min="0" placeholder="75" value={form.price_per_hour} onChange={e => set("price_per_hour")(e.target.value)} className="h-9 pl-6 text-sm" />
                </div>
              </div>
              <div>
                <Label htmlFor="c-pnotes" className="mb-1.5 block text-xs font-semibold">Pricing note <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="c-pnotes" placeholder="e.g. Group rates available" value={form.price_notes} onChange={e => set("price_notes")(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label htmlFor="c-web" className="mb-1.5 block text-xs font-semibold">Website / Instagram <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="c-web" placeholder="https://yoursite.com.au" value={form.website} onChange={e => set("website")(e.target.value)} className="h-9 text-sm" />
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs">← Back</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting ? "Saving…" : isEdit ? "Save changes" : "Submit profile"}
                {!submitting && <CheckCircle2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ stateFilter, onRegister }: { stateFilter: string; onRegister: () => void }) {
  return (
    <div className="mt-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-background/80 backdrop-blur-[2px]">
          <div className="rounded-2xl border border-primary/20 bg-card px-6 py-5 text-center shadow-lg max-w-xs">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-bold">
              {stateFilter ? `Be the first coach listed in ${stateFilter}` : "Be among the first coaches listed"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Your profile could appear here — free to list, no commission.</p>
            <Button size="sm" className="mt-3 w-full gap-1.5" onClick={onRegister}>
              <Sparkles className="h-3.5 w-3.5" /> List your profile
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-25 pointer-events-none select-none">
          {[
            { name: "Alex Chen", suburb: "Clayton", state: "VIC", exp: 8, price: 75, specialties: ["Advanced / Competitive", "Tournament Preparation"], sessions: ["Private 1-on-1", "Group Sessions"] },
            { name: "Sarah Park", suburb: "Parramatta", state: "NSW", exp: 5, price: 60, specialties: ["Beginner Development", "Junior Coaching"], sessions: ["Private 1-on-1", "On-court Sessions"] },
            { name: "Michael Torres", suburb: "Acacia Ridge", state: "QLD", exp: 12, price: 90, specialties: ["Doubles Strategy", "Fitness & Conditioning"], sessions: ["Private 1-on-1", "Online / Video"] },
          ].map(c => (
            <div key={c.name} className="flex flex-col rounded-2xl border bg-card overflow-hidden">
              <div className="flex items-start gap-4 p-5 pb-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white ${avatarGradient(c.name)}`}>
                  {initials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.suburb}, {c.state}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.exp} years experience</p>
                </div>
                <div className="text-right"><p className="text-base font-bold text-primary">${c.price}</p><p className="text-[10px] text-muted-foreground">/hr</p></div>
              </div>
              <div className="flex flex-wrap gap-1.5 px-5">{c.specialties.map(s => <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{s}</span>)}</div>
              <div className="mt-2.5 flex flex-wrap gap-1.5 px-5">{c.sessions.map(s => <span key={s} className="rounded-full border px-2 py-0.5 text-[11px]">{s}</span>)}</div>
              <div className="mt-4 border-t px-5 py-3"><div className="h-7 w-full rounded-md bg-primary/20" /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="mb-1 text-sm font-bold">Why list on ShuttleSpot?</h3>
        <p className="mb-5 text-xs text-muted-foreground">Join Australia&apos;s fastest-growing badminton community</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: TrendingUp, title: "Grow your client base", desc: "Reach players actively looking for coaching across Australia" },
            { icon: Award, title: "Build your reputation", desc: "Verified badge, reviews, and a professional profile page" },
            { icon: Sparkles, title: "Free to list", desc: "No commission, no monthly fees — enquiries come direct in-app" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-xs font-semibold">{title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center">
          <Button onClick={onRegister} className="gap-2"><Sparkles className="h-4 w-4" /> Register as a Coach — it&apos;s free</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = { initialCoaches: Coach[] };

export default function CoachesPage({ initialCoaches }: Props) {
  const [coaches, setCoaches] = useState<Coach[]>(initialCoaches);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");

  // Modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);

  // Message dialogs
  const [enquireCoach, setEnquireCoach] = useState<Coach | null>(null);
  const [inboxCoach, setInboxCoach] = useState<Coach | null>(null);

  // Auth prompt
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState("");

  const refreshCoaches = async () => {
    const { data } = await supabase.from("coaches").select("*").eq("active", true)
      .order("verified", { ascending: false }).order("created_at", { ascending: true });
    if (data) setCoaches(data as Coach[]);
  };

  // Auth — on login, auto-link coach profile if email matches but user_id is unset
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setUser(u);
      if (u) {
        // Restore pending enquiry from sessionStorage (after OAuth redirect)
        try {
          const savedId = sessionStorage.getItem("ss_pendingCoachId");
          if (savedId) {
            const coach = initialCoaches.find(c => c.id === parseInt(savedId));
            if (coach) setEnquireCoach(coach);
            sessionStorage.removeItem("ss_pendingCoachId");
          }
        } catch {}

        // Auto-link: if this user has a coach profile with matching email but no user_id, claim it
        const unlinked = initialCoaches.find(c => c.email === u.email && !c.user_id);
        if (unlinked) {
          await supabase.from("coaches").update({ user_id: u.id }).eq("id", unlinked.id);
          refreshCoaches();
        }
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOwnProfile = (coach: Coach) => {
    if (!user) return false;
    return (!!coach.user_id && coach.user_id === user.id) || coach.email === user.email;
  };

  const handleEnquire = (coach: Coach) => {
    if (!user) {
      try { sessionStorage.setItem("ss_pendingCoachId", String(coach.id)); } catch {}
      setAuthReason(`Sign in to message ${coach.name} and enquire about coaching sessions.`);
      setAuthOpen(true);
      return;
    }
    setEnquireCoach(coach);
  };

  const handleEdit = (coach: Coach) => {
    setEditingCoach(coach);
    setProfileModalOpen(true);
  };

  const handleDelete = async (coachId: number) => {
    if (!window.confirm("Remove your coaching profile from ShuttleSpot? This cannot be undone.")) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/coaches/${coachId}/deactivate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setCoaches(prev => prev.filter(c => c.id !== coachId));
  };

  const handleOpenRegister = () => {
    setEditingCoach(null);
    setProfileModalOpen(true);
  };

  const filtered = useMemo(() => coaches.filter(c => {
    if (stateFilter && c.state !== stateFilter) return false;
    if (specialtyFilter && !c.specialties.includes(specialtyFilter)) return false;
    if (sessionFilter && !c.session_types.includes(sessionFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.suburb.toLowerCase().includes(q) && !c.bio?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [coaches, stateFilter, specialtyFilter, sessionFilter, search]);

  const hasFilters = stateFilter || specialtyFilter || sessionFilter || search;

  return (
    <div className="min-h-[calc(100vh-56px)] pb-20 md:pb-0">

      {/* ── Hero ── */}
      <section className="border-b bg-gradient-to-b from-primary/[0.06] to-transparent px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                <Star className="h-3 w-3" /> Coaching Network
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Find a Badminton Coach</h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Connect with experienced coaches across Australia. Private lessons, group clinics, online sessions — all skill levels welcome.
              </p>
            </div>
            <Button onClick={handleOpenRegister} className="shrink-0 gap-2 sm:self-end">
              <Sparkles className="h-4 w-4" /> List your coaching
            </Button>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search coaches..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 pl-8 pr-8 text-sm" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={stateFilter || "all"} onValueChange={v => setStateFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 w-[110px] text-sm"><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All states</SelectItem>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={specialtyFilter || "all"} onValueChange={v => setSpecialtyFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue placeholder="Specialty" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All specialties</SelectItem>{SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sessionFilter || "all"} onValueChange={v => setSessionFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 w-[150px] text-sm"><SelectValue placeholder="Session type" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All sessions</SelectItem>{SESSION_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setSearch(""); setStateFilter(""); setSpecialtyFilter(""); setSessionFilter(""); }}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {filtered.length === 0
                ? coaches.length === 0 ? "No coaches listed yet" : "No coaches match your filters"
                : `${filtered.length} coach${filtered.length !== 1 ? "es" : ""}${stateFilter ? ` in ${stateFilter}` : " across Australia"}`}
            </p>
            {filtered.length > 0 && (
              <Badge variant="secondary" className="text-[11px]">{coaches.filter(c => c.verified).length} verified</Badge>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(c => (
                <CoachCard
                  key={c.id} coach={c} isOwn={isOwnProfile(c)}
                  onEnquire={handleEnquire} onEdit={handleEdit}
                  onDelete={handleDelete} onViewMessages={setInboxCoach}
                />
              ))}
            </div>
          ) : (
            <EmptyState stateFilter={stateFilter} onRegister={handleOpenRegister} />
          )}
        </div>
      </section>

      <CoachProfileModal
        open={profileModalOpen}
        onClose={() => { setProfileModalOpen(false); setEditingCoach(null); }}
        onSuccess={refreshCoaches}
        user={user}
        existingCoach={editingCoach}
      />
      <EnquireDialog coach={enquireCoach} user={user} open={!!enquireCoach} onClose={() => setEnquireCoach(null)} />
      <CoachInboxDialog coach={inboxCoach} user={user} open={!!inboxCoach} onClose={() => setInboxCoach(null)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} reason={authReason} />
    </div>
  );
}
