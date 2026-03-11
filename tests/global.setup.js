import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

const authFile = path.join('playwright', '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('justfav@mosiermadness.com');
  await page.getByLabel('Password').fill('testtest');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait until redirected away from /login
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  });

  await page.context().storageState({ path: authFile });
});
