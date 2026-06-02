import { http, HttpResponse } from 'msw';

const BASE = 'http://test-server';

export const handlers = [
  http.get(`${BASE}/Games`, () =>
    HttpResponse.json([{ id: 1, time: '2026-01-01T19:00:00' }])
  ),
  http.get(`${BASE}/Players`, () =>
    HttpResponse.json([
      { id: 1, name: 'Alice', emailAddress: 'alice@example.com', PlayerGame: [{ count: 2 }] },
    ])
  ),
  http.get(`${BASE}/Game/:id/players`, () =>
    HttpResponse.json([
      { id: 10, gameId: 1, playerId: 1, score: 1500, Player: { id: 1, name: 'Alice', emailAddress: 'alice@example.com' } },
    ])
  ),
  http.post(`${BASE}/Game`, () =>
    HttpResponse.json({ id: 2, time: '2026-06-02T19:00:00' }, { status: 201 })
  ),
  http.delete(`${BASE}/Game/:id`, () =>
    HttpResponse.json({ message: 'Game deleted' })
  ),
  http.post(`${BASE}/Game/:id/player`, () =>
    HttpResponse.json({ id: 11, gameId: 1, playerId: 2, score: 0 }, { status: 201 })
  ),
  http.put(`${BASE}/Game/:gameId/player/:playerId`, () =>
    HttpResponse.json({ message: 'Score updated' })
  ),
  http.delete(`${BASE}/Game/:gameId/player/:playerId`, () =>
    HttpResponse.json({ message: 'Player removed from game' })
  ),
  http.get(`${BASE}/Player/:id/games`, () =>
    HttpResponse.json([
      { id: 10, gameId: 1, playerId: 1, score: 1500, Game: { id: 1, time: '2026-01-01T19:00:00' } },
    ])
  ),
  http.post(`${BASE}/Player`, () =>
    HttpResponse.json({ id: 3, name: 'Bob', emailAddress: 'bob@example.com' }, { status: 201 })
  ),
  http.delete(`${BASE}/Player/:id`, () =>
    HttpResponse.json({ message: 'Player deleted' })
  ),
];
