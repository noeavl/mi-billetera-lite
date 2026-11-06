import { test, expect } from '@playwright/test';

test('check console errors with location', async ({ page }) => {
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
    console.log('STACK:', err.stack);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
      console.log('LOCATION:', msg.location());
    }
  });
  
  await page.goto('http://127.0.0.1:8080');
  await page.waitForTimeout(3000);
});