import { test, expect } from '@playwright/test';

test('offline mode - can add expense and persists', async ({ page, context }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('http://127.0.0.1:8080');
  await page.waitForSelector('#expense-form');
  await page.waitForSelector('#total');
  
  // Go offline
  await context.setOffline(true);
  
  // Wait for offline badge to appear
  await expect(page.locator('#offline-badge')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#offline-badge')).toContainText('Sin conexión');
  
  // Add expense while offline
  await page.fill('#concept', 'Taxi offline');
  await page.fill('#amount', '150');
  await page.selectOption('#category', 'transporte');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  
  // Check expense appears
  await expect(page.locator('#empty-state')).toBeHidden();
  const item = page.locator('.expense-item').first();
  await expect(item).toBeVisible();
  await expect(item.locator('.expense-concept')).toContainText('Taxi offline');
  await expect(item.locator('.expense-amount')).toContainText('150.00');
  
  // Check offline badge shows success message
  await expect(page.locator('#offline-badge')).toContainText('guardado localmente');
  
  // Reload page while still offline
  await page.reload();
  await page.waitForSelector('#expense-form');
  await page.waitForTimeout(500);
  
  // Check expense persists after reload offline
  const itemAfterReload = page.locator('.expense-item').first();
  await expect(itemAfterReload).toBeVisible();
  await expect(itemAfterReload.locator('.expense-concept')).toContainText('Taxi offline');
  
  console.log('✅ Offline test passed!');
});