// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
// Если Node <18, установите `npm i node-fetch` и:
// import fetch from 'node-fetch'

// Парсер CSV — можно взять любой. Здесь пример с csv-parse/sync:
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

async function main() {
  console.log('Начинаем заполнение базы данных...')

  // Очищаем все таблицы для избежания дублирования
  await prisma.$executeRaw`TRUNCATE TABLE "GameTag" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "HardwareProfile" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Requirement" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Game" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Component" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Tag" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Genre" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Platform" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Manufacturer" CASCADE;`
  
  console.log('База данных очищена. Начинаем заполнение...')

  // 1. Загружаем производителей
  console.log('Загрузка производителей...')
  const manufacturersPath = path.join(__dirname, 'manufacturers.csv')
  const manufacturersContent = fs.readFileSync(manufacturersPath, 'utf8')
  const manufacturers = parse(manufacturersContent, {
    columns: true,
    skip_empty_lines: true
  }) as Array<{ id: string; name: string }>

  for (const { id, name } of manufacturers) {
    await prisma.manufacturer.create({
      data: {
        id: Number(id),
        name,
      },
    })
  }
  console.log(`✓ Загружено ${manufacturers.length} производителей`)

  // 2. Загружаем компоненты (CPU и GPU)
  console.log('Загрузка компонентов...')
  const componentsPath = path.join(__dirname, 'components.csv')
  const componentsContent = fs.readFileSync(componentsPath, 'utf8')
  const components = parse(componentsContent, {
    columns: true,
    skip_empty_lines: true
  }) as Array<{ id: string; name: string; type: string; manufacturerId: string; benchmarkScore: string }>

  for (const { id, name, type, manufacturerId, benchmarkScore } of components) {
    await prisma.component.create({
      data: {
        id: Number(id),
        name,
        type,
        manufacturerId: Number(manufacturerId),
        benchmarkScore: Number(benchmarkScore || 1000), // Если значения нет, ставим 1000 по умолчанию
      },
    })
  }
  console.log(`✓ Загружено ${components.length} компонентов`)

  // 3. Загружаем жанры
  console.log('Загрузка жанров...')
  const genresPath = path.join(__dirname, 'genres.csv')
  const genresContent = fs.readFileSync(genresPath, 'utf8')
  const genres = parse(genresContent, {
    columns: true,
    skip_empty_lines: true
  }) as Array<{ id: string; name: string }>

  for (const { id, name } of genres) {
    await prisma.genre.create({
      data: {
        id: Number(id),
        name,
      },
    })
  }
  console.log(`✓ Загружено ${genres.length} жанров`)

  // 4. Загружаем платформы
  console.log('Загрузка платформ...')
  const platformsPath = path.join(__dirname, 'platforms.csv')
  const platformsContent = fs.readFileSync(platformsPath, 'utf8')
  const platforms = parse(platformsContent, {
    columns: true,
    skip_empty_lines: true
  }) as Array<{ id: string; name: string }>

  for (const { id, name } of platforms) {
    await prisma.platform.create({
      data: {
        id: Number(id),
        name,
      },
    })
  }
  console.log(`✓ Загружено ${platforms.length} платформ`)

  // 5. Загружаем теги
  console.log('Загрузка тегов...')
  const tagsPath = path.join(__dirname, 'tags.csv')
  const tagsContent = fs.readFileSync(tagsPath, 'utf8')
  const tags = parse(tagsContent, {
    columns: true,
    skip_empty_lines: true
  }) as Array<{ name: string }>

  let tagId = 1;
  for (const { name } of tags) {
    await prisma.tag.create({
      data: {
        id: tagId++,
        name,
      },
    })
  }
  console.log(`✓ Загружено ${tags.length} тегов`)

  // 6. Загружаем игры
  console.log('Загрузка игр...')
  const gamesPath = path.join(__dirname, 'games.csv')
  const gamesContent = fs.readFileSync(gamesPath, 'utf8')
  const games = parse(gamesContent, {
    columns: true,
    skip_empty_lines: true
  }) as Array<{ id: string; title: string; genreId: string; platformId: string; releaseYear: string; imageUrl: string }>

  for (const { id, title, genreId, platformId, releaseYear, imageUrl } of games) {
    try {
      // Скачиваем картинку, если URL есть
      let buffer = null;
      if (imageUrl) {
        try {
          const res = await fetch(imageUrl);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            console.log(`✓ Загружено изображение для игры ${id}: ${title} (${buffer.length} байт)`);
          } else {
            console.warn(`⚠ Не удалось загрузить изображение для игры ${id}: HTTP ${res.status}`);
          }
        } catch (e) {
          console.warn(`⚠ Ошибка при загрузке изображения для игры ${id}:`, e);
        }
      }

      // Записываем в БД
      await prisma.game.create({
        data: {
          id: Number(id),
          title,
          genreId: Number(genreId),
          platformId: Number(platformId),
          releaseYear: Number(releaseYear),
          imageData: buffer,
        },
      });

      console.log(`✓ Игра ${id}: "${title}" добавлена`);
    } catch (e) {
      console.error(`✗ Ошибка при добавлении игры ${id}: ${title}`, e);
    }
  }
  console.log(`✓ Загружено ${games.length} игр`)

  // 7. Загружаем требования для игр
  console.log('Загрузка требований...')
  const requirementsPath = path.join(__dirname, 'requirement.csv')
  const requirementsContent = fs.readFileSync(requirementsPath, 'utf8')
  const requirements = parse(requirementsContent, {
    columns: true,
    skip_empty_lines: true
  }) as Array<{ 
    id: string; 
    gameId: string; 
    minCpuId: string; 
    minGpuId: string; 
    minRam: string; 
    minVram: string; 
    recCpuId: string; 
    recGpuId: string; 
    recRam: string; 
    recVram: string 
  }>

  for (const { 
    id, gameId, minCpuId, minGpuId, minRam, minVram, recCpuId, recGpuId, recRam, recVram 
  } of requirements) {
    try {
      await prisma.requirement.create({
        data: {
          id: Number(id),
          gameId: Number(gameId),
          minCpuId: Number(minCpuId),
          minGpuId: Number(minGpuId),
          minRam: Number(minRam),
          minVram: Number(minVram),
          recCpuId: Number(recCpuId),
          recGpuId: Number(recGpuId),
          recRam: Number(recRam),
          recVram: Number(recVram),
        },
      })
    } catch (e) {
      console.error(`✗ Ошибка при добавлении требований ${id} для игры ${gameId}`, e);
    }
  }
  console.log(`✓ Загружено ${requirements.length} наборов требований`)

  // 8. Загружаем связи игр и тегов
  console.log('Загрузка связей игр и тегов...')
  const gameTagsPath = path.join(__dirname, 'game_tags.csv')
  if (fs.existsSync(gameTagsPath)) {
    const gameTagsContent = fs.readFileSync(gameTagsPath, 'utf8')
    const gameTags = parse(gameTagsContent, {
      columns: true,
      skip_empty_lines: true
    }) as Array<{ game_id: string; tag_name: string }>

    // Сначала получаем все теги из базы, чтобы сопоставить имена с ID
    const allTags = await prisma.tag.findMany();
    const tagNameToId = new Map(allTags.map(tag => [tag.name, tag.id]));
    
    console.log('Найдено тегов в БД:', allTags.length);
    console.log('Сопоставление тегов:', Object.fromEntries(tagNameToId));
    
    let successCount = 0;
    let errorCount = 0;

    for (const { game_id, tag_name } of gameTags) {
      try {
        // Находим ID тега по его имени
        const tagId = tagNameToId.get(tag_name);
        
        if (!tagId) {
          console.warn(`⚠ Тег "${tag_name}" не найден в базе, пропускаем связь для игры ${game_id}`);
          errorCount++;
          continue;
        }
        
        await prisma.gameTag.create({
          data: {
            gameId: Number(game_id),
            tagId: tagId,
          },
        });
        
        successCount++;
      } catch (e) {
        console.error(`✗ Ошибка при добавлении связи игры ${game_id} и тега "${tag_name}"`, e);
        errorCount++;
    }
  }
    
    console.log(`✓ Загружено ${successCount} связей игр с тегами, ошибок: ${errorCount}`)
  } else {
    console.warn('⚠ Файл game_tags.csv не найден, пропускаем')
  }

  console.log('Заполнение базы данных завершено успешно!')
}

main()
  .catch(e => {
    console.error('Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
