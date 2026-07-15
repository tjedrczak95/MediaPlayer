"use client";

import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { EpisodeThumbnail } from "@/components/atoms/EpisodeThumbnail";
import { EpisodeMeta } from "@/components/molecules/EpisodeMeta";
import { usePlayer } from "@/components/organisms/Player";
import { getEpisodeProductionUrl } from "@/lib/links";
import type { EpisodeRm } from "@/lib/types";

interface EpisodeCardProps {
  episode: EpisodeRm;
  priority?: boolean;
}

export function EpisodeCard({ episode, priority = false }: EpisodeCardProps) {
  const { play } = usePlayer();
  const hasAudio = Boolean(episode.externalAudioId);
  const hasVideo = Boolean(episode.externalVideoId);
  const durationSeconds = episode.videoDuration ?? episode.audioDuration;
  const productionUrl = getEpisodeProductionUrl(episode.podcastSlug, episode.slug);

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-black/20 p-3 dark:border-white/10">
      <button
        type="button"
        onClick={() => play(episode)}
        aria-label={`Odtwórz odcinek: ${episode.title}`}
        className="group relative block w-full rounded-lg text-left"
      >
        <EpisodeThumbnail
          src={episode.mainImage?.uri ?? null}
          alt={episode.mainImage?.title ?? episode.title}
          priority={priority}
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 transition-colors group-hover:bg-black/40">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-black/80">
            <FontAwesomeIcon icon={faPlay} className="h-5 w-5 translate-x-0.5 text-black dark:text-white" />
          </span>
        </span>
      </button>
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
