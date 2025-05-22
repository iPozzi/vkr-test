import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

// Получение всех жанров
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

    const genres = await prisma.genre.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching genres' },
      { status: 500 }
    );
  }
}

// Создание нового жанра
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
    const existingGenre = await prisma.genre.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive' // Регистронезависимый поиск
        }
      }
    });

    if (existingGenre) {
      return NextResponse.json(
        { message: 'Genre with this name already exists' },
        { status: 400 }
      );
    }

    // Создание жанра
    const genre = await prisma.genre.create({
      data: {
        name
      }
    });

    return NextResponse.json(
      { message: 'Genre created successfully', genreId: genre.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating genre:', error);
    return NextResponse.json(
      { message: 'An error occurred while creating the genre' },
      { status: 500 }
    );
  }
}

// Обновление жанра
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

    // Проверка существования жанра
    const existingGenre = await prisma.genre.findUnique({
      where: { id }
    });

    if (!existingGenre) {
      return NextResponse.json(
        { message: 'Genre not found' },
        { status: 404 }
      );
    }

    // Проверка на уникальность имени (исключая текущий жанр)
    const duplicateGenre = await prisma.genre.findFirst({
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

    if (duplicateGenre) {
      return NextResponse.json(
        { message: 'Genre with this name already exists' },
        { status: 400 }
      );
    }

    // Обновление жанра
    await prisma.genre.update({
      where: { id },
      data: { name }
    });

    return NextResponse.json(
      { message: 'Genre updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating genre:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating the genre' },
      { status: 500 }
    );
  }
}

// Удаление жанра
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
        { message: 'Invalid genre ID' },
        { status: 400 }
      );
    }

    const genreId = parseInt(id);

    // Проверка существования жанра
    const existingGenre = await prisma.genre.findUnique({
      where: { id: genreId }
    });

    if (!existingGenre) {
      return NextResponse.json(
        { message: 'Genre not found' },
        { status: 404 }
      );
    }

    // Проверка использования жанра в играх
    const usedInGames = await prisma.game.findFirst({
      where: {
        genreId
      }
    });

    if (usedInGames) {
      return NextResponse.json(
        { message: 'Cannot delete genre: it is used by one or more games' },
        { status: 400 }
      );
    }

    // Удаление жанра
    await prisma.genre.delete({
      where: { id: genreId }
    });

    return NextResponse.json(
      { message: 'Genre deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting genre:', error);
    return NextResponse.json(
      { message: 'An error occurred while deleting the genre' },
      { status: 500 }
    );
  }
} 