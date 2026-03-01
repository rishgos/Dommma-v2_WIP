import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts, openNovaChat, sendNovaChatMessage, closeNovaChat } from '../fixtures/helpers';

test.describe('Nova AI Chat Core Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await dismissToasts(page);
  });

  test('homepage loads with Nova AI search bar visible', async ({ page }) => {
    // Check hero section is visible
    await expect(page.getByTestId('hero-section')).toBeVisible();
    
    // Check Nova search section is visible
    await expect(page.getByTestId('nova-search-section')).toBeVisible();
    
    // Check search input is visible
    await expect(page.getByTestId('nova-search-input')).toBeVisible();
    
    // Check search button is visible  
    await expect(page.getByTestId('nova-search-button')).toBeVisible();
  });

  test('clicking search bar opens Nova chat modal', async ({ page }) => {
    // Focus and type in the search bar
    const searchInput = page.getByTestId('nova-search-input');
    await searchInput.fill('Find apartments in Vancouver');
    
    // Click the search button
    const searchButton = page.getByTestId('nova-search-button');
    await searchButton.click();
    
    // Wait for Nova chat modal to appear
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible({ timeout: 10000 });
  });

  test('Nova chat button exists and opens modal', async ({ page }) => {
    // Find the Nova chat button
    const chatButton = page.getByTestId('nova-chat-button');
    await expect(chatButton).toBeVisible();
    
    // Click to open the modal
    await chatButton.click();
    
    // Verify modal opens
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible();
    
    // Verify chat input is visible
    await expect(page.getByTestId('nova-input')).toBeVisible();
    
    // Verify send button is visible
    await expect(page.getByTestId('nova-send-button')).toBeVisible();
  });

  test('Nova chat modal can be closed', async ({ page }) => {
    // Open the chat
    await page.getByTestId('nova-chat-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible();
    
    // Close the chat
    await page.getByTestId('nova-close-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeHidden();
  });

  test('Nova chat shows welcome message', async ({ page }) => {
    await page.getByTestId('nova-chat-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible();
    
    // Check for welcome message content
    const messagesContainer = page.getByTestId('nova-messages-container');
    await expect(messagesContainer).toContainText("I'm Nova");
    await expect(messagesContainer).toContainText('Property Search');
  });

  test('Nova chat has quick action buttons', async ({ page }) => {
    await page.getByTestId('nova-chat-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible();
    
    // Check for quick action categories
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=Property Search')).toBeVisible();
    await expect(page.locator('text=Financial Help')).toBeVisible();
  });

  test('voice toggle button exists', async ({ page }) => {
    await page.getByTestId('nova-chat-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible();
    
    // Check voice toggle
    await expect(page.getByTestId('nova-voice-toggle')).toBeVisible();
  });

  test('voice input button exists', async ({ page }) => {
    await page.getByTestId('nova-chat-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible();
    
    // Check voice input button (microphone)
    await expect(page.getByTestId('nova-voice-button')).toBeVisible();
  });

  test('image upload button exists', async ({ page }) => {
    await page.getByTestId('nova-chat-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible();
    
    // Check image upload button
    await expect(page.getByTestId('nova-image-button')).toBeVisible();
  });

  test('preferences button exists', async ({ page }) => {
    await page.getByTestId('nova-chat-button').click();
    await expect(page.getByTestId('nova-chat-modal')).toBeVisible();
    
    // Check preferences/settings button
    await expect(page.getByTestId('nova-preferences-button')).toBeVisible();
  });
});
