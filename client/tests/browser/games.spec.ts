import { execSync } from 'child_process';
import path from 'path';
import { test, expect } from '@playwright/test';

// In React Native Web, TouchableOpacity renders as a plain <div> (no role="button").
// Clicking the text content of a card bubbles up to the parent TouchableOpacity handler.

const DB_URL =
  process.env.SUPABASE_DB_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const LARGE_SQL = path.resolve(__dirname, '../../../supabase/seeds/large.sql');
const seedLarge = () => execSync(`psql "${DB_URL}" -f "${LARGE_SQL}"`, { stdio: 'pipe' });

test.describe('GamesScreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the React app to hydrate and the /Games API response to arrive.
    await expect(page.getByText('New Game')).toBeVisible({ timeout: 15000 });
  });

  test('loads the games list from the real API', async ({ page }) => {
    // All 50 game dates are in 2025; at least one should be visible.
    await expect(page.getByText(/2025/).first()).toBeVisible();
  });

  test('shows multiple game cards', async ({ page }) => {
    // Scroll to trigger FlatList to render more items, then count date labels.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    expect(await page.getByText(/2025/).count()).toBeGreaterThanOrEqual(10);
  });

  test('expanding the first game shows player names', async ({ page }) => {
    // Click the date label of the first card (game 50, newest) to expand it.
    await page.getByText(/2025/).first().click();

    // Game 50 players: IDs that are multiples of 10 (Player 010 … Player 200).
    await expect(page.getByText('Player 010').first()).toBeVisible({ timeout: 5000 });
  });

  test('expanded game shows 20 player rows', async ({ page }) => {
    await page.getByText(/2025/).first().click();

    await expect(page.getByText('Player 010').first()).toBeVisible({ timeout: 5000 });
    expect(await page.getByText(/^Player \d{3}$/).count()).toBe(20);
  });

  test('expanded game includes Player 200', async ({ page }) => {
    await page.getByText(/2025/).first().click();
    await expect(page.getByText('Player 200').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('GamesScreen mutations', () => {
  test.beforeEach(async ({ page }) => {
    // Restore the large fixture so every mutation test starts from a clean slate.
    seedLarge();
    await page.goto('/');
    await expect(page.getByText('New Game')).toBeVisible({ timeout: 15000 });
  });

  test('creates a new game and adds it to the list', async ({ page }) => {
    const before = await page.getByText(/2025/).count();

    // Open the New Game modal; defaults (today's date, 19:00) apply without typing.
    await page.getByText('New Game').click();
    await expect(page.getByText('Create')).toBeVisible({ timeout: 3000 });
    await page.getByText('Create').click();

    // The list should grow by one card (the new game's date appears)
    await expect
      .poll(() => page.getByText(/2025|\d{4}/).count(), { timeout: 5000 })
      .toBeGreaterThan(before);
  });

  test('adds Player 001 to the first game', async ({ page }) => {
    // Expand game 50 by clicking its date
    await page.getByText(/2025/).first().click();
    await expect(page.getByText('Player 010').first()).toBeVisible({ timeout: 5000 });

    const before = await page.getByText(/^Player \d{3}$/).count();

    // Open the "Add Player" modal inside the expanded game card
    await page.getByText('Add Player').click();
    // Player 001 is not in game 50; click their name in the modal list
    await expect(page.getByText('Player 001').first()).toBeVisible({ timeout: 5000 });
    await page.getByText('Player 001').first().click();

    // Game 50 now has 21 players
    await expect
      .poll(() => page.getByText(/^Player \d{3}$/).count(), { timeout: 5000 })
      .toBeGreaterThan(before);
  });

  test('updates Player 010 score and persists it after page reload', async ({ page }) => {
    await page.getByText(/2025/).first().click();
    await expect(page.getByText('Player 010').first()).toBeVisible({ timeout: 5000 });

    // Player 010's initial score = 10 × 50 = 500
    await page.locator('input[value="500"]').first().fill('9999');
    // After fill the value changes to "9999", so re-press via keyboard on the still-focused input.
    await page.keyboard.press('Enter'); // triggers onSubmitEditing → PUT /Game/50/player/10

    // Reload to clear client state; re-fetch from server must return 9999
    await page.reload();
    await expect(page.getByText('New Game')).toBeVisible({ timeout: 15000 });
    await page.getByText(/2025/).first().click();
    await expect(page.getByText('Player 010').first()).toBeVisible({ timeout: 5000 });

    await expect(page.locator('input[value="9999"]').first()).toBeVisible({ timeout: 5000 });
  });
});
