'use strict';

/**
 * Integration tests — run against a local Supabase stack (supabase start).
 *
 * Before running: supabase start && supabase db reset
 * The seed in supabase/seed.sql is applied automatically by db reset.
 *
 * Run with: npm run test:integration
 */

// __mocks__/@supabase/supabase-js is auto-applied to all tests because it
// sits adjacent to node_modules. Unmock it so we hit the real local DB.
jest.unmock('@supabase/supabase-js');

const request = require('supertest');

const { seedSmall } = require('./fixtures');
const app = require('../../server');

beforeAll(() => seedSmall());

// ── GET / ──────────────────────────────────────────────────────────────────

describe('GET /', () => {
  it('returns server status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Monopoly server running.');
  });
});

// ── Players ────────────────────────────────────────────────────────────────

describe('GET /Players', () => {
  it('returns all players ordered by name', async () => {
    const res = await request(app).get('/Players');
    expect(res.status).toBe(200);
    const names = res.body.map((p) => p.name);
    expect(names).toEqual([...names].sort());
    expect(names).toContain('Alice');
    expect(names).toContain('Bob');
  });
});

describe('POST /Player + DELETE /Player/:id', () => {
  it('creates then deletes a player', async () => {
    const create = await request(app)
      .post('/Player')
      .send({ name: 'Dave', emailAddress: 'dave@example.com' });
    expect(create.status).toBe(201);
    expect(create.body.name).toBe('Dave');

    const id = create.body.id;
    const del = await request(app).delete(`/Player/${id}`);
    expect(del.status).toBe(200);
    expect(del.body.message).toBe('Player deleted');
  });
});

describe('GET /Player/:id/games', () => {
  it('returns games for player 1 with nested Game data', async () => {
    const res = await request(app).get('/Player/1/games');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('Game');
  });

  it('returns empty array for player with no games', async () => {
    const res = await request(app).get('/Player/3/games');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 for non-integer id', async () => {
    const res = await request(app).get('/Player/abc/games');
    expect(res.status).toBe(500);
  });
});

// ── Games ──────────────────────────────────────────────────────────────────

describe('GET /Games', () => {
  it('returns games sorted newest first', async () => {
    const res = await request(app).get('/Games');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
    const times = res.body.map((g) => g.time);
    expect(times).toEqual([...times].sort().reverse());
  });
});

describe('POST /Game + DELETE /Game/:id', () => {
  it('creates then deletes a game', async () => {
    const create = await request(app)
      .post('/Game')
      .send({ time: '2026-12-31T20:00:00+00' });
    expect(create.status).toBe(201);
    expect(create.body).toHaveProperty('id');

    const id = create.body.id;
    const del = await request(app).delete(`/Game/${id}`);
    expect(del.status).toBe(200);
    expect(del.body.message).toBe('Game deleted');
  });
});

// ── PlayerGame ─────────────────────────────────────────────────────────────

describe('GET /Game/:id/players', () => {
  it('returns players with nested Player data for game 1', async () => {
    const res = await request(app).get('/Game/1/players');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('Player');
  });

  it('returns empty array for game with no players', async () => {
    const res = await request(app).get('/Game/4/players');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 for non-integer id', async () => {
    const res = await request(app).get('/Game/abc/players');
    expect(res.status).toBe(500);
  });
});

describe('POST /Game/:id/player, PUT score, DELETE player', () => {
  it('adds a player to a game, updates their score, then removes them', async () => {
    const add = await request(app)
      .post('/Game/2/player')
      .send({ playerId: 2 });
    expect(add.status).toBe(201);
    expect(add.body.score).toBe(0);

    const update = await request(app)
      .put('/Game/2/player/2')
      .send({ score: 3000 });
    expect(update.status).toBe(200);
    expect(update.body.message).toBe('Score updated');

    const remove = await request(app).delete('/Game/2/player/2');
    expect(remove.status).toBe(200);
    expect(remove.body.message).toBe('Player removed from game');
  });
});
