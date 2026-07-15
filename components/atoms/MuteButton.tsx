import { IconButton } from "@/components/atoms/IconButton";
import { MuteIcon, VolumeIcon } from "@/components/atoms/icons";

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
      {isMuted ? <MuteIcon /> : <VolumeIcon />}
    </IconButton>
  );
}
