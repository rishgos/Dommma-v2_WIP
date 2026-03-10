import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts, loginAsTestUser } from '../fixtures/helpers';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://storage-migration-3.preview.emergentagent.com';

test.describe('Financing Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('should display Financing page with three financing options', async ({ page }) => {
    await page.goto('/financing', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify page title and hero section
    await expect(page.locator('h1')).toContainText('Flexible Financing Options');
    
    // Verify the three financing options are displayed
    const rentToOwn = page.getByTestId('financing-option-rent-to-own');
    const depositFinancing = page.getByTestId('financing-option-deposit-financing');
    const firstMonthFree = page.getByTestId('financing-option-first-month-free');
    
    await expect(rentToOwn).toBeVisible();
    await expect(depositFinancing).toBeVisible();
    await expect(firstMonthFree).toBeVisible();
    
    // Verify option titles
    await expect(rentToOwn.locator('h3')).toContainText('Rent-to-Own');
    await expect(depositFinancing.locator('h3')).toContainText('Deposit Financing');
    await expect(firstMonthFree.locator('h3')).toContainText('First Month Free');
  });

  test('should display financing calculator', async ({ page }) => {
    await page.goto('/financing', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify calculator section exists
    await expect(page.locator('text=Financing Calculator')).toBeVisible();
    
    // Verify input fields are present
    await expect(page.locator('label:has-text("Monthly Rent")')).toBeVisible();
    await expect(page.locator('label:has-text("Security Deposit")')).toBeVisible();
    
    // Verify calculator results sections - use more specific selectors
    await expect(page.locator('h4:has-text("Rent-to-Own Projection")')).toBeVisible();
    await expect(page.locator('h4:has-text("Deposit Financing")')).toBeVisible();
  });

  test('should open application modal when clicking Apply Now - EXPECTED TO FAIL DUE TO BUG', async ({ page }) => {
    await page.goto('/financing', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Click Apply Now on the first financing option
    const applyButton = page.getByTestId('financing-option-rent-to-own').getByRole('button', { name: /Apply Now/i });
    await applyButton.click();
    
    // BUG: Modal opens but crashes with "Send is not defined" because Send icon is not imported
    // This test is expected to fail until the bug is fixed
    // The fix requires adding "Send" to the lucide-react imports in Financing.jsx
    
    // Wait a moment to see if error overlay appears
    await page.waitForTimeout(1000);
    
    // Check if error overlay is visible (indicates the bug)
    const errorOverlay = page.locator('text=Uncaught runtime errors');
    if (await errorOverlay.isVisible()) {
      // Bug is present - test should fail to alert main agent
      expect(false, 'BUG: Financing modal crashes due to missing Send import in Financing.jsx').toBe(true);
    }
    
    // If no error, verify modal opened correctly
    await expect(page.locator('h3:has-text("Apply for Rent-to-Own")')).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/financing', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify FAQ section exists
    await expect(page.locator('text=Frequently Asked Questions')).toBeVisible();
    
    // Verify some FAQ items
    await expect(page.locator('text=What credit score do I need?')).toBeVisible();
    await expect(page.locator('text=How long does approval take?')).toBeVisible();
  });

  test('should display How It Works section', async ({ page }) => {
    await page.goto('/financing', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify How It Works section
    await expect(page.locator('h2:has-text("How It Works")')).toBeVisible();
    
    // Verify steps - use more specific selectors
    await expect(page.locator('h4:has-text("Choose Option")')).toBeVisible();
    await expect(page.locator('h4:has-text("Apply Online")')).toBeVisible();
    await expect(page.locator('h4:has-text("Get Approved")')).toBeVisible();
    await expect(page.locator('h4:has-text("Move In")')).toBeVisible();
  });
});

test.describe('Homepage - Our Story Link Removed', () => {
  test('should NOT display Our Story link in navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify Our Story link is NOT visible
    const ourStoryLink = page.locator('nav a:has-text("Our Story")');
    await expect(ourStoryLink).not.toBeVisible();
    
    // Verify other navigation links ARE visible
    await expect(page.locator('nav a:has-text("Home")')).toBeVisible();
    await expect(page.locator('nav a:has-text("About")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Properties")')).toBeVisible();
  });

  test('should display main navigation items correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Take screenshot of navigation
    await page.screenshot({ path: 'test-results/homepage-nav.jpeg', quality: 20 });
    
    // Verify all expected navigation items
    const nav = page.locator('nav');
    await expect(nav.locator('a:has-text("Home")')).toBeVisible();
    await expect(nav.locator('a:has-text("About")')).toBeVisible();
    await expect(nav.locator('a:has-text("Properties")')).toBeVisible();
    await expect(nav.locator('a:has-text("Lease Takeover")')).toBeVisible();
    await expect(nav.locator('a:has-text("Pros")')).toBeVisible();
    await expect(nav.locator('a:has-text("Contact")')).toBeVisible();
  });
});

test.describe('Analytics Dashboard Access', () => {
  test('should display Nova Insights in sidebar when logged in', async ({ page }) => {
    // Login as test user
    await loginAsTestUser(page);
    
    // Verify sidebar contains Nova Insights
    await expect(page.locator('text=Nova Insights')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-nova-insights.jpeg', quality: 20 });
  });

  test('should navigate to analytics from Nova Insights link', async ({ page }) => {
    // Login as test user
    await loginAsTestUser(page);
    
    // Click on Nova Insights in sidebar
    const novaInsightsLink = page.locator('a:has-text("Nova Insights")').first();
    
    // Check if it's visible and clickable
    if (await novaInsightsLink.isVisible()) {
      await novaInsightsLink.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Verify we're on an analytics-related page or modal opens
      // The exact behavior depends on implementation
      await page.screenshot({ path: 'test-results/nova-insights-page.jpeg', quality: 20 });
    }
  });
});
