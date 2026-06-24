truncate "PlayerGame", "Game", "Player" restart identity cascade;

insert into "Player" (id, name, "emailAddress") values
  (1, 'Alice', 'alice@example.com'),
  (2, 'Bob',   'bob@example.com'),
  (3, 'Carol', 'carol@example.com');

insert into "Game" (id, time) values
  (1, '2026-01-01T19:00:00+00'),
  (2, '2026-03-15T19:00:00+00'),
  (4, '2026-06-01T19:00:00+00');

insert into "PlayerGame" (id, "gameId", "playerId", score) values
  (10, 1, 1, 1500),
  (11, 1, 2,  800),
  (12, 2, 1, 2200);

-- Reset sequences so new inserts don't collide with fixture ids
select setval('"Player_id_seq"',  (select max(id) from "Player"));
select setval('"Game_id_seq"',    (select max(id) from "Game"));
select setval('"PlayerGame_id_seq"', (select max(id) from "PlayerGame"));
