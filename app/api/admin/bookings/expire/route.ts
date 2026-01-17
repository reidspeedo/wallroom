import { NextResponse } from 'next/server';
import { expireOldBookings } from '@/lib/bookings';
import { requireAdminSession } from '@/lib/session';

export async function POST() {
  try {
    // Check authentication (optional - could also be called internally)
    await requireAdminSession();

    const expiredCount = await expireOldBookings();

    return NextResponse.json({ expiredCount });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Expire bookings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
