import { FormatToggleButton } from "@/components/atoms/FormatToggleButton";
import type { MediaType } from "@/lib/types";

interface FormatSwitchProps {
  activeFormat: MediaType;
  onChange: (format: MediaType) => void;
}

export function FormatSwitch({ activeFormat, onChange }: FormatSwitchProps) {
  return (
    <div className="flex shrink-0 gap-1" role="group" aria-label="Format odtwarzania">
      <FormatToggleButton
        format="audio"
        active={activeFormat === "audio"}
        onClick={() => onChange("audio")}
      />
      <FormatToggleButton
        format="video"
        active={activeFormat === "video"}
        onClick={() => onChange("video")}
      />
    </div>
  );
}
