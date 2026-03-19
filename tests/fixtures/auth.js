import { test as base, expect } from '@playwright/test';

/**
 * Fixture that provides a helper to detect the current tournament stage
 * from the navbar's disabled/enabled link states.
 *
 * This is intentionally coarse. During early live-tournament days the
 * scenarios link is disabled until Sweet Sixteen, which looks the same as
 * the complete stage when you only inspect nav state.
 */
export const test = base.extend({
  /** Resolves the current tournament stage by inspecting the DOM. */
  getStage: async ({ page }, use) => {
    const getStage = async () => {
      // The layout server injects stage into Navbar; we can infer it from
      // which nav links are disabled.  The stage drives:
      //   archive        → bracket disabled, entries disabled, scenarios disabled
      //   bracket-open   → bracket enabled, entries enabled, scenarios disabled
      //   tournament-live→ bracket disabled, entries enabled, scenarios enabled
      //   complete       → bracket disabled, entries enabled, scenarios disabled

      // Wait for nav to be rendered
      await page.waitForSelector('nav', { timeout: 10_000 });

      const bracketDisabled = await page
        .locator('nav span[title] >> text=Submit Entry')
        .count()
        .then((c) => c > 0);
      const entriesDisabled = await page
        .locator('nav span[title] >> text=Entries')
        .count()
        .then((c) => c > 0);
      const scenariosDisabled = await page
        .locator('nav span[title] >> text=Scenarios')
        .count()
        .then((c) => c > 0);

      if (!bracketDisabled && !entriesDisabled && scenariosDisabled) return 'bracket-open';
      if (bracketDisabled && entriesDisabled && scenariosDisabled) return 'archive';
      if (bracketDisabled && !entriesDisabled && !scenariosDisabled) return 'tournament-live';
      if (bracketDisabled && !entriesDisabled && scenariosDisabled) return 'complete';

      return 'unknown';
    };

    await use(getStage);
  },
});

export { expect };
