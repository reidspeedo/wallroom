import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAdapter: PrismaPg | undefined;
  prismaPool: Pool | undefined;
};

const getAdapter = () => {
  if (globalForPrisma.prismaAdapter) {
    return globalForPrisma.prismaAdapter;
  }

  if (!process.env.DATABASE_URL) {
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

    return client;
  } catch (error) {
    throw error;
  }
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
