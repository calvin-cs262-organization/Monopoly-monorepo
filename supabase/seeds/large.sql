truncate "PlayerGame", "Game", "Player" restart identity cascade;

-- 200 players: "Player 001" … "Player 200"
insert into "Player" (name, "emailAddress")
select
  'Player ' || lpad(i::text, 3, '0'),
  'player' || i || '@example.com'
from generate_series(1, 200) as i;

-- 50 games, one per week starting 2025-01-06 (oldest → lowest ID)
insert into "Game" (time)
select '2025-01-06T19:00:00Z'::timestamptz + (i - 1) * interval '7 days'
from generate_series(1, 50) as i;

-- PlayerGame: player p plays in game g when (g.id - 1) % 10 = (p.id - 1) % 10
-- → each player appears in exactly 5 games; each game has exactly 20 players.
-- score = player_id * 50
insert into "PlayerGame" ("gameId", "playerId", score)
select g.id, p.id, p.id * 50
from "Player" p
join "Game" g on (g.id - 1) % 10 = (p.id - 1) % 10;
