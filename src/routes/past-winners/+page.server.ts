import type { PageServerLoad } from './$types';
import { getPastWinnersPageData } from '$lib/server/history';

export const load: PageServerLoad = async () => {
  return getPastWinnersPageData();
};
