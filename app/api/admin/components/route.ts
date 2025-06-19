import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

// Получение всех компонентов
export async function GET(req: NextRequest) {
  try {
    const hasAdminRights = await isAdmin(req);
    if (!hasAdminRights) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    const components = await prisma.component.findMany({
      include: { manufacturer: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(components);
  } catch (error) {
    console.error('Error fetching components:', error);
    return NextResponse.json({ message: 'Ошибка при получении компонентов' }, { status: 500 });
  }
}

// Создание нового компонента
export async function POST(req: NextRequest) {
  try {
    const hasAdminRights = await isAdmin(req);
    if (!hasAdminRights) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    const { name, type, manufacturerId, benchmarkScore } = await req.json();
    if (!name || !type || !manufacturerId || benchmarkScore === undefined) {
      return NextResponse.json({ message: 'Все поля обязательны' }, { status: 400 });
    }
    const component = await prisma.component.create({
      data: { name, type, manufacturerId, benchmarkScore }
    });
    return NextResponse.json({ message: 'Компонент создан', componentId: component.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating component:', error);
    return NextResponse.json({ message: 'Ошибка при создании компонента' }, { status: 500 });
  }
}

// Обновление компонента
export async function PUT(req: NextRequest) {
  try {
    const hasAdminRights = await isAdmin(req);
    if (!hasAdminRights) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    const { id, name, type, manufacturerId, benchmarkScore } = await req.json();
    if (!id || !name || !type || !manufacturerId || benchmarkScore === undefined) {
      return NextResponse.json({ message: 'Все поля обязательны' }, { status: 400 });
    }
    const existing = await prisma.component.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: 'Компонент не найден' }, { status: 404 });
    }
    await prisma.component.update({
      where: { id },
      data: { name, type, manufacturerId, benchmarkScore }
    });
    return NextResponse.json({ message: 'Компонент обновлен' }, { status: 200 });
  } catch (error) {
    console.error('Error updating component:', error);
    return NextResponse.json({ message: 'Ошибка при обновлении компонента' }, { status: 500 });
  }
} 