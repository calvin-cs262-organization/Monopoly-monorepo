import { execSync } from 'child_process';
import path from 'path';

const DB_URL =
  process.env.SUPABASE_DB_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const SEEDS = path.resolve(__dirname, '../../../supabase/seeds');

export const seedLarge = () =>
  execSync(`psql "${DB_URL}" -f "${path.join(SEEDS, 'large.sql')}"`, {
    stdio: 'pipe',
  });
