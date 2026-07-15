import Link from "next/link";
import { EpisodeThumbnail } from "@/components/atoms/EpisodeThumbnail";
import { EpisodeMeta } from "@/components/molecules/EpisodeMeta";
import { getEpisodeProductionUrl } from "@/lib/links";
import type { EpisodeRm } from "@/lib/types";

interface EpisodeCardProps {
  episode: EpisodeRm;
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const hasAudio = Boolean(episode.externalAudioId);
  const hasVideo = Boolean(episode.externalVideoId);
  const durationSeconds = episode.videoDuration ?? episode.audioDuration;
  const productionUrl = getEpisodeProductionUrl(episode.podcastSlug, episode.slug);

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-black/20 p-3 dark:border-white/10">
      <EpisodeThumbnail
        src={episode.mainImage?.uri ?? null}
        alt={episode.mainImage?.title ?? episode.title}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Link
          href={productionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline"
        >
          {episode.title}
        </Link>
        <EpisodeMeta
          podcastTitle={episode.podcastTitle}
          durationSeconds={durationSeconds}
          hasAudio={hasAudio}
          hasVideo={hasVideo}
        />
      </div>
    </li>
  );
}
