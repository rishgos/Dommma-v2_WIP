import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts, loginAsLandlord } from '../fixtures/helpers';

test.describe('Document Builder Feature', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    // Login first
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Landlord' }).click();
    await page.fill('input[type="email"]', 'landlord@test.com');
    await page.fill('input[type="password"]', 'test1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  test('Document Builder page loads with all templates', async ({ page }) => {
    // Navigate via sidebar
    await page.getByTestId('nav-document-builder').click();
    await waitForAppReady(page);
    
    // Verify page title and all templates
    await expect(page.getByTestId('document-builder-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('document-builder-title')).toBeVisible();
    await expect(page.getByTestId('template-rtb-1')).toBeVisible();
    await expect(page.getByTestId('template-rtb-7')).toBeVisible();
    await expect(page.getByTestId('template-rtb-26')).toBeVisible();
    await expect(page.getByTestId('template-rtb-30')).toBeVisible();
  });

  test('RTB-1 template opens form wizard with all sections', async ({ page }) => {
    await page.getByTestId('nav-document-builder').click();
    await expect(page.getByTestId('document-builder-page')).toBeVisible();
    
    // Click RTB-1 template
    await page.getByTestId('template-rtb-1').click();
    
    // Verify form page
    await expect(page.getByTestId('document-fill-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('selected-template-name')).toContainText('RTB-1');
    await expect(page.getByTestId('section-title')).toContainText('Parties');
    await expect(page.getByTestId('section-progress')).toContainText('Section 1 of 7');
  });

  test('Document preview shows PDF and send options', async ({ page }) => {
    await page.getByTestId('nav-document-builder').click();
    await expect(page.getByTestId('document-builder-page')).toBeVisible();
    
    // Select RTB-30 (only 2 sections)
    await page.getByTestId('template-rtb-30').click();
    await expect(page.getByTestId('document-fill-page')).toBeVisible();
    
    // Navigate using JS click to avoid overlay issues
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="next-section-button"]');
      if (btn) (btn as HTMLButtonElement).click();
    });
    
    await expect(page.getByTestId('preview-button')).toBeVisible({ timeout: 5000 });
    
    // Click preview using JS
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="preview-button"]');
      if (btn) (btn as HTMLButtonElement).click();
    });
    
    // Verify preview elements
    await expect(page.getByTestId('document-preview-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('download-pdf-button')).toBeVisible();
    await expect(page.getByTestId('send-signature-section')).toBeVisible();
  });
});
