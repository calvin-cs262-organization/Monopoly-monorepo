// E2E tests for GamesScreen — run against a real Express server backed by
// the large Supabase fixture (50 games, 200 players, 20 players/game).
// Requires `supabase start` and is launched via `npm run test:e2e`.
//
// FlatList renders initialNumToRender (default 10) items without a scroll
// viewport, so the 10 newest games are visible in tests.

import React from 'react';
import { FlatList, TextInput, TouchableOpacity } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import GamesScreen from '../../app/(tabs)/index';
import { seedLarge } from './fixtures';

jest.setTimeout(20000);

describe('GamesScreen (large fixture)', () => {
  it('loads and renders game cards', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');
    // New Game button + 10 initially-rendered games × (expand + trash) = 21
    expect(screen.UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThanOrEqual(21);
  });

  it('game labels show dates', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');
    // All 10 visible games have dates in 2025
    expect(screen.getAllByText(/2025/).length).toBeGreaterThanOrEqual(10);
  });

  it('expanding the first game shows 20 players', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[1]); // expand game 50 (newest, first in list)

    // Game 50 players: IDs 10,20,...,200 → names Player 010, Player 020, ...
    await waitFor(() => {
      expect(screen.getAllByText(/^Player \d{3}$/)).toHaveLength(20);
    });
  });

  it('expanded first game includes Player 010', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[1]);

    await screen.findByText('Player 010');
  });

  it('expanded first game includes Player 200', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[1]);

    await screen.findByText('Player 200');
  });
});

describe('GamesScreen — mutations', () => {
  // Re-seed before each mutation test so the DB is in a known state.
  beforeEach(() => seedLarge());

  it('creates a new game and adds it to the list', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    const before = screen.UNSAFE_getAllByType(TouchableOpacity).length;

    // Open modal and confirm; defaults (today's date, 19:00) are filled in automatically.
    fireEvent.press(screen.getByText('New Game'));
    fireEvent.press(screen.getByText('Create'));

    // One new game card → two new touchables (expand + trash)
    await waitFor(() =>
      expect(screen.UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThan(before),
    );
  });

  it('deletes the first game and removes it from the list', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    const before = (screen.UNSAFE_getByType(FlatList).props.data as unknown[]).length;

    // Touchable layout: [0]=New Game, [1]=game50 expand, [2]=game50 trash
    fireEvent.press(screen.UNSAFE_getAllByType(TouchableOpacity)[2]);

    // FlatList fills the freed slot visually, so visible card count stays the same.
    // Assert on FlatList.data directly — it shrinks by 1 when setGames filters.
    await waitFor(() =>
      expect(
        (screen.UNSAFE_getByType(FlatList).props.data as unknown[]).length,
      ).toBe(before - 1),
    );
  });

  it('adds Player 001 to the first game', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    // Expand game 50 (touchables[1])
    fireEvent.press(screen.UNSAFE_getAllByType(TouchableOpacity)[1]);
    await screen.findByText('Player 010'); // confirm 20 players loaded

    // Record TextInput count (20 player score inputs + any from hidden modals)
    const before = screen.UNSAFE_getAllByType(TextInput).length;

    // Open the "Add Player" modal and choose Player 001 (not in game 50)
    fireEvent.press(screen.getByText('Add Player'));
    fireEvent.press(screen.getByText('Player 001'));

    // After the POST + re-fetch, game 50 has 21 players → one more score TextInput
    await waitFor(() =>
      expect(screen.UNSAFE_getAllByType(TextInput).length).toBe(before + 1),
    );
  });

  it('removes a player from the first game', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    // Expand game 50
    fireEvent.press(screen.UNSAFE_getAllByType(TouchableOpacity)[1]);
    await screen.findByText('Player 010');

    const before = screen.UNSAFE_getAllByType(TextInput).length;

    // [0]=New Game, [1]=expand, [2]=game trash, [3]=first player's trash.
    // Server has no ORDER BY so we can't assert which player was removed —
    // just assert the count drops by 1.
    fireEvent.press(screen.UNSAFE_getAllByType(TouchableOpacity)[3]);

    await waitFor(() =>
      expect(screen.UNSAFE_getAllByType(TextInput).length).toBe(before - 1),
    );
  });

  it('updates a player score and persists it after re-render', async () => {
    const { unmount } = render(<GamesScreen />);
    await screen.findByText('New Game');

    // Expand game 50; Player 010's score = 10 × 50 = 500
    fireEvent.press(screen.UNSAFE_getAllByType(TouchableOpacity)[1]);
    await screen.findByText('Player 010');

    fireEvent.changeText(screen.getByDisplayValue('500'), '9999');
    fireEvent(screen.getByDisplayValue('9999'), 'onSubmitEditing');

    // Wait briefly for the PUT to reach the server, then discard component state.
    // Wrapped in act so React can flush any state updates triggered by the response.
    await act(async () => { await new Promise<void>((r) => setTimeout(r, 500)); });
    unmount();

    // Fresh render — editScores state is gone, so the value comes purely from the server
    render(<GamesScreen />);
    await screen.findByText('New Game');
    fireEvent.press(screen.UNSAFE_getAllByType(TouchableOpacity)[1]);

    await waitFor(() => expect(screen.getByDisplayValue('9999')).toBeTruthy(), {
      timeout: 10000,
    });
  });
});
