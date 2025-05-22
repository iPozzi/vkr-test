import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Нет access токена' }, { status: 401 });
    }
    
    let payload: TokenPayload;
    try {
      payload = jwt.verify(accessToken, JWT_SECRET) as TokenPayload;
    } catch {
      return NextResponse.json({ message: 'Невалидный access токен' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ message: 'Пользователь не найден' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
} 