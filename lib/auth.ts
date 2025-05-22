import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Получение ID пользователя из запроса
export const getUserIdFromRequest = (req: NextRequest) => {
  const token = req.cookies.get('accessToken')?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload.id;
  } catch {
    return null;
  }
};

// Проверка роли администратора
export const isAdmin = async (req: NextRequest): Promise<boolean> => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return false;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === 'admin';
  } catch (error) {
    console.error('Ошибка проверки роли администратора:', error);
    return false;
  }
}; 