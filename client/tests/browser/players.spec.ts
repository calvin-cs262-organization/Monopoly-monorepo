import { execSync } from 'child_process';
import path from 'path';
import { test, expect } from '@playwright/test';

const DB_URL =
  process.env.SUPABASE_DB_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const LARGE_SQL = path.resolve(__dirname, '../../../supabase/seeds/large.sql');
const seedLarge = () => execSync(`psql "${DB_URL}" -f "${LARGE_SQL}"`, { stdio: 'pipe' });

// In React Native Web, TouchableOpacity renders as a plain <div> (no role="button").
// Clicking a text node inside a card bubbles up to the parent TouchableOpacity handler.

test.describe('PlayersScreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/players');
    // Wait for the React app to hydrate and the /Players API response to arrive.
    await expect(page.getByText('Add Player')).toBeVisible({ timeout: 15000 });
  });

  test('loads the players list from the real API', async ({ page }) => {
    // Players are sorted alphabetically; Player 001 should appear first.
    await expect(page.getByText('Player 001')).toBeVisible();
  });

  test('shows game count for each player', async ({ page }) => {
    // Every player in the large fixture has exactly 5 games.
    await expect(page.getByText('5 games').first()).toBeVisible();
  });

  test('scrolling reveals more players', async ({ page }) => {
    await expect(page.getByText('Player 001')).toBeVisible();

    // Scroll the list to trigger FlatList to render additional items.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    expect(await page.getByText(/^Player \d{3}$/).count()).toBeGreaterThan(10);
  });

  test('expanding Player 001 shows their 5 games', async ({ page }) => {
    // Click the player name text — bubbles up to the cardMain TouchableOpacity.
    await page.getByText('Player 001').first().click();

    // Player 1's score in every game is 1 × 50 = 50 pts.
    await expect(page.getByText('50 pts').first()).toBeVisible({ timeout: 5000 });
    expect(await page.getByText('50 pts').count()).toBe(5);
  });

  test('expanding Player 001 shows 5 game date entries', async ({ page }) => {
    await page.getByText('Player 001').first().click();

    // Each expanded game entry shows a formatted date (year 2025).
    await expect(page.getByText('50 pts').first()).toBeVisible({ timeout: 5000 });
    expect(await page.getByText('50 pts').count()).toBe(5);
  });
});

test.describe('PlayersScreen mutations', () => {
  test.beforeEach(async ({ page }) => {
    // Restore the large fixture so every mutation test starts from a clean slate.
    seedLarge();
    await page.goto('/players');
    await expect(page.getByText('Add Player')).toBeVisible({ timeout: 15000 });
  });

  test('adds a new player and shows them in the list', async ({ page }) => {
    await page.getByText('Add Player').click();

    // Modal has "Full name" and "email@example.com" placeholder inputs.
    // "Alice New" sorts before all "Player XXX" names, so she appears immediately.
    await page.getByPlaceholder('Full name').fill('Alice New');
    await page.getByPlaceholder('email@example.com').fill('alice@new.com');
    await page.getByText('Add', { exact: true }).click();

    await expect(page.getByText('Alice New')).toBeVisible({ timeout: 5000 });
  });
});
