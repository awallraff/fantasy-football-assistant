import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('homepage has correct title and heading', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Fantasy Football/);

    // Expect the main heading to be visible.
    await expect(page.getByRole('heading', { name: 'Fantasy Football Analytics' })).toBeVisible();
  });
});
