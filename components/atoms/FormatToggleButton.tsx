import { IconButton } from "@/components/atoms/IconButton";
import { AudioIcon, VideoIcon } from "@/components/atoms/icons";
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
      {format === "audio" ? <AudioIcon /> : <VideoIcon />}
    </IconButton>
  );
}
