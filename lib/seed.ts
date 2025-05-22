import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function loadCSV(file: string) {
  const content = await fs.readFile(path.join(__dirname, file), 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

async function main() {
  const [genres, platforms, manufacturers, components, games, requirements] =
    await Promise.all([
      loadCSV('genres.csv'),
      loadCSV('platforms.csv'),
      loadCSV('manufacturers.csv'),
      loadCSV('components.csv'),
      loadCSV('games.csv'),
      loadCSV('requirements.csv'),
    ]);

  const genreMap = new Map<string, number>();
  for (const g of genres) {
    const genre = await prisma.genre.create({ data: { name: g.name } });
    genreMap.set(g.name, genre.id);
  }

  const platformMap = new Map<string, number>();
  for (const p of platforms) {
    const platform = await prisma.platform.create({ data: { name: p.name } });
    platformMap.set(p.name, platform.id);
  }

  const manufacturerMap = new Map<string, number>();
  for (const m of manufacturers) {
    const man = await prisma.manufacturer.create({ data: { name: m.name } });
    manufacturerMap.set(m.name, man.id);
  }

  const componentMap = new Map<string, number>();
  for (const c of components) {
    const comp = await prisma.component.create({
      data: {
        name: c.name,
        type: c.type,
        manufacturerId: manufacturerMap.get(c.manufacturer)!,
        benchmarkScore: parseInt(c.benchmarkScore || '1000'),
      },
    });
    componentMap.set(c.name, comp.id);
  }

  const gameMap = new Map<string, number>();
  for (const g of games) {
    const game = await prisma.game.create({
      data: {
        title: g.title,
        genreId: genreMap.get(g.genre)!,
        platformId: platformMap.get(g.platform)!,
        releaseYear: parseInt(g.releaseYear),
        imageData: g.imageData || null,
      },
    });
    gameMap.set(g.id, game.id);
  }

  for (const r of requirements) {
    const gameId = gameMap.get(r.game_id);
    if (!gameId) continue;

    await prisma.requirement.create({
      data: {
        gameId,
        minCpuId: componentMap.get(r.minCpu)!,
        minGpuId: componentMap.get(r.minGpu)!,
        minRam: parseInt(r.minRam),
        minVram: parseInt(r.minVram),
        recCpuId: componentMap.get(r.recCpu)!,
        recGpuId: componentMap.get(r.recGpu)!,
        recRam: parseInt(r.recRam),
        recVram: parseInt(r.recVram),
      },
    });
  }

  console.log('✅ Сидинг завершён');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });