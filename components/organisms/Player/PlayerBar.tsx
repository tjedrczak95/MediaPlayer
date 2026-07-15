import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { RefObject } from "react";
import { EpisodeThumbnail } from "@/components/atoms/EpisodeThumbnail";
import { IconButton } from "@/components/atoms/IconButton";
import { PlayPauseButton } from "@/components/atoms/PlayPauseButton";
import { Spinner } from "@/components/atoms/Spinner";
import { FormatSwitch } from "@/components/molecules/FormatSwitch";
import { PlaybackProgress } from "@/components/molecules/PlaybackProgress";
import { VolumeControl } from "@/components/molecules/VolumeControl";
import { getEpisodeProductionUrl } from "@/lib/links";
import type { EpisodeRm, MediaAsset, MediaType } from "@/lib/types";
import type { PlayerStatus } from "@/components/organisms/Player/usePlayerEngine";

interface PlayerBarProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  episode: EpisodeRm | null;
  format: MediaType | null;
  asset: MediaAsset | null;
  status: PlayerStatus;
  errorMessage: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackError: boolean;
  onTogglePlayPause: () => void;
  onSeek: (nextTime: number) => void;
  onVolumeChange: (nextVolume: number) => void;
  onToggleMute: () => void;
  onSwitchFormat: (nextFormat: MediaType) => void;
  onClose: () => void;
}

export function PlayerBar({
  videoRef,
  episode,
  format,
  asset,
  status,
  errorMessage,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackError,
  onTogglePlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSwitchFormat,
  onClose,
}: PlayerBarProps) {
  const hasAudio = Boolean(episode?.externalAudioId);
  const hasVideo = Boolean(episode?.externalVideoId);
  const isVideoVisible = format === "video" && status === "ready" && !playbackError;

  return (
    <>
      <div
        role="region"
        aria-label="Odtwarzacz"
        className={
          episode
            ? "fixed inset-x-0 bottom-0 z-10 border-t border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-black/95"
            : "hidden"
        }
      >
        <div className="flex w-full flex-col gap-2 p-3">
          <video
            ref={videoRef}
            src={asset?.uri}
            playsInline
            className={isVideoVisible ? "block aspect-video w-full bg-black" : "hidden"}
          />

          {episode && (
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="w-12 shrink-0">
                  <EpisodeThumbnail
                    src={episode.mainImage?.uri ?? null}
                    alt={episode.mainImage?.title ?? episode.title}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={getEpisodeProductionUrl(episode.podcastSlug, episode.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {episode.title}
                  </Link>
                  <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {episode.podcastTitle}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
                {status === "ready" && !playbackError && (
                  <>
                    <PlayPauseButton isPlaying={isPlaying} onToggle={onTogglePlayPause} />
                    <PlaybackProgress
                      currentTime={currentTime}
                      duration={duration}
                      onSeek={onSeek}
                    />
                  </>
                )}

                {status === "loading" && (
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <Spinner label="Wczytywanie nagrania" />
                    Wczytywanie…
                  </div>
                )}

                {status === "error" && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {errorMessage}
                  </p>
                )}

                {playbackError && status !== "error" && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    Wystąpił błąd odtwarzania. Spróbuj ponownie później.
                  </p>
                )}
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                {hasAudio && hasVideo && format && (
                  <FormatSwitch activeFormat={format} onChange={onSwitchFormat} />
                )}

                {status === "ready" && !playbackError && (
                  <VolumeControl
                    volume={volume}
                    isMuted={isMuted}
                    onVolumeChange={onVolumeChange}
                    onToggleMute={onToggleMute}
                  />
                )}

                <IconButton label="Zamknij odtwarzacz" onClick={onClose}>
                  <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
                </IconButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {episode && <div aria-hidden="true" className="h-20" />}
    </>
  );
}
