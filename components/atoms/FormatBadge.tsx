type FormatBadgeKind = "audio" | "video" | "none";

const LABELS: Record<FormatBadgeKind, string> = {
  audio: "Audio",
  video: "Wideo",
  none: "Brak nagrania",
};

interface FormatBadgeProps {
  kind: FormatBadgeKind;
}

export function FormatBadge({ kind }: FormatBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        kind === "none"
          ? "bg-red-500/10 text-red-700 dark:text-red-400"
          : "bg-black/5 text-neutral-700 dark:bg-white/10 dark:text-neutral-300"
      }`}
    >
      {LABELS[kind]}
    </span>
  );
}
