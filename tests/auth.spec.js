import { test, expect } from '@playwright/test';

test.describe('Auth redirects (unauthenticated)', () => {
  // These tests use the default (unauthenticated) chromium project,
  // but this file matches auth.spec so it runs in the "authenticated" project.
  // We override by creating a fresh context without storageState.

  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated /bracket redirects to login with redirect param', async ({ page }) => {
    await page.goto('/bracket');
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 10_000 });
    expect(page.url()).toContain('redirect=%2Fbracket');
  });

  test('unauthenticated /admin redirects to login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 10_000 });
  });
});

test.describe('Login flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login with valid credentials lands on home page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('justfav@mosiermadness.com');
    await page.getByLabel('Password').fill('testtest');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 15_000,
    });

    // Should land on home page
    expect(page.url()).toMatch(/\/$/);
  });

  test('login with redirect param goes to redirect target', async ({ page }) => {
    await page.goto('/login?redirect=%2Fbracket');
    await page.getByLabel('Email address').fill('justfav@mosiermadness.com');
    await page.getByLabel('Password').fill('testtest');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 15_000,
    });

    // Should land on /bracket (or redirect target)
    expect(page.url()).toContain('/bracket');
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('wrong@example.com');
    await page.getByLabel('Password').fill('badpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Should stay on login page and show an error (Alert component renders with red background)
    await expect(page.locator('.bg-red-950\\/50')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Authenticated session', () => {
  // These tests use the stored auth state from the setup project

  test('authenticated user can access /bracket', async ({ page }) => {
    await page.goto('/bracket');
    // Should NOT redirect to login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('logout redirects to home', async ({ page }) => {
    await page.goto('/');
    // Wait for nav to hydrate and show Logout button
    const logoutBtn = page.locator('nav button', { hasText: 'Logout' });
    await expect(logoutBtn).toBeVisible({ timeout: 10_000 });
    await logoutBtn.click();

    // Should redirect to home after logout (full page reload)
    await page.waitForURL('/', { timeout: 10_000 });
  });
});
