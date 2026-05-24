import { getTranslations } from "next-intl/server";
import { fetchRankings } from "@/lib/api";
import RankingList from "@/components/RankingList";

export default async function RisingPage() {
  const t = await getTranslations("rising");
  const initial = await fetchRankings("rising", 20, 0);

  return (
    <main className="min-h-screen bg-white max-w-2xl mx-auto">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>
        <p className="text-xs text-gray-400">{t("subtitle")}</p>
      </header>
      <RankingList initialItems={initial} rankType="rising" />
    </main>
  );
}
