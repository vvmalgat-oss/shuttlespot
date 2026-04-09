import { MetadataRoute } from "next";
import { supabase } from "../supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: venues } = await supabase.from("venues").select("id, name");
  const now = new Date();

  const venueUrls: MetadataRoute.Sitemap = (venues || []).map((v) => ({
    url: `https://shuttlespot.vercel.app/venue/${v.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: "https://shuttlespot.vercel.app", lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: "https://shuttlespot.vercel.app/venues", lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: "https://shuttlespot.vercel.app/social", lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: "https://shuttlespot.vercel.app/coaches", lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: "https://shuttlespot.vercel.app/search", lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...["melbourne", "sydney", "brisbane", "perth", "adelaide", "canberra", "hobart", "darwin"].map((city) => ({
      url: `https://shuttlespot.vercel.app/venues/${city}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...venueUrls,
  ];
}
