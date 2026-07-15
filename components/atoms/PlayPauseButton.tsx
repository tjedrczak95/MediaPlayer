import { IconButton } from "@/components/atoms/IconButton";
import { PauseIcon, PlayIcon } from "@/components/atoms/icons";

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  className?: string;
}

export function PlayPauseButton({
  isPlaying,
  onToggle,
  className,
}: PlayPauseButtonProps) {
  return (
    <IconButton
      label={isPlaying ? "Pauza" : "Odtwórz"}
      pressed={isPlaying}
      onClick={onToggle}
      className={className}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </IconButton>
  );
}
