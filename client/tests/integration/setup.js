'use strict';

const { execSync, spawn } = require('child_process');
const path = require('path');

const E2E_PORT = 3001;
const projectRoot = path.resolve(__dirname, '../../..');

module.exports = async function globalSetup() {
  // Step 1: Read the local Supabase stack's API URL, service-role key, and DB
  // connection string. These are only available while `supabase start` is running.
  const status = JSON.parse(
    execSync('supabase status --output json', {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString()
  );

  // Step 2: Seed the database with the large fixture (50 games, 200 players).
  // psql applies the SQL file directly, bypassing the Supabase JS client.
  execSync(
    `psql "${status.DB_URL}" -f "${path.resolve(projectRoot, 'supabase/seeds/large.sql')}"`,
    { stdio: 'pipe' }
  );

  // Step 3: Start the Express server as a child process on E2E_PORT so the
  // client components can make real HTTP calls. We spawn instead of require()
  // to avoid cross-package Babel resolution issues between client and server.
  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(projectRoot, 'server'),
    env: {
      ...process.env,
      PORT: String(E2E_PORT),
      SUPABASE_URL: status.API_URL,
      SUPABASE_KEY: status.SERVICE_ROLE_KEY,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Step 4: Wait until the server signals it is ready before letting tests run.
  // The 3 s fallback handles cases where stdout is buffered or the message changes.
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('running')) resolve();
    });
    server.on('error', reject);
    setTimeout(resolve, 3000);
  });

  // Step 5: Save the PID so globalTeardown (teardown.js) can kill the process.
  global.__E2E_SERVER_PID__ = server.pid;
};
