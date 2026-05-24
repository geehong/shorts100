import { fetchRankings } from "@/lib/api";
import RankingList from "@/components/RankingList";

export default async function HomePage() {
  const initial = await fetchRankings("global", 20, 0);

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <RankingList initialItems={initial} rankType="global" />
    </main>
  );
}
