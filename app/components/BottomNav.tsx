"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutList, Users, Heart } from "lucide-react";

const tabs = [
  {
    href: "/",
    label: "Find",
    icon: Home,
    match: (p: string) => p === "/" || p.startsWith("/search"),
  },
  {
    href: "/venues",
    label: "Venues",
    icon: LayoutList,
    match: (p: string) => p.startsWith("/venues") || p.startsWith("/venue"),
  },
  {
    href: "/social",
    label: "Social",
    icon: Users,
    match: (p: string) => p.startsWith("/social"),
  },
  {
    href: "/saved",
    label: "Saved",
    icon: Heart,
    match: (p: string) => p.startsWith("/saved"),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-16 items-end pb-2">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-semibold tracking-wide transition-colors ${
                active ? "text-primary" : "text-muted-foreground/70 hover:text-foreground"
              }`}
            >
              <Icon className={`h-[22px] w-[22px] transition-all ${active ? "" : "opacity-70"}`} strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
