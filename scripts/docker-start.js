const { spawn } = require('node:child_process');
const fs = require('node:fs');

const SERVER_ENDPOINT =
  'http://127.0.0.1:7243/ingest/574ee7da-3486-45cc-b0c4-25e90c71fca4';
const SESSION_ID = 'debug-session';
const RUN_ID = process.env.DEBUG_RUN_ID || 'pre-fix';
const LOG_PATH = '/app/.cursor/debug.log';

function logDebug({ hypothesisId, location, message, data }) {
  const payload = {
    sessionId: SESSION_ID,
    runId: RUN_ID,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now()
  };

  // #region agent log
  try {
    fs.mkdirSync('/app/.cursor', { recursive: true });
    fs.appendFileSync(LOG_PATH, `${JSON.stringify(payload)}\n`);
  } catch (error) {
    // Use stdout as a fallback to surface logging failures in docker logs.
    console.error('[debug-log-write-failed]', error.message);
  }
  // #endregion

  // #region agent log
  fetch(SERVER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
  // #endregion
}

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
  // #region agent log
  console.log('[docker-start] defaulted PRISMA_CLIENT_ENGINE_TYPE=library');
  // #endregion
}

function runCmd(command, args, hypothesisId, envOverrides) {
  logDebug({
    hypothesisId,
    location: 'scripts/docker-start.js:28',
    message: 'spawn start',
    data: { command, args, envOverrides: envOverrides ?? null }
  });

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: envOverrides ? { ...process.env, ...envOverrides } : process.env
    });

    child.on('error', (error) => {
      logDebug({
        hypothesisId,
        location: 'scripts/docker-start.js:39',
        message: 'spawn error',
        data: { command, args, error: error.message }
      });
      reject(error);
    });

    child.on('exit', (code, signal) => {
      logDebug({
        hypothesisId,
        location: 'scripts/docker-start.js:49',
        message: 'spawn exit',
        data: { command, args, code, signal }
      });
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
      }
    });
  });
}

async function main() {
  console.log('[docker-start] using pnpm exec next dev args');
  // #region agent log
  try {
    fs.mkdirSync('/app/.cursor', { recursive: true });
    fs.appendFileSync(
      LOG_PATH,
      `${JSON.stringify({
        sessionId: SESSION_ID,
        runId: RUN_ID,
        hypothesisId: 'LOG',
        location: 'scripts/docker-start.js:68',
        message: 'debug log bootstrap write',
        data: { logPath: LOG_PATH },
        timestamp: Date.now()
      })}\n`
    );
  } catch (error) {
    console.error('[debug-log-bootstrap-failed]', error.message);
  }
  // #endregion

  logDebug({
    hypothesisId: 'A',
    location: 'scripts/docker-start.js:90',
    message: 'docker start script begin',
    data: { cwd: process.cwd(), node: process.version }
  });

  try {
    await runCmd('pnpm', ['db:generate'], 'C', {
      PRISMA_CLIENT_ENGINE_TYPE: 'library'
    });
    await runCmd('pnpm', ['prisma', 'db', 'push'], 'C');
    console.log(
      '[docker-start] run:',
      'pnpm exec next dev --hostname 0.0.0.0 --turbopack'
    );
    await runCmd(
      'pnpm',
      ['exec', 'next', 'dev', '--hostname', '0.0.0.0', '--turbopack'],
      'A'
    );
  } catch (error) {
    logDebug({
      hypothesisId: 'A',
      location: 'scripts/docker-start.js:80',
      message: 'docker start script failed',
      data: { error: error.message }
    });
    process.exit(1);
  }
}

main();

