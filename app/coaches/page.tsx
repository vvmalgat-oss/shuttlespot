import { Metadata } from "next";
import { supabase } from "../../supabase";
import CoachesPage, { type Coach } from "./CoachesPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find a Badminton Coach in Australia",
  description: "Connect with experienced badminton coaches across Australia. Private lessons, group clinics, and online coaching for all skill levels.",
  openGraph: {
    title: "Find a Badminton Coach | ShuttleSpot",
    description: "Connect with experienced badminton coaches across Australia for private lessons, group sessions, and online coaching.",
    url: "https://shuttlespot.vercel.app/coaches",
  },
};

export default async function Page() {
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("active", true)
    .order("verified", { ascending: false })
    .order("created_at", { ascending: true });

  // Gracefully handle the case where the table hasn't been migrated yet
  const coaches: Coach[] = error ? [] : (data as Coach[]) ?? [];

  return <CoachesPage initialCoaches={coaches} />;
}
