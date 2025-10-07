import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './lib/adminAuth';

export async function middleware(req: NextRequest) {
  const PASS = process.env.ADMIN_PASSWORD;
  if (!PASS) {
    return new NextResponse('Admin password not configured', { status: 500 });
  }

  const { pathname } = req.nextUrl;
  // Allow the login page itself
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('admin_session')?.value;
  if (cookie) {
    const ok = await verifySessionToken(cookie, PASS);
    if (ok) {
      return NextResponse.next();
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'],
};
