'use strict';

module.exports = async function globalTeardown() {
  const pid = global.__E2E_SERVER_PID__;
  if (pid) {
    try { process.kill(pid, 'SIGTERM'); } catch { /* already gone */ }
  }
};
