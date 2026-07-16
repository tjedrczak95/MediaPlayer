"use server";

import { fetchEpisodes, fetchMediaAsset } from "@/lib/api";
import type { EpisodesResponse, MediaAsset, MediaType } from "@/lib/types";

// Client components call these instead of lib/api.ts directly so the actual
// request to the (VPN-gated) CMS host always runs on the server

export async function loadEpisodesAction(
  pageNumber: number,
  pageSize: number,
): Promise<EpisodesResponse> {
  return fetchEpisodes(pageNumber, pageSize);
}

export async function loadMediaAssetAction(
  type: MediaType,
  externalId: string,
): Promise<MediaAsset> {
  return fetchMediaAsset(type, externalId);
}
