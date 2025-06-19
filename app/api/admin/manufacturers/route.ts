import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const hasAdminRights = await isAdmin(req);
    if (!hasAdminRights) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    const manufacturers = await prisma.manufacturer.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(manufacturers);
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return NextResponse.json({ message: 'Ошибка при получении производителей' }, { status: 500 });
  }
} 