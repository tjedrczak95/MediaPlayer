import { EpisodeList } from "@/components/organisms/EpisodeList";
import { EPISODES_PAGE_SIZE, fetchEpisodes } from "@/lib/api";

export default async function Home() {
  const { data, pageNumber, totalPages } = await fetchEpisodes(
    1,
    EPISODES_PAGE_SIZE,
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Odcinki podcastów</h1>
      <EpisodeList
        initialEpisodes={data}
        initialPageNumber={pageNumber}
        totalPages={totalPages}
      />
    </main>
  );
}
