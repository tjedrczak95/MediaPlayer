import { formatDuration } from "@/lib/format";

interface DurationProps {
  seconds: number;
}

export function Duration({ seconds }: DurationProps) {
  return <span>{formatDuration(seconds)}</span>;
}
