import { error } from '@sveltejs/kit';
import { getPlayerProfileData } from '$lib/server/history';

export async function load({ params }) {
  const player = await getPlayerProfileData(params.slug);

  if (!player) {
    throw error(404, 'Player not found');
  }

  return player;
}
