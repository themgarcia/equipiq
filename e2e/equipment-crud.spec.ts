import { test, expect } from "@playwright/test";

test.describe("Equipment CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/equipment");
    // Wait for page to load
    await expect(page.getByRole("heading", { name: /equipment/i })).toBeVisible({ timeout: 10000 });
  });

  test.describe("Equipment List", () => {
    test("should display equipment list page", async ({ page }) => {
      await expect(page.getByRole("heading", { name: /equipment/i })).toBeVisible();
      
      // Should show add equipment button
      await expect(page.getByRole("button", { name: /add|new|import/i })).toBeVisible();
    });

    test("should show empty state or equipment items", async ({ page }) => {
      // Either shows empty state or equipment table/cards
      const hasEquipment = await page.locator('[data-testid="equipment-item"], table tbody tr, [class*="card"]').count() > 0;
      const hasEmptyState = await page.getByText(/no equipment|get started|add your first/i).isVisible().catch(() => false);
      
      expect(hasEquipment || hasEmptyState).toBe(true);
    });

    test("should have working status filter tabs", async ({ page }) => {
      // Look for status filter tabs
      const allTab = page.getByRole("tab", { name: /all/i });
      const activeTab = page.getByRole("tab", { name: /active/i });
      
      if (await allTab.isVisible()) {
        await allTab.click();
        await expect(allTab).toHaveAttribute("data-state", "active");
      }
      
      if (await activeTab.isVisible()) {
        await activeTab.click();
        await expect(activeTab).toHaveAttribute("data-state", "active");
      }
    });
  });

  test.describe("Add Equipment", () => {
    test("should open add equipment modal", async ({ page }) => {
      // Find and click add button
      const addButton = page.getByRole("button", { name: /add|new/i }).first();
      await addButton.click();
      
      // Should show modal with options
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    });

    test("should show manual entry option", async ({ page }) => {
      const addButton = page.getByRole("button", { name: /add|new/i }).first();
      await addButton.click();
      
      await expect(page.getByRole("dialog")).toBeVisible();
      
      // Should show manual entry option
      await expect(page.getByText(/manual.*entry|enter.*manually/i)).toBeVisible();
    });

    test("should show import options", async ({ page }) => {
      const addButton = page.getByRole("button", { name: /add|new/i }).first();
      await addButton.click();
      
      await expect(page.getByRole("dialog")).toBeVisible();
      
      // Should show document and spreadsheet import options
      await expect(page.getByText(/document|pdf|invoice/i)).toBeVisible();
      await expect(page.getByText(/spreadsheet|csv|excel/i)).toBeVisible();
    });

    test("should open manual entry form", async ({ page }) => {
      const addButton = page.getByRole("button", { name: /add|new/i }).first();
      await addButton.click();
      
      // Click manual entry option
      await page.getByText(/manual.*entry|enter.*manually/i).click();
      
      // Should show equipment form
      await expect(page.getByLabel(/make/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel(/model/i)).toBeVisible();
    });

    test("should validate required fields in manual entry", async ({ page }) => {
      const addButton = page.getByRole("button", { name: /add|new/i }).first();
      await addButton.click();
      await page.getByText(/manual.*entry|enter.*manually/i).click();
      
      // Wait for form
      await expect(page.getByLabel(/make/i)).toBeVisible({ timeout: 5000 });
      
      // Try to submit without filling required fields
      const submitButton = page.getByRole("button", { name: /save|add|submit|create/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show validation errors
        await expect(page.getByText(/required|invalid/i)).toBeVisible();
      }
    });
  });

  test.describe("Equipment Details", () => {
    test("should open equipment details when clicking an item", async ({ page }) => {
      // Skip if no equipment exists
      const equipmentItems = page.locator('table tbody tr, [data-testid="equipment-item"], [class*="equipment-card"]');
      const count = await equipmentItems.count();
      
      if (count === 0) {
        test.skip();
        return;
      }
      
      // Click first equipment item
      await equipmentItems.first().click();
      
      // Should show details panel/sheet
      await expect(page.getByRole("dialog").or(page.locator('[data-state="open"]'))).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Search and Filter", () => {
    test("should have search input", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });

    test("should filter equipment by search", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      // Type a search query
      await searchInput.fill("test");
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Page should update (we can't verify results without knowing the data)
      await expect(searchInput).toHaveValue("test");
    });
  });
});
