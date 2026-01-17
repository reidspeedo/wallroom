import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Check if setup has already been done
    const existingSettings = await prisma.userSetting.findFirst();
    if (existingSettings) {
      return NextResponse.json(
        { success: false, error: 'Setup already completed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      adminPassword,
      timeZone,
      pollIntervalSeconds,
      bookingDurations,
      extendIncrements
    } = body;

    // Validate password
    if (!adminPassword || adminPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Hash password
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    // Generate unique board token
    const boardPublicToken = crypto.randomBytes(32).toString('hex');

    // Create settings
    const settings = await prisma.userSetting.create({
      data: {
        adminPasswordHash,
        boardPublicToken,
        pollIntervalSeconds: pollIntervalSeconds || 10,
        timeZone: timeZone || null,
        bookingDurations: bookingDurations || [15, 30, 60, 90, 120],
        extendIncrements: extendIncrements || [15, 30]
      }
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const boardPublicUrl = `${baseUrl}/board/${settings.boardPublicToken}`;

    return NextResponse.json({
      success: true,
      boardPublicUrl
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
