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
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
      <span className="truncate">{podcastTitle}</span>
      {durationSeconds !== null && (
        <>
          <span aria-hidden="true">·</span>
          <Duration seconds={durationSeconds} />
        </>
      )}
      <span className="flex gap-1">
        {hasAudio && <FormatBadge kind="audio" />}
        {hasVideo && <FormatBadge kind="video" />}
        {!hasAudio && !hasVideo && <FormatBadge kind="none" />}
      </span>
    </div>
  );
}
