import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Playing Partners",
  description: "Find badminton playing partners near you. Post your availability or join other players at venues across Australia.",
  openGraph: {
    title: "Find Badminton Playing Partners | ShuttleSpot",
    description: "Find badminton playing partners near you. Post your availability or join other players at venues across Australia.",
    url: "https://shuttlespot.vercel.app/social",
  },
};

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
