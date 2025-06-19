import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

// Получение всех тегов
export async function GET(req: NextRequest) {
  try {
    // Проверка авторизации и роли администратора
    const hasAdminRights = await isAdmin(req);
    if (!hasAdminRights) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching tags' },
      { status: 500 }
    );
  }
}

// Создание нового тега
export async function POST(req: NextRequest) {
  try {
    // Проверка авторизации и роли администратора
    const hasAdminRights = await isAdmin(req);
    if (!hasAdminRights) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { name } = await req.json();

    // Базовая валидация
    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }

    // Проверка на уникальность имени
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive' // Регистронезависимый поиск
        }
      }
    });

    if (existingTag) {
      return NextResponse.json(
        { message: 'Tag with this name already exists' },
        { status: 400 }
      );
    }

    // Создание тега
    const tag = await prisma.tag.create({
      data: {
        name
      }
    });

    return NextResponse.json(
      { message: 'Tag created successfully', tagId: tag.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { message: 'An error occurred while creating the tag' },
      { status: 500 }
    );
  }
}

// Обновление тега
export async function PUT(req: NextRequest) {
  try {
    // Проверка авторизации и роли администратора
    const hasAdminRights = await isAdmin(req);
    if (!hasAdminRights) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id, name } = await req.json();

    // Базовая валидация
    if (!id || !name) {
      return NextResponse.json(
        { message: 'ID and name are required' },
        { status: 400 }
      );
    }

    // Проверка существования тега
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return NextResponse.json(
        { message: 'Tag not found' },
        { status: 404 }
      );
    }

    // Проверка на уникальность имени (исключая текущий тег)
    const duplicateTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });

    if (duplicateTag) {
      return NextResponse.json(
        { message: 'Tag with this name already exists' },
        { status: 400 }
      );
    }

    // Обновление тега
    await prisma.tag.update({
      where: { id },
      data: { name }
    });

    return NextResponse.json(
      { message: 'Tag updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating the tag' },
      { status: 500 }
    );
  }
}

// Удаление тега
export async function DELETE(req: NextRequest) {
  try {
    // Проверка авторизации и роли администратора
    const hasAdminRights = await isAdmin(req);
    if (!hasAdminRights) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { message: 'Invalid tag ID' },
        { status: 400 }
      );
    }

    const tagId = parseInt(id);

    // Проверка существования тега
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId }
    });

    if (!existingTag) {
      return NextResponse.json(
        { message: 'Tag not found' },
        { status: 404 }
      );
    }

    // Удаление всех связей тега с играми
    await prisma.gameTag.deleteMany({
      where: {
        tagId
      }
    });

    // Удаление тега
    await prisma.tag.delete({
      where: { id: tagId }
    });

    return NextResponse.json(
      { message: 'Tag deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { message: 'An error occurred while deleting the tag' },
      { status: 500 }
    );
  }
} 