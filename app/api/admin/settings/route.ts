import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/session';

export async function GET() {
  try {
    // Check authentication
    await requireAdminSession();

    const settings = await prisma.userSetting.findFirst();
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const boardPublicUrl = `${baseUrl}/board/${settings.boardPublicToken}`;

    return NextResponse.json({
      timeZone: settings.timeZone,
      bookingDurations: settings.bookingDurations,
      extendIncrements: settings.extendIncrements,
      boardPublicUrl
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    await requireAdminSession();

    const body = await request.json();
    const {
      timeZone,
      bookingDurations,
      extendIncrements
    } = body;

    const settings = await prisma.userSetting.findFirst();
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Settings not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (timeZone !== undefined) updateData.timeZone = timeZone;
    if (bookingDurations !== undefined)
      updateData.bookingDurations = bookingDurations;
    if (extendIncrements !== undefined)
      updateData.extendIncrements = extendIncrements;

    await prisma.userSetting.update({
      where: { id: settings.id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
