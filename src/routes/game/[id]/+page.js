export async function load({ fetch, params }) {
  const response = await fetch('/api/scores');
  const matches = await response.json();
  return { matches, gameId: params.id };
} 