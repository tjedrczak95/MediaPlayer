Odtwarzacz odcinków (audio/wideo) w Next.js, zasilany danymi z CMS Polskiego Radia.

## Uruchomienie

### Wymagania

- Node.js 24 (zob. [`.nvmrc`](.nvmrc))
- pnpm (wersja spięta w `packageManager`, zob. [`package.json`](package.json))

### Lokalnie

```bash
cp .env.example .env.local   # jeśli .env.local jeszcze nie istnieje
pnpm install
pnpm dev
```

Aplikacja wystartuje pod [http://localhost:3000](http://localhost:3000).

Zmienne środowiskowe (zob. [`.env.example`](.env.example)):

- `NEXT_PUBLIC_API_BASE_URL` — adres bazowy API CMS (proxy deweloperskie).

### Docker

```bash
docker build -t mediaplayer .
docker run -p 3000:3000 mediaplayer
```

## Architektura

- **Next.js (App Router) + React + TypeScript**, stylowanie Tailwind CSS.
- **Komponenty wg atomic design** (`components/atoms`, `components/molecules`, `components/organisms`) — od najprostszych elementów UI (`IconButton`, `SeekBar`) przez złożenia (`FormatSwitch`, `VolumeControl`) po całe sekcje (`EpisodeList`, `Player`).
- **Warstwa danych** (`lib/api.ts`, `lib/types.ts`) izolowana od komponentów: pobieranie listy odcinków (`fetchEpisodes`) i pojedynczego zasobu media (`fetchMediaAsset`), z przepisywaniem prywatnego hosta CDN (`dev-cms-gateway...`) na publiczny (`cdn6...`), żeby zwrócone URI dało się odtworzyć z przeglądarki.
- **Server Actions jako brama do API** (`lib/actions.ts`) — komponenty klienckie nie wywołują `lib/api.ts` bezpośrednio, tylko przez `"use server"` akcje, bo docelowe API CMS jest zagated VPN-em i request musi wychodzić z serwera.
- **Player** (`components/organisms/Player/`) — logika odtwarzania wydzielona do hooka `usePlayerEngine.ts`, stan współdzielony przez `PlayerContext.ts`, warstwa prezentacji w `PlayerBar.tsx`.

## Czas poświęcony na zadanie

Ok. 8-10h.

## Decyzje projektowe

### Jeden `<video>` zamiast `<audio>` + `<video>`

Player (`components/organisms/Player/`) używa jednego elementu `<video>` do odtwarzania zarówno audio, jak i wideo. Gdy aktywny format to audio, element jest tylko wizualnie ukryty (`className="hidden"`) — `HTMLVideoElement` nie wymaga ścieżki wideo w źródle i odtwarza czyste audio identycznie jak `<audio>` (ten sam interfejs `HTMLMediaElement`: `play`/`pause`/`currentTime`/`volume`/eventy).

Powód: część odcinków ma oba formaty i przełącznik audio↔wideo (`FormatSwitch`). Przy jednym elemencie przełączenie formatu to tylko podmiana `src` na tym samym `videoRef` — nie trzeba przenosić stanu (czas, głośność, odtwarzanie) między dwoma osobnymi elementami ani przepinać listenerów przy każdej zmianie formatu. Listenery (`timeupdate`, `play`, `pause`, `error`, `volumechange`) są podpięte raz, na cały czas życia playera (`usePlayerEngine.ts`).

### Ochrona przed spóźnioną odpowiedzią (`requestIdRef`)

`loadMedia` w `usePlayerEngine.ts` numeruje każdy request licznikiem w `useRef` i po powrocie z `fetch` sprawdza, czy to wciąż najnowszy request — jeśli nie (użytkownik zdążył kliknąć inny odcinek/format), wynik jest ignorowany. Zabezpiecza to przed nadpisaniem stanu playera przez odpowiedź ze starszego, wolniejszego requestu.

### Napisy WebVTT dla audio i wideo

`asset.transcription.vttUri` (zwracane przez `fetchMediaAsset`, `lib/api.ts`) trafia do `<track kind="subtitles">` wewnątrz `<video>` w `PlayerBar.tsx`, sterowanego przyciskiem CC.

- `<video>` ma `crossOrigin="anonymous"`, gdy odcinek ma napisy. Bez tego przeglądarka w ogóle blokuje wczytanie `<track>` z innej domeny niż strona (mimo że CDN wysyła `Access-Control-Allow-Origin: *`) — to osobne ograniczenie od zwykłego CORS na `fetch`, dotyczące konkretnie elementów `<track>`/`<video>`.
- W trybie wideo napisy renderują się natywnie (`track.mode = "showing"`) jako nakładka na obrazie.
- W trybie audio `<video>` jest tylko wizualnie ukryty, nie wyłączony (patrz sekcja "Jeden `<video>`..." wyżej) — cue'y nadal się parsują i odpalają `cuechange`, ale nie ma widocznego boksu wideo, na którym przeglądarka mogłaby je wypalić. Dlatego audio ma własny listener `cuechange` na `TextTrack`, który wyświetla aktualną linię transkrypcji jako duży tekst nad paskiem kontrolek.
- Błąd wczytania `.vtt` (404, CORS, zły host) jest wykrywany przez event `error` na `<track>` i pokazywany jako komunikat (`role="alert"`) zamiast ciszy — przycisk CC bez tego wyglądałby na działający, a po kliknięciu nic by się nie działo.

### Naprawiona ścieżka `vttUri` z API

Testowe API systematycznie zwraca `transcription.vttUri` bez segmentu `/cms/dev/`, który mają `uri` samych plików audio/wideo (np. `.../audio/all/{id}/transcription.vtt` zamiast `.../cms/dev/audio/all/{id}/transcription.vtt`). Plik pod błędną ścieżką odpowiada 404; pod poprawioną — 200 z realną treścią VTT (zweryfikowane bezpośrednio na CDN, i dla audio, i dla wideo).

`fixTranscriptionUrl` w `lib/api.ts` wstawia brakujący segment przed zamianą hosta na publiczny CDN (`toPublicMediaUrl`). To błąd danych po stronie backendu CMS, nie tego repo — warto zgłosić zespołowi API; poprawka we froncie jest tymczasowym obejściem.

### Znany problem: niektóre odcinki się nie odtwarzają (świadomie nienaprawiony)

Dwa pierwsze odcinki (podcast "Lata 20-ste") zwracają z testowego API plik `audio.wav` (46 MB), który nie odtwarza się w żadnej przeglądarce — kończy się na istniejącym stanie „błąd odtwarzania".

Nagłówek WAV deklaruje `wFormatTag = 0x50` (`WAVE_FORMAT_MPEG`), a sama zawartość to strumień MPEG-1 **Layer II**. Oficjalna dokumentacja Chromium (chromium.org/audio-video) wprost wymienia wspierane kodeki audio: FLAC, MP3, Opus, PCM, Vorbis (+ AAC tylko w Chrome) — **MPEG Layer II nie występuje na tej liście**. Żadne API webowe (MSE, WebCodecs, Web Audio) tego nie obejdzie, bo wszystkie korzystają z tego samego wewnętrznego dekodera platformy.

Dalsze opcje (dekoder WASM typu ffmpeg.wasm w przeglądarce, albo serwerowy transcoding proxy z realnym `ffmpeg`) są wykonalne, ale nieproporcjonalne do problemu.

### `force-dynamic` na stronie głównej

`app/page.tsx` wymusza `export const dynamic = "force-dynamic"`, więc strona nie jest prerenderowana w czasie builda, tylko renderowana przy każdym żądaniu.

Powód: lista odcinków zależy od API CMS zagatowanego VPN-em, a build Dockera (etap `builder`) nie ma do niego dostępu — próba prerenderu w czasie builda skończyłaby się błędem fetch. Renderowanie per-request przenosi to wywołanie do środowiska runtime (kontener po starcie), które ma już dostęp do API.

### Wstępne wczytanie dwóch stron odcinków

`app/page.tsx` przy SSR pobiera od razu `firstPage` i (jeśli istnieje) `secondPage` — czyli 2×`EPISODES_PAGE_SIZE` (10) odcinków — zamiast tylko pierwszej strony.

Powód: siatka odcinków ma do 5 kolumn (`lg:grid-cols-5`). Jedna strona (5 elementów) wypełniłaby dokładnie jeden rząd, więc od razu po wejściu na stronę widać tylko przycisk „Pokaż więcej” bez żadnego realnego przewijania. Dociągnięcie drugiej strony po stronie serwera daje sensowną wysokość startową (dwa rzędy) bez dodatkowego round-tripu po stronie klienta.

### Przenoszenie pozycji odtwarzania przy zmianie formatu (`resumeTimeRef`)

Zmiana formatu (`switchFormat` w `usePlayerEngine.ts`) podmienia `src` elementu `<video>`, a przeglądarka przy takiej podmianie sama zeruje `currentTime` — nie da się tego przechwycić przed faktem. Aktualna pozycja jest więc zapamiętywana w `resumeTimeRef` przed podmianą i przywracana dopiero w handlerze `loadedmetadata` nowego źródła, gdy element jest już gotowy do ustawienia `currentTime`.

Dzięki temu przełączenie audio↔wideo w trakcie odtwarzania nie cofa użytkownika na początek nagrania.
