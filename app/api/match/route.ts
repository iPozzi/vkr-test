import { NextResponse } from 'next/server';
import { matchGames } from '@/lib/matchGames';

/**
 * POST /api/match
 * Body:
 * {
 *   cpuId?: number,
 *   gpuId?: number,
 *   ram: number,          // в ГБ
 *   vram: number,         // в МБ
 *   minPerformanceRatio?: number, // минимальный запас производительности
 *   genreId?: number,
 * }
 * 
 * Логика:
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cpuId, gpuId, ram, vram, minPerformanceRatio, genreId } = body;

    console.log("API /match - получен запрос:", { cpuId, gpuId, ram, vram, minPerformanceRatio, genreId });

    if (ram == null || vram == null) {
      console.error("API /match - ошибка: отсутствуют обязательные параметры ram и vram");
      return NextResponse.json(
        { error: 'ram и vram являются обязательными параметрами' },
        { status: 400 },
      );
    }

    // Используем значение VRAM как есть, в МБ
    console.log(`Используем VRAM: ${vram} МБ`);
    
    const startTime = Date.now();
    const games = await matchGames({ 
      cpuId, 
      gpuId, 
      ram, 
      vram,
      minPerformanceRatio: minPerformanceRatio ?? 0.0,
      genreId,
    });
    const executionTime = Date.now() - startTime;

    console.log(`API /match - найдено ${games.length} подходящих игр за ${executionTime}мс`);
    
    // Если игр не найдено, возвращаем дополнительную информацию
    if (games.length === 0) {
      console.log("API /match - игры не найдены, возможные причины:");
      console.log("- Конфигурация слишком слабая для минимальных требований");
      console.log("- Слишком высокий minPerformanceRatio");
      console.log("- Отсутствуют игры в базе данных");
      
      // Добавляем информацию о том, что был запрос с нулевым результатом
      return NextResponse.json({
        games: [],
        query: { cpuId, gpuId, ram, vram, minPerformanceRatio, genreId },
        error: "Не найдено игр, соответствующих заданным параметрам"
      });
    }
    
    return NextResponse.json(games);
  } catch (error) {
    console.error("API /match - критическая ошибка:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}