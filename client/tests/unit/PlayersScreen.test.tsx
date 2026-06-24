import React from 'react';
import { TouchableOpacity } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { server } from '../../__mocks__/msw/server';
import PlayersScreen from '../../app/(tabs)/players';

describe('PlayersScreen', () => {
  it('renders player list after loading', async () => {
    render(<PlayersScreen />);
    await screen.findByText('Alice');
    expect(screen.getByText('alice@example.com')).toBeTruthy();
    expect(screen.getByText('2 games')).toBeTruthy();
  });

  it('renders empty list without crashing when no players', async () => {
    server.use(
      http.get('http://test-server/Players', () => HttpResponse.json([]))
    );
    render(<PlayersScreen />);
    await waitFor(() => expect(screen.queryByText('Alice')).toBeNull());
  });

  it('shows player games when card is expanded', async () => {
    render(<PlayersScreen />);
    fireEvent.press(await screen.findByText('Alice'));
    await screen.findByText('1500 pts');
  });

  it('shows "No games yet." when player has no games', async () => {
    server.use(
      http.get('http://test-server/Player/:id/games', () => HttpResponse.json([]))
    );
    render(<PlayersScreen />);
    fireEvent.press(await screen.findByText('Alice'));
    await screen.findByText('No games yet.');
  });

  it('adds a new player and shows them in the list', async () => {
    render(<PlayersScreen />);
    await screen.findByText('Alice');

    fireEvent.press(screen.getByText('Add Player'));
    fireEvent.changeText(screen.getByPlaceholderText('Full name'), 'Bob');
    fireEvent.changeText(screen.getByPlaceholderText('email@example.com'), 'bob@example.com');
    fireEvent.press(screen.getByText('Add'));

    await screen.findByText('Bob');
  });

  it('does not submit add-player form when fields are empty', async () => {
    render(<PlayersScreen />);
    await screen.findByText('Alice');

    fireEvent.press(screen.getByText('Add Player'));
    fireEvent.press(screen.getByText('Add'));

    // Modal stays open — input still visible
    expect(screen.getByPlaceholderText('Full name')).toBeTruthy();
  });

  it('deletes a player and removes them from the list', async () => {
    render(<PlayersScreen />);
    await screen.findByText('Alice');

    // Touchables: [Add Player, Alice-expand, Alice-trash]
    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[touchables.length - 1]);

    await waitFor(() => expect(screen.queryByText('Alice')).toBeNull());
  });

  it('does not crash when API returns an error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get('http://test-server/Players', () => HttpResponse.error())
    );
    render(<PlayersScreen />);
    await waitFor(() => expect(screen.queryByText('Alice')).toBeNull());
    jest.restoreAllMocks();
  });
});
