import { test, expect } from './fixtures/auth.js';

test.describe('Desktop navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('nav links are present', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Always-visible links
    await expect(nav.getByText('Leaderboard')).toBeVisible();
    await expect(nav.getByText('Live Bracket')).toBeVisible();
    await expect(nav.getByText('Past Winners')).toBeVisible();
    await expect(nav.getByText('Statistics')).toBeVisible();
    await expect(nav.getByText('Login')).toBeVisible();
  });

  test('stage-dependent links reflect current stage', async ({ page, getStage }) => {
    await page.goto('/');
    const stage = await getStage();
    const nav = page.locator('nav');

    // Submit Entry
    const submitEntry = nav.getByText('Submit Entry');
    await expect(submitEntry).toBeVisible();
    if (stage === 'bracket-open') {
      // Should be a clickable link, not a disabled span
      await expect(nav.locator('a', { hasText: 'Submit Entry' })).toBeVisible();
    } else {
      // Disabled — rendered as a span with title attribute
      await expect(nav.locator('span[title]', { hasText: 'Submit Entry' })).toBeVisible();
    }

    // Entries
    const entries = nav.getByText('Entries').first();
    await expect(entries).toBeVisible();
    if (stage === 'archive') {
      await expect(nav.locator('span[title]', { hasText: 'Entries' })).toBeVisible();
    }

    // Scenarios
    const scenarios = nav.getByText('Scenarios');
    await expect(scenarios).toBeVisible();
    if (stage === 'tournament-live') {
      // Should be clickable
      await expect(nav.locator('span[title]', { hasText: 'Scenarios' })).toHaveCount(0);
    } else {
      await expect(nav.locator('span[title]', { hasText: 'Scenarios' })).toBeVisible();
    }
  });

  test('disabled nav links show tooltip reason', async ({ page, getStage }) => {
    await page.goto('/');
    const stage = await getStage();
    const nav = page.locator('nav');

    if (stage !== 'bracket-open') {
      const disabledBracket = nav.locator('span[title]', { hasText: 'Submit Entry' });
      const title = await disabledBracket.getAttribute('title');
      expect(title).toBeTruthy();
    }

    if (stage !== 'tournament-live') {
      const disabledScenarios = nav.locator('span[title]', { hasText: 'Scenarios' });
      const title = await disabledScenarios.getAttribute('title');
      expect(title).toContain('tournament');
    }
  });
});

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger menu opens and shows nav items', async ({ page }) => {
    await page.goto('/');

    // Hamburger button should be visible on mobile
    const menuBtn = page.getByRole('button', { name: /toggle navigation/i });
    await expect(menuBtn).toBeVisible();

    // Open menu
    await menuBtn.click();

    // Mobile overlay should appear with nav items
    const mobileMenu = page.locator('.md\\:hidden.fixed');
    await expect(mobileMenu).toBeVisible();
    await expect(mobileMenu.getByText('Leaderboard')).toBeVisible();
    await expect(mobileMenu.getByText('Live Bracket')).toBeVisible();
    await expect(mobileMenu.getByText('Past Winners')).toBeVisible();
    await expect(mobileMenu.getByText('Statistics')).toBeVisible();
    await expect(mobileMenu.getByText('Login')).toBeVisible();
  });

  test('mobile menu closes on link click', async ({ page }) => {
    await page.goto('/');

    const menuBtn = page.getByRole('button', { name: /toggle navigation/i });
    await menuBtn.click();

    const mobileMenu = page.locator('.md\\:hidden.fixed');
    await expect(mobileMenu).toBeVisible();

    // Click a nav link in the mobile overlay
    await mobileMenu.getByText('Past Winners').click();

    // Should navigate
    await page.waitForURL('/past-winners');
  });
});
