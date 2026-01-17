import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAdapter: PrismaPg | undefined;
  prismaPool: Pool | undefined;
};

const LOG_ENDPOINT =
  'http://127.0.0.1:7243/ingest/574ee7da-3486-45cc-b0c4-25e90c71fca4';

const logDebug = (
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) => {
  // #region agent log
  fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion
};

const getAdapter = () => {
  if (globalForPrisma.prismaAdapter) {
    return globalForPrisma.prismaAdapter;
  }

  if (!process.env.DATABASE_URL) {
    logDebug('H7', 'lib/prisma.ts:36', 'missing DATABASE_URL for adapter', {});
    return undefined;
  }

  const pool = globalForPrisma.prismaPool ?? new Pool({
    connectionString: process.env.DATABASE_URL
  });
  globalForPrisma.prismaPool = pool;
  globalForPrisma.prismaAdapter = new PrismaPg(pool);
  return globalForPrisma.prismaAdapter;
};

const createPrismaClient = () => {
  const adapter = getAdapter();

  // #region agent log
  console.log('[prisma-debug] adapter', {
    hasAdapter: Boolean(adapter)
  });
  // #endregion

  logDebug('H8', 'lib/prisma.ts:54', 'prisma adapter status', {
    hasAdapter: Boolean(adapter)
  });

  const initData = {
    nodeEnv: process.env.NODE_ENV,
    prismaClientEngineType: process.env.PRISMA_CLIENT_ENGINE_TYPE ?? null,
    prismaAccelerateUrlSet: Boolean(process.env.PRISMA_ACCELERATE_URL),
    prismaAdapterSet: Boolean(process.env.PRISMA_CLIENT_ENGINE_TYPE_ADAPTER),
    nextRuntime: process.env.NEXT_RUNTIME ?? null
  };

  // #region agent log
  console.log('[prisma-debug] init', initData);
  // #endregion

  logDebug('H1', 'lib/prisma.ts:30', 'prisma init', initData);

  try {
    const client = adapter
      ? new PrismaClient({
          adapter,
          log:
            process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
        })
      : new PrismaClient({
          log:
            process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
        });

    // #region agent log
    console.log('[prisma-debug] client created', {
      hasGlobal: Boolean(globalForPrisma.prisma)
    });
    // #endregion

    logDebug('H2', 'lib/prisma.ts:43', 'prisma client created', {
      hasGlobal: Boolean(globalForPrisma.prisma)
    });

    return client;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // #region agent log
    console.error('[prisma-debug] client creation failed', message);
    // #endregion

    logDebug('H3', 'lib/prisma.ts:50', 'prisma client creation failed', {
      message
    });
    throw error;
  }
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
