import { RankingItem } from "@/components/RankingList";

const SERVER_API = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://shorts100.firemarkets.net";
const CLIENT_API = process.env.NEXT_PUBLIC_API_URL || "https://shorts100.firemarkets.net";

function rankingEndpoint(rankType: string): string {
  if (rankType === "rising") return "/api/rankings/rising";
  return "/api/rankings/global";
}

// server-side (SSR/SSG)
export async function fetchRankings(
  rankType: string,
  limit: number,
  offset: number
): Promise<RankingItem[]> {
  try {
    const url = `${SERVER_API}${rankingEndpoint(rankType)}?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// client-side
export async function fetchRankingsClient(
  rankType: string,
  limit: number,
  offset: number,
  period?: string,
  region?: string,
  category?: string,
  rankBasis?: string
): Promise<RankingItem[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (period && period !== "all") params.set("period", period);
  if (region) params.set("region", region);
  if (category) params.set("category", category);
  if (rankBasis) params.set("rank_basis", rankBasis);

  const res = await fetch(`${CLIENT_API}${rankingEndpoint(rankType)}?${params}`);
  if (!res.ok) return [];
  return res.json();
}

// server-side video detail
export async function fetchVideoDetail(id: string) {
  try {
    const res = await fetch(`${SERVER_API}/api/videos/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
