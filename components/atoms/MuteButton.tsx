import { faVolumeHigh, faVolumeXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton } from "@/components/atoms/IconButton";

interface MuteButtonProps {
  isMuted: boolean;
  onToggle: () => void;
}

export function MuteButton({ isMuted, onToggle }: MuteButtonProps) {
  return (
    <IconButton
      label={isMuted ? "Wyłącz wyciszenie" : "Wycisz"}
      pressed={isMuted}
      onClick={onToggle}
    >
      <FontAwesomeIcon icon={isMuted ? faVolumeXmark : faVolumeHigh} className="size-5" />
    </IconButton>
  );
}
