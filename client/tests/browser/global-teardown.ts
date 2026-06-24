export default async function globalTeardown() {
  const pid = (global as any).__E2E_API_PID__;
  if (pid) {
    try { process.kill(pid, 'SIGTERM'); } catch { /* already gone */ }
  }
}
