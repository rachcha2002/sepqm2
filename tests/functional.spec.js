// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Functional Testing Suite
 * Tests user interactions on the e-commerce website
 * Includes both valid and invalid test scenarios
 */
test.describe("E-commerce Functional Testing", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to automation exercise website
    console.log("Navigating to test website...");
    await page.goto("https://automationexercise.com/", {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });

    // Ensure the page is fully loaded by waiting for a key element instead of networkidle
    try {
      // Wait for the logo to be visible as an indicator the page is ready
      await page.locator(".logo").waitFor({ state: "visible", timeout: 45000 });
      console.log("Page loaded successfully");
    } catch (error) {
      console.log("Warning: Timed out waiting for page to fully load, continuing test");
    }

    // Take screenshot of homepage for reporting
    await page.screenshot({ path: "./test-results/screenshots/homepage.png" });
  });

  /**
   * VALID TEST CASE: Product Search Functionality
   * Test ID: FUNC-001
   * Description: Verifies that a user can search for products using valid keywords
   * Expected Result: Search results page displays products matching the search query
   */
  test("VALID: User can search for products with valid keyword", async ({
    page,
  }) => {
    console.log("Testing product search with valid keyword...");

    // Go to products page
    await page.locator('a[href="/products"]').first().click();
    await page.waitForSelector("#search_product", { timeout: 10000 });

    // Search for a product with valid keyword
    const searchKeyword = "top";
    await page.locator("#search_product").fill(searchKeyword);
    await page.locator("#submit_search").click();

    // Take screenshot of search results
    await page.screenshot({
      path: "./test-results/screenshots/valid-search-results.png",
    });

    // Verify search results
    await expect(page.locator(".features_items")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator(".features_items")).toContainText(
      "Searched Products",
      { timeout: 10000 }
    );

    // Verify at least one product is found
    const productCount = await page.locator(".product-image-wrapper").count();
    console.log(
      `Found ${productCount} products for search term: ${searchKeyword}`
    );
    expect(productCount).toBeGreaterThan(0);
  });

  /**
   * INVALID TEST CASE: Product Search Functionality
   * Test ID: FUNC-002
   * Description: Verifies behavior when searching with invalid/nonsense keywords
   * Expected Result: Search results page shows no products or appropriate message
   */
  test("INVALID: User searches with nonsense keyword", async ({ page }) => {
    console.log("Testing product search with invalid keyword...");

    // Go to products page
    await page.locator('a[href="/products"]').first().click();
    await page.waitForSelector("#search_product", { timeout: 10000 });

    // Search for a product with invalid keyword
    const invalidKeyword = "xzy123nonexistent";
    await page.locator("#search_product").fill(invalidKeyword);
    await page.locator("#submit_search").click();

    // Take screenshot of search results
    await page.screenshot({
      path: "./test-results/screenshots/invalid-search-results.png",
    });

    // Verify search results page shows no products or shows "no results" message
    // Note: This site may still show "Searched Products" header but with no actual products
    await expect(page.locator(".features_items")).toBeVisible({
      timeout: 10000,
    });

    // Count products found
    const productCount = await page.locator(".product-image-wrapper").count();
    console.log(
      `Found ${productCount} products for invalid search term: ${invalidKeyword}`
    );
    // Verify the behavior (few or no products for invalid search)
    expect(productCount).toBeLessThan(3);
  });

  /**
   * VALID TEST CASE: Add to Cart Functionality
   * Test ID: FUNC-003
   * Description: Verifies a user can add a product to the cart
   * Expected Result: Product is added to cart and visible on cart page
   */
  test("VALID: User can add product to cart", async ({ page }) => {
    console.log("Testing add to cart functionality...");

    // Go to products page
    await page.locator('a[href="/products"]').first().click();

    // Wait for products to load
    await page.waitForSelector(".features_items", { timeout: 10000 });

    // Get product name before adding to cart for verification
    const productName = await page
      .locator(".product-image-wrapper")
      .first()
      .locator(".single-products p")
      .nth(0)
      .textContent();
    console.log(`Adding product to cart: ${productName}`);

    // Hover over the first product
    const firstProduct = page.locator(".product-image-wrapper").first();
    await firstProduct.hover();

    // Take screenshot of hover state
    await page.screenshot({
      path: "./test-results/screenshots/product-hover.png",
    });

    // Click the add to cart button
    await page.locator(".product-overlay .add-to-cart").first().click();

    // Take screenshot of add to cart modal
    await page.screenshot({
      path: "./test-results/screenshots/add-to-cart-modal.png",
    });

    // Click continue shopping
    await page.locator(".modal-footer button").click();

    // Verify product was added by going to cart page
    await page.locator('a[href="/view_cart"]').first().click();

    // Take screenshot of cart page
    await page.screenshot({ path: "./test-results/screenshots/cart-page.png" });

    // Verify cart page loaded with item
    await expect(page.locator("#cart_info")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".cart_description")).toBeVisible({
      timeout: 10000,
    });

    // Verify at least one product is in cart
    const cartItemCount = await page.locator(".cart_product").count();
    console.log(`Number of items in cart: ${cartItemCount}`);
    expect(cartItemCount).toBeGreaterThan(0);
  });

  /**
   * INVALID TEST CASE: User Registration
   * Test ID: FUNC-004
   * Description: Tests registration with existing email (invalid case)
   * Expected Result: System should show error message about existing email
   */
  test("INVALID: User registration with existing email", async ({ page }) => {
    console.log("Testing registration with existing email...");

    // Click Signup/Login link
    await page.locator('a[href="/login"]').click();

    // Wait for signup form to be visible
    await page.waitForSelector('div[class="signup-form"]', { timeout: 10000 });

    // Take screenshot of signup form
    await page.screenshot({
      path: "./test-results/screenshots/signup-form.png",
    });

    // Fill signup form with known existing email
    const existingEmail = "test@test.com"; // Using this as it's likely already registered
    await page.locator('input[data-qa="signup-name"]').fill("Existing User");
    await page.locator('input[data-qa="signup-email"]').fill(existingEmail);
    await page.locator('button[data-qa="signup-button"]').click();

    // Take screenshot of error message
    await page.screenshot({
      path: "./test-results/screenshots/existing-email-error.png",
    });

    // Verify error message about existing email is shown
    await expect(page.locator(".signup-form")).toContainText(
      "Email Address already exist!",
      { timeout: 10000 }
    );
    console.log("Successfully verified error message for existing email");
  });
});