import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://clftouxlvxytggpdfirw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZnRvdXhsdnh5dGdncGRmaXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIzNjk5NSwiZXhwIjoyMDkzODEyOTk1fQ.OlxR3MHjRCMYlOaryCsQUK6TWxh0zGrq5XzICokfIHk';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Game {
  id: number;
  time: string;
}

export interface Player {
  id: number;
  name: string;
  emailAddress: string;
}

export interface PlayerGame {
  id: number;
  gameId: number;
  playerId: number;
  score: number;
}

export type PlayerGameWithPlayer = PlayerGame & { Player: Player };
export type PlayerGameWithGame = PlayerGame & { Game: Game };
export type PlayerWithGameCount = Player & { PlayerGame: { count: number }[] };

// Business logic layer: all database access lives here. Functions return
// data on success and throw on error.

// --- Games ---

export async function getGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('Game')
    .select('*')
    .order('time', { ascending: false });
  if (error) {
    throw error;
  }
  return data as Game[];
}

export async function createGame(time: string | undefined): Promise<Game> {
  const { data, error } = await supabase
    .from('Game')
    .insert([{ time }])
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data as Game;
}

export async function deleteGame(id: string): Promise<void> {
  // Remove all PlayerGame rows first to avoid FK violation
  await supabase.from('PlayerGame').delete().eq('gameId', id);
  const { error } = await supabase.from('Game').delete().eq('id', id);
  if (error) {
    throw error;
  }
}

// --- PlayerGame (players in a game with scores) ---

export async function getGamePlayers(gameId: string): Promise<PlayerGameWithPlayer[]> {
  const { data, error } = await supabase
    .from('PlayerGame')
    .select('*, Player(*)')
    .eq('gameId', gameId);
  if (error) {
    throw error;
  }
  return data as PlayerGameWithPlayer[];
}

export async function addPlayerToGame(
  gameId: string,
  playerId: number,
  score?: number,
): Promise<PlayerGame> {
  const { data, error } = await supabase
    .from('PlayerGame')
    .insert([{ gameId, playerId, score: score ?? 0 }])
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data as PlayerGame;
}

export async function updatePlayerScore(gameId: string, playerId: string, score: number): Promise<void> {
  const { error } = await supabase
    .from('PlayerGame')
    .update({ score })
    .eq('gameId', gameId)
    .eq('playerId', playerId);
  if (error) {
    throw error;
  }
}

export async function removePlayerFromGame(gameId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from('PlayerGame')
    .delete()
    .eq('gameId', gameId)
    .eq('playerId', playerId);
  if (error) {
    throw error;
  }
}

// --- Players ---

export async function getPlayers(): Promise<PlayerWithGameCount[]> {
  const { data, error } = await supabase
    .from('Player')
    .select('*, PlayerGame(count)')
    .order('name');
  if (error) {
    throw error;
  }
  return data as PlayerWithGameCount[];
}

export async function getPlayerGames(playerId: string): Promise<PlayerGameWithGame[]> {
  const { data, error } = await supabase
    .from('PlayerGame')
    .select('*, Game(*)')
    .eq('playerId', playerId);
  if (error) {
    throw error;
  }
  return data as PlayerGameWithGame[];
}

export async function createPlayer(name: string, emailAddress: string): Promise<Player> {
  const { data, error } = await supabase
    .from('Player')
    .insert([{ name, emailAddress }])
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data as Player;
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase.from('Player').delete().eq('id', id);
  if (error) {
    throw error;
  }
}
