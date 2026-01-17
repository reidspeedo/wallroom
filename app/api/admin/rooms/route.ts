import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/session';

export async function GET() {
  try {
    // Check authentication
    await requireAdminSession();

    const rooms = await prisma.room.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json({
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        color: room.color,
        isActive: room.isActive,
        displayOrder: room.displayOrder,
        capacity: room.capacity,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get rooms error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    await requireAdminSession();

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Get the highest display order and add 1
    const maxOrderRoom = await prisma.room.findFirst({
      orderBy: { displayOrder: 'desc' }
    });
    const displayOrder = (maxOrderRoom?.displayOrder || 0) + 1;

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
        displayOrder,
        isActive: true
      }
    });

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        color: room.color,
        isActive: room.isActive,
        displayOrder: room.displayOrder
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
