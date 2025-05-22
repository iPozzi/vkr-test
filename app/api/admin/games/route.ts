import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

// Получение списка всех игр
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

    const games = await prisma.game.findMany({
      include: {
        genre: true,
        platform: true,
        tags: {
          include: { tag: true }
        },
        requirements: true
      }
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching games' },
      { status: 500 }
    );
  }
}

interface TagConnection {
  tag: {
    connect: {
      id: number;
    };
  };
  game: {
    connect: {
      id: number;
    };
  };
}

// Создание новой игры
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

    const {
      title,
      genreId,
      platformId,
      releaseYear,
      imageUrl,
      tagIds,
      requirements,
    } = await req.json();

    // Basic validation
    if (!title || !genreId || !platformId || !releaseYear || !requirements) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the game
    const game = await prisma.game.create({
      data: {
        title,
        genreId,
        platformId,
        releaseYear: parseInt(String(releaseYear)),
        imageData: imageUrl ? Buffer.from(imageUrl) : undefined,
      },
    });

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      const tagConnections = tagIds.map((tagId: number) => ({
        tag: { connect: { id: tagId } },
        game: { connect: { id: game.id } },
      }));

      await Promise.all(
        tagConnections.map((connection: TagConnection) =>
          prisma.gameTag.create({
            data: {
              tagId: connection.tag.connect.id,
              gameId: game.id,
            },
          })
        )
      );
    }

    // Add requirements
    await prisma.requirement.create({
      data: {
        gameId: game.id,
        minCpuId: parseInt(String(requirements.minCpuId)),
        minGpuId: parseInt(String(requirements.minGpuId)),
        minRam: parseInt(String(requirements.minRam)),
        minVram: parseInt(String(requirements.minVram)),
        recCpuId: parseInt(String(requirements.recCpuId)),
        recGpuId: parseInt(String(requirements.recGpuId)),
        recRam: parseInt(String(requirements.recRam)),
        recVram: parseInt(String(requirements.recVram)),
      },
    });

    return NextResponse.json(
      { message: 'Game added successfully', gameId: game.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding game:', error);
    return NextResponse.json(
      { message: 'An error occurred while adding the game' },
      { status: 500 }
    );
  }
}

// Обновление существующей игры
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

    const {
      id,
      title,
      genreId,
      platformId,
      releaseYear,
      imageUrl,
      tagIds,
      requirements,
    } = await req.json();

    // Basic validation
    if (!id || !title || !genreId || !platformId || !releaseYear || !requirements) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Проверяем существование игры
    const existingGame = await prisma.game.findUnique({
      where: { id },
      include: { tags: true }
    });

    if (!existingGame) {
      return NextResponse.json(
        { message: 'Game not found' },
        { status: 404 }
      );
    }

    // Обновление основной информации об игре
    await prisma.game.update({
      where: { id },
      data: {
        title,
        genreId,
        platformId,
        releaseYear: parseInt(String(releaseYear)),
        imageData: imageUrl ? Buffer.from(imageUrl) : undefined,
      },
    });

    // Обновление тегов - удаляем старые и добавляем новые
    if (tagIds) {
      // Удаляем существующие теги
      await prisma.gameTag.deleteMany({
        where: { gameId: id }
      });

      // Добавляем новые теги
      if (tagIds.length > 0) {
        await Promise.all(
          tagIds.map((tagId: number) =>
            prisma.gameTag.create({
              data: {
                tagId,
                gameId: id,
              },
            })
          )
        );
      }
    }

    // Обновление требований
    if (requirements) {
      const existingRequirements = await prisma.requirement.findFirst({
        where: { gameId: id }
      });

      if (existingRequirements) {
        await prisma.requirement.update({
          where: { id: existingRequirements.id },
          data: {
            minCpuId: parseInt(String(requirements.minCpuId)),
            minGpuId: parseInt(String(requirements.minGpuId)),
            minRam: parseInt(String(requirements.minRam)),
            minVram: parseInt(String(requirements.minVram)),
            recCpuId: parseInt(String(requirements.recCpuId)),
            recGpuId: parseInt(String(requirements.recGpuId)),
            recRam: parseInt(String(requirements.recRam)),
            recVram: parseInt(String(requirements.recVram)),
          },
        });
      } else {
        await prisma.requirement.create({
          data: {
            gameId: id,
            minCpuId: parseInt(String(requirements.minCpuId)),
            minGpuId: parseInt(String(requirements.minGpuId)),
            minRam: parseInt(String(requirements.minRam)),
            minVram: parseInt(String(requirements.minVram)),
            recCpuId: parseInt(String(requirements.recCpuId)),
            recGpuId: parseInt(String(requirements.recGpuId)),
            recRam: parseInt(String(requirements.recRam)),
            recVram: parseInt(String(requirements.recVram)),
          },
        });
      }
    }

    return NextResponse.json(
      { message: 'Game updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating the game' },
      { status: 500 }
    );
  }
}

// Удаление игры
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
        { message: 'Invalid game ID' },
        { status: 400 }
      );
    }

    const gameId = parseInt(id);

    // Проверяем существование игры
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!existingGame) {
      return NextResponse.json(
        { message: 'Game not found' },
        { status: 404 }
      );
    }

    // Удаляем связанные данные
    // 1. Теги
    await prisma.gameTag.deleteMany({
      where: { gameId }
    });

    // 2. Требования
    await prisma.requirement.deleteMany({
      where: { gameId }
    });

    // 3. Саму игру
    await prisma.game.delete({
      where: { id: gameId }
    });

    return NextResponse.json(
      { message: 'Game deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { message: 'An error occurred while deleting the game' },
      { status: 500 }
    );
  }
} 