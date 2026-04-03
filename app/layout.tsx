import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

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
      </body>
    </html>
  );
}
