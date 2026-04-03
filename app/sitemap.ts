import { MetadataRoute } from "next";
import { supabase } from "../supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: venues } = await supabase.from("venues").select("id");

  const venueUrls: MetadataRoute.Sitemap = (venues || []).map((v) => ({
    url: `https://shuttlespot.vercel.app/venue/${v.id}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: "https://shuttlespot.vercel.app", changeFrequency: "weekly", priority: 1.0 },
    { url: "https://shuttlespot.vercel.app/venues", changeFrequency: "weekly", priority: 0.9 },
    { url: "https://shuttlespot.vercel.app/social", changeFrequency: "daily", priority: 0.8 },
    ...venueUrls,
  ];
}
