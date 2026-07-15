import { faHeadphones, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton } from "@/components/atoms/IconButton";
import type { MediaType } from "@/lib/types";

const LABELS: Record<MediaType, string> = {
  audio: "Odtwarzaj audio",
  video: "Odtwarzaj wideo",
};

interface FormatToggleButtonProps {
  format: MediaType;
  active: boolean;
  onClick: () => void;
}

export function FormatToggleButton({
  format,
  active,
  onClick,
}: FormatToggleButtonProps) {
  return (
    <IconButton label={LABELS[format]} pressed={active} onClick={onClick}>
      <FontAwesomeIcon icon={format === "audio" ? faHeadphones : faVideo} className="h-5 w-5" />
    </IconButton>
  );
}
