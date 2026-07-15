"use client";

import { useState } from "react";
import Image from "next/image";
import { Spinner } from "@/components/atoms/Spinner";

interface EpisodeThumbnailProps {
  src: string | null;
  alt: string;
  priority?: boolean;
}

export function EpisodeThumbnail({ src, alt, priority = false }: EpisodeThumbnailProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800">
      {src ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner label="Wczytywanie miniatury" />
            </div>
          )}
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 12vw, (min-width: 640px) 30vw, 100vw"
            className={`object-cover transition-opacity ${isLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setIsLoaded(true)}
            priority={priority}
          />
        </>
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
