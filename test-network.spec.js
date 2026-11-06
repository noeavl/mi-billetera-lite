import { test, expect } from '@playwright/test';

test('check network responses', async ({ page }) => {
  page.on('response', response => {
    if (response.url().includes('.js')) {
      console.log('JS Response:', response.url(), response.status(), response.headers()['content-type']);
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  await page.goto('http://127.0.0.1:8080');
  await page.waitForTimeout(3000);
});