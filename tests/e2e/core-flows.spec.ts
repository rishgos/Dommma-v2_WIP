import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts } from '../fixtures/helpers';

test.describe('Homepage and Nova Chat Core Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await dismissToasts(page);
  });

  test('homepage loads with Nova search bar visible', async ({ page }) => {
    await expect(page.getByTestId('hero-section')).toBeVisible();
    await expect(page.getByTestId('nova-search-section')).toBeVisible();
    await expect(page.getByTestId('nova-search-input')).toBeVisible();
    await expect(page.getByTestId('nova-search-button')).toBeVisible();
  });

  test('search bar click opens Nova chat modal', async ({ page }) => {
    await page.getByTestId('nova-search-input').fill('Find apartments in Vancouver');
    await page.getByTestId('nova-search-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible({ timeout: 10000 });
  });

  test('Nova chat modal has all expected UI elements', async ({ page }) => {
    await page.getByTestId('nova-search-input').fill('test');
    await page.getByTestId('nova-search-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible({ timeout: 10000 });
    
    // Verify all UI elements
    await expect(page.getByTestId('nova-input')).toBeVisible();
    await expect(page.getByTestId('nova-send-button')).toBeVisible();
    await expect(page.getByTestId('nova-close-button')).toBeVisible();
    await expect(page.getByTestId('nova-voice-toggle')).toBeVisible();
    await expect(page.getByTestId('nova-voice-button')).toBeVisible();
    await expect(page.getByTestId('nova-image-button')).toBeVisible();
    await expect(page.getByTestId('nova-preferences-button')).toBeVisible();
  });

  test('Nova chat shows welcome message with capabilities', async ({ page }) => {
    await page.getByTestId('nova-search-input').fill('test');
    await page.getByTestId('nova-search-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible({ timeout: 10000 });
    
    const messagesContainer = page.getByTestId('nova-messages-container');
    await expect(messagesContainer).toContainText("I'm Nova");
    await expect(messagesContainer).toContainText('Property Search');
  });

  test('Nova chat modal can be closed', async ({ page }) => {
    await page.getByTestId('nova-search-input').fill('test');
    await page.getByTestId('nova-search-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible({ timeout: 10000 });
    
    await page.getByTestId('nova-close-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeHidden();
  });

  test('Nova chat has quick action categories', async ({ page }) => {
    await page.getByTestId('nova-search-input').fill('test');
    await page.getByTestId('nova-search-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible({ timeout: 10000 });
    
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=Property Search')).toBeVisible();
    await expect(page.locator('text=Financial Help')).toBeVisible();
  });
});
