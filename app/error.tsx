"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-4 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Odcinki podcastów</h1>
      <p role="alert" className="text-red-600 dark:text-red-400">
        Nie udało się pobrać listy odcinków. Spróbuj ponownie.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
      >
        Spróbuj ponownie
      </button>
    </main>
  );
}
