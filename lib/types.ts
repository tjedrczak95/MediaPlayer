export interface EpisodeRm {
  id: string;
  title: string;
  slug: string;
  podcastSlug: string;
  podcastTitle: string;
  audioDuration: number | null;
  videoDuration: number | null;
  externalAudioId: string | null;
  externalVideoId: string | null;
  mainImage: { uri: string; title: string } | null;
}

export interface EpisodesResponse {
  data: EpisodeRm[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface MediaAsset {
  id: string;
  title: string;
  uri: string;
  durationSeconds: number;
  transcription?: { vttUri?: string };
}

export interface MediaAssetResponse {
  data: MediaAsset;
}

export type MediaType = "audio" | "video";
