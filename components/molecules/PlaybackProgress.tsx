import { Duration } from "@/components/atoms/Duration";
import { SeekBar } from "@/components/atoms/SeekBar";

interface PlaybackProgressProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function PlaybackProgress({ currentTime, duration, onSeek }: PlaybackProgressProps) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <span className="w-10 shrink-0 text-right text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
        <Duration seconds={currentTime} />
      </span>
      <SeekBar currentTime={currentTime} duration={duration} onSeek={onSeek} />
      <span className="w-10 shrink-0 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
        <Duration seconds={duration} />
      </span>
    </div>
  );
}
