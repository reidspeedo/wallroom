import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkBookingConflict } from '@/lib/bookings';

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

    const body = await request.json();
    const { incrementMinutes } = body;

    // Validate increment
    if (
      !incrementMinutes ||
      !settings.extendIncrements.includes(incrementMinutes)
    ) {
      return NextResponse.json(
        { error: 'Invalid extension increment' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Booking has already ended' },
        { status: 400 }
      );
    }

    // Calculate new end time
    const newEndTime = new Date(
      booking.endTime.getTime() + incrementMinutes * 60 * 1000
    );

    // Check for conflicts (excluding current booking)
    const hasConflict = await checkBookingConflict(
      booking.roomId,
      booking.startTime,
      newEndTime,
      bookingId
    );

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Cannot extend: conflicts with another booking' },
        { status: 409 }
      );
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { endTime: newEndTime }
    });

    return NextResponse.json({
      booking: {
        id: updatedBooking.id,
        roomId: updatedBooking.roomId,
        title: updatedBooking.title,
        startTime: updatedBooking.startTime.toISOString(),
        endTime: updatedBooking.endTime.toISOString(),
        status: updatedBooking.status
      }
    });
  } catch (error) {
    console.error('Extend booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
