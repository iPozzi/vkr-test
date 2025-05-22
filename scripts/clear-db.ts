import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Удаляем записи в правильном порядке (сначала зависимые таблицы)
    await prisma.gameTag.deleteMany();
    await prisma.requirement.deleteMany();
    await prisma.hardwareProfile.deleteMany();
    await prisma.game.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.genre.deleteMany();
    await prisma.platform.deleteMany();
    await prisma.component.deleteMany();
    await prisma.manufacturer.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ База данных очищена');
  } catch (error) {
    console.error('Ошибка при очистке базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase(); 