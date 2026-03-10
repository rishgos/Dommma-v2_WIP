import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts, loginAsTestUser } from '../fixtures/helpers';

/**
 * Tests for R2 Storage Integration, User Ratings and Dashboard features
 */

test.describe('R2 Storage Status API', () => {
  test('storage status endpoint returns configured true', async ({ request }) => {
    const response = await request.get('/api/storage/status');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('configured');
    expect(data.configured).toBe(true);
  });
});

test.describe('User Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('login page loads correctly with user type selection', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify login page elements
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByText('I am a:')).toBeVisible();
    
    // Verify user type buttons
    await expect(page.getByRole('button', { name: 'Renter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Landlord' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Contractor' })).toBeVisible();
    
    // Verify form inputs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/login-page.jpeg', quality: 20 });
  });

  test('test user can login successfully', async ({ page }) => {
    await loginAsTestUser(page);
    
    // Verify redirect to dashboard
    await expect(page.url()).toContain('/dashboard');
    
    // Dashboard should be visible
    await expect(page.getByTestId('dashboard-content')).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'test-results/dashboard-after-login.jpeg', quality: 20 });
  });
});

test.describe('Renter Dashboard with Ratings', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsTestUser(page);
  });

  test('renter dashboard displays correctly', async ({ page }) => {
    // Verify renter dashboard content
    await expect(page.getByTestId('renter-dashboard')).toBeVisible({ timeout: 10000 });
    
    // Verify pay rent button
    await expect(page.getByTestId('pay-rent-btn')).toBeVisible();
    
    // Verify recommended properties section
    await expect(page.getByText('Recommended Properties')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/renter-dashboard.jpeg', quality: 20 });
  });

  test('user rating card is visible on dashboard', async ({ page }) => {
    // Scroll down to find rating card
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for rating card to appear
    const ratingCard = page.getByTestId('user-rating-card');
    await expect(ratingCard).toBeVisible({ timeout: 10000 });
    
    // Verify ratings section header
    await expect(page.getByText('Ratings & Reviews')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/user-rating-card.jpeg', quality: 20 });
  });

  test('pay rent button navigates to payments', async ({ page }) => {
    const payRentBtn = page.getByTestId('pay-rent-btn');
    await expect(payRentBtn).toBeVisible();
    await payRentBtn.click();
    
    // Should navigate to payments page
    await expect(page.url()).toContain('/payments');
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({ path: 'test-results/payments-page.jpeg', quality: 20 });
  });
});

test.describe('Ratings API Integration', () => {
  test('ratings endpoint returns user ratings', async ({ request }) => {
    // First get a user ID from login
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test@dommma.com',
        password: 'test123'
      }
    });
    
    expect(loginResponse.status()).toBe(200);
    const userData = await loginResponse.json();
    const userId = userData.id;
    
    // Now get ratings for this user
    const ratingsResponse = await request.get(`/api/ratings/user/${userId}`);
    expect(ratingsResponse.status()).toBe(200);
    
    const ratingsData = await ratingsResponse.json();
    expect(ratingsData).toHaveProperty('user_id');
    expect(ratingsData).toHaveProperty('average_rating');
    expect(ratingsData).toHaveProperty('total_ratings');
  });

  test('ratings summary endpoint works', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test@dommma.com',
        password: 'test123'
      }
    });
    
    const userData = await loginResponse.json();
    const userId = userData.id;
    
    const summaryResponse = await request.get(`/api/ratings/summary/${userId}`);
    expect(summaryResponse.status()).toBe(200);
    
    const summaryData = await summaryResponse.json();
    expect(summaryData).toHaveProperty('distribution');
  });
});

test.describe('Homepage and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('homepage loads with key elements', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Verify DOMMMA branding
    await expect(page.getByText('DOMMMA').first()).toBeVisible();
    
    // Verify main headline
    await expect(page.getByText('HOME MADE SIMPLE')).toBeVisible();
    
    // Verify navigation links using data-testid for specificity
    await expect(page.getByTestId('nav-link-home')).toBeVisible();
    await expect(page.getByTestId('nav-link-properties')).toBeVisible();
    
    // Verify Pros link in header navigation
    await expect(page.getByRole('link', { name: 'Pros' }).first()).toBeVisible();
    
    // Verify LOGIN button using data-testid
    await expect(page.getByTestId('login-btn')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/homepage.jpeg', quality: 20 });
  });

  test('can navigate to properties page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Use data-testid for specificity
    await page.getByTestId('nav-link-properties').click();
    await page.waitForLoadState('domcontentloaded');
    
    // URL should contain /properties or /browse
    await expect(page.url()).toMatch(/\/(properties|browse)/);
    
    await page.screenshot({ path: 'test-results/properties-page.jpeg', quality: 20 });
  });
});
