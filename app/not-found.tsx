import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-4 pb-16 text-center md:pb-0">
      <span className="text-6xl">🏸</span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        That court must have moved. Let&apos;s get you back on the court.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/"><Button>Find courts</Button></Link>
        <Link href="/venues"><Button variant="outline">Browse venues</Button></Link>
      </div>
    </div>
  );
}
