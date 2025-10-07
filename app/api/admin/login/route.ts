import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/adminAuth';

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: NextRequest) {
  const PASS = process.env.ADMIN_PASSWORD;
  if (!PASS) {
    return NextResponse.json({ error: 'Admin password not configured' }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const password = body?.password ?? '';

  if (password !== PASS) {
    return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 });
  }

  const token = await createSessionToken(PASS, MAX_AGE);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
  return res;
}
