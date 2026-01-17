import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkBookingConflict } from '@/lib/bookings';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; roomId: string }> }
) {
  try {
    const { token, roomId } = await params;

    // Verify token
    const settings = await prisma.userSetting.findUnique({
      where: { boardPublicToken: token }
    });

    if (!settings) {
      return NextResponse.json({ error: 'Invalid board token' }, { status: 404 });
    }

    // Verify room exists and is active
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room || !room.isActive) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const body = await request.json();
    const { durationMinutes, title } = body;

    // Validate duration
    if (
      !durationMinutes ||
      !settings.bookingDurations.includes(durationMinutes)
    ) {
      return NextResponse.json(
        { error: 'Invalid duration' },
        { status: 400 }
      );
    }

    // Validate title
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (title.trim().length > 120) {
      return NextResponse.json(
        { error: 'Title is too long (max 120 characters)' },
        { status: 400 }
      );
    }

    // Calculate start and end times
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // Check for conflicts
    const hasConflict = await checkBookingConflict(roomId, startTime, endTime);
    if (hasConflict) {
      return NextResponse.json(
        { error: 'Room is already booked for this time' },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        roomId,
        title: title.trim(),
        startTime,
        endTime,
        source: 'board',
        status: 'active'
      }
    });

    return NextResponse.json({
      booking: {
        id: booking.id,
        roomId: booking.roomId,
        title: booking.title,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Book room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
