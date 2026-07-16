"use client";

import type { ReactNode } from "react";
import { PlayerBar } from "@/components/organisms/Player/PlayerBar";
import { PlayerContext } from "@/components/organisms/Player/PlayerContext";
import { usePlayerEngine } from "@/components/organisms/Player/usePlayerEngine";

export { usePlayer } from "@/components/organisms/Player/PlayerContext";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const engine = usePlayerEngine();

  return (
    <PlayerContext.Provider
      value={{
        activeEpisode: engine.episode,
        isPlaying: engine.isPlaying,
        play: engine.play,
        togglePlayPause: engine.togglePlayPause,
      }}
    >
      {children}
      <PlayerBar
        videoRef={engine.videoRef}
        episode={engine.episode}
        format={engine.format}
        asset={engine.asset}
        status={engine.status}
        errorMessage={engine.errorMessage}
        isPlaying={engine.isPlaying}
        currentTime={engine.currentTime}
        duration={engine.duration}
        volume={engine.volume}
        isMuted={engine.isMuted}
        playbackError={engine.playbackError}
        onTogglePlayPause={engine.togglePlayPause}
        onSeek={engine.handleSeek}
        onVolumeChange={engine.handleVolumeInput}
        onToggleMute={engine.toggleMute}
        onSwitchFormat={engine.switchFormat}
        onClose={engine.close}
      />
    </PlayerContext.Provider>
  );
}
