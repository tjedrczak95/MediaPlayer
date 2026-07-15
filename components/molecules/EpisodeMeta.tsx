import { Duration } from "@/components/atoms/Duration";
import { FormatBadge } from "@/components/atoms/FormatBadge";

interface EpisodeMetaProps {
  podcastTitle: string;
  durationSeconds: number | null;
  hasAudio: boolean;
  hasVideo: boolean;
}

export function EpisodeMeta({
  podcastTitle,
  durationSeconds,
  hasAudio,
  hasVideo,
}: EpisodeMetaProps) {
  return (
    <div className="flex flex-col gap-1 text-sm text-neutral-500 dark:text-neutral-400">
      <div className="flex items-center gap-x-2">
        <span className="min-w-0 flex-1 truncate">{podcastTitle}</span>
        {durationSeconds !== null && (
          <Duration seconds={durationSeconds} />
        )}
      </div>
      <p className="flex gap-1">
        {hasAudio && <FormatBadge kind="audio" />}
        {hasVideo && <FormatBadge kind="video" />}
        {!hasAudio && !hasVideo && <FormatBadge kind="none" />}
      </p>
    </div>
  );
}
