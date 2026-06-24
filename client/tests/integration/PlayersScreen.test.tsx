// E2E tests for PlayersScreen — run against a real Express server backed by
// the large Supabase fixture (50 games, 200 players, 5 games/player).
// Requires `supabase start` and is launched via `npm run test:e2e`.
//
// FlatList renders initialNumToRender (default 10) items without a scroll
// viewport, so players Player 001–Player 010 are visible in tests.

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import PlayersScreen from '../../app/(tabs)/players';
import { seedLarge } from './fixtures';

jest.setTimeout(20000);

describe('PlayersScreen (large fixture)', () => {
  it('shows Player 001 first (alphabetical sort)', async () => {
    render(<PlayersScreen />);
    await screen.findByText('Player 001');
  });

  it('shows "5 games" for each initially-rendered player', async () => {
    render(<PlayersScreen />);
    await screen.findByText('Player 001');
    // All 200 players have 5 games; all 10 visible rows show "5 games"
    expect(screen.getAllByText('5 games').length).toBeGreaterThanOrEqual(10);
  });

  it('renders the first 10 players alphabetically', async () => {
    render(<PlayersScreen />);
    await screen.findByText('Player 001');
    await screen.findByText('Player 010');
  });

  it('expanding Player 001 shows 5 game entries each scoring 50 pts', async () => {
    render(<PlayersScreen />);
    await screen.findByText('Player 001');

    // touchables[0] = Add Player, touchables[1] = Player 001 expand
    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[1]);

    // Player 1's score = 1 * 50 = 50 in every game
    await waitFor(() => {
      expect(screen.getAllByText('50 pts')).toHaveLength(5);
    });
  });
});

describe('PlayersScreen — mutations', () => {
  // Re-seed before each mutation test so the DB is in a known state.
  beforeEach(() => seedLarge());

  it('adds a new player and shows them in the list', async () => {
    render(<PlayersScreen />);
    await screen.findByText('Add Player');

    fireEvent.press(screen.getByText('Add Player'));

    // "Alice New" sorts before all "Player XXX" names, so she appears in the
    // first 10 rendered items and is visible without scrolling.
    fireEvent.changeText(screen.getByPlaceholderText('Full name'), 'Alice New');
    fireEvent.changeText(screen.getByPlaceholderText('email@example.com'), 'alice@new.com');
    fireEvent.press(screen.getByText('Add'));

    await screen.findByText('Alice New');
  });

  it('deletes Player 001 and removes them from the list', async () => {
    render(<PlayersScreen />);
    await screen.findByText('Player 001');

    // Touchable layout: [0]=Add Player, [1]=Player001 expand, [2]=Player001 trash
    fireEvent.press(screen.UNSAFE_getAllByType(TouchableOpacity)[2]);

    // FlatList fills the freed slot with the next player, so total touchable count
    // stays the same — assert on the label disappearing instead.
    await waitFor(() => expect(screen.queryByText('Player 001')).toBeNull());
  });
});
