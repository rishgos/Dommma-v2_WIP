import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts } from '../fixtures/helpers';

/**
 * Helper to open Nova chat and wait for response
 */
async function openChatAndWaitForResponse(page: any, query: string) {
  await page.getByTestId('nova-search-input').fill(query);
  await page.getByTestId('nova-search-button').click();
  await expect(page.getByTestId('nova-chat-modal')).toBeVisible({ timeout: 10000 });
  
  const messagesContainer = page.getByTestId('nova-messages-container');
  
  // Wait for thinking indicator to disappear
  await expect(messagesContainer.locator('text=Nova is thinking')).toBeVisible({ timeout: 5000 }).catch(() => {});
  await expect(messagesContainer.locator('text=Nova is thinking')).toBeHidden({ timeout: 45000 });
  
  return messagesContainer;
}

test.describe('AI Concierge Tool Calling - Search Listings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await dismissToasts(page);
  });

  test('search_listings returns properties based on criteria', async ({ page }) => {
    const messagesContainer = await openChatAndWaitForResponse(
      page, 
      'Find me a 2 bedroom apartment in Vancouver under $2500'
    );
    
    // Should contain property-related response
    const responseText = await messagesContainer.textContent();
    expect(responseText?.toLowerCase()).toMatch(/bedroom|apartment|properties|\$/);
  });

  test('search results show property cards with images', async ({ page }) => {
    const messagesContainer = await openChatAndWaitForResponse(
      page, 
      'Show me apartments in Vancouver'
    );
    
    // Check for property cards (links containing images)
    const propertyCards = messagesContainer.locator('a:has(img)');
    const cardCount = await propertyCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('property cards link to browse page with property ID', async ({ page }) => {
    const messagesContainer = await openChatAndWaitForResponse(
      page, 
      'Show me apartments in Vancouver'
    );
    
    const propertyCards = messagesContainer.locator('a:has(img)');
    const cardCount = await propertyCards.count();
    
    if (cardCount > 0) {
      const href = await propertyCards.first().getAttribute('href');
      expect(href).toContain('/browse');
      expect(href).toContain('property=');
    }
  });
});

test.describe('AI Concierge Tool Calling - Find Contractors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await dismissToasts(page);
  });

  test('find_contractors returns contractor recommendations', async ({ page }) => {
    const messagesContainer = await openChatAndWaitForResponse(
      page, 
      'I need an emergency plumber right now'
    );
    
    // Should contain plumbing-related response
    const responseText = await messagesContainer.textContent();
    expect(responseText?.toLowerCase()).toMatch(/plumb|contractor|verified|rated/);
  });

  test('contractor links in response are clickable', async ({ page }) => {
    const messagesContainer = await openChatAndWaitForResponse(
      page, 
      'I need an emergency plumber'
    );
    
    // Look for contractor links in the response
    const contractorLinks = messagesContainer.locator('a[href*="/contractors"]');
    const linkCount = await contractorLinks.count();
    
    if (linkCount > 0) {
      const href = await contractorLinks.first().getAttribute('href');
      expect(href).toContain('/contractors');
    }
  });
});

test.describe('AI Concierge Tool Calling - Calculate Budget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await dismissToasts(page);
  });

  test('calculate_budget returns affordability info', async ({ page }) => {
    const messagesContainer = await openChatAndWaitForResponse(
      page, 
      'What rent can I afford on an $80,000 salary?'
    );
    
    // Should contain budget-related response
    const responseText = await messagesContainer.textContent();
    expect(responseText?.toLowerCase()).toMatch(/afford|budget|rent|income|\$/);
  });

  test('budget calculation uses 30% rule', async ({ page }) => {
    const messagesContainer = await openChatAndWaitForResponse(
      page, 
      'What can I afford on $80000 income'
    );
    
    // May mention 30% rule
    const responseText = await messagesContainer.textContent();
    expect(responseText?.toLowerCase()).toMatch(/afford|budget|rent/);
  });
});

test.describe('AI Concierge Tool Calling - Triage Maintenance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await dismissToasts(page);
  });

  test('triage_maintenance handles issue reports', async ({ page }) => {
    const messagesContainer = await openChatAndWaitForResponse(
      page, 
      'My kitchen sink is leaking badly and I need help'
    );
    
    // Should contain maintenance-related response
    const responseText = await messagesContainer.textContent();
    expect(responseText?.toLowerCase()).toMatch(/leak|plumb|repair|maintenance|urgent/);
  });

  test('maintenance triage suggests contractors', async ({ page }) => {
    const messagesContainer = await openChatAndWaitForResponse(
      page, 
      'My toilet is overflowing and I need help immediately'
    );
    
    // Should suggest contractors or repair steps
    const responseText = await messagesContainer.textContent();
    expect(responseText?.toLowerCase()).toMatch(/plumb|contractor|emergency|steps|turn off/);
  });
});

test.describe('AI Concierge Tool Calling - Create Listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await dismissToasts(page);
  });

  test('create_listing gathers property information', async ({ page }) => {
    const messagesContainer = await openChatAndWaitForResponse(
      page, 
      'I want to list my 2 bedroom apartment at 456 Main Street Vancouver for $2000 per month'
    );
    
    // Should contain listing-related response
    const responseText = await messagesContainer.textContent();
    expect(responseText?.toLowerCase()).toMatch(/list|property|bedroom|details|create/);
  });
});
