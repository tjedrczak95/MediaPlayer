"use client";

import { createContext, useContext } from "react";
import type { EpisodeRm } from "@/lib/types";

export interface PlayerContextValue {
  activeEpisode: EpisodeRm | null;
  isPlaying: boolean;
  play: (episode: EpisodeRm) => void;
  togglePlayPause: () => void;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
