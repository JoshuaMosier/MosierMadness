import { getPastWinnersPageData } from '$lib/server/history';

export async function load() {
  return getPastWinnersPageData();
}
