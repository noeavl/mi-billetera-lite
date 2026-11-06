import { test, expect } from '@playwright/test';

test('check console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
    errors.push(err.message);
  });
  
  await page.goto('http://127.0.0.1:8080');
  await page.waitForTimeout(3000);
  
  console.log('All errors:', errors);
  
  // Check if form is visible
  await expect(page.locator('#expense-form')).toBeVisible();
  await expect(page.locator('#empty-state')).toBeVisible();
});