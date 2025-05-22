import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = '15m';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

function generateAccessToken(user: { id: number; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return NextResponse.json({ message: 'Нет refresh токена' }, { status: 401 });
    }
    
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;
    } catch {
      return NextResponse.json({ message: 'Невалидный refresh токен' }, { status: 401 });
    }
    
    const accessToken = generateAccessToken(payload);
    const response = NextResponse.json({ accessToken });
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15,
    });
    return response;
  } catch (error) {
    console.error('Ошибка refresh:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
} 