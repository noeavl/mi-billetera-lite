import { test, expect } from '@playwright/test';

test('expense persistence after reload', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('http://127.0.0.1:8080');
  await page.waitForSelector('#expense-form');
  await page.waitForSelector('#total');
  
  // Add first expense
  await page.fill('#concept', 'Café');
  await page.fill('#amount', '45.50');
  await page.selectOption('#category', 'comida');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  
  // Add second expense
  await page.fill('#concept', 'Transporte');
  await page.fill('#amount', '150');
  await page.selectOption('#category', 'transporte');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  
  // Check both expenses
  const items = page.locator('.expense-item');
  await expect(items).toHaveCount(2);
  await expect(page.locator('#total')).toContainText('195.50');
  
  // Reload page
  await page.reload();
  await page.waitForSelector('#expense-form');
  await page.waitForTimeout(500);
  
  // Check expenses persist
  const itemsAfterReload = page.locator('.expense-item');
  await expect(itemsAfterReload).toHaveCount(2);
  await expect(itemsAfterReload.nth(0).locator('.expense-concept')).toContainText('Transporte');
  await expect(itemsAfterReload.nth(1).locator('.expense-concept')).toContainText('Café');
  await expect(page.locator('#total')).toContainText('195.50');
  
  console.log('✅ Persistence test passed!');
});