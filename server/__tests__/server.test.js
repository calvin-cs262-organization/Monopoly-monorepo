'use strict';

const request = require('supertest');
const { mockFrom, mockChain } = require('@supabase/supabase-js');

// server.js must be required AFTER the mock is in place
const app = require('../server');

beforeEach(() => jest.clearAllMocks());

// ── Games ──────────────────────────────────────────────────────────────────

describe('GET /Games', () => {
  it('requests games sorted by time descending and returns them in that order', async () => {
    // Simulates what Supabase returns after applying .order('time', { ascending: false })
    const games = [
      { id: 4, time: '2026-06-01T19:00:00' },
      { id: 2, time: '2026-03-15T19:00:00' },
      { id: 1, time: '2026-01-01T19:00:00' },
    ];
    const chain = mockChain({ data: games, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).get('/Games');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(games);
    expect(mockFrom).toHaveBeenCalledWith('Game');
    expect(chain.order).toHaveBeenCalledWith('time', { ascending: false });
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
    const successChain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(successChain);

    const res = await request(app).delete('/Game/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Game deleted' });
    expect(mockFrom).toHaveBeenCalledWith('PlayerGame');
    expect(mockFrom).toHaveBeenCalledWith('Game');
  });

  it('returns 500 when Supabase rejects the id', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: { message: 'invalid input syntax for type integer' } }));

    const res = await request(app).delete('/Game/abc');

    expect(res.status).toBe(500);
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

  it('returns 200 with empty array when game has no players', async () => {
    mockFrom.mockReturnValue(mockChain({ data: [], error: null }));

    const res = await request(app).get('/Game/999/players');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 with null when game id does not exist', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: null }));

    const res = await request(app).get('/Game/999/players');

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('returns 500 when Supabase rejects the id', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: { message: 'invalid input syntax for type integer' } }));

    const res = await request(app).get('/Game/abc/players');

    expect(res.status).toBe(500);
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

  it('defaults score to 0 when not provided', async () => {
    const chain = mockChain({ data: { id: 11, gameId: 1, playerId: 2, score: 0 }, error: null });
    mockFrom.mockReturnValue(chain);

    await request(app)
      .post('/Game/1/player')
      .send({ playerId: 2 });

    expect(chain.insert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ score: 0 })])
    );
  });

  it('returns 500 when Supabase rejects the game id', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: { message: 'invalid input syntax for type integer' } }));

    const res = await request(app)
      .post('/Game/abc/player')
      .send({ playerId: 2, score: 0 });

    expect(res.status).toBe(500);
  });
});

describe('PUT /Game/:gameId/player/:playerId', () => {
  it('updates a player score and returns success message', async () => {
    const chain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .put('/Game/1/player/2')
      .send({ score: 2500 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Score updated' });
    expect(chain.update).toHaveBeenCalledWith({ score: 2500 });
    expect(chain.eq).toHaveBeenCalledWith('gameId', '1');
    expect(chain.eq).toHaveBeenCalledWith('playerId', '2');
  });

  it('returns 500 when Supabase rejects the id', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: { message: 'invalid input syntax for type integer' } }));

    const res = await request(app)
      .put('/Game/abc/player/xyz')
      .send({ score: 2500 });

    expect(res.status).toBe(500);
  });
});

describe('DELETE /Game/:gameId/player/:playerId', () => {
  it('removes a player from a game and returns success message', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: null }));

    const res = await request(app).delete('/Game/1/player/2');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Player removed from game' });
  });

  it('returns 500 when Supabase rejects the id', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: { message: 'invalid input syntax for type integer' } }));

    const res = await request(app).delete('/Game/abc/player/xyz');

    expect(res.status).toBe(500);
  });
});

// ── Players ────────────────────────────────────────────────────────────────

describe('GET /Players', () => {
  it('returns players ordered by name with game count', async () => {
    const players = [
      { id: 1, name: 'Alice', emailAddress: 'a@b.com', PlayerGame: [{ count: 3 }] },
      { id: 2, name: 'Bob', emailAddress: 'b@b.com', PlayerGame: [{ count: 1 }] },
    ];
    const chain = mockChain({ data: players, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).get('/Players');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(players);
    expect(mockFrom).toHaveBeenCalledWith('Player');
    expect(chain.order).toHaveBeenCalledWith('name');
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

  it('returns 200 with null when player id does not exist', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: null }));

    const res = await request(app).get('/Player/999/games');

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('returns 500 when Supabase rejects the id', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: { message: 'invalid input syntax for type integer' } }));

    const res = await request(app).get('/Player/abc/games');

    expect(res.status).toBe(500);
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

describe('GET /', () => {
  it('returns server status message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Monopoly server running.');
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

  it('returns 200 with null when player id does not exist', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: null }));

    const res = await request(app).delete('/Player/999');

    expect(res.status).toBe(200);
  });

  it('returns 500 when Supabase rejects the id', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: { message: 'invalid input syntax for type integer' } }));

    const res = await request(app).delete('/Player/abc');

    expect(res.status).toBe(500);
  });
});
