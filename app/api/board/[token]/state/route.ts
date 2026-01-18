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
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    // Get all active rooms
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }]
    });

    const roomIds = rooms.map((room) => room.id);
    const dayBookings = await prisma.booking.findMany({
      where: {
        roomId: { in: roomIds },
        status: 'active',
        OR: [
          { startTime: { gte: dayStart, lte: dayEnd } },
          { endTime: { gte: dayStart, lte: dayEnd } },
          { startTime: { lt: dayStart }, endTime: { gt: dayEnd } }
        ]
      },
      orderBy: { startTime: 'asc' }
    });

    const bookingsByRoom = dayBookings.reduce<Record<string, typeof dayBookings>>(
      (acc, booking) => {
        acc[booking.roomId] = acc[booking.roomId] || [];
        acc[booking.roomId].push(booking);
        return acc;
      },
      {}
    );

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
          layoutX: room.layoutX,
          layoutY: room.layoutY,
          layoutW: room.layoutW,
          layoutH: room.layoutH,
          dayBookings: (bookingsByRoom[room.id] || []).map((booking) => ({
            id: booking.id,
            title: booking.title,
            startTime: booking.startTime.toISOString(),
            endTime: booking.endTime.toISOString()
          })),
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
