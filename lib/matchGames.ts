import { prisma } from '@/lib/prisma';
import type { Game } from '@prisma/client';

interface MatchParams {
  cpuId?: number;
  gpuId?: number;
  ram: number;       // в ГБ
  vram: number;      // в МБ 
  minPerformanceRatio?: number; // минимальный запас производительности (по умолчанию 0)
}

/**
 * Возвращает массив игр, отсортированных по «лучшей совместимости».
 * Каждому совпадению присваивается числовой score и performanceRatio - запас производительности.
 */
export async function matchGames({
  cpuId,
  gpuId,
  ram,
  vram,
  minPerformanceRatio = 0
}: MatchParams) {
  console.log("Входные параметры:", { cpuId, gpuId, ram, vram, minPerformanceRatio });
  
  // Получаем информацию о компонентах пользователя, если они указаны
  let userCpuScore = 0;
  let userGpuScore = 0;
  let cpuName = 'Не указан';
  let gpuName = 'Не указана';
  
  if (cpuId) {
    const cpu = await prisma.component.findUnique({ 
      where: { id: cpuId },
    });
    
    if (cpu) {
      userCpuScore = cpu.benchmarkScore;
      cpuName = cpu.name;
      console.log(`Процессор: ${cpuName} (производительность: ${userCpuScore})`);
    }
  }
  
  if (gpuId) {
    const gpu = await prisma.component.findUnique({ 
      where: { id: gpuId },
    });
    
    if (gpu) {
      userGpuScore = gpu.benchmarkScore;
      gpuName = gpu.name;
      console.log(`Видеокарта: ${gpuName} (производительность: ${userGpuScore})`);
    }
  }

  console.log(`Память: ${ram} ГБ RAM, ${vram} МБ VRAM`);
  
  // Выполним запрос для изучения структуры БД
  const sampleReq = await prisma.requirement.findFirst({
    include: {
      minCpu: true,
      minGpu: true,
      recCpu: true,
      recGpu: true,
    }
  });
  
  if (sampleReq) {
    console.log('Пример требований из БД:');
    console.log(`minRam: ${sampleReq.minRam} ГБ, recRam: ${sampleReq.recRam} ГБ`);
    console.log(`minVram: ${sampleReq.minVram} МБ, recVram: ${sampleReq.recVram} МБ`);
    console.log(`minCpu: ${sampleReq.minCpu.name} (${sampleReq.minCpu.benchmarkScore})`);
    console.log(`recCpu: ${sampleReq.recCpu.name} (${sampleReq.recCpu.benchmarkScore})`);
  }

  // Загружаем все игры с требованиями + базовыми связями
  const games = await prisma.game.findMany({
    include: {
      requirements: {
        include: {
          minCpu: true,
          minGpu: true,
          recCpu: true,
          recGpu: true,
        }
      },
      genre: true,
      platform: true,
      tags: { include: { tag: true } },
    },
  });
  
  console.log(`Загружено ${games.length} игр для проверки`);

  interface ScoredGame extends Game {
    score: number;
    performanceRatio: number;
  }
  
  const scoredGames: ScoredGame[] = [];
  let matchedCount = 0;
  let skippedCpu = 0;
  let skippedGpu = 0;
  let skippedRam = 0;
  let skippedVram = 0;
  
  // Проходим по всем играм
  for (const game of games) {
    // По всем наборам требований (может быть несколько версий/платформ)
    for (const req of game.requirements) {
      // 1. Проверяем минимальные требования - жесткий фильтр
      // Проверка RAM (в ГБ)
      if (ram < req.minRam) {
        skippedRam++;
        continue;
      }
      
      // Проверка VRAM (в МБ) - предполагаем, что в БД значения уже в МБ
      if (vram < req.minVram) {
        skippedVram++;
        continue;
      }
      
      // Проверка CPU по баллам бенчмарка
      if (cpuId && userCpuScore < req.minCpu.benchmarkScore) {
        skippedCpu++;
        continue;
      }
      
      // Проверка GPU по баллам бенчмарка
      if (gpuId && userGpuScore < req.minGpu.benchmarkScore) {
        skippedGpu++;
        continue;
      }
      
      matchedCount++;
      
      // 2. Рассчитываем соотношение для рекомендованных требований
      const cpuRatio = cpuId ? userCpuScore / req.recCpu.benchmarkScore : 1.0;
      const gpuRatio = gpuId ? userGpuScore / req.recGpu.benchmarkScore : 1.0;
      const ramRatio = ram / req.recRam;
      const vramRatio = vram / req.recVram;
      
      // Общий коэффициент производительности - выбираем минимальное значение
      // как самое "узкое место" системы
      const performanceRatio = Math.min(cpuRatio, gpuRatio, ramRatio, vramRatio);
      
      // Если указан минимальный порог производительности и игра не проходит - пропускаем
      if (performanceRatio < minPerformanceRatio) continue;
      
      // Рассчитываем score - чем ближе к 1.0 или выше, тем лучше
      let score = 0;
      
      if (performanceRatio >= 1.0) {
        // Превышаем рекомендованные - отлично
        score = 2 + (performanceRatio - 1) * 0.5; // Выше 1.0 даёт небольшой бонус
      } else if (performanceRatio >= 0.8) {
        // Близко к рекомендованным - хорошо
        score = 1 + performanceRatio;
      } else {
        // Ниже 80% от рекомендованных - просто минимум
        score = performanceRatio;
      }

      // Добавляем игру с наилучшим показателем производительности
      const existingIndex = scoredGames.findIndex(g => g.id === game.id);
      if (existingIndex >= 0) {
        // Если игра уже добавлена, обновляем только если новый score выше
        if (score > scoredGames[existingIndex].score) {
          scoredGames[existingIndex].score = score;
          scoredGames[existingIndex].performanceRatio = performanceRatio;
        }
      } else {
        // Если игры ещё нет, добавляем
        scoredGames.push({
          ...game,
          score,
          performanceRatio,
        });
      }
      
      // Не проверяем остальные наборы требований для этой игры, если один уже подошел
      break;
    }
  }

  console.log(`Найдено ${scoredGames.length} подходящих игр для конфигурации:`);
  console.log(`• CPU: ${cpuName}${cpuId ? ` (${userCpuScore})` : ''}`);
  console.log(`• GPU: ${gpuName}${gpuId ? ` (${userGpuScore})` : ''}`);
  console.log(`• RAM: ${ram} ГБ`);
  console.log(`• VRAM: ${vram} МБ`);
  console.log(`• Мин. запас: ${minPerformanceRatio}`);
  console.log(`Статистика фильтрации: пройдено ${matchedCount} проверок минимальных требований`);
  console.log(`Отфильтровано по: CPU - ${skippedCpu}, GPU - ${skippedGpu}, RAM - ${skippedRam}, VRAM - ${skippedVram}`);

  // Сортируем по score ↓, затем по году релиза ↓ (более новые выше)
  const sortedGames = scoredGames.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
  });

  // Очищаем данные для безопасной передачи через JSON
  return sortedGames.map(game => {
    // Преобразуем imageData из Buffer в объект, который корректно сериализуется
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
}