import { fetchVideoDetail } from "@/lib/api";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import VideoDetailClient from "./VideoDetailClient";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const video = await fetchVideoDetail(id);
  if (!video) return {};

  const title = `${video.title} — Shorts100`;
  const description = video.description?.slice(0, 160) ?? "지금 가장 핫한 유튜브 쇼츠";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: video.thumbnail_url ? [{ url: video.thumbnail_url }] : [],
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: video.thumbnail_url ? [video.thumbnail_url] : [],
    },
  };
}

export default async function VideoPage({ params }: PageProps) {
  const { id } = await params;
  const video = await fetchVideoDetail(id);

  if (!video) {
    notFound();
  }

  // JSON-LD VideoObject (T47)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description ?? "",
    thumbnailUrl: video.thumbnail_url ?? "",
    uploadDate: video.published_at ?? "",
    embedUrl: `https://www.youtube.com/embed/${video.platform_video_id}`,
    url: `https://www.youtube.com/shorts/${video.platform_video_id}`,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WatchAction",
        userInteractionCount: video.view_count,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: video.like_count ?? 0,
      },
    ],
    author: video.channel
      ? { "@type": "Person", name: video.channel.title }
      : undefined,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VideoDetailClient video={video} />
    </main>
  );
}
