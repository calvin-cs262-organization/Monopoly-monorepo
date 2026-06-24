'use strict';

jest.unmock('@supabase/supabase-js');

const request = require('supertest');

const { clearAll } = require('./fixtures');
const app = require('../../server');

beforeAll(() => clearAll());

describe('Empty DB — GET list endpoints return empty arrays', () => {
  it('GET /Games → []', async () => {
    const res = await request(app).get('/Games');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /Players → []', async () => {
    const res = await request(app).get('/Players');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /Game/1/players → [] (no PlayerGame rows)', async () => {
    const res = await request(app).get('/Game/1/players');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /Player/1/games → [] (no PlayerGame rows)', async () => {
    const res = await request(app).get('/Player/1/games');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('Empty DB — mutations still succeed', () => {
  it('DELETE /Game/1 on non-existent game returns success', async () => {
    const res = await request(app).delete('/Game/1');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Game deleted');
  });

  it('DELETE /Player/1 on non-existent player returns success', async () => {
    const res = await request(app).delete('/Player/1');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Player deleted');
  });

  it('POST /Game creates a game in an empty DB', async () => {
    const res = await request(app).post('/Game').send({ time: '2026-01-01T19:00:00+00' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('POST /Player creates a player in an empty DB', async () => {
    const res = await request(app)
      .post('/Player')
      .send({ name: 'Solo', emailAddress: 'solo@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Solo');
  });
});

describe('Empty DB — bad IDs still return 500', () => {
  it('GET /Game/abc/players → 500', async () => {
    const res = await request(app).get('/Game/abc/players');
    expect(res.status).toBe(500);
  });

  it('GET /Player/abc/games → 500', async () => {
    const res = await request(app).get('/Player/abc/games');
    expect(res.status).toBe(500);
  });
});
