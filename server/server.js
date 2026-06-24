const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const supabaseUrl = process.env.SUPABASE_URL || 'https://clftouxlvxytggpdfirw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZnRvdXhsdnh5dGdncGRmaXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIzNjk5NSwiZXhwIjoyMDkzODEyOTk1fQ.OlxR3MHjRCMYlOaryCsQUK6TWxh0zGrq5XzICokfIHk';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Games ---

app.get('/Games', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Game')
      .select('*')
      .order('time', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/Game', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Game')
      .insert([{ time: req.body.time }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/Game/:id', async (req, res) => {
  try {
    // Remove all PlayerGame rows first to avoid FK violation
    await supabase.from('PlayerGame').delete().eq('gameId', req.params.id);
    const { error } = await supabase.from('Game').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PlayerGame (players in a game with scores) ---

app.get('/Game/:id/players', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('PlayerGame')
      .select('*, Player(*)')
      .eq('gameId', req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/Game/:id/player', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('PlayerGame')
      .insert([{ gameId: req.params.id, playerId: req.body.playerId, score: req.body.score ?? 0 }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/Game/:gameId/player/:playerId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('PlayerGame')
      .update({ score: req.body.score })
      .eq('gameId', req.params.gameId)
      .eq('playerId', req.params.playerId);
    if (error) throw error;
    res.json({ message: 'Score updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/Game/:gameId/player/:playerId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('PlayerGame')
      .delete()
      .eq('gameId', req.params.gameId)
      .eq('playerId', req.params.playerId);
    if (error) throw error;
    res.json({ message: 'Player removed from game' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Players ---

app.get('/Players', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Player')
      .select('*, PlayerGame(count)')
      .order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/Player/:id/games', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('PlayerGame')
      .select('*, Game(*)')
      .eq('playerId', req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/Player', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Player')
      .insert([{ name: req.body.name, emailAddress: req.body.emailAddress }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/Player/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('Player').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Player deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Monopoly server running.'));

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
