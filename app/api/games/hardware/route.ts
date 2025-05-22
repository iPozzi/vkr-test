import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const getUserIdFromRequest = (req: NextRequest) => {
  const token = req.cookies.get('accessToken')?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload.id;
  } catch {
    return null;
  }
};

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // Получаем HardwareProfile пользователя
    const profile = await prisma.hardwareProfile.findFirst({
      where: { userId },
    });
    if (!profile) {
      return NextResponse.json([], { status: 200 });
    }
    // Ищем игры, которые подходят по минимальным требованиям
    const games = await prisma.game.findMany({
      where: {
        requirements: {
          some: {
            minCpuId: profile.cpuId,
            minGpuId: profile.gpuId,
            minRam: { lte: profile.ram },
            minVram: { lte: profile.vram },
          },
        },
      },
      include: {
        genre: true,
      },
      orderBy: {
        title: 'asc',
      },
      take: 20,
    });
    
    // Обрабатываем и сериализуем данные для совместимости с клиентом
    const processedGames = games.map(game => {
      if (game.imageData && Buffer.isBuffer(game.imageData)) {
        return {
          ...game,
          imageData: {
            type: 'Buffer',
            data: Array.from(game.imageData)
          }
        };
      }
      return game;
    });
    
    return NextResponse.json(processedGames);
  } catch (error) {
    console.error('Ошибка подбора игр по железу:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 