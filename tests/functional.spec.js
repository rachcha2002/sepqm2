// @ts-check
const { test, expect } = require('@playwright/test');

// Configure test retries and timeouts
test.describe.configure({ retries: 2 });

test.describe('E-commerce Functional Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to automation exercise website which is more stable
    await page.goto('https://automationexercise.com/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    
    // Ensure the page is fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('User can search for products', async ({ page }) => {
    // Go to products page
    await page.locator('a[href="/products"]').first().click();
    await page.waitForSelector('#search_product', { timeout: 10000 });
    
    // Search for a product
    await page.locator('#search_product').fill('top');
    await page.locator('#submit_search').click();
    
    // Verify search results with increased timeout
    await expect(page.locator('.features_items')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.features_items')).toContainText('Searched Products', { timeout: 10000 });
  });
  
  test('User can add product to cart', async ({ page }) => {
    // Go to products page
    await page.locator('a[href="/products"]').first().click();
    
    // Wait for products to load
    await page.waitForSelector('.features_items', { timeout: 10000 });
    
    // Hover over the first product
    const firstProduct = page.locator('.product-image-wrapper').first();
    await firstProduct.hover();
    
    // Click the add to cart button
    await page.locator('.product-overlay .add-to-cart').first().click();
    
    // Click continue shopping
    await page.locator('.modal-footer button').click();
    
    // Verify product was added by going to cart page
    await page.locator('a[href="/view_cart"]').first().click();
    
    // Verify cart page loaded with item
    await expect(page.locator('#cart_info')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.cart_description')).toBeVisible({ timeout: 10000 });
  });
  
  test('User can register an account', async ({ page }) => {
    // Click Signup/Login link
    await page.locator('a[href="/login"]').click();
    
    // Wait for signup form to be visible
    await page.waitForSelector('div[class="signup-form"]', { timeout: 10000 });
    
    // Fill signup form
    const randomName = `TestUser${Math.floor(Math.random() * 10000)}`;
    const randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    
    await page.locator('input[data-qa="signup-name"]').fill(randomName);
    await page.locator('input[data-qa="signup-email"]').fill(randomEmail);
    await page.locator('button[data-qa="signup-button"]').click();
    
    // Fill account information form
    await page.waitForSelector('#name', { timeout: 10000 });
    
    // Select title
    await page.locator('#id_gender1').click();
    
    // Password
    await page.locator('#password').fill('Password123');
    
    // Date of birth
    await page.locator('#days').selectOption('15');
    await page.locator('#months').selectOption('6');
    await page.locator('#years').selectOption('1990');
    
    // Check newsletter and special offers
    await page.locator('#newsletter').check();
    await page.locator('#optin').check();
    
    // Address information
    await page.locator('#first_name').fill('Test');
    await page.locator('#last_name').fill('User');
    await page.locator('#company').fill('Test Company');
    await page.locator('#address1').fill('123 Test Street');
    await page.locator('#address2').fill('Apt 456');
    await page.locator('#country').selectOption('United States');
    await page.locator('#state').fill('California');
    await page.locator('#city').fill('Los Angeles');
    await page.locator('#zipcode').fill('90001');
    await page.locator('#mobile_number').fill('1234567890');
    
    // Submit form
    await page.locator('button[data-qa="create-account"]').click();
    
    // Verify successful registration
    await expect(page.locator('h2[data-qa="account-created"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Account Created!')).toBeVisible({ timeout: 10000 });
    
    // Click continue button
    await page.locator('a[data-qa="continue-button"]').click();
    
    // Verify user is logged in
    await expect(page.getByText(`Logged in as ${randomName}`)).toBeVisible({ timeout: 15000 });
  });
}); 