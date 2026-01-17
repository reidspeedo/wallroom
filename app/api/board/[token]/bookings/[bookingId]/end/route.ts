import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; bookingId: string }> }
) {
  try {
    const { token, bookingId } = await params;

    // Verify token
    const settings = await prisma.userSetting.findUnique({
      where: { boardPublicToken: token }
    });

    if (!settings) {
      return NextResponse.json({ error: 'Invalid board token' }, { status: 404 });
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'active') {
      return NextResponse.json(
        { error: 'Booking is not active' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Check if booking has already ended
    if (booking.endTime <= now) {
      // Already ended, mark as ended
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'ended' }
      });
      return NextResponse.json(
        { error: 'Booking has already ended' },
        { status: 400 }
      );
    }

    // End the booking early
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        endedEarlyAt: now,
        status: 'ended'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
