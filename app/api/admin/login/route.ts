import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get admin settings
    const settings = await prisma.userSetting.findFirst();
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Setup not completed' },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, settings.adminPasswordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    
    await createSession(ipAddress, userAgent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
