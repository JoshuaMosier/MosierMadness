import { getStatsPageData } from '$lib/server/history';

export async function load() {
  return getStatsPageData();
}
