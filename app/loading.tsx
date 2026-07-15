import { Spinner } from "@/components/atoms/Spinner";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 p-4 md:p-8">
      <Spinner label="Wczytywanie odcinków" />
    </main>
  );
}
