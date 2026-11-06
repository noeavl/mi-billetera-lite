import { test, expect } from '@playwright/test';

test('expense list renders and shows added expenses', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('http://127.0.0.1:8080');
  
  // Wait for app to load
  await page.waitForSelector('#expense-form');
  await page.waitForSelector('#total');
  
  // Check for JS errors
  console.log('JS Errors on load:', errors);
  
  // Check empty state is visible initially
  await expect(page.locator('#empty-state')).toBeVisible();
  await expect(page.locator('#empty-state')).toContainText('Sin gastos registrados');
  
  // Add first expense
  await page.fill('#concept', 'Café');
  await page.fill('#amount', '45.50');
  await page.selectOption('#category', 'comida');
  await page.click('button[type="submit"]');
  
  // Wait for list to update - give more time
  await page.waitForTimeout(1500);
  
  // Check for JS errors after submit
  console.log('JS Errors after submit:', errors);
  
  // Empty state should be hidden, list visible
  await expect(page.locator('#empty-state')).toBeHidden({ timeout: 5000 });
  await expect(page.locator('#expenses-ul')).toBeVisible();
  
  // Check expense appears in list
  const expenseItem = page.locator('.expense-item').first();
  await expect(expenseItem).toBeVisible();
  await expect(expenseItem.locator('.expense-concept')).toContainText('Café');
  await expect(expenseItem.locator('.expense-category')).toContainText('Comida');
  await expect(expenseItem.locator('.expense-amount')).toContainText('45.50');
  
  // Check total updated
  await expect(page.locator('#total')).toContainText('45.50');
  
  console.log('✅ All tests passed!');
});