import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRoomStatus, expireOldBookings } from '@/lib/bookings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Verify token
    const settings = await prisma.userSetting.findUnique({
      where: { boardPublicToken: token }
    });

    if (!settings) {
      return NextResponse.json({ error: 'Invalid board token' }, { status: 404 });
    }

    // Expire old bookings
    await expireOldBookings();

    const now = new Date();

    // Get all active rooms
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }]
    });

    // Get status for each room
    const roomsWithStatus = await Promise.all(
      rooms.map(async (room) => {
        const roomStatus = await getRoomStatus(
          room.id,
          now,
          settings.extendIncrements
        );
        return {
          id: room.id,
          name: room.name,
          color: room.color,
          isActive: room.isActive,
          ...roomStatus
        };
      })
    );

    return NextResponse.json({
      serverTime: now.toISOString(),
      rooms: roomsWithStatus,
      bookingDurations: settings.bookingDurations,
      extendIncrements: settings.extendIncrements
    });
  } catch (error) {
    console.error('Board state error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
