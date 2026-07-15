"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { EpisodeThumbnail } from "@/components/atoms/EpisodeThumbnail";
import { IconButton } from "@/components/atoms/IconButton";
import { PlayPauseButton } from "@/components/atoms/PlayPauseButton";
import { CloseIcon } from "@/components/atoms/icons";
import { Spinner } from "@/components/atoms/Spinner";
import { FormatSwitch } from "@/components/molecules/FormatSwitch";
import { PlaybackProgress } from "@/components/molecules/PlaybackProgress";
import { VolumeControl } from "@/components/molecules/VolumeControl";
import { fetchMediaAsset } from "@/lib/api";
import { getEpisodeProductionUrl } from "@/lib/links";
import type { EpisodeRm, MediaAsset, MediaType } from "@/lib/types";

type PlayerStatus = "idle" | "loading" | "ready" | "error";

interface PlayerContextValue {
  activeEpisode: EpisodeRm | null;
  isPlaying: boolean;
  play: (episode: EpisodeRm) => void;
  togglePlayPause: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}

function pickFormat(episode: EpisodeRm): MediaType | null {
  if (episode.externalAudioId) return "audio";
  if (episode.externalVideoId) return "video";
  return null;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [episode, setEpisode] = useState<EpisodeRm | null>(null);
  const [format, setFormat] = useState<MediaType | null>(null);
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  // Guards against a stale response overwriting a newer one when the user
  // switches episode/format again before the previous fetch resolves.
  const requestIdRef = useRef(0);

  async function loadMedia(targetEpisode: EpisodeRm, targetFormat: MediaType) {
    const externalId =
      targetFormat === "audio"
        ? targetEpisode.externalAudioId
        : targetEpisode.externalVideoId;
    if (!externalId) return;

    const requestId = ++requestIdRef.current;
    setStatus("loading");
    setErrorMessage(null);
    setPlaybackError(false);
    setAsset(null);
    setCurrentTime(0);
    setDuration(0);

    try {
      const result = await fetchMediaAsset(targetFormat, externalId);
      if (requestIdRef.current !== requestId) return;
      setAsset(result);
      setStatus("ready");
    } catch {
      if (requestIdRef.current !== requestId) return;
      setStatus("error");
      setErrorMessage("Nie udało się wczytać nagrania.");
    }
  }

  // Autoplay once the new source is ready.
  useEffect(() => {
    if (status === "ready") {
      videoRef.current?.play().catch(() => {
        // Autoplay can be blocked by the browser; user can press play manually.
      });
    }
  }, [status, asset?.uri]);

  // The <video> element stays mounted for the whole session, so listeners
  // are attached once rather than re-wired on every source change.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const handleTimeUpdate = () => setCurrentTime(el.currentTime);
    const handleLoadedMetadata = () => setDuration(el.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setPlaybackError(true);
      setIsPlaying(false);
    };
    const handleVolumeChange = () => {
      setVolume(el.volume);
      setIsMuted(el.muted);
    };

    el.addEventListener("timeupdate", handleTimeUpdate);
    el.addEventListener("loadedmetadata", handleLoadedMetadata);
    el.addEventListener("play", handlePlay);
    el.addEventListener("pause", handlePause);
    el.addEventListener("ended", handleEnded);
    el.addEventListener("error", handleError);
    el.addEventListener("volumechange", handleVolumeChange);

    return () => {
      el.removeEventListener("timeupdate", handleTimeUpdate);
      el.removeEventListener("loadedmetadata", handleLoadedMetadata);
      el.removeEventListener("play", handlePlay);
      el.removeEventListener("pause", handlePause);
      el.removeEventListener("ended", handleEnded);
      el.removeEventListener("error", handleError);
      el.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  function play(nextEpisode: EpisodeRm) {
    const nextFormat = pickFormat(nextEpisode);
    setEpisode(nextEpisode);
    setFormat(nextFormat);
    if (nextFormat) {
      loadMedia(nextEpisode, nextFormat);
    } else {
      requestIdRef.current += 1;
      setAsset(null);
      setStatus("error");
      setErrorMessage("Ten odcinek nie ma dostępnego nagrania.");
    }
  }

  function togglePlayPause() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }

  function handleSeek(nextTime: number) {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleVolumeInput(nextVolume: number) {
    const el = videoRef.current;
    if (!el) return;
    el.volume = nextVolume;
    if (nextVolume > 0 && el.muted) el.muted = false;
  }

  function toggleMute() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
  }

  function switchFormat(nextFormat: MediaType) {
    if (!episode || nextFormat === format) return;
    const externalId =
      nextFormat === "audio" ? episode.externalAudioId : episode.externalVideoId;
    if (!externalId) return;
    setFormat(nextFormat);
    loadMedia(episode, nextFormat);
  }

  function close() {
    videoRef.current?.pause();
    requestIdRef.current += 1;
    setEpisode(null);
    setFormat(null);
    setAsset(null);
    setStatus("idle");
    setErrorMessage(null);
  }

  const hasAudio = Boolean(episode?.externalAudioId);
  const hasVideo = Boolean(episode?.externalVideoId);
  const isVideoVisible = format === "video" && status === "ready" && !playbackError;

  return (
    <PlayerContext.Provider
      value={{ activeEpisode: episode, isPlaying, play, togglePlayPause }}
    >
      {children}

      <div
        role="region"
        aria-label="Odtwarzacz"
        className={
          episode
            ? "fixed inset-x-0 bottom-0 z-10 border-t border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-black/95"
            : "hidden"
        }
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 p-3">
          <video
            ref={videoRef}
            src={asset?.uri}
            playsInline
            className={isVideoVisible ? "block aspect-video w-full bg-black" : "hidden"}
          />

          {episode && (
            <>
              <div className="flex items-center gap-3">
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

                {hasAudio && hasVideo && format && (
                  <FormatSwitch activeFormat={format} onChange={switchFormat} />
                )}

                <IconButton label="Zamknij odtwarzacz" onClick={close}>
                  <CloseIcon />
                </IconButton>
              </div>

              {status === "loading" && (
                <div className="flex items-center gap-2 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <Spinner label="Wczytywanie nagrania" />
                  Wczytywanie…
                </div>
              )}

              {status === "error" && (
                <p role="alert" className="py-2 text-sm text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
              )}

              {playbackError && status !== "error" && (
                <p role="alert" className="py-2 text-sm text-red-600 dark:text-red-400">
                  Wystąpił błąd odtwarzania. Spróbuj ponownie później.
                </p>
              )}

              {status === "ready" && !playbackError && (
                <div className="flex items-center gap-3">
                  <PlayPauseButton isPlaying={isPlaying} onToggle={togglePlayPause} />
                  <PlaybackProgress
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={handleSeek}
                  />
                  <VolumeControl
                    volume={volume}
                    isMuted={isMuted}
                    onVolumeChange={handleVolumeInput}
                    onToggleMute={toggleMute}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {episode && <div aria-hidden="true" className="h-24" />}
    </PlayerContext.Provider>
  );
}
