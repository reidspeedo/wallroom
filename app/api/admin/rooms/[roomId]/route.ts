import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // Check authentication
    await requireAdminSession();

    const { roomId } = await params;
    const body = await request.json();
    const {
      name,
      description,
      color,
      capacity,
      isActive,
      displayOrder,
      layoutX,
      layoutY,
      layoutW,
      layoutH,
      features
    } = body;

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color || null;
    if (capacity !== undefined) updateData.capacity = capacity ? Number(capacity) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (layoutX !== undefined) updateData.layoutX = layoutX;
    if (layoutY !== undefined) updateData.layoutY = layoutY;
    if (layoutW !== undefined) updateData.layoutW = layoutW;
    if (layoutH !== undefined) updateData.layoutH = layoutH;
    if (features !== undefined) updateData.features = Array.isArray(features) ? features : [];

    const room = await prisma.room.update({
      where: { id: roomId },
      data: updateData
    });

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        color: room.color,
        capacity: room.capacity,
        isActive: room.isActive,
        displayOrder: room.displayOrder,
        layoutX: room.layoutX,
        layoutY: room.layoutY,
        layoutW: room.layoutW,
        layoutH: room.layoutH,
        features: room.features || []
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // Check authentication
    await requireAdminSession();

    const { roomId } = await params;

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        bookings: {
          where: { status: 'active' }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Delete the room (cascade will handle bookings)
    await prisma.room.delete({
      where: { id: roomId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Delete room error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
