'use strict';

// Reads SUPABASE_URL, SUPABASE_KEY, and SUPABASE_DB_URL from the local
// Supabase stack (supabase status) so no credentials are hardcoded.
// Runs once per Jest worker via setupFiles; subsequent test files skip the
// execSync call because the env vars are already set.

const { execSync } = require('child_process');
const path = require('path');

if (!process.env.SUPABASE_KEY) {
  try {
    const status = JSON.parse(
      execSync('supabase status --output json', {
        cwd: path.resolve(__dirname, '../../..'),
        stdio: ['pipe', 'pipe', 'ignore'],
      }).toString()
    );
    process.env.SUPABASE_URL = process.env.SUPABASE_URL || status.API_URL;
    process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || status.SERVICE_ROLE_KEY;
    process.env.SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || status.DB_URL;
  } catch {
    // supabase not running; integration tests will fail with a clear network error
  }
}
