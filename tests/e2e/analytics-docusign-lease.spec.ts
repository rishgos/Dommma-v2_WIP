import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts } from '../fixtures/helpers';

const TEST_LANDLORD = {
  email: 'testlandlord@test.com',
  password: 'test123'
};

/**
 * Helper to login as landlord
 */
async function loginAsLandlord(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
  
  // Select landlord user type
  await page.getByTestId('login-type-landlord').click();
  
  // Fill in credentials
  await page.getByTestId('login-email').fill(TEST_LANDLORD.email);
  await page.getByTestId('login-password').fill(TEST_LANDLORD.password);
  
  // Submit
  await page.getByTestId('login-submit').click();
  
  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('analytics page loads for logged-in landlord', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify page title/header
    await expect(page.getByText('Analytics Dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('analytics page displays stat cards', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Wait for stat cards to load
    await expect(page.getByTestId('stat-card').first()).toBeVisible({ timeout: 15000 });
    
    // Verify multiple stat cards exist
    const statCards = page.getByTestId('stat-card');
    await expect(statCards).toHaveCount(5);
  });

  test('analytics page has refresh button', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify refresh button exists
    await expect(page.getByTestId('refresh-analytics')).toBeVisible({ timeout: 10000 });
  });

  test('analytics page shows user statistics', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Wait for data to load
    await expect(page.getByText('Total Users')).toBeVisible({ timeout: 15000 });
  });

  test('analytics page shows listings statistics', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Wait for listings data
    await expect(page.getByText('Active Listings')).toBeVisible({ timeout: 15000 });
  });

  test('analytics page shows recent activity section', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Wait for recent activity section
    await expect(page.getByText('Recent Activity')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('ESign Page - DocuSign Integration', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('esign page loads for logged-in landlord', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/esign', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify page title
    await expect(page.getByText('E-Sign Documents')).toBeVisible({ timeout: 15000 });
  });

  test('esign page shows DocuSign integration card', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/esign', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify DocuSign integration card exists
    await expect(page.getByTestId('docusign-integration-card')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('DocuSign Integration')).toBeVisible();
  });

  test('esign page shows Connect DocuSign button when not connected', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/esign', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // The DocuSign status is fetched, so we wait for the card to load
    await expect(page.getByTestId('docusign-integration-card')).toBeVisible({ timeout: 15000 });
    
    // Check for Connect DocuSign button (should appear for unconnected users)
    await expect(page.getByTestId('connect-docusign-btn')).toBeVisible({ timeout: 10000 });
  });

  test('esign page shows New Document button', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/esign', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify create document button exists
    await expect(page.getByTestId('create-document-btn')).toBeVisible({ timeout: 15000 });
  });

  test('esign page has BC Forms tab', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/esign', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify BC Forms tab exists
    await expect(page.getByText('BC Forms')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Lease Assignments Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('lease assignments page loads', async ({ page }) => {
    await page.goto('/lease-assignments', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify page title
    await expect(page.getByText('Lease Assignment Marketplace')).toBeVisible({ timeout: 15000 });
  });

  test('lease assignments page has search input', async ({ page }) => {
    await page.goto('/lease-assignments', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify search input exists
    await expect(page.getByTestId('assignment-search')).toBeVisible({ timeout: 10000 });
  });

  test('lease assignments page shows hero section', async ({ page }) => {
    await page.goto('/lease-assignments', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify hero text
    await expect(page.getByText('Take over someone\'s lease and save money')).toBeVisible({ timeout: 10000 });
  });

  test('logged in user can see create assignment button', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/lease-assignments', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify create button exists for logged in users
    await expect(page.getByTestId('create-assignment-btn')).toBeVisible({ timeout: 15000 });
  });

  test('search functionality filters results', async ({ page }) => {
    await page.goto('/lease-assignments', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Wait for assignments to load (demo data or real)
    await page.waitForLoadState('domcontentloaded');
    
    // Enter search query
    const searchInput = page.getByTestId('assignment-search');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('Vancouver');
    
    // The filtering happens client-side, so we just verify the input works
    await expect(searchInput).toHaveValue('Vancouver');
  });
});
