import { execSync, spawn } from 'child_process';
import path from 'path';

const API_PORT = 3001;
const projectRoot = path.resolve(__dirname, '../../..');

export default async function globalSetup() {
  // Step 1: Read Supabase credentials from the local running stack.
  const status = JSON.parse(
    execSync('supabase status --output json', {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString()
  );

  // Step 2: Seed the large fixture (50 games, 200 players) via psql.
  execSync(
    `psql "${status.DB_URL}" -f "${path.resolve(projectRoot, 'supabase/seeds/large.sql')}"`,
    { stdio: 'pipe' }
  );

  // Step 3: Start the Express API server so the web app's fetch calls succeed.
  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(projectRoot, 'server'),
    env: {
      ...process.env,
      PORT: String(API_PORT),
      SUPABASE_URL: status.API_URL,
      SUPABASE_KEY: status.SERVICE_ROLE_KEY,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await new Promise<void>((resolve, reject) => {
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('running')) resolve();
    });
    server.on('error', reject);
    setTimeout(resolve, 3000); // fallback if stdout is buffered
  });

  (global as any).__E2E_API_PID__ = server.pid;
}
