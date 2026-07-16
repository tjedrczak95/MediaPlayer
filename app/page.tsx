import { EpisodeList } from "@/components/organisms/EpisodeList";
import { EPISODES_PAGE_SIZE, fetchEpisodes } from "@/lib/api";

// The episode list depends on a live, VPN-gated API, so it can never be
// prerendered at build time (e.g. Docker builds don't have network access
// to it) — force this page to render per-request instead.
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
