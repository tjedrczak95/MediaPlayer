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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("Missing NEXT_PUBLIC_API_BASE_URL environment variable");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", ...init });
  } catch {
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

  return {
    ...data,
    uri: toPublicMediaUrl(data.uri),
    transcription: data.transcription?.vttUri
      ? { vttUri: toPublicMediaUrl(data.transcription.vttUri) }
      : data.transcription,
  };
}
