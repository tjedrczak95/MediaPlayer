interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function SeekBar({ currentTime, duration, onSeek }: SeekBarProps) {
  return (
    <input
      type="range"
      aria-label="Pozycja odtwarzania"
      min={0}
      max={duration || 0}
      step={0.1}
      value={Math.min(currentTime, duration || 0)}
      onChange={(event) => onSeek(Number(event.target.value))}
      disabled={duration === 0}
      className="h-1.5 flex-1 cursor-pointer accent-neutral-900 disabled:opacity-40 dark:accent-neutral-100"
    />
  );
}
