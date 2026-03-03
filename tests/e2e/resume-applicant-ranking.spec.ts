import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts } from '../fixtures/helpers';

const TEST_LANDLORD = {
  email: 'testlandlord@test.com',
  password: 'test123'
};

const TEST_RENTER = {
  email: 'testrenter@test.com',
  password: 'test123'
};

/**
 * Helper to login as a user type and wait for dashboard
 */
async function loginAndWaitForDashboard(page, email: string, password: string, userType: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
  
  // Select user type
  await page.getByTestId(`user-type-${userType}`).click();
  
  // Fill credentials
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  
  // Submit and wait for dashboard
  await page.getByTestId('submit-btn').click();
  await expect(page.getByTestId('dashboard-sidebar')).toBeVisible({ timeout: 15000 });
}

/**
 * Helper to navigate via sidebar link text
 */
async function navigateViaSidebar(page, linkText: string) {
  const link = page.getByText(linkText, { exact: true });
  await link.click();
  await page.waitForLoadState('domcontentloaded');
}

test.describe('My Resume Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('my resume page loads for logged-in renter via sidebar', async ({ page }) => {
    // Login as renter
    await loginAndWaitForDashboard(page, TEST_RENTER.email, TEST_RENTER.password, 'renter');
    
    // Navigate via sidebar
    await navigateViaSidebar(page, 'My Resume');
    
    // Verify page loads - check for header with "Reusable profile" text
    await expect(page.getByText('Reusable profile for rental applications')).toBeVisible({ timeout: 15000 });
  });

  test('my resume page shows create button or edit button', async ({ page }) => {
    await loginAndWaitForDashboard(page, TEST_RENTER.email, TEST_RENTER.password, 'renter');
    await navigateViaSidebar(page, 'My Resume');
    
    // Should see either Create Resume button or Edit Resume button
    const createBtn = page.getByTestId('create-resume-btn');
    const editBtn = page.getByTestId('edit-resume-btn');
    
    await expect(createBtn.or(editBtn)).toBeVisible({ timeout: 15000 });
  });

  test('my resume page shows completeness score', async ({ page }) => {
    await loginAndWaitForDashboard(page, TEST_RENTER.email, TEST_RENTER.password, 'renter');
    await navigateViaSidebar(page, 'My Resume');
    
    // Completeness score should be visible (e.g., "0% Complete" or "80% Complete")
    await expect(page.getByText(/\d+%\s*Complete/i)).toBeVisible({ timeout: 15000 });
  });

  test('my resume empty state shows create resume option', async ({ page }) => {
    // Use unique email for clean state
    const uniqueEmail = `test-res-${Date.now()}@example.com`;
    
    await loginAndWaitForDashboard(page, uniqueEmail, 'test123', 'renter');
    await navigateViaSidebar(page, 'My Resume');
    
    // For new user, should see create resume button
    const createBtn = page.getByTestId('create-resume-btn');
    await expect(createBtn).toBeVisible({ timeout: 15000 });
  });

  test('clicking create resume shows edit form', async ({ page }) => {
    // Use existing renter who already has no resume (test-res user)
    const uniqueEmail = `test-create-${Date.now()}@example.com`;
    
    await loginAndWaitForDashboard(page, uniqueEmail, 'test123', 'renter');
    
    // Navigate via sidebar  
    await navigateViaSidebar(page, 'My Resume');
    
    // Verify page loads and create button is visible
    const createBtn = page.getByTestId('create-resume-btn');
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    
    // Click via JavaScript to avoid overlay issues
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="create-resume-btn"]');
      if (btn) btn.click();
    });
    
    // Should see Save button indicating edit mode
    await expect(page.getByTestId('save-resume-btn')).toBeVisible({ timeout: 10000 });
    
    // Contact Information section should be visible
    await expect(page.getByText('Contact Information')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Applicant Ranking Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('applicant ranking page loads for landlord via sidebar', async ({ page }) => {
    await loginAndWaitForDashboard(page, TEST_LANDLORD.email, TEST_LANDLORD.password, 'landlord');
    await navigateViaSidebar(page, 'AI Ranking');
    
    // Verify page loads with AI heading
    await expect(page.getByText('AI Applicant Ranking')).toBeVisible({ timeout: 15000 });
  });

  test('applicant ranking page shows AI description', async ({ page }) => {
    await loginAndWaitForDashboard(page, TEST_LANDLORD.email, TEST_LANDLORD.password, 'landlord');
    await navigateViaSidebar(page, 'AI Ranking');
    
    // Verify AI description text
    await expect(page.getByText('Nova AI analyzes applicants based on income, employment, and rental history')).toBeVisible({ timeout: 15000 });
  });

  test('applicant ranking page shows filter options', async ({ page }) => {
    await loginAndWaitForDashboard(page, TEST_LANDLORD.email, TEST_LANDLORD.password, 'landlord');
    await navigateViaSidebar(page, 'AI Ranking');
    
    // Verify filter buttons exist
    await expect(page.getByText('All Applicants')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Highly Qualified')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Needs Review')).toBeVisible({ timeout: 15000 });
  });

  test('applicant ranking page shows property selector', async ({ page }) => {
    await loginAndWaitForDashboard(page, TEST_LANDLORD.email, TEST_LANDLORD.password, 'landlord');
    await navigateViaSidebar(page, 'AI Ranking');
    
    // Verify property selector exists
    await expect(page.getByText('Select Property')).toBeVisible({ timeout: 15000 });
  });

  test('applicant ranking page shows empty state or applicant cards after property selection', async ({ page }) => {
    await loginAndWaitForDashboard(page, TEST_LANDLORD.email, TEST_LANDLORD.password, 'landlord');
    await navigateViaSidebar(page, 'AI Ranking');
    
    // Wait for page content to load
    await expect(page.getByText('Select Property')).toBeVisible({ timeout: 15000 });
    
    // Either shows empty state or applicant card - use first() to avoid strict mode
    const emptyState = page.getByRole('heading', { name: 'No Applicants Yet' });
    const applicantCard = page.getByTestId('applicant-card-0');
    
    // Check if either is visible
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    const cardVisible = await applicantCard.isVisible().catch(() => false);
    
    expect(emptyVisible || cardVisible).toBe(true);
  });

  test('filter buttons are clickable', async ({ page }) => {
    await loginAndWaitForDashboard(page, TEST_LANDLORD.email, TEST_LANDLORD.password, 'landlord');
    await navigateViaSidebar(page, 'AI Ranking');
    
    // Click filter buttons
    const allBtn = page.getByText('All Applicants');
    const qualifiedBtn = page.getByText('Highly Qualified');
    const reviewBtn = page.getByText('Needs Review');
    
    await expect(allBtn).toBeVisible({ timeout: 15000 });
    
    // Click each filter button
    await qualifiedBtn.click();
    await reviewBtn.click();
    await allBtn.click();
    
    // No errors means buttons are clickable
    expect(true).toBe(true);
  });
});
