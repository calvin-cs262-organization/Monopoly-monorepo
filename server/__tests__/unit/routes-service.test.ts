'use strict';

// Unit tests for the Express routes with the service layer fully mocked.
// These check that each route calls the right service function with the right
// arguments and maps the result/error to the right HTTP response.
// Run with: npm test

jest.mock('../../service');

import request from 'supertest';
import * as service from '../../service';
import app from '../../server';

beforeEach(() => {
  jest.resetAllMocks();
});

// Each entry: [description, http method, path, body, service fn name,
// expected service args, resolved value, expected status, expected body]
type SuccessCase = [
  name: string,
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  body: object | undefined,
  fn: keyof typeof service,
  args: unknown[],
  resolved: unknown,
  status: number,
  expectedBody: unknown,
];

const successCases: SuccessCase[] = [
  [
    'GET /Games',
    'get',
    '/Games',
    undefined,
    'getGames',
    [],
    [
      {
        id: 1,
      },
    ],
    200,
    [
      {
        id: 1,
      },
    ],
  ],
  [
    'POST /Game',
    'post',
    '/Game',
    {
      time: '2026-06-02T19:00:00',
    },
    'createGame',
    ['2026-06-02T19:00:00'],
    {
      id: 2,
    },
    201,
    {
      id: 2,
    },
  ],
  [
    'DELETE /Game/:id',
    'delete',
    '/Game/5',
    undefined,
    'deleteGame',
    ['5'],
    undefined,
    200,
    {
      message: 'Game deleted',
    },
  ],
  [
    'GET /Game/:id/players',
    'get',
    '/Game/5/players',
    undefined,
    'getGamePlayers',
    ['5'],
    [
      {
        playerId: 1,
      },
    ],
    200,
    [
      {
        playerId: 1,
      },
    ],
  ],
  [
    'POST /Game/:id/player',
    'post',
    '/Game/5/player',
    {
      playerId: 3,
      score: 100,
    },
    'addPlayerToGame',
    ['5', 3, 100],
    {
      gameId: 5,
      playerId: 3,
    },
    201,
    {
      gameId: 5,
      playerId: 3,
    },
  ],
  [
    'PUT /Game/:gameId/player/:playerId',
    'put',
    '/Game/5/player/3',
    {
      score: 250,
    },
    'updatePlayerScore',
    ['5', '3', 250],
    undefined,
    200,
    {
      message: 'Score updated',
    },
  ],
  [
    'DELETE /Game/:gameId/player/:playerId',
    'delete',
    '/Game/5/player/3',
    undefined,
    'removePlayerFromGame',
    ['5', '3'],
    undefined,
    200,
    {
      message: 'Player removed from game',
    },
  ],
  [
    'GET /Players',
    'get',
    '/Players',
    undefined,
    'getPlayers',
    [],
    [
      {
        id: 1,
        name: 'Ann',
      },
    ],
    200,
    [
      {
        id: 1,
        name: 'Ann',
      },
    ],
  ],
  [
    'GET /Player/:id/games',
    'get',
    '/Player/7/games',
    undefined,
    'getPlayerGames',
    ['7'],
    [
      {
        gameId: 1,
      },
    ],
    200,
    [
      {
        gameId: 1,
      },
    ],
  ],
  [
    'POST /Player',
    'post',
    '/Player',
    {
      name: 'Bob',
      emailAddress: 'bob@example.com',
    },
    'createPlayer',
    ['Bob', 'bob@example.com'],
    {
      id: 9,
      name: 'Bob',
    },
    201,
    {
      id: 9,
      name: 'Bob',
    },
  ],
  [
    'DELETE /Player/:id',
    'delete',
    '/Player/7',
    undefined,
    'deletePlayer',
    ['7'],
    undefined,
    200,
    {
      message: 'Player deleted',
    },
  ],
];

describe('routes with mocked service layer', () => {
  describe.each(successCases)(
    '%s',
    (name, method, path, body, fn, args, resolved, status, expectedBody) => {
      it('calls the service and returns its result', async () => {
        (service[fn] as jest.Mock).mockResolvedValue(resolved);

        const req = request(app)[method](path);
        const res = await (body ? req.send(body) : req);

        expect(service[fn] as jest.Mock).toHaveBeenCalledTimes(1);
        expect(service[fn] as jest.Mock).toHaveBeenCalledWith(...args);
        expect(res.status).toBe(status);
        expect(res.body).toEqual(expectedBody);
      });

      it('returns 500 with the error message when the service throws', async () => {
        (service[fn] as jest.Mock).mockRejectedValue(new Error('boom'));

        const req = request(app)[method](path);
        const res = await (body ? req.send(body) : req);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({
          error: 'boom',
        });
      });
    },
  );

  it('POST /Game/:id/player passes an undefined score through to the service', async () => {
    (service.addPlayerToGame as jest.Mock).mockResolvedValue({
      gameId: 5,
      playerId: 3,
      score: 0,
    });

    const res = await request(app).post('/Game/5/player').send({
      playerId: 3,
    });

    expect(service.addPlayerToGame as jest.Mock).toHaveBeenCalledWith('5', 3, undefined);
    expect(res.status).toBe(201);
  });

  it('GET / does not touch the service', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toBe('Monopoly server running.');
    Object.values(service)
      .filter((fn) => typeof fn === 'function')
      .forEach((fn) => {
        expect(fn).not.toHaveBeenCalled();
      });
  });
});
