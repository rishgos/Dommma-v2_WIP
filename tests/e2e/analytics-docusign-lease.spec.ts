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
  await page.getByTestId('user-type-landlord').click();
  
  // Fill in credentials
  await page.getByTestId('email-input').fill(TEST_LANDLORD.email);
  await page.getByTestId('password-input').fill(TEST_LANDLORD.password);
  
  // Submit and wait for dashboard to load
  await page.getByTestId('submit-btn').click();
  
  // Wait for sidebar to appear (indicates successful login)
  await expect(page.getByTestId('dashboard-sidebar')).toBeVisible({ timeout: 15000 });
}

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('analytics page loads with stat cards for logged-in landlord', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify page title/header
    await expect(page.getByText('Analytics Dashboard')).toBeVisible({ timeout: 15000 });
    
    // Wait for stat cards to load
    await expect(page.getByTestId('stat-card').first()).toBeVisible({ timeout: 15000 });
    
    // Verify multiple stat cards exist
    const statCards = page.getByTestId('stat-card');
    const count = await statCards.count();
    expect(count).toBe(5);
  });

  test('analytics page has refresh button and shows statistics', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify refresh button exists
    await expect(page.getByTestId('refresh-analytics')).toBeVisible({ timeout: 15000 });
    
    // Wait for data to load
    await expect(page.getByText('Total Users')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Active Listings')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('ESign Page - DocuSign Integration', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('esign page loads and shows DocuSign integration card', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/esign', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify page title
    await expect(page.getByText('E-Sign Documents')).toBeVisible({ timeout: 15000 });
    
    // Verify DocuSign integration card exists
    await expect(page.getByTestId('docusign-integration-card')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('DocuSign Integration')).toBeVisible();
  });

  test('esign page shows Connect DocuSign button and BC Forms tab', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/esign', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // The DocuSign status is fetched, so we wait for the card to load
    await expect(page.getByTestId('docusign-integration-card')).toBeVisible({ timeout: 15000 });
    
    // Check for Connect DocuSign button (should appear for unconnected users)
    await expect(page.getByTestId('connect-docusign-btn')).toBeVisible({ timeout: 10000 });
    
    // Verify create document button exists
    await expect(page.getByTestId('create-document-btn')).toBeVisible({ timeout: 10000 });
    
    // Verify BC Forms tab exists
    await expect(page.getByText('BC Forms')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Lease Assignments Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('lease assignments page loads with hero section', async ({ page }) => {
    await page.goto('/lease-assignments', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify page title
    await expect(page.getByText('Lease Assignment Marketplace')).toBeVisible({ timeout: 15000 });
    
    // Verify hero text
    await expect(page.getByText('Take over someone\'s lease and save money')).toBeVisible({ timeout: 10000 });
  });

  test('lease assignments page has search input', async ({ page }) => {
    await page.goto('/lease-assignments', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify search input exists
    await expect(page.getByTestId('assignment-search')).toBeVisible({ timeout: 10000 });
  });

  test('logged in user can see create assignment button', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto('/lease-assignments', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify create button exists for logged in users
    await expect(page.getByTestId('create-assignment-btn')).toBeVisible({ timeout: 15000 });
  });
});
