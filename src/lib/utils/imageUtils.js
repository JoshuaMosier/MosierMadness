/** Fallback for team logo images when they fail to load. */
const PLACEHOLDER_TEAM = '/images/placeholder-team.svg';

/**
 * Handler for img on:error. Sets the image source to the placeholder.
 * @param {Event} event - The error event from the img element
 */
export function handleImageError(event) {
  event.target.src = PLACEHOLDER_TEAM;
}
