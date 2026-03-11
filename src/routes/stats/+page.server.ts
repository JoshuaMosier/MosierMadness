import type { PageServerLoad } from './$types';
import { getStatsPageData } from '$lib/server/history';

export const load: PageServerLoad = async () => {
  return getStatsPageData();
};
