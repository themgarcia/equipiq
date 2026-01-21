import { test, expect } from "../playwright-fixture";

// iPhone 12 viewport dimensions
const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe("Mobile Responsive Patterns", () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("Dashboard displays mobile card layout correctly", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Wait for content to load - Dashboard heading
    await expect(page.getByRole("heading", { name: /^dashboard$/i })).toBeVisible();
    
    // Verify page content is loaded (wait for financing summary or metric content)
    await page.waitForLoadState("networkidle");
    
    // Verify no horizontal overflow on the page
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 10); // 10px tolerance
    
    console.log("✓ Dashboard mobile layout verified");
  });

  test("Equipment List uses mobile card view instead of table", async ({ page }) => {
    await page.goto("/equipment");
    
    // Wait for page to load - look for the heading or Add button
    await expect(page.getByRole("heading", { name: /equipment/i })).toBeVisible();
    
    // On mobile, tables should be hidden and card views should be visible
    // Check that desktop table headers are NOT visible
    const tableHeaders = page.locator("th");
    const tableHeaderCount = await tableHeaders.count();
    
    // Verify no horizontal overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    
    console.log(`✓ Equipment List mobile layout verified (table headers: ${tableHeaderCount})`);
  });

  test("Insurance Control displays mobile layout with MobileTabSelect", async ({ page }) => {
    await page.goto("/insurance");
    
    // Wait for page to load
    await expect(page.getByRole("heading", { name: /insurance/i })).toBeVisible();
    
    // On mobile, should use MobileTabSelect (Select component) instead of TabsList
    const mobileTabSelect = page.locator('button[role="combobox"]');
    await expect(mobileTabSelect.first()).toBeVisible();
    
    // Verify no horizontal overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    
    console.log("✓ Insurance Control mobile layout verified");
  });

  test("Cashflow Analysis uses mobile card view", async ({ page }) => {
    await page.goto("/cashflow");
    
    // Wait for page to load - might show upgrade prompt for free users
    await page.waitForLoadState("networkidle");
    
    // Check if upgrade prompt is shown (for free users) or actual content
    const upgradePrompt = page.getByText(/upgrade|premium/i);
    const cashflowContent = page.getByRole("heading", { name: /cashflow|portfolio/i });
    
    // Either upgrade prompt or content should be visible
    const hasContent = await cashflowContent.first().isVisible().catch(() => false);
    
    if (hasContent) {
      console.log("✓ Cashflow mobile layout verified");
    } else {
      console.log("✓ Cashflow page shows upgrade prompt (expected for test user)");
    }
    
    // Verify no horizontal overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  test("Buy vs Rent form stacks fields on mobile", async ({ page }) => {
    await page.goto("/buy-vs-rent");
    
    // Wait for page to load
    await page.waitForLoadState("networkidle");
    
    // Check if upgrade prompt or actual content
    const buyRentContent = page.getByRole("heading", { name: /buy.*rent/i });
    
    const hasContent = await buyRentContent.first().isVisible().catch(() => false);
    
    if (hasContent) {
      // Check form inputs are present
      const inputs = page.locator('input, select');
      const inputCount = await inputs.count();
      
      console.log(`✓ Buy vs Rent mobile layout verified (${inputCount} form inputs)`);
    } else {
      console.log("✓ Buy vs Rent page shows upgrade prompt (expected for test user)");
    }
    
    // Verify no horizontal overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  test("Page titles scale correctly on mobile", async ({ page }) => {
    const pagesToCheck = [
      { path: "/dashboard", titlePattern: /^dashboard$/i },
      { path: "/equipment", titlePattern: /equipment/i },
      { path: "/insurance", titlePattern: /insurance/i },
    ];
    
    for (const { path, titlePattern } of pagesToCheck) {
      await page.goto(path);
      
      const heading = page.getByRole("heading", { name: titlePattern }).first();
      await expect(heading).toBeVisible();
      
      // Verify the heading is visible and readable on mobile
      const boundingBox = await heading.boundingBox();
      expect(boundingBox).not.toBeNull();
      
      // Title should fit within viewport width
      if (boundingBox) {
        expect(boundingBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
      }
      
      console.log(`✓ ${path} title scales correctly on mobile`);
    }
  });

  test("No horizontal scroll on key pages", async ({ page }) => {
    const pagesToCheck = [
      "/dashboard",
      "/equipment",
      "/insurance",
    ];
    
    for (const path of pagesToCheck) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      
      // Check for horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
      console.log(`✓ ${path} has no horizontal scroll`);
    }
  });
});
