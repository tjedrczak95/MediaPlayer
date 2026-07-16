This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Decyzje projektowe

### Jeden `<video>` zamiast `<audio>` + `<video>`

Player (`components/organisms/Player/`) używa jednego elementu `<video>` do odtwarzania zarówno audio, jak i wideo. Gdy aktywny format to audio, element jest tylko wizualnie ukryty (`className="hidden"`) — `HTMLVideoElement` nie wymaga ścieżki wideo w źródle i odtwarza czyste audio identycznie jak `<audio>` (ten sam interfejs `HTMLMediaElement`: `play`/`pause`/`currentTime`/`volume`/eventy).

Powód: część odcinków ma oba formaty i przełącznik audio↔wideo (`FormatSwitch`). Przy jednym elemencie przełączenie formatu to tylko podmiana `src` na tym samym `videoRef` — nie trzeba przenosić stanu (czas, głośność, odtwarzanie) między dwoma osobnymi elementami ani przepinać listenerów przy każdej zmianie formatu. Listenery (`timeupdate`, `play`, `pause`, `error`, `volumechange`) są podpięte raz, na cały czas życia playera (`usePlayerEngine.ts`).

### Ochrona przed spóźnioną odpowiedzią (`requestIdRef`)

`loadMedia` w `usePlayerEngine.ts` numeruje każdy request licznikiem w `useRef` i po powrocie z `fetch` sprawdza, czy to wciąż najnowszy request — jeśli nie (użytkownik zdążył kliknąć inny odcinek/format), wynik jest ignorowany. Zabezpiecza to przed nadpisaniem stanu playera przez odpowiedź ze starszego, wolniejszego requestu.

### Znany problem: niektóre odcinki się nie odtwarzają (świadomie nienaprawiony)

Dwa pierwsze odcinki (podcast "Lata 20-ste") zwracają z testowego API plik `audio.wav` (46 MB), który nie odtwarza się w żadnej przeglądarce — kończy się na istniejącym stanie „błąd odtwarzania".

Nagłówek WAV deklaruje `wFormatTag = 0x50` (`WAVE_FORMAT_MPEG`), a sama zawartość to strumień MPEG-1 **Layer II**. Oficjalna dokumentacja Chromium (chromium.org/audio-video) wprost wymienia wspierane kodeki audio: FLAC, MP3, Opus, PCM, Vorbis (+ AAC tylko w Chrome) — **MPEG Layer II nie występuje na tej liście**. Żadne API webowe (MSE, WebCodecs, Web Audio) tego nie obejdzie, bo wszystkie korzystają z tego samego wewnętrznego dekodera platformy.

Dalsze opcje (dekoder WASM typu ffmpeg.wasm w przeglądarce, albo serwerowy transcoding proxy z realnym `ffmpeg`) są wykonalne, ale nieproporcjonalne do problemu.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
