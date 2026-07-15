import type { ReactNode } from "react";

interface IconButtonProps {
  onClick: () => void;
  label: string;
  children: ReactNode;
  pressed?: boolean;
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  onClick,
  label,
  children,
  pressed,
  disabled,
  className = "",
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-black/5 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-white/10 ${className}`}
    >
      {children}
    </button>
  );
}
