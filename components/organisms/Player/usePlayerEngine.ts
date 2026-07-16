"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMediaAsset } from "@/lib/api";
import type { EpisodeRm, MediaAsset, MediaType } from "@/lib/types";

export type PlayerStatus = "idle" | "loading" | "ready" | "error";

function pickFormat(episode: EpisodeRm): MediaType | null {
  if (episode.externalAudioId) return "audio";
  if (episode.externalVideoId) return "video";
  return null;
}

export function usePlayerEngine() {
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

  // Carries the playback position across a format switch: applied once the
  // new source's metadata loads, since the browser resets currentTime on
  // its own as soon as the <video> element's src changes.
  const resumeTimeRef = useRef(0);

  async function loadMedia(targetEpisode: EpisodeRm, targetFormat: MediaType, resumeTime = 0) {
    const externalId =
      targetFormat === "audio" ? targetEpisode.externalAudioId : targetEpisode.externalVideoId;
    if (!externalId) return;

    const requestId = ++requestIdRef.current;
    resumeTimeRef.current = resumeTime;
    setStatus("loading");
    setErrorMessage(null);
    setPlaybackError(false);
    setAsset(null);
    setCurrentTime(resumeTime);
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
    const handleLoadedMetadata = () => {
      setDuration(el.duration || 0);
      if (resumeTimeRef.current > 0) {
        el.currentTime = resumeTimeRef.current;
        resumeTimeRef.current = 0;
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
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
    el.addEventListener("error", handleError);
    el.addEventListener("volumechange", handleVolumeChange);

    return () => {
      el.removeEventListener("timeupdate", handleTimeUpdate);
      el.removeEventListener("loadedmetadata", handleLoadedMetadata);
      el.removeEventListener("play", handlePlay);
      el.removeEventListener("pause", handlePause);
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
    const externalId = nextFormat === "audio" ? episode.externalAudioId : episode.externalVideoId;
    if (!externalId) return;
    const resumeTime = videoRef.current?.currentTime ?? currentTime;
    setFormat(nextFormat);
    loadMedia(episode, nextFormat, resumeTime);
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

  return {
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
    play,
    togglePlayPause,
    handleSeek,
    handleVolumeInput,
    toggleMute,
    switchFormat,
    close,
  };
}
