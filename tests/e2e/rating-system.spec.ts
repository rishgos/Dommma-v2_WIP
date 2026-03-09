import { test, expect } from '@playwright/test';

/**
 * Tests for Star Rating System components
 * Features: StarRating component, RatingDisplay, UserRatingCard
 */

test.describe('Star Rating Components', () => {
  test.beforeEach(async ({ page }) => {
    // Login as renter
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByText('Renter', { exact: true }).click();
    await page.locator('input[type="email"]').fill('test_renter@example.com');
    await page.locator('input[type="password"]').fill('test123456');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
  });

  test('should display star ratings on contractor cards', async ({ page }) => {
    // Navigate to contractor marketplace
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Wait for contractors to load and check for star ratings
    // Stars are rendered as SVG elements with yellow fill for rated stars
    const contractors = page.locator('[data-testid^="contractor-card-"]');
    
    // If there are contractors, check that star ratings are visible
    const count = await contractors.count();
    if (count > 0) {
      // Stars should be present (they use Star icon from lucide-react)
      const firstCard = contractors.first();
      // The card shows stars with fill-yellow-400 class
      await expect(firstCard.locator('svg.text-yellow-400').first()).toBeVisible();
    }
  });

  test('should display rating count in parentheses', async ({ page }) => {
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Check for rating counts like "(0)" or "(5)" next to stars
    const contractors = page.locator('[data-testid^="contractor-card-"]');
    const count = await contractors.count();
    
    if (count > 0) {
      // Rating count format is usually "(N)"
      await expect(page.locator('text=/(\\d+)/').first()).toBeVisible();
    }
  });
});

test.describe('Top Contractors Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByText('Renter', { exact: true }).click();
    await page.locator('input[type="email"]').fill('test_renter@example.com');
    await page.locator('input[type="password"]').fill('test123456');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
  });

  test('should display Top Contractors section with rankings', async ({ page }) => {
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Verify Top Contractors header
    await expect(page.getByText('Top Contractors')).toBeVisible();
    
    // Verify View All link
    await expect(page.getByText('View All')).toBeVisible();
  });

  test('should show rating and job count for top contractors', async ({ page }) => {
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Look for "Jobs" text in leaderboard (shows completed jobs count)
    const jobsText = page.locator('text=/\\d+\\s*jobs/i');
    await expect(jobsText.first()).toBeVisible({ timeout: 5000 });
  });
});
