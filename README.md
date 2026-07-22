Odtwarzacz odcinków podcastów (audio/wideo) w Next.js, zasilany danymi z CMS Polskiego Radia.

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
- **Server Actions jako brama do API** (`lib/actions.ts`) — komponenty klienckie nie wywołują `lib/api.ts` bezpośrednio, tylko przez `"use server"` akcje. To środowisko testowe (`dev-proxy`) jest w praktyce publiczne i ma permisywne CORS (odbija dowolny nagłówek `Origin` z powrotem jako `Access-Control-Allow-Origin`) — nic nie blokowałoby wywołania go wprost z przeglądarki. Server Actions to świadoma decyzja architektoniczna, nie obejście realnej blokady: klient nigdy nie poznaje hosta CMS, logiki naprawiania odpowiedzi (`toPublicMediaUrl`, `fixTranscriptionUrl`) ani przyszłych wymogów autoryzacji — w docelowym środowisku, gdzie API faktycznie stoi za VPN-em Polskiego Radia, ta granica zadziała bez żadnej zmiany po stronie klienta.
- **Player** (`components/organisms/Player/`) — logika odtwarzania wydzielona do hooka `usePlayerEngine.ts`, stan współdzielony przez `PlayerContext.ts`, warstwa prezentacji w `PlayerBar.tsx`.

## Czas poświęcony na zadanie

Zakres zadania: 7 godzin
VTT: 1 godzina
Suma: 8 godzin

## Decyzje projektowe

### Jeden `<video>` zamiast `<audio>` + `<video>`

Player (`components/organisms/Player/`) używa jednego elementu `<video>` do odtwarzania zarówno audio, jak i wideo. Gdy aktywny format to audio, element jest tylko wizualnie ukryty (`className="hidden"`) — `HTMLVideoElement` nie wymaga ścieżki wideo w źródle i odtwarza czyste audio identycznie jak `<audio>`.

Powód: część odcinków ma oba formaty i przełącznik audio↔wideo (`FormatSwitch`). Przy jednym elemencie przełączenie formatu to tylko podmiana `src` na tym samym `videoRef` — nie trzeba przenosić stanu (czas, głośność, odtwarzanie) między dwoma osobnymi elementami ani przepinać listenerów przy każdej zmianie formatu. Listenery (`timeupdate`, `play`, `pause`, `error`, `volumechange`) są podpięte raz, na cały czas życia playera (`usePlayerEngine.ts`).

### Ochrona przed spóźnioną odpowiedzią (`requestIdRef`)

`loadMedia` w `usePlayerEngine.ts` numeruje każdy request licznikiem w `useRef` i po powrocie z `fetch` sprawdza, czy to wciąż najnowszy request — jeśli nie (użytkownik zdążył kliknąć inny odcinek/format), wynik jest ignorowany. Zabezpiecza to przed nadpisaniem stanu playera przez odpowiedź ze starszego, wolniejszego requestu.

### Napisy WebVTT dla audio i wideo

`asset.transcription.vttUri` (zwracane przez `fetchMediaAsset`, `lib/api.ts`) trafia do `<track kind="subtitles">` wewnątrz `<video>` w `PlayerBar.tsx`, sterowanego przyciskiem CC.

- `<video>` ma `crossOrigin="anonymous"`, gdy odcinek ma napisy. Bez tego przeglądarka w ogóle blokuje wczytanie `<track>` z innej domeny niż strona (mimo że CDN wysyła `Access-Control-Allow-Origin: *`) — to osobne ograniczenie od zwykłego CORS na `fetch`, dotyczące konkretnie elementów `<track>`/`<video>`.
- W trybie wideo napisy renderują się natywnie (`track.mode = "showing"`) jako nakładka na obrazie.
- W trybie audio `<video>` jest tylko wizualnie ukryty, nie wyłączony , dlatego audio ma własny listener `cuechange` na `TextTrack`, który wyświetla aktualną linię transkrypcji jako duży tekst nad paskiem kontrolek.
- Błąd wczytania `.vtt` (404, CORS, zły host) jest wykrywany przez event `error` na `<track>` i pokazywany jako komunikat (`role="alert"`) zamiast braku komunikatu — przycisk CC bez tego wyglądałby na działający, a po kliknięciu nic by się nie działo.

### Naprawiona ścieżka `vttUri` z API

Testowe API systematycznie zwraca `transcription.vttUri` bez segmentu `/cms/dev/`, który mają `uri` samych plików audio/wideo (np. `.../audio/all/{id}/transcription.vtt` zamiast `.../cms/dev/audio/all/{id}/transcription.vtt`). Plik pod błędną ścieżką odpowiada 404; pod poprawioną — 200 (zweryfikowane bezpośrednio na CDN, dla audio i wideo).

`fixTranscriptionUrl` w `lib/api.ts` wstawia brakujący segment przed zamianą hosta na publiczny CDN.

### Znany problem: niektóre odcinki się nie odtwarzają (świadomie nienaprawiony)

Dwa pierwsze odcinki (podcast "Lata 20-ste") zwracają z testowego API plik `audio.wav`, który nie odtwarza się w żadnej przeglądarce — kończy się na istniejącym stanie „błąd odtwarzania".

