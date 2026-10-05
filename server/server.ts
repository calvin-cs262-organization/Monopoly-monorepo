import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import * as service from './service';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// --- Games ---

app.get('/Games', async (req: Request, res: Response) => {
  try {
    res.json(await service.getGames());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/Game', async (req: Request, res: Response) => {
  try {
    res.status(201).json(await service.createGame(req.body.time));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/Game/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    await service.deleteGame(req.params.id);
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- PlayerGame (players in a game with scores) ---

app.get('/Game/:id/players', async (req: Request<{ id: string }>, res: Response) => {
  try {
    res.json(await service.getGamePlayers(req.params.id));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/Game/:id/player', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const data = await service.addPlayerToGame(req.params.id, req.body.playerId, req.body.score);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/Game/:gameId/player/:playerId', async (req: Request<{ gameId: string; playerId: string }>, res: Response) => {
  try {
    await service.updatePlayerScore(req.params.gameId, req.params.playerId, req.body.score);
    res.json({ message: 'Score updated' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/Game/:gameId/player/:playerId', async (req: Request<{ gameId: string; playerId: string }>, res: Response) => {
  try {
    await service.removePlayerFromGame(req.params.gameId, req.params.playerId);
    res.json({ message: 'Player removed from game' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- Players ---

app.get('/Players', async (req: Request, res: Response) => {
  try {
    res.json(await service.getPlayers());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/Player/:id/games', async (req: Request<{ id: string }>, res: Response) => {
  try {
    res.json(await service.getPlayerGames(req.params.id));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/Player', async (req: Request, res: Response) => {
  try {
    const data = await service.createPlayer(req.body.name, req.body.emailAddress);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/Player/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    await service.deletePlayer(req.params.id);
    res.json({ message: 'Player deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/', (req: Request, res: Response) => res.send('Monopoly server running.'));

export default app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
