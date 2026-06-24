'use strict';

const path = require('path');
const { execSync } = require('child_process');

const DB_URL =
  process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

function runSql(file) {
  execSync(`psql "${DB_URL}" -f "${file}"`, { stdio: 'pipe' });
}

const SEEDS = path.resolve(__dirname, '../../../supabase/seeds');

const clearAll = () => runSql(path.join(SEEDS, 'empty.sql'));
const seedSmall = () => runSql(path.join(SEEDS, 'small.sql'));
const seedLarge = () => runSql(path.join(SEEDS, 'large.sql'));

module.exports = { clearAll, seedSmall, seedLarge };
