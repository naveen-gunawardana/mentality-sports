import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const BASE_URL = "https://mentalitysports.com";

export const revalidate = 3600;

async function getPublishedSlugs(): Promise<{ slug: string; published_at: string | null }[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("resources")
      .select("slug, published_at")
      .eq("status", "published");
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE_URL}/advice`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/game-day`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/game-day/pregame`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/game-day/postgame`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/game-day/reset`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/about`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE_URL}/signup`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/terms`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: "yearly" },
  ];

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/advice/${a.slug}`,
    lastModified: a.published_at ? new Date(a.published_at) : new Date(),
    priority: 0.8,
    changeFrequency: "monthly" as const,
  }));

  return [...staticPages, ...articlePages];
}
