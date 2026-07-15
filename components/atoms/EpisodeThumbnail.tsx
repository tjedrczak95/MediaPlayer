import Image from "next/image";

interface EpisodeThumbnailProps {
  src: string | null;
  alt: string;
}

export function EpisodeThumbnail({ src, alt }: EpisodeThumbnailProps) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 160px, 96px"
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full items-center justify-center text-neutral-400 dark:text-neutral-600"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
            <path
              d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
