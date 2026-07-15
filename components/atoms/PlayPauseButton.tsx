import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton } from "@/components/atoms/IconButton";

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
      <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="h-5 w-5" />
    </IconButton>
  );
}
