'use strict';

jest.unmock('@supabase/supabase-js');

const request = require('supertest');

const { seedLarge } = require('./fixtures');
const app = require('../../server');

// seedLarge inserts 50 games and 200 players.
// Distribution: player at index pi (ID = pi+1) plays in the 5 games where
//   gameIndex % 10 === pi % 10
// so each game has exactly 20 players and each player has exactly 5 games.
//
// Games are inserted oldest-first (game ID 1 = oldest), so GET /Games
// sorted by time descending returns game ID 50 first.

beforeAll(() => seedLarge(), 30000);

describe('Large DB — GET /Games', () => {
  it('returns all 50 games', async () => {
    const res = await request(app).get('/Games');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(50);
  });

  it('games are sorted newest first', async () => {
    const res = await request(app).get('/Games');
    const times = res.body.map((g) => g.time);
    expect(times).toEqual([...times].sort((a, b) => b.localeCompare(a)));
  });
});

describe('Large DB — GET /Players', () => {
  it('returns all 200 players', async () => {
    const res = await request(app).get('/Players');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(200);
  });

  it('players are sorted alphabetically by name', async () => {
    const res = await request(app).get('/Players');
    const names = res.body.map((p) => p.name);
    expect(names).toEqual([...names].sort());
  });

  it('first player is "Player 001"', async () => {
    const res = await request(app).get('/Players');
    expect(res.body[0].name).toBe('Player 001');
  });

  it('last player is "Player 200"', async () => {
    const res = await request(app).get('/Players');
    expect(res.body[199].name).toBe('Player 200');
  });
});

describe('Large DB — GET /Game/:id/players', () => {
  it('game 1 has exactly 20 players', async () => {
    const res = await request(app).get('/Game/1/players');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(20);
  });

  it('each entry has a nested Player object', async () => {
    const res = await request(app).get('/Game/1/players');
    for (const row of res.body) {
      expect(row).toHaveProperty('Player');
      expect(row.Player).toHaveProperty('name');
    }
  });

  it('returns 500 for non-integer game id', async () => {
    const res = await request(app).get('/Game/abc/players');
    expect(res.status).toBe(500);
  });
});

describe('Large DB — GET /Player/:id/games', () => {
  it('player 1 has exactly 5 games', async () => {
    const res = await request(app).get('/Player/1/games');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });

  it('each entry has a nested Game object', async () => {
    const res = await request(app).get('/Player/1/games');
    for (const row of res.body) {
      expect(row).toHaveProperty('Game');
      expect(row.Game).toHaveProperty('time');
    }
  });

  it('returns 500 for non-integer player id', async () => {
    const res = await request(app).get('/Player/abc/games');
    expect(res.status).toBe(500);
  });
});

describe('Large DB — mutations still work', () => {
  it('POST /Game adds a 51st game', async () => {
    const create = await request(app)
      .post('/Game')
      .send({ time: '2026-01-01T00:00:00+00' });
    expect(create.status).toBe(201);

    const list = await request(app).get('/Games');
    expect(list.body).toHaveLength(51);

    await request(app).delete(`/Game/${create.body.id}`);
  });

  it('POST /Player adds a 201st player', async () => {
    const create = await request(app)
      .post('/Player')
      .send({ name: 'Zara', emailAddress: 'zara@example.com' });
    expect(create.status).toBe(201);

    const list = await request(app).get('/Players');
    expect(list.body).toHaveLength(201);

    await request(app).delete(`/Player/${create.body.id}`);
  });
});
