import { EpisodeList } from "@/components/organisms/EpisodeList";
import { EPISODES_PAGE_SIZE, fetchEpisodes } from "@/lib/api";

// Every fetch in lib/api.ts uses cache: "no-store", so this page can never be
// static anyway. Declared explicitly rather than relying on Next's automatic
// dynamic-usage detection: that mechanism depends on its internal
// DYNAMIC_SERVER_USAGE control-flow exception propagating untouched through
// the whole call path — a single overly-broad try/catch anywhere below (see
// lib/api.ts) is enough to swallow it and fail the build instead of falling
// back to dynamic rendering.
export const dynamic = "force-dynamic";

export default async function Home() {
  const firstPage = await fetchEpisodes(1, EPISODES_PAGE_SIZE);
  const secondPage = firstPage.totalPages > 1 ? await fetchEpisodes(2, EPISODES_PAGE_SIZE) : null;

  const data = secondPage ? [...firstPage.data, ...secondPage.data] : firstPage.data;
  const pageNumber = secondPage ? secondPage.pageNumber : firstPage.pageNumber;
  const totalPages = firstPage.totalPages;

  return (
    <main className="mx-auto flex w-full flex-1 flex-col gap-6 p-4 sm:w-3/5 md:p-8">
      <h1 className="text-6xl font-semibold">Odcinki podcastów</h1>
      <EpisodeList initialEpisodes={data} initialPageNumber={pageNumber} totalPages={totalPages} />
    </main>
  );
}
