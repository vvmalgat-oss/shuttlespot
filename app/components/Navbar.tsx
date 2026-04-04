"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Menu, X, LogOut, User, Heart } from "lucide-react";
import SearchModal from "./SearchModal";
import AuthModal from "./AuthModal";
import ShuttleSpotLogo from "./ShuttlecockLogo";
import { supabase } from "@/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useUserLocation } from "../hooks/useUserLocation";

export default function Navbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { location: userLocation } = useUserLocation();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getInitials = (u: SupabaseUser) => {
    const name = u.user_metadata?.full_name || u.email || "";
    return name
      .split(/\s+/)
      .map((p: string) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const links = [
    { href: "/", label: "Find Courts" },
    { href: "/venues", label: "Venues" },
    { href: "/social", label: "Social" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/">
            <ShuttleSpotLogo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  size="sm"
                  className="text-[13px]"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-[11px]">{getInitials(user)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium truncate">{user.user_metadata?.full_name || "Account"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/saved">
                    <DropdownMenuItem className="gap-2 text-[13px] cursor-pointer">
                      <Heart className="h-3.5 w-3.5" />
                      Saved venues
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="gap-2 text-[13px] text-destructive focus:text-destructive">
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="hidden sm:flex text-[13px]" onClick={() => setAuthOpen(true)}>
                Sign in
              </Button>
            )}

            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav — auth only (navigation handled by BottomNav) */}
        {mobileOpen && (
          <div className="border-t px-4 py-3 md:hidden">
            {user ? (
              <>
                <div className="px-2 py-1.5 mb-2">
                  <p className="text-xs font-medium truncate">{user.user_metadata?.full_name || "Account"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <Link href="/saved" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-[13px]">
                    <Heart className="h-3.5 w-3.5" /> Saved venues
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full text-[13px] text-destructive hover:text-destructive justify-start gap-2"
                  onClick={() => { signOut(); setMobileOpen(false); }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button size="sm" className="w-full text-[13px]" onClick={() => { setMobileOpen(false); setAuthOpen(true); }}>
                Sign in
              </Button>
            )}
          </div>
        )}
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} userLocation={userLocation} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
