import 'server-only';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(ipAddress?: string, userAgent?: string) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: {
      sessionToken,
      expiresAt,
      ipAddress,
      userAgent,
      admin: true
    }
  });

  (await cookies()).set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  });

  return session;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken }
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: { sessionToken }
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAdminSession() {
  const session = await getSession();

  if (!session || !session.admin) {
    throw new Error('Unauthorized');
  }

  return session;
}
