/**
 * Shared transition params for consistent fade animations.
 * Use with svelte/transition's fade: in:fade={FADE_QUICK}, etc.
 */
export const FADE_QUICK = { duration: 100 };
export const FADE_DELAYED = { duration: 100, delay: 100 };
export const FADE_CONTENT = { duration: 300, delay: 100 };

/** Staggered fade for list items: in:fade={fadeStagger(index)} */
export function fadeStagger(index) {
  return { duration: 100, delay: index * 50 };
}
