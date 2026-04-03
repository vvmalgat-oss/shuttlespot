"use client";

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, ExternalLink, Navigation, X, CalendarDays,
  Clock, AlertCircle, Flame, CheckCircle2, Info,
} from "lucide-react";
import VenueMap from "./VenueMap";

type Venue = {
  id: number;
  name: string;
  suburb: string;
  address: string;
  city?: string;
  state?: string;
  courts: number;
  price: string;
  booking_url: string;
  lat: number;
  lng: number;
};

type Props = {
  venue: Venue | null;
  open: boolean;
  onClose: () => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function formatShort(dateStr: string) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function getDayOfWeek(dateStr: string) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).getDay();
}

function parseHourlyRate(price: string): number | null {
  const m = price?.match(/\$?(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

/** Convert a slot string like "7:30am" → hour as a 24h number (7.5) */
function slotToHour(slot: string): number {
  const m = slot.match(/^(\d+):(\d+)(am|pm)$/);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  if (m[3] === "pm" && h !== 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  return h + min / 60;
}

// Confirmed open/close hours per venue (partial lowercase name match, 24h).
// Sources: each venue's website. Used to filter which slots to display.
const VENUE_OPEN_HOURS: { match: string; open: number; close: number }[] = [
  { match: "mitcham badminton",          open: 9,  close: 24 },
  { match: "melbourne badminton centre", open: 8,  close: 23 },
  { match: "kings park badminton",       open: 8,  close: 24 },
  { match: "alpha badminton",            open: 9,  close: 23 },
  { match: "hunter badminton",           open: 9,  close: 19 },
  { match: "adelaide badminton centre",  open: 11, close: 24 },
  { match: "badminton hobart",           open: 9,  close: 21 },
  { match: "darwin badminton",           open: 18, close: 22 },
  { match: "southside badminton",        open: 18, close: 22 },
];
const DEFAULT_OPEN_H = 9;
const DEFAULT_CLOSE_H = 22;

function getVenueOpenHours(venueName: string): { open: number; close: number } {
  const name = venueName.toLowerCase();
  const match = VENUE_OPEN_HOURS.find((h) => name.includes(h.match));
  return match ? { open: match.open, close: match.close } : { open: DEFAULT_OPEN_H, close: DEFAULT_CLOSE_H };
}

/**
 * Generate start-time slots within a venue's opening hours, stepping by durationMinutes.
 * Minimum start is 8am — no venue offers casual court hire before 8am.
 */
function generateSlots(durationMinutes: number, venueName: string): string[] {
  const { open, close } = getVenueOpenHours(venueName);
  const startH = Math.max(open, 8); // never earlier than 8am
  const slots: string[] = [];
  const startMin = startH * 60;
  const endMin = close * 60;

  for (let m = startMin; m + durationMinutes <= endMin; m += durationMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "am" : "pm";
    slots.push(`${h12}:${min === 0 ? "00" : String(min).padStart(2, "0")}${ampm}`);
  }
  return slots;
}

function isPeakSlot(slot: string, dayOfWeek: number): boolean {
  const h = slotToHour(slot);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  // Peak: weekend mornings 9–12, all evenings 5–9pm (no pre-8am peak since we don't show those)
  if (isWeekend) return (h >= 9 && h < 12) || (h >= 17 && h < 21);
  return h >= 17 && h < 21;
}

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hr" },
  { value: 120, label: "2 hours" },
];

// ─── Time Slot Grid ───────────────────────────────────────────────────────────

function TimeSlotGrid({
  title,
  slots,
  selected,
  dayOfWeek,
  onSelect,
}: {
  title: string;
  slots: string[];
  selected: string | null;
  dayOfWeek: number;
  onSelect: (s: string) => void;
}) {
  if (slots.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {slots.map((slot) => {
          const active = selected === slot;
          const peak = isPeakSlot(slot, dayOfWeek);
          return (
            <button
              key={slot}
              onClick={() => onSelect(slot)}
              className={`relative rounded-lg border py-2.5 text-[12px] font-medium transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : peak
                  ? "border-orange-200 bg-orange-50 text-foreground hover:border-orange-300 hover:bg-orange-100"
                  : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {slot}
              {peak && !active && (
                <span className="absolute -top-1.5 right-1 flex items-center rounded-full bg-orange-500 px-1 py-px text-[9px] font-bold text-white leading-none">
                  <Flame className="h-2 w-2" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VenueSlideOver({ venue, open, onClose }: Props) {
  const today = useMemo(() => localDateString(new Date()), []);
  const tomorrow = useMemo(() => localDateString(addDays(new Date(), 1)), []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [customDate, setCustomDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const activePill =
    selectedDate === today ? "today" : selectedDate === tomorrow ? "tomorrow" : "custom";

  function pickDate(type: "today" | "tomorrow") {
    setSelectedDate(type === "today" ? today : tomorrow);
    setCustomDate("");
    setSelectedTime(null);
  }

  function handleCustomDate(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setCustomDate(val);
    if (val) { setSelectedDate(val); setSelectedTime(null); }
  }

  function handleDuration(val: number) {
    setDuration(val);
    setSelectedTime(null); // selected slot may no longer exist in new grid
  }

  const dayOfWeek = useMemo(() => getDayOfWeek(selectedDate), [selectedDate]);

  // Re-generate slots whenever duration or venue changes
  const allSlots = useMemo(() => generateSlots(duration, venue?.name ?? ""), [duration, venue?.name]);
  const morningSlots = useMemo(() => allSlots.filter(s => { const h = slotToHour(s); return h >= 8 && h < 12; }), [allSlots]);
  const afternoonSlots = useMemo(() => allSlots.filter(s => { const h = slotToHour(s); return h >= 12 && h < 18; }), [allSlots]);
  const eveningSlots = useMemo(() => allSlots.filter(s => { const h = slotToHour(s); return h >= 18; }), [allSlots]);

  const bookingUrl = venue?.booking_url || null;
  const hasBooking = !!bookingUrl;
  const hourlyRate = useMemo(() => parseHourlyRate(venue?.price ?? ""), [venue?.price]);
  const estimatedCost = useMemo(
    () => (hourlyRate ? Math.round(hourlyRate * duration / 60) : null),
    [hourlyRate, duration]
  );

  const continueHref = useMemo(() => {
    if (!bookingUrl || !selectedTime) return null;
    const params = new URLSearchParams({ date: selectedDate, time: selectedTime, duration: String(duration) });
    const sep = bookingUrl.includes("?") ? "&" : "?";
    return `${bookingUrl}${sep}${params.toString()}`;
  }, [bookingUrl, selectedDate, selectedTime, duration]);

  const mapsUrl = venue
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`
    : "#";

  const selectedDateLabel =
    activePill === "today" ? `Today, ${formatShort(today)}`
    : activePill === "tomorrow" ? `Tomorrow, ${formatShort(tomorrow)}`
    : selectedDate ? formatShort(selectedDate) : "";

  const durationLabel = DURATION_OPTIONS.find(d => d.value === duration)?.label ?? "";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[500px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {venue && (
          <>
            {/* Header */}
            <div className="flex-shrink-0 border-b px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold leading-tight">{venue.name}</h2>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{venue.address}</span>
                  </div>
                </div>
                <SheetClose asChild>
                  <button className="mt-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </SheetClose>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {venue.courts ? (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
                    {venue.courts} court{venue.courts !== 1 ? "s" : ""}
                  </span>
                ) : null}
                {venue.price ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {venue.price}
                  </span>
                ) : null}
                {(venue.city || venue.state) && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {[venue.city, venue.state].filter(Boolean).join(", ")}
                  </span>
                )}
                {hasBooking ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Online booking
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    <Info className="h-3 w-3" /> Enquire to book
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="book" className="flex flex-1 flex-col overflow-hidden">
              <TabsList className="h-10 w-full flex-shrink-0 justify-start rounded-none border-b bg-background px-5">
                {[{ v: "book", label: "Book a court" }, { v: "info", label: "Venue info" }].map(({ v, label }) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="mr-5 last:mr-0 rounded-none border-b-2 border-transparent px-0 pb-px text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── Book Tab ── */}
              <TabsContent value="book" className="mt-0 flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
                {!hasBooking && (
                  <div className="flex-shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-3">
                    <div className="flex items-start gap-2 text-xs text-amber-800">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Online booking isn&apos;t available. Get directions and call ahead to confirm.</span>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-6 px-5 py-5">

                    {/* 1 — Date */}
                    <div>
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">1 · Date</p>
                      <div className="flex gap-2">
                        {[
                          { key: "today", label: "Today", sub: formatShort(today) },
                          { key: "tomorrow", label: "Tomorrow", sub: formatShort(tomorrow) },
                        ].map(({ key, label, sub }) => (
                          <button
                            key={key}
                            onClick={() => pickDate(key as "today" | "tomorrow")}
                            className={`flex flex-1 flex-col items-start rounded-xl border p-3 text-left transition-all ${
                              activePill === key
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                : "border-border hover:border-primary/30 hover:bg-accent/40"
                            }`}
                          >
                            <span className={`text-sm font-bold ${activePill === key ? "text-primary" : ""}`}>{label}</span>
                            <span className="text-[11px] text-muted-foreground">{sub}</span>
                          </button>
                        ))}
                        <label className={`relative flex flex-1 cursor-pointer flex-col items-start rounded-xl border p-3 transition-all ${
                          activePill === "custom"
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:border-primary/30 hover:bg-accent/40"
                        }`}>
                          <span className={`flex items-center gap-1 text-sm font-bold ${activePill === "custom" ? "text-primary" : ""}`}>
                            <CalendarDays className="h-3.5 w-3.5" />
                            {activePill === "custom" && customDate ? formatShort(customDate) : "Pick"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {activePill === "custom" && customDate ? "Custom" : "Other day"}
                          </span>
                          <input type="date" value={customDate} min={today} onChange={handleCustomDate} className="absolute inset-0 cursor-pointer opacity-0" />
                        </label>
                      </div>
                    </div>

                    {/* 2 — Duration */}
                    <div>
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">2 · Duration</p>
                      <div className="flex gap-2">
                        {DURATION_OPTIONS.map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => handleDuration(value)}
                            className={`flex-1 rounded-xl border py-2.5 text-[13px] font-semibold transition-all ${
                              duration === value
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border hover:border-primary/40 hover:bg-primary/5"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3 — Time */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          3 · Start time
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[10px] text-orange-600">
                            <Flame className="h-2.5 w-2.5" /> Peak hours
                          </span>
                          {selectedTime && (
                            <button onClick={() => setSelectedTime(null)} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-5">
                        <TimeSlotGrid title="Morning · 8am – 12pm" slots={morningSlots} selected={selectedTime} dayOfWeek={dayOfWeek} onSelect={setSelectedTime} />
                        <TimeSlotGrid title="Afternoon · 12pm – 6pm" slots={afternoonSlots} selected={selectedTime} dayOfWeek={dayOfWeek} onSelect={setSelectedTime} />
                        <TimeSlotGrid title="Evening · 6pm – midnight" slots={eveningSlots} selected={selectedTime} dayOfWeek={dayOfWeek} onSelect={setSelectedTime} />
                      </div>
                    </div>

                    <p className="flex items-start gap-1.5 rounded-lg border bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Availability is approximate. Confirm when you reach the venue&apos;s booking page.
                    </p>
                  </div>
                </div>

                {/* Sticky footer */}
                <div className="flex-shrink-0 border-t bg-background px-5 py-4">
                  {selectedTime ? (
                    <div className="mb-3 flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-semibold">{selectedDateLabel} · {selectedTime}</p>
                          <p className="text-[11px] text-muted-foreground">{durationLabel}</p>
                        </div>
                      </div>
                      {estimatedCost && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">${estimatedCost}</p>
                          <p className="text-[10px] text-muted-foreground">est. total</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mb-3 text-center text-xs text-muted-foreground">
                      Select a date and start time above
                    </p>
                  )}

                  {hasBooking ? (
                    continueHref ? (
                      <a href={continueHref} target="_blank" rel="noopener noreferrer" className="block">
                        <Button className="h-11 w-full gap-2 text-sm font-semibold">
                          Continue to booking <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    ) : (
                      <Button className="h-11 w-full" disabled>Continue to booking</Button>
                    )
                  ) : (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="h-11 w-full gap-2 text-sm font-semibold">
                        <Navigation className="h-4 w-4" /> Get directions to venue
                      </Button>
                    </a>
                  )}

                  {hasBooking && (
                    <p className="mt-2 text-center text-[10px] text-muted-foreground">
                      Booking managed by {venue.name}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* ── Venue Info Tab ── */}
              <TabsContent value="info" className="mt-0 flex-1 overflow-y-auto px-5 py-5 data-[state=inactive]:hidden">
                <div className="mb-5 grid grid-cols-3 gap-2.5">
                  {venue.courts ? (
                    <Card><CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{venue.courts}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Court{venue.courts !== 1 ? "s" : ""}</p>
                    </CardContent></Card>
                  ) : null}
                  {venue.price ? (
                    <Card className="border-primary/20 bg-primary/[0.03]"><CardContent className="p-4 text-center">
                      <p className="text-xl font-bold text-primary">{venue.price}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">per hour</p>
                    </CardContent></Card>
                  ) : null}
                  <Card><CardContent className="p-4 text-center">
                    <p className="text-base font-bold">Indoor</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Facility</p>
                  </CardContent></Card>
                </div>

                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Location</p>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{venue.address}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {venue.city && <Badge variant="secondary">{venue.city}</Badge>}
                    {venue.state && <Badge variant="outline">{venue.state}</Badge>}
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  {venue.booking_url && (
                    <a href={venue.booking_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-1.5">Book now <ExternalLink className="h-3.5 w-3.5" /></Button>
                    </a>
                  )}
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Navigation className="h-3.5 w-3.5" /> Get directions
                    </Button>
                  </a>
                </div>

                <Separator className="mb-5" />

                {venue.lat && venue.lng ? (
                  <div className="h-56 overflow-hidden rounded-xl border">
                    <VenueMap venues={[venue]} center={{ lat: venue.lat, lng: venue.lng }} fullHeight className="h-full" />
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
