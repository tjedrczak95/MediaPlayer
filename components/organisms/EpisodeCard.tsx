import Link from "next/link";
import { EpisodeThumbnail } from "@/components/atoms/EpisodeThumbnail";
import { PlayPauseButton } from "@/components/atoms/PlayPauseButton";
import { EpisodeMeta } from "@/components/molecules/EpisodeMeta";
import { usePlayer } from "@/components/organisms/Player";
import { getEpisodeProductionUrl } from "@/lib/links";
import type { EpisodeRm } from "@/lib/types";

interface EpisodeCardProps {
  episode: EpisodeRm;
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const { activeEpisode, isPlaying, play, togglePlayPause } = usePlayer();

  const hasAudio = Boolean(episode.externalAudioId);
  const hasVideo = Boolean(episode.externalVideoId);
  const hasMedia = hasAudio || hasVideo;
  const isActive = activeEpisode?.id === episode.id;
  const durationSeconds = episode.videoDuration ?? episode.audioDuration;
  const productionUrl = getEpisodeProductionUrl(episode.podcastSlug, episode.slug);

  function handlePlayClick() {
    if (isActive) {
      togglePlayPause();
    } else {
      play(episode);
    }
  }

  return (
    <li className="flex gap-4 rounded-xl border border-black/10 p-3 dark:border-white/10">
      <div className="relative w-24 shrink-0 sm:w-32">
        <EpisodeThumbnail
          src={episode.mainImage?.uri ?? null}
          alt={episode.mainImage?.title ?? episode.title}
        />
        {hasMedia && (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayPauseButton
              isPlaying={isActive && isPlaying}
              onToggle={handlePlayClick}
              className="bg-black/50 text-white hover:bg-black/60"
            />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
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
