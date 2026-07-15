interface VolumeSliderProps {
  volume: number;
  onChange: (volume: number) => void;
}

export function VolumeSlider({ volume, onChange }: VolumeSliderProps) {
  return (
    <input
      type="range"
      aria-label="Głośność"
      min={0}
      max={1}
      step={0.01}
      value={volume}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-1.5 w-20 cursor-pointer accent-neutral-900 dark:accent-neutral-100"
    />
  );
}
