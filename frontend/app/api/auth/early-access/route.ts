import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = '8pm-early-access';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const validUsername = process.env.EARLY_ACCESS_USERNAME || '';
    const validPassword = process.env.EARLY_ACCESS_PASSWORD || '';

    if (!validUsername || !validPassword) {
      return NextResponse.json({ success: false, error: 'Auth not configured' }, { status: 500 });
    }

    if (
      username?.trim().toLowerCase() === validUsername.toLowerCase() &&
      password?.toLowerCase() === validPassword.toLowerCase()
    ) {
      const response = NextResponse.json({ success: true });
      response.cookies.set(COOKIE_NAME, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME);
  return NextResponse.json({ authenticated: cookie?.value === 'true' });
}
