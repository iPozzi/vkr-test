import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Выход выполнен' });
  response.cookies.set('accessToken', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
} 