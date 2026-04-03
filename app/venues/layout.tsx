import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Badminton Venues",
  description: "Browse all badminton venues across Australia. Filter by state, number of courts, and price.",
  openGraph: {
    title: "All Badminton Venues in Australia | ShuttleSpot",
    description: "Browse all badminton venues across Australia. Filter by state, number of courts, and price.",
    url: "https://shuttlespot.vercel.app/venues",
  },
};

export default function VenuesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