Nagłówek WAV deklaruje `wFormatTag = 0x50` (`WAVE_FORMAT_MPEG`), a sama zawartość to strumień MPEG-1 **Layer II**. Oficjalna dokumentacja Chromium (chromium.org/audio-video) wprost wymienia wspierane kodeki audio: FLAC, MP3, Opus, PCM, Vorbis (+ AAC tylko w Chrome) — **MPEG Layer II nie występuje na tej liście**. Żadne API webowe tego nie obejdzie, bo wszystkie korzystają z tego samego wewnętrznego dekodera platformy.

Dalsze opcje (dekoder WASM typu ffmpeg.wasm w przeglądarce, albo serwerowy transcoding proxy z realnym `ffmpeg`) są wykonalne, ale nieproporcjonalne do problemu.

### `cache: "no-store"` na każdym fetchu (`lib/api.ts`)

`apiFetch` wywołuje każdy request z `{ cache: "no-store", ...init }` — świadomie, nie tylko dlatego, że to obecny domyślny tryb w Next.js 15+.

Dwa powody: (1) oba endpointy potrzebują świeżości — lista odcinków może dostać nowy/zaktualizowany wpis z CMS-a w dowolnym momencie, a `/audio/{id}`/`/video/{id}` to dokładnie ten endpoint, w którym znaleziono błąd ścieżki `vttUri` (patrz niżej) — jeśli CMS kiedyś to naprawi po swojej stronie, cache'owana odpowiedź sprzed poprawki byłaby myląca. (2) To `no-store` jest tym, co realnie wymusza dynamiczne renderowanie strony — sygnalizuje Next.js, że fetch nie może być cache'owany, co bezpośrednio prowadzi do decyzji o `force-dynamic` opisanej niżej.

Do Next.js 14 `fetch` domyślnie cache'ował się jak `force-cache`, więc ten zapis miał realny efekt override'u. Od Next.js 15 to już domyślne zachowanie — ale zostawiony jawnie, bo dokumentuje intencję w miejscu wywołania, niezależnie od tego, czy ktoś kiedyś zmieni globalny default frameworka.

### `force-dynamic` na stronie głównej

`app/page.tsx` wymusza `export const dynamic = "force-dynamic"`. Każdy fetch w `lib/api.ts` używa `cache: "no-store"`, więc strona i tak nigdy nie mogłaby być statyczna — `force-dynamic` deklaruje to jawnie zamiast polegać na automatycznym wykrywaniu przez Next.js.

**Zweryfikowany root cause (nie VPN).** Pierwotnie zakładałem, że bez `force-dynamic` build wywala się, bo API CMS jest za VPN-em Polskiego Radia. Po sprawdzeniu bezpośrednio (`curl`, Node `fetch` z tej samej maszyny co build) endpoint listy odcinków okazał się w pełni publiczny i osiągalny bez VPN-a — to nie był powód błędu builda.

Rzeczywista przyczyna: usunięcie `force-dynamic` powoduje próbę statycznego prerenderu `/` w czasie builda. Next.js wykrywa fetch z `cache: "no-store"` i rzuca wewnętrzny wyjątek kontrolny (`digest: "DYNAMIC_SERVER_USAGE"`) — to jego własny mechanizm sygnalizujący „ta trasa nie może być statyczna, oznacz ją jako dynamiczną". Blok `try { fetch(...) } catch { throw new ApiError(...) }` w `apiFetch` (`lib/api.ts`) łapał **każdy** błąd z `fetch`, w tym ten wewnętrzny sygnał, i zamieniał go na zwykły `ApiError` — Next.js przestawał rozpoznawać własny mechanizm bailoutu, traktował to jako prawdziwy, nieodwracalny błąd prerenderu i wywalał cały build.

Naprawione: `catch` w `apiFetch` re-throwuje teraz wszystko, co nie jest `TypeError` — jedynym typem błędu, jakim `fetch()` faktycznie odrzuca dla prawdziwych awarii sieciowych, zgodnie ze specyfikacją WHATWG. Dzięki temu wewnętrzne sygnały Next.js (w tym `DYNAMIC_SERVER_USAGE`, a potencjalnie też `notFound()`/`redirect()`, gdyby ta funkcja była kiedyś użyta w podobnym kontekście) przechodzą nietknięte. Po tej poprawce build przechodzi nawet bez `force-dynamic` — Next sam wykrywa i oznacza trasę jako dynamiczną (`ƒ /` w outpucie builda).

`force-dynamic` zostaje mimo to zadeklarowany jawnie: to solidniejsze rozwiązanie niż poleganie na automatycznej detekcji, która — jak pokazał ten błąd — jest krucha wobec dowolnego nadmiernie szerokiego `catch` gdziekolwiek w ścieżce wywołań.

### Przenoszenie pozycji odtwarzania przy zmianie formatu (`resumeTimeRef`)

Zmiana formatu (`switchFormat` w `usePlayerEngine.ts`) podmienia `src` elementu `<video>`, a przeglądarka przy takiej podmianie sama zeruje `currentTime` — nie da się tego przechwycić przed faktem. Aktualna pozycja jest więc zapamiętywana w `resumeTimeRef` przed podmianą i przywracana dopiero w handlerze `loadedmetadata` nowego źródła, gdy element jest już gotowy do ustawienia `currentTime`.

Dzięki temu przełączenie audio↔wideo w trakcie odtwarzania nie cofa użytkownika na początek nagrania.
