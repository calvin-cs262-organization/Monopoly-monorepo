import React from 'react';
import { TouchableOpacity } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { server } from '../__mocks__/msw/server';
import GamesScreen from '../app/(tabs)/index';

describe('GamesScreen', () => {
  it('renders a game card after loading', async () => {
    render(<GamesScreen />);
    // Wait for loading spinner to go away and at least the New Game button to appear
    await screen.findByText('New Game');
    // A game card should render (formatted date appears in the list)
    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBeGreaterThan(1); // New Game + at least one game card
  });

  it('shows player names and scores when game card is expanded', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    // Touchables: [New Game, game-card-expand, game-card-trash]
    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    // Press the game card (second touchable, index 1)
    fireEvent.press(touchables[1]);

    await screen.findByText('Alice');
    expect(screen.getByDisplayValue('1500')).toBeTruthy();
  });

  it('removes a player from the game', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[1]); // expand game

    await screen.findByText('Alice');

    // After expanding: touchables gain player row, trash icon for player, Add Player, etc.
    const expandedTouchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    // Last touchable in the player row area is the player trash icon
    // Structure: New Game | game-expand | game-trash | score-save | player-trash | Add Player
    const playerTrash = expandedTouchables.find(
      (t, i) => i > 2 && expandedTouchables[i - 1] !== expandedTouchables[i]
    );
    // Press the trash icon for Alice (4th touchable: [NewGame, expand, gameTrash, playerTrash, addPlayer...])
    fireEvent.press(expandedTouchables[3]);

    await waitFor(() => expect(screen.queryByText('Alice')).toBeNull());
  });

  it('creates a new game and prepends it to the list', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    const initialTouchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    const initialCount = initialTouchables.length;

    fireEvent.press(screen.getByText('New Game'));
    fireEvent.press(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThan(initialCount);
    });
  });

  it('deletes a game and removes it from the list', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    const countBefore = touchables.length;

    // Trash is the last touchable in the game row [New Game, expand, trash]
    fireEvent.press(touchables[touchables.length - 1]);

    await waitFor(() => {
      expect(screen.UNSAFE_getAllByType(TouchableOpacity).length).toBeLessThan(countBefore);
    });
  });

  it('shows "All players already in this game" when pool is empty', async () => {
    render(<GamesScreen />);
    await screen.findByText('New Game');

    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[1]); // expand game

    await screen.findByText('Alice');
    fireEvent.press(screen.getByText('Add Player'));
    await screen.findByText('All players are already in this game.');
  });

  it('does not crash when /Games API returns an error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get('http://test-server/Games', () => HttpResponse.error())
    );
    render(<GamesScreen />);
    await screen.findByText('New Game');
    jest.restoreAllMocks();
  });
});
