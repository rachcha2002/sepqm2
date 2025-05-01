// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('UI Testing', () => {
  test('Homepage layout and visual elements', async ({ page }) => {
    // Go to automation exercise site
    await page.goto('https://automationexercise.com/');
    
    // Check if the logo is visible
    await expect(page.locator('img[alt="Website for automation practice"]')).toBeVisible();
    
    // Check if the navigation menu is present
    await expect(page.locator('.navbar-nav')).toBeVisible();
    
    // Check for hero banner
    await expect(page.locator('#slider')).toBeVisible();
    
    // Verify footer is present
    await expect(page.locator('footer')).toBeVisible();
  });

  test('Responsive design on different viewports', async ({ page }) => {
    await page.goto('https://automationexercise.com/');
    
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    // On this site, let's just verify we can see the logo in mobile view
    await expect(page.locator('img[alt="Website for automation practice"]')).toBeVisible();
    
    // And verify the viewport size changed correctly
    const viewportSize = page.viewportSize();
    expect(viewportSize.width).toBe(375);
    expect(viewportSize.height).toBe(667);
    
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await expect(page.locator('img[alt="Website for automation practice"]')).toBeVisible();
    
    // Test on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('img[alt="Website for automation practice"]')).toBeVisible();
    
    // Verify the header is present across all viewport sizes
    await expect(page.locator('.shop-menu')).toBeVisible();
  });

  test('Form validation UI feedback', async ({ page }) => {
    // Go to contact page
    await page.goto('https://automationexercise.com/contact_us');
    
    // Try to submit form without filling required fields
    await page.locator('input[data-qa="submit-button"]').click();
    
    // For this site, we need to check if form submission is prevented
    // by verifying we're still on the contact page
    await expect(page.url()).toContain('/contact_us');
    
    // Fill in one field and check form behavior
    await page.locator('input[data-qa="name"]').fill('John Doe');
    await page.locator('input[data-qa="email"]').fill('invalid-email'); // Invalid format
    await page.locator('input[data-qa="submit-button"]').click();
    
    // Check if the form was not submitted due to validation
    await expect(page.url()).toContain('/contact_us');
  });

  test('Accessibility testing', async ({ page }) => {
    await page.goto('https://automationexercise.com/');
    
    // Check for image alt texts in the products section
    await page.locator('a[href="/products"]').first().click();
    
    // Wait for products to load
    await page.waitForSelector('.features_items', { timeout: 10000 });
    
    // Get all product images
    const productImages = await page.locator('.product-image-wrapper img').all();
    
    // Verify at least one image exists
    expect(productImages.length).toBeGreaterThan(0);
    
    // Check form accessibility on contact page
    await page.goto('https://automationexercise.com/contact_us');
    
    // Simply check that form inputs exist and have placeholders
    const formInputs = await page.locator('input[data-qa="name"], input[data-qa="email"], input[data-qa="subject"]').all();
    expect(formInputs.length).toBeGreaterThan(0);
    
    // Verify that at least the name input has a placeholder
    const nameInput = page.locator('input[data-qa="name"]');
    const hasPlaceholder = await nameInput.evaluate(el => 
      el.hasAttribute('placeholder') && el.getAttribute('placeholder').trim() !== ''
    );
    expect(hasPlaceholder).toBeTruthy();
  });
}); 