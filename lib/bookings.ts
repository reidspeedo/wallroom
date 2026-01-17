import 'server-only';
import { prisma } from './prisma';

export interface RoomStatus {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
  status: 'free' | 'occupied';
  currentBooking?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    canExtend: boolean;
    canEndEarly: boolean;
  };
  nextBooking?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
  };
}

export async function getCurrentAndNextBookings(roomId: string, now: Date) {
  const currentBooking = await prisma.booking.findFirst({
    where: {
      roomId,
      status: 'active',
      startTime: { lte: now },
      endTime: { gt: now }
    },
    orderBy: { startTime: 'asc' }
  });

  const nextBooking = await prisma.booking.findFirst({
    where: {
      roomId,
      status: 'active',
      startTime: { gt: now }
    },
    orderBy: { startTime: 'asc' }
  });

  return { currentBooking, nextBooking };
}

export async function getRoomStatus(
  roomId: string,
  now: Date,
  extendIncrements: number[]
): Promise<Omit<RoomStatus, 'id' | 'name' | 'color' | 'isActive'>> {
  const { currentBooking, nextBooking } = await getCurrentAndNextBookings(
    roomId,
    now
  );

  if (currentBooking) {
    // Check if booking can be extended
    let canExtend = false;
    if (extendIncrements.length > 0) {
      const smallestIncrement = Math.min(...extendIncrements);
      const extendedEndTime = new Date(
        currentBooking.endTime.getTime() + smallestIncrement * 60 * 1000
      );

      // Check if extension would conflict with next booking
      if (nextBooking) {
        canExtend = extendedEndTime <= nextBooking.startTime;
      } else {
        canExtend = true;
      }
    }

    return {
      status: 'occupied',
      currentBooking: {
        id: currentBooking.id,
        title: currentBooking.title,
        startTime: currentBooking.startTime.toISOString(),
        endTime: currentBooking.endTime.toISOString(),
        canExtend,
        canEndEarly: true
      },
      nextBooking: nextBooking
        ? {
            id: nextBooking.id,
            title: nextBooking.title,
            startTime: nextBooking.startTime.toISOString(),
            endTime: nextBooking.endTime.toISOString()
          }
        : undefined
    };
  }

  return {
    status: 'free',
    nextBooking: nextBooking
      ? {
          id: nextBooking.id,
          title: nextBooking.title,
          startTime: nextBooking.startTime.toISOString(),
          endTime: nextBooking.endTime.toISOString()
        }
      : undefined
  };
}

export async function checkBookingConflict(
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId,
      status: 'active',
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      OR: [
        {
          // New booking starts during existing booking
          startTime: { lte: startTime },
          endTime: { gt: startTime }
        },
        {
          // New booking ends during existing booking
          startTime: { lt: endTime },
          endTime: { gte: endTime }
        },
        {
          // New booking completely contains existing booking
          startTime: { gte: startTime },
          endTime: { lte: endTime }
        }
      ]
    }
  });

  return !!conflict;
}

export async function expireOldBookings() {
  const now = new Date();

  const result = await prisma.booking.updateMany({
    where: {
      status: 'active',
      endTime: { lte: now }
    },
    data: {
      status: 'ended'
    }
  });

  return result.count;
}
