import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";

export const metadata: Metadata = {
  metadataBase: new URL("https://shuttlespot.vercel.app"),
  title: {
    default: "ShuttleSpot — Find Badminton Courts Across Australia",
    template: "%s | ShuttleSpot",
  },
  description: "Discover and book badminton courts across Australia. Search by suburb, compare prices, and find playing partners.",
  openGraph: {
    type: "website",
    siteName: "ShuttleSpot",
    title: "ShuttleSpot — Find Badminton Courts Across Australia",
    description: "Discover and book badminton courts across Australia. Search by suburb, compare prices, and find playing partners.",
    url: "https://shuttlespot.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShuttleSpot — Find Badminton Courts Across Australia",
    description: "Discover and book badminton courts across Australia. Search by suburb, compare prices, and find playing partners.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Navbar />
        {children}
        <BottomNav />
        <footer className="border-t bg-muted/30 px-4 py-8 pb-24 sm:px-6 md:pb-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-foreground">ShuttleSpot</p>
              <nav className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <a href="/venues" className="hover:text-foreground transition">All venues</a>
                <a href="/social" className="hover:text-foreground transition">Find partners</a>
                <a href="/terms" className="hover:text-foreground transition">Terms</a>
                <a href="/privacy" className="hover:text-foreground transition">Privacy</a>
                <a href="mailto:hello.shuttlespot@gmail.com" className="hover:text-foreground transition">Contact</a>
              </nav>
            </div>
            <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} ShuttleSpot. Badminton venue discovery across Australia.</p>
              <p className="text-[11px] text-muted-foreground">Hero media by <a href="https://www.pexels.com/@luthfi-ali-qodri" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">Luthfi Ali Qodri</a> &amp; <a href="https://www.pexels.com/@shvets-production" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">SHVETS production</a> via <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">Pexels</a></p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
