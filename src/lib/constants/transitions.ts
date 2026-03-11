import type { FadeParams } from 'svelte/transition';

/**
 * Shared transition params for consistent fade animations.
 * Use with svelte/transition's fade: in:fade={FADE_QUICK}, etc.
 */
export const FADE_QUICK: FadeParams = { duration: 100 };
export const FADE_DELAYED: FadeParams = { duration: 100, delay: 100 };
export const FADE_CONTENT: FadeParams = { duration: 300, delay: 100 };

/** Staggered fade for list items: in:fade={fadeStagger(index)} */
export function fadeStagger(index: number): FadeParams {
  return { duration: 100, delay: index * 50 };
}
