import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const USER = process.env.ADMIN_USER || 'admin';
  const PASS = process.env.ADMIN_PASSWORD;

  // Fail closed if password not configured
  if (!PASS) {
    return new NextResponse('Admin password not configured', { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }

  const [scheme, encoded] = authHeader.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    return new NextResponse('Bad Authorization header', {
      status: 400,
    });
  }

  let decoded = '';
  try {
    decoded = atob(encoded);
  } catch (e) {
    return new NextResponse('Invalid Authorization encoding', { status: 400 });
  }

  const separatorIndex = decoded.indexOf(':');
  const user = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : '';
  const pass = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';

  if (user !== USER || pass !== PASS) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
