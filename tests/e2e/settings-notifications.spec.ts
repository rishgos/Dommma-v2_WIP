import { test, expect } from '@playwright/test';

/**
 * Tests for Settings Page - Notifications Tab
 * Features: Categorized notification preferences similar to Wise app
 */

test.describe('Settings Notifications Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Login as renter
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByText('Renter', { exact: true }).click();
    await page.locator('input[type="email"]').fill('test_renter@example.com');
    await page.locator('input[type="password"]').fill('test123456');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Settings
    await page.click('text=Settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display Notifications tab in settings sidebar', async ({ page }) => {
    const notificationsTab = page.getByTestId('settings-tab-notifications');
    await expect(notificationsTab).toBeVisible();
  });

  test('should show categorized notification preferences when clicking Notifications tab', async ({ page }) => {
    // Click Notifications tab
    await page.getByTestId('settings-tab-notifications').click();
    await page.waitForLoadState('networkidle');
    
    // Verify categories are displayed
    await expect(page.getByTestId('notifications-account')).toBeVisible();
    await expect(page.getByTestId('notifications-messages')).toBeVisible();
    await expect(page.getByTestId('notifications-property')).toBeVisible();
    await expect(page.getByTestId('notifications-payments')).toBeVisible();
    await expect(page.getByTestId('notifications-delivery')).toBeVisible();
  });

  test('should display Account & Security section with always-on items', async ({ page }) => {
    await page.getByTestId('settings-tab-notifications').click();
    await page.waitForLoadState('networkidle');
    
    // Verify Account & Security section
    await expect(page.getByText('Account & Security')).toBeVisible();
    
    // Verify "Always on" labels for security-critical notifications
    const alwaysOnLabels = page.getByText('Always on');
    await expect(alwaysOnLabels.first()).toBeVisible();
  });

  test('should display Messages & Communication section', async ({ page }) => {
    await page.getByTestId('settings-tab-notifications').click();
    await page.waitForLoadState('networkidle');
    
    // Verify section header
    await expect(page.getByText('Messages & Communication')).toBeVisible();
    
    // Verify notification options
    await expect(page.getByText('Direct messages')).toBeVisible();
    await expect(page.getByText('Push notifications for messages')).toBeVisible();
    await expect(page.getByText('Application updates')).toBeVisible();
  });

  test('should display Property & Listings section', async ({ page }) => {
    await page.getByTestId('settings-tab-notifications').click();
    await page.waitForLoadState('networkidle');
    
    // Verify section header
    await expect(page.getByText('Property & Listings')).toBeVisible();
    
    // Verify notification options
    await expect(page.getByText('New listing alerts')).toBeVisible();
    await expect(page.getByText('Price drop alerts')).toBeVisible();
    await expect(page.getByText('Viewing reminders')).toBeVisible();
  });

  test('should display Payments & Billing section', async ({ page }) => {
    await page.getByTestId('settings-tab-notifications').click();
    await page.waitForLoadState('networkidle');
    
    // Verify section header
    await expect(page.getByText('Payments & Billing')).toBeVisible();
    
    // Verify notification options
    await expect(page.getByText('Rent due reminders')).toBeVisible();
    await expect(page.getByText('Late payment alerts')).toBeVisible();
    await expect(page.getByText('Invoice generated')).toBeVisible();
  });

  test('should display Delivery Methods section', async ({ page }) => {
    await page.getByTestId('settings-tab-notifications').click();
    await page.waitForLoadState('networkidle');
    
    // Verify section header
    await expect(page.getByText('Delivery Methods')).toBeVisible();
    
    // Verify delivery options
    await expect(page.getByText('Push notifications')).toBeVisible();
    await expect(page.getByText('SMS notifications')).toBeVisible();
    await expect(page.getByText('Weekly email digest')).toBeVisible();
  });

  test('should have Save Changes button', async ({ page }) => {
    await page.getByTestId('settings-tab-notifications').click();
    await page.waitForLoadState('networkidle');
    
    // Verify Save Changes button
    const saveBtn = page.getByTestId('save-notifications-btn');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toHaveText(/Save Changes/);
  });

  test('should have toggle switches for each notification option', async ({ page }) => {
    await page.getByTestId('settings-tab-notifications').click();
    await page.waitForLoadState('networkidle');
    
    // Count toggle switches (they use peer-checked:bg-[#1A2F3A] class)
    const toggles = page.locator('.peer');
    const toggleCount = await toggles.count();
    
    // Should have multiple toggles for all the notification options
    expect(toggleCount).toBeGreaterThan(10);
  });
});

test.describe('Settings Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByText('Renter', { exact: true }).click();
    await page.locator('input[type="email"]').fill('test_renter@example.com');
    await page.locator('input[type="password"]').fill('test123456');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
  });

  test('should display all settings tabs', async ({ page }) => {
    await page.click('text=Settings');
    await page.waitForLoadState('networkidle');
    
    // Verify all tabs are present
    await expect(page.getByTestId('settings-tab-profile')).toBeVisible();
    await expect(page.getByTestId('settings-tab-payments')).toBeVisible();
    await expect(page.getByTestId('settings-tab-notifications')).toBeVisible();
    await expect(page.getByTestId('settings-tab-privacy')).toBeVisible();
    await expect(page.getByTestId('settings-tab-security')).toBeVisible();
  });

  test('should switch between tabs correctly', async ({ page }) => {
    await page.click('text=Settings');
    await page.waitForLoadState('networkidle');
    
    // Click Notifications tab
    await page.getByTestId('settings-tab-notifications').click();
    await expect(page.getByText('Notification Preferences')).toBeVisible();
    
    // Click Privacy tab
    await page.getByTestId('settings-tab-privacy').click();
    await expect(page.getByText('Privacy Settings')).toBeVisible();
    
    // Click Profile tab
    await page.getByTestId('settings-tab-profile').click();
    await expect(page.getByText('Profile Information')).toBeVisible();
  });
});
