import { test, expect } from './fixtures/auth.js';

test.describe('Public pages smoke tests', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mosier Madness/i);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('login page shows sign-in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: /register here/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /forgot your password/i })).toBeVisible();
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('nav')).toBeVisible();
    // Registration form should have some form element
    await expect(page.locator('form')).toBeVisible();
  });

  test('past winners page loads', async ({ page }) => {
    await page.goto('/past-winners');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('stats page loads', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('live bracket page loads', async ({ page }) => {
    await page.goto('/live-bracket');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('scores page loads', async ({ page }) => {
    await page.goto('/scores');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('easter egg page loads', async ({ page }) => {
    await page.goto('/easter-egg');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Stage-aware conditional pages', () => {
  test('entries page respects tournament stage', async ({ page, getStage }) => {
    await page.goto('/');
    const stage = await getStage();

    await page.goto('/entries');
    if (stage === 'archive') {
      // During archive, /entries should redirect or show limited content
      // The nav link is disabled, but direct URL access may still work
      // depending on server-side guards. Just verify no crash.
      await expect(page.locator('nav')).toBeVisible();
    } else {
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('scenarios page respects tournament stage', async ({ page, getStage }) => {
    await page.goto('/');
    const stage = await getStage();

    await page.goto('/scenarios');
    if (stage === 'tournament-live') {
      await expect(page.locator('main')).toBeVisible();
    } else {
      // Scenarios is only available once the live tournament reaches Sweet Sixteen.
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.getByRole('heading', { name: /scenarios are not active yet/i })).toBeVisible();
    }
  });
});
