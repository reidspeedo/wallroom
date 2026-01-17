import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    await requireAdminSession();

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Get current settings
    const settings = await prisma.userSetting.findFirst();
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Settings not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      currentPassword,
      settings.adminPasswordHash
    );
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.userSetting.update({
      where: { id: settings.id },
      data: { adminPasswordHash: newPasswordHash }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
