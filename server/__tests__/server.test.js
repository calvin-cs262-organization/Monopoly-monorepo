'use strict';

const request = require('supertest');
const { mockFrom, mockChain } = require('@supabase/supabase-js');

// server.js must be required AFTER the mock is in place
const app = require('../server');

beforeEach(() => jest.clearAllMocks());

// ── Games ──────────────────────────────────────────────────────────────────

describe('GET /Games', () => {
  it('returns list of games ordered by time', async () => {
    const games = [{ id: 1, time: '2026-01-01T19:00:00' }];
    mockFrom.mockReturnValue(mockChain({ data: games, error: null }));

    const res = await request(app).get('/Games');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(games);
    expect(mockFrom).toHaveBeenCalledWith('Game');
  });

  it('returns 500 when Supabase returns an error', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: { message: 'db error' } }));

    const res = await request(app).get('/Games');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'db error' });
  });
});

describe('POST /Game', () => {
  it('creates a game and returns 201', async () => {
    const game = { id: 2, time: '2026-06-02T19:00:00' };
    mockFrom.mockReturnValue(mockChain({ data: game, error: null }));

    const res = await request(app)
      .post('/Game')
      .send({ time: '2026-06-02T19:00:00' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(game);
  });
});

describe('DELETE /Game/:id', () => {
  it('deletes PlayerGame rows then the game, returns success message', async () => {
    // First call: DELETE from PlayerGame; second call: DELETE from Game
    const successChain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(successChain);

    const res = await request(app).delete('/Game/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Game deleted' });
    expect(mockFrom).toHaveBeenCalledWith('PlayerGame');
    expect(mockFrom).toHaveBeenCalledWith('Game');
  });
});

// ── PlayerGame ─────────────────────────────────────────────────────────────

describe('GET /Game/:id/players', () => {
  it('returns players with nested Player data', async () => {
    const rows = [
      { id: 10, gameId: 1, playerId: 1, score: 1500, Player: { id: 1, name: 'Alice', emailAddress: 'a@b.com' } },
    ];
    mockFrom.mockReturnValue(mockChain({ data: rows, error: null }));

    const res = await request(app).get('/Game/1/players');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
    expect(mockFrom).toHaveBeenCalledWith('PlayerGame');
  });
});

describe('POST /Game/:id/player', () => {
  it('adds a player to a game and returns 201', async () => {
    const row = { id: 11, gameId: 1, playerId: 2, score: 0 };
    mockFrom.mockReturnValue(mockChain({ data: row, error: null }));

    const res = await request(app)
      .post('/Game/1/player')
      .send({ playerId: 2, score: 0 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(row);
  });
});

describe('PUT /Game/:gameId/player/:playerId', () => {
  it('updates a player score and returns success message', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: null }));

    const res = await request(app)
      .put('/Game/1/player/2')
      .send({ score: 2500 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Score updated' });
  });
});

describe('DELETE /Game/:gameId/player/:playerId', () => {
  it('removes a player from a game and returns success message', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: null }));

    const res = await request(app).delete('/Game/1/player/2');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Player removed from game' });
  });
});

// ── Players ────────────────────────────────────────────────────────────────

describe('GET /Players', () => {
  it('returns players with game count', async () => {
    const players = [
      { id: 1, name: 'Alice', emailAddress: 'a@b.com', PlayerGame: [{ count: 3 }] },
    ];
    mockFrom.mockReturnValue(mockChain({ data: players, error: null }));

    const res = await request(app).get('/Players');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(players);
    expect(mockFrom).toHaveBeenCalledWith('Player');
  });
});

describe('GET /Player/:id/games', () => {
  it('returns games for a player with nested Game data', async () => {
    const rows = [
      { id: 10, gameId: 1, playerId: 1, score: 1500, Game: { id: 1, time: '2026-01-01T19:00:00' } },
    ];
    mockFrom.mockReturnValue(mockChain({ data: rows, error: null }));

    const res = await request(app).get('/Player/1/games');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
  });
});

describe('POST /Player', () => {
  it('creates a player and returns 201', async () => {
    const player = { id: 3, name: 'Bob', emailAddress: 'bob@example.com' };
    mockFrom.mockReturnValue(mockChain({ data: player, error: null }));

    const res = await request(app)
      .post('/Player')
      .send({ name: 'Bob', emailAddress: 'bob@example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(player);
  });
});

describe('DELETE /Player/:id', () => {
  it('deletes a player and returns success message', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: null }));

    const res = await request(app).delete('/Player/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Player deleted' });
    expect(mockFrom).toHaveBeenCalledWith('Player');
  });
});
