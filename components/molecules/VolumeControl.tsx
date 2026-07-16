import { MuteButton } from "@/components/atoms/MuteButton";
import { VolumeSlider } from "@/components/atoms/VolumeSlider";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  return (
    <div className="hidden shrink-0 items-center gap-1 sm:flex">
      <MuteButton isMuted={isMuted} onToggle={onToggleMute} />
      <VolumeSlider volume={isMuted ? 0 : volume} onChange={onVolumeChange} />
    </div>
  );
}
