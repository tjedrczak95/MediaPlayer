import {
  faClosedCaptioning,
  faCompress,
  faExpand,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { type RefObject, useEffect, useRef, useState } from "react";
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
  const isReady = status === "ready" && !playbackError;
  const isVideoVisible = format === "video" && isReady;
  const vttUri = asset?.transcription?.vttUri;
  const hasCaptions = Boolean(vttUri) && isReady;

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLTrackElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBarHidden, setIsBarHidden] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [cueText, setCueText] = useState<string | null>(null);
  const [captionsFailed, setCaptionsFailed] = useState(false);

  // <track> has no React prop for live on/off — the browser only reads
  // `default` once, on mount — so toggling has to go through the TextTrack
  // API directly.
  useEffect(() => {
    const track = trackRef.current?.track;
    if (!track) return;
    track.mode = captionsEnabled ? "showing" : "hidden";
  }, [captionsEnabled, vttUri]);

  // The <track> element fires `error` if the .vtt fails to fetch (wrong
  // path, CORS, 404 — this API has served all three). Without watching for
  // it, toggling captions on a broken track just does nothing, silently.
  useEffect(() => {
    const trackEl = trackRef.current;
    if (!trackEl) return;

    function handleError() {
      setCaptionsFailed(true);
    }

    trackEl.addEventListener("error", handleError);
    return () => {
      trackEl.removeEventListener("error", handleError);
      setCaptionsFailed(false);
    };
  }, [vttUri]);

  // Cue text is tracked independently of native <track> rendering: the
  // <video> element is only visually hidden (not disabled) in audio mode
  // (see README "Jeden <video> zamiast <audio> + <video>"), so cues still
  // parse and fire cuechange, but there's no rendered video box for the
  // browser to burn them onto — audio mode needs its own text display.
  useEffect(() => {
    const track = trackRef.current?.track;
    if (!track) return;

    function handleCueChange() {
      const activeCues = track?.activeCues;
      if (!activeCues || activeCues.length === 0) {
        setCueText(null);
        return;
      }
      setCueText(Array.from(activeCues, (cue) => (cue as VTTCue).text).join("\n"));
    }

    track.addEventListener("cuechange", handleCueChange);
    handleCueChange();
    return () => track.removeEventListener("cuechange", handleCueChange);
  }, [vttUri]);

  useEffect(() => {
    function handleFullscreenChange() {
      const active = document.fullscreenElement === containerRef.current;
      setIsFullscreen(active);
      setIsBarHidden(false);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const revealZonePx = 120;
    function handleMouseMove(event: MouseEvent) {
      const distanceFromBottom = window.innerHeight - event.clientY;
      setIsBarHidden(distanceFromBottom > revealZonePx);
    }

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [isFullscreen]);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current?.requestFullscreen();
    }
  }

  function handleClose() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onClose();
  }

  return (
    <>
      <div
        ref={containerRef}
        role="region"
        aria-label="Odtwarzacz"
        className={
          episode
            ? isFullscreen
              ? "fixed inset-0 z-10 bg-black"
              : "fixed inset-x-0 bottom-0 z-10 border-t border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-black/95"
            : "hidden"
        }
      >
        <video
          ref={videoRef}
          src={asset?.uri}
          playsInline
          crossOrigin={vttUri ? "anonymous" : undefined}
          className={
            isVideoVisible
              ? isFullscreen
                ? "block size-full bg-black object-contain"
                : "mx-auto block aspect-video max-h-[calc(100vh-6rem)] max-w-[92%] bg-black"
              : "hidden"
          }
        >
          {vttUri && (
            <track ref={trackRef} kind="subtitles" src={vttUri} srcLang="pl" label="Polski" />
          )}
        </video>

        {episode && (
          <div
            className={
              isFullscreen
                ? `absolute inset-x-0 bottom-0 flex flex-col gap-2 border-t border-black/10 bg-white/95 p-3 backdrop-blur transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-black/95 ${
                    isBarHidden ? "translate-y-full" : "translate-y-0"
                  }`
                : "flex w-full flex-col gap-2 p-3"
            }
          >
            {captionsEnabled && captionsFailed && (
              <p role="alert" className="text-center text-base text-red-600 dark:text-red-400">
                Nie udało się wczytać napisów.
              </p>
            )}

            {captionsEnabled && !captionsFailed && !isVideoVisible && cueText && (
              <p
                aria-live="polite"
                className="text-center text-2xl whitespace-pre-line text-neutral-700 dark:text-neutral-300"
              >
                {cueText}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex min-w-0 items-center gap-3 sm:flex-1">
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

              <div className="flex min-w-0 items-center gap-3 sm:flex-1 sm:justify-center">
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

              <div className="flex min-w-0 items-center justify-end gap-2 sm:flex-1">
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

                {hasCaptions && (
                  <IconButton
                    label={captionsEnabled ? "Wyłącz napisy" : "Włącz napisy"}
                    pressed={captionsEnabled}
                    onClick={() => setCaptionsEnabled((enabled) => !enabled)}
                  >
                    <FontAwesomeIcon icon={faClosedCaptioning} className="size-5" />
                  </IconButton>
                )}

                {isVideoVisible && (
                  <IconButton
                    label={isFullscreen ? "Zamknij pełny ekran" : "Pełny ekran"}
                    pressed={isFullscreen}
                    onClick={toggleFullscreen}
                  >
                    <FontAwesomeIcon
                      icon={isFullscreen ? faCompress : faExpand}
                      className="size-5"
                    />
                  </IconButton>
                )}

                <IconButton label="Zamknij odtwarzacz" onClick={handleClose}>
                  <FontAwesomeIcon icon={faXmark} className="size-5" />
                </IconButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {episode && <div aria-hidden="true" className="h-40 sm:h-20" />}
    </>
  );
}
