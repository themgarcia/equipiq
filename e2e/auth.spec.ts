import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Login Flow", () => {
    test("should display login form by default", async ({ page }) => {
      await page.goto("/auth");
      
      // Should show login tab as active
      await expect(page.getByRole("tab", { name: /login/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("should show validation errors for empty fields", async ({ page }) => {
      await page.goto("/auth");
      
      await page.getByRole("button", { name: /sign in/i }).click();
      
      // Should show validation messages
      await expect(page.getByText(/email is required|invalid email/i)).toBeVisible();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/auth");
      
      await page.getByLabel(/email/i).fill("invalid@example.com");
      await page.getByLabel(/password/i).fill("wrongpassword123");
      await page.getByRole("button", { name: /sign in/i }).click();
      
      // Should show error toast or message
      await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 10000 });
    });

    test("should navigate to forgot password", async ({ page }) => {
      await page.goto("/auth");
      
      await page.getByRole("button", { name: /forgot password/i }).click();
      
      // Should show forgot password form
      await expect(page.getByText(/reset.*password|password.*reset/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /send.*reset|reset.*link/i })).toBeVisible();
    });
  });

  test.describe("Signup Flow", () => {
    test("should navigate to signup tab", async ({ page }) => {
      await page.goto("/auth");
      
      await page.getByRole("tab", { name: /sign up|register/i }).click();
      
      // Should show signup form (step 1)
      await expect(page.getByLabel(/full name|name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
    });

    test("should validate signup step 1 fields", async ({ page }) => {
      await page.goto("/auth");
      await page.getByRole("tab", { name: /sign up|register/i }).click();
      
      // Try to proceed without filling fields
      await page.getByRole("button", { name: /next|continue/i }).click();
      
      // Should show validation errors
      await expect(page.getByText(/required|invalid/i)).toBeVisible();
    });

    test("should progress through signup steps", async ({ page }) => {
      await page.goto("/auth");
      await page.getByRole("tab", { name: /sign up|register/i }).click();
      
      // Fill step 1
      await page.getByLabel(/full name|name/i).fill("Test User");
      await page.getByLabel(/email/i).fill(`test-${Date.now()}@example.com`);
      
      const passwordFields = page.getByLabel(/password/i);
      await passwordFields.first().fill("TestPassword123!");
      await passwordFields.last().fill("TestPassword123!");
      
      await page.getByRole("button", { name: /next|continue/i }).click();
      
      // Should show step 2 (company info)
      await expect(page.getByLabel(/company.*name|organization/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Authenticated User", () => {
    test("should redirect authenticated user from auth page", async ({ page }) => {
      // User is already authenticated via storage state
      await page.goto("/auth");
      
      // Should redirect to dashboard or home
      await expect(page).toHaveURL(/\/(dashboard|equipment|$)/, { timeout: 10000 });
    });

    test("should show user is logged in on dashboard", async ({ page }) => {
      await page.goto("/dashboard");
      
      // Should be on dashboard (not redirected to auth)
      await expect(page).toHaveURL(/dashboard/);
      
      // Should show some dashboard content
      await expect(page.getByRole("heading")).toBeVisible();
    });
  });
});
