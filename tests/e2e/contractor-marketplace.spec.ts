import { test, expect } from '@playwright/test';

/**
 * Tests for Contractor Marketplace - Job Posting and Bidding workflow
 * Features: Find Contractors tab, Browse Jobs tab, Post a Job button, Job cards
 */

test.describe('Contractor Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    // Login as renter
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByText('Renter', { exact: true }).click();
    await page.locator('input[type="email"]').fill('test_renter@example.com');
    await page.locator('input[type="password"]').fill('test123456');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
  });

  test('should display Find Contractors and Browse Jobs tabs', async ({ page }) => {
    // Navigate to contractor marketplace
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Verify tabs are present
    await expect(page.getByText('Find Contractors', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Browse Jobs', { exact: true })).toBeVisible();
  });

  test('should show Post a Job button for non-contractor users', async ({ page }) => {
    // Navigate to contractor marketplace
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Verify Post a Job button is visible (since user is a renter, not contractor)
    const postJobBtn = page.getByTestId('post-job-btn');
    await expect(postJobBtn).toBeVisible();
  });

  test('should display category filters', async ({ page }) => {
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Verify category buttons are present
    await expect(page.getByText('All')).toBeVisible();
    await expect(page.getByTestId('category-plumbing')).toBeVisible();
    await expect(page.getByTestId('category-electrical')).toBeVisible();
    await expect(page.getByTestId('category-painting')).toBeVisible();
  });

  test('should switch to Browse Jobs tab', async ({ page }) => {
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Click Browse Jobs tab
    await page.getByText('Browse Jobs', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    
    // The title should change
    const heading = page.getByRole('heading', { name: /Browse Jobs/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should open Job Post Form when clicking Post a Job', async ({ page }) => {
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Click Post a Job button
    await page.getByTestId('post-job-btn').click();
    
    // Verify Job Post Form modal opens
    const formModal = page.getByTestId('job-post-form');
    await expect(formModal).toBeVisible();
    
    // Verify form has category buttons
    await expect(page.getByTestId('category-btn-plumbing')).toBeVisible();
    
    // Verify form has title input
    await expect(page.getByTestId('job-title-input')).toBeVisible();
  });

  test('should display search input for contractors', async ({ page }) => {
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Verify search input is visible
    const searchInput = page.getByTestId('contractor-search-input');
    await expect(searchInput).toBeVisible();
  });

  test('should display Top Contractors leaderboard', async ({ page }) => {
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    
    // Verify Top Contractors section is visible
    await expect(page.getByText('Top Contractors')).toBeVisible();
  });
});

test.describe('Job Post Form', () => {
  test.beforeEach(async ({ page }) => {
    // Login as renter
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByText('Renter', { exact: true }).click();
    await page.locator('input[type="email"]').fill('test_renter@example.com');
    await page.locator('input[type="password"]').fill('test123456');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
    
    // Navigate to marketplace and open form
    await page.click('text=Find Contractors');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('post-job-btn').click();
    await expect(page.getByTestId('job-post-form')).toBeVisible();
  });

  test('should have step progress indicator', async ({ page }) => {
    // Verify step indicator shows Step 1 of 3
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
  });

  test('should navigate through form steps', async ({ page }) => {
    // Step 1: Select category and title
    await page.getByTestId('category-btn-plumbing').click();
    await page.getByTestId('job-title-input').fill('Test Job Title');
    
    // Click Continue
    await page.getByRole('button', { name: /Continue/i }).click();
    
    // Step 2 should be visible
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
    await expect(page.getByTestId('job-description-input')).toBeVisible();
  });

  test('should require category and title to proceed', async ({ page }) => {
    // Try to click Continue without filling fields
    const continueBtn = page.getByRole('button', { name: /Continue/i });
    
    // Button should be disabled
    await expect(continueBtn).toBeDisabled();
    
    // Fill category
    await page.getByTestId('category-btn-plumbing').click();
    
    // Still disabled without title
    await expect(continueBtn).toBeDisabled();
    
    // Fill title
    await page.getByTestId('job-title-input').fill('Test Job');
    
    // Now enabled
    await expect(continueBtn).toBeEnabled();
  });

  test('should close form when clicking backdrop', async ({ page }) => {
    // Click the backdrop (outside the modal)
    await page.locator('.bg-black\\/50').click();
    
    // Form should close
    await expect(page.getByTestId('job-post-form')).not.toBeVisible();
  });
});
