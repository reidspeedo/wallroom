import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';

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

export default async function HomePage() {
  logDebug('H4', 'app/page.tsx:29', 'home page entry', {});

  try {
    const settings = await prisma.userSetting.findFirst();
    logDebug('H5', 'app/page.tsx:33', 'user settings lookup', {
      hasSettings: Boolean(settings)
    });

    if (!settings) {
      redirect('/setup');
    }

    redirect('/admin/login');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logDebug('H6', 'app/page.tsx:44', 'user settings lookup failed', {
      message
    });
    redirect('/setup');
  }
}

