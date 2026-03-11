/** Fallback for team logo images when they fail to load. */
const PLACEHOLDER_TEAM = '/images/placeholder-team.svg';

/**
 * Handler for img on:error. Sets the image source to the placeholder.
 */
export function handleImageError(event: Event): void {
  (event.target as HTMLImageElement).src = PLACEHOLDER_TEAM;
}
