import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root path handling - check if setup is needed
  if (pathname === '/') {
    try {
      const settings = await prisma.userSetting.findFirst();
      
      if (!settings) {
        // No setup yet, redirect to setup page
        return NextResponse.redirect(new URL('/setup', request.url));
      }
      
      // Setup complete, redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    } catch (error) {
      // Database connection issues, show error or redirect to setup
      return NextResponse.redirect(new URL('/setup', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|board).*)'
  ]
};
