"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/atoms/Spinner";
import { EpisodeCard } from "@/components/organisms/EpisodeCard";
import { loadEpisodesAction } from "@/lib/actions";
import { EPISODES_PAGE_SIZE } from "@/lib/api";
import type { EpisodeRm } from "@/lib/types";

interface EpisodeListProps {
  initialEpisodes: EpisodeRm[];
  initialPageNumber: number;
  totalPages: number;
}

export function EpisodeList({ initialEpisodes, initialPageNumber, totalPages }: EpisodeListProps) {
  const [episodes, setEpisodes] = useState(initialEpisodes);
  const [pageNumber, setPageNumber] = useState(initialPageNumber);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasMore = pageNumber < totalPages;

  function handleLoadMore() {
    setError(null);
    startTransition(async () => {
      try {
        const next = await loadEpisodesAction(pageNumber + 1, EPISODES_PAGE_SIZE);
        setEpisodes((prev) => [...prev, ...next.data]);
        setPageNumber(next.pageNumber);
      } catch {
        setError("Nie udało się wczytać kolejnych odcinków. Spróbuj ponownie.");
      }
    });
  }

  if (episodes.length === 0) {
    return <p role="status">Brak odcinków do wyświetlenia.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {episodes.map((episode, index) => (
          <EpisodeCard key={episode.id} episode={episode} priority={index === 0} />
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isPending}
          aria-label="Pokaż więcej odcinków"
          className="inline-flex items-center gap-2 self-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
        >
          {isPending && <Spinner label="Wczytywanie kolejnych odcinków" />}
          {isPending ? "Wczytywanie…" : "Pokaż więcej"}
        </button>
      )}
    </div>
  );
}
