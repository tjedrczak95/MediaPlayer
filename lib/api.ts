import type { EpisodesResponse, MediaAsset, MediaAssetResponse, MediaType } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const EPISODES_PAGE_SIZE = 5;

const PRIVATE_MEDIA_HOST = "dev-cms-gateway.polskieradio.pl";
const PUBLIC_MEDIA_HOST = "cdn6.polskieradio.pl";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function toPublicMediaUrl(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.hostname === PRIVATE_MEDIA_HOST) {
      url.hostname = PUBLIC_MEDIA_HOST;
    }
    return url.toString();
  } catch {
    return uri;
  }
}

// The CMS API returns transcription.vttUri without the "/cms/dev" path
// segment that the audio/video uri itself has, so the file 404s as-is —
// confirmed against the live CDN that the .vtt only exists at the
// /cms/dev-prefixed path, same as the media file.
function fixTranscriptionUrl(uri: string): string {
  try {
    const url = new URL(uri);
    if (!url.pathname.startsWith("/cms/dev/")) {
      url.pathname = `/cms/dev${url.pathname}`;
    }
    return url.toString();
  } catch {
    return uri;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("Missing NEXT_PUBLIC_API_BASE_URL environment variable");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", ...init });
  } catch (error) {
    // fetch() only rejects with a TypeError for genuine network failures (WHATWG
    // spec). Anything else — notably Next.js's internal DYNAMIC_SERVER_USAGE
    // control-flow exception, thrown during static generation when it detects a
    // no-store fetch — must be rethrown as-is. Swallowing it here would hide the
    // digest Next relies on to bail out to dynamic rendering gracefully, turning
    // an internal signal into a hard build failure.
    if (!(error instanceof TypeError)) throw error;
    throw new ApiError("Nie udało się połączyć z API.");
  }

  if (!res.ok) {
    throw new ApiError(`Żądanie ${path} zakończyło się błędem ${res.status}.`, res.status);
  }

  return res.json() as Promise<T>;
}

export async function fetchEpisodes(
  pageNumber: number,
  pageSize = EPISODES_PAGE_SIZE,
): Promise<EpisodesResponse> {
  return apiFetch<EpisodesResponse>(
    `/podcast-episodes/read-models?pageNumber=${pageNumber}&pageSize=${pageSize}`,
  );
}

export async function fetchMediaAsset(type: MediaType, externalId: string): Promise<MediaAsset> {
  const { data } = await apiFetch<MediaAssetResponse>(`/${type}/${externalId}`);
  console.log(data);

  return {
    ...data,
    uri: toPublicMediaUrl(data.uri),
    transcription: data.transcription?.vttUri
      ? { vttUri: toPublicMediaUrl(fixTranscriptionUrl(data.transcription.vttUri)) }
      : data.transcription,
  };
}
