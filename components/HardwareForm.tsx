'use client';

import * as React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, InfoIcon, AlertCircle } from 'lucide-react';
import GameCard from '@/components/GameCard';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Схема валидации формы
const schema = z.object({
  cpuId: z.string().refine(val => val !== 'any', {
    message: "Необходимо выбрать процессор"
  }),
  gpuId: z.string().refine(val => val !== 'any', {
    message: "Необходимо выбрать видеокарту"
  }),
  ram: z.string(),
  vram: z.string(),
  minPerformanceRatio: z.string().optional(),
});

export type ComponentOption = { id: number; name: string };

interface ImageData {
  type: string;
  data: number[];
}

interface GameResult {
  id: number;
  title: string;
  releaseYear: number;
  imageData?: ImageData | Buffer;
  score: number;
  performanceRatio: number;
  genre: { id: number; name: string };
  platform: { id: number; name: string };
  tags: { tag: { id: number; name: string } }[];
}

interface Props {
  cpus: ComponentOption[];
  gpus: ComponentOption[];
}

export default function HardwareForm({ cpus, gpus }: Props) {
  const [games, setGames] = React.useState<GameResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const formRef = React.useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;

    setError(null);
    setValidationErrors({});
    const entries = Object.fromEntries(new FormData(formRef.current).entries());
    
    try {
      const data = schema.parse(entries);
      
      setLoading(true);
      
      try {
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cpuId: Number(data.cpuId),
            gpuId: Number(data.gpuId),
            ram: Number(data.ram),
            vram: Number(data.vram),
            minPerformanceRatio: data.minPerformanceRatio ? Number(data.minPerformanceRatio) : 0
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'API error');
        }
        
        const json = await res.json();
        setGames(json);
        
        if (json.length === 0) {
          setError('По данным параметрам не найдено подходящих игр. Попробуйте снизить минимальный запас производительности или выбрать более мощные компоненты.');
        }
      } catch (err) {
        console.error('Ошибка запроса:', err);
        setError('Не удалось подобрать игры. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    } catch (validationError) {
      console.error('Ошибка валидации:', validationError);
      if (validationError instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        validationError.errors.forEach((err) => {
          if (err.path) {
            errors[err.path[0]] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      setError('Пожалуйста, проверьте корректность заполнения полей формы.');
    }
  }

  return (
    <>
      <Card className="mb-8 shadow-md max-w-3xl mx-auto border-zinc-800 bg-card">
        <CardHeader className="bg-card border-b border-zinc-800">
          <CardTitle className="text-xl text-center">Укажите параметры вашего компьютера</CardTitle>
          <p className="text-sm text-zinc-400 text-center mt-2">
            Алгоритм использует реальные баллы производительности и показывает ВСЕ игры, 
            где ваш ПК соответствует минимальным требованиям
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form
            ref={formRef}
            onSubmit={onSubmit}
          >
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 mb-6">
              {/* CPU */}
              <div className="space-y-2">
                <Label htmlFor="cpu" className="font-medium">
                  Процессор <span className="text-red-500">*</span>
                </Label>
                <Select name="cpuId" required>
                  <SelectTrigger id="cpu" className={`w-full border-zinc-800 bg-zinc-900 ${validationErrors.cpuId ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Выберите процессор" />
                  </SelectTrigger>
                  <SelectContent>
                    {cpus.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.cpuId && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.cpuId}</p>
                )}
              </div>

              {/* GPU */}
              <div className="space-y-2">
                <Label htmlFor="gpu" className="font-medium">
                  Видеокарта <span className="text-red-500">*</span>
                </Label>
                <Select name="gpuId" required>
                  <SelectTrigger id="gpu" className={`w-full border-zinc-800 bg-zinc-900 ${validationErrors.gpuId ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Выберите видеокарту" />
                  </SelectTrigger>
                  <SelectContent>
                    {gpus.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.gpuId && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.gpuId}</p>
                )}
              </div>

              {/* RAM */}
              <div className="space-y-2">
                <Label htmlFor="ram" className="font-medium">Оперативная память (ГБ)</Label>
                <Select name="ram" defaultValue="16">
                  <SelectTrigger id="ram" className="w-full border-zinc-800 bg-zinc-900">
                    <SelectValue placeholder="16" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="16">16</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="32">32</SelectItem>
                    <SelectItem value="64">64</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* VRAM */}
              <div className="space-y-2">
                <Label htmlFor="vram" className="font-medium">Видеопамять (МБ)</Label>
                <Select name="vram" defaultValue="4096">
                  <SelectTrigger id="vram" className="w-full border-zinc-800 bg-zinc-900">
                    <SelectValue placeholder="4096" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2048">2048</SelectItem>
                    <SelectItem value="4096">4096</SelectItem>
                    <SelectItem value="6144">6144</SelectItem>
                    <SelectItem value="8192">8192</SelectItem>
                    <SelectItem value="12288">12288</SelectItem>
                    <SelectItem value="16384">16384</SelectItem>
                    <SelectItem value="24576">24576</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Фильтр по запасу производительности */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="minPerformanceRatio" className="font-medium">
                  Минимальный запас производительности
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-blue-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Отношение вашего оборудования к рекомендуемым требованиям:</p>
                      <ul className="list-disc ml-5 mt-1 text-xs">
                        <li>1.0 = точное соответствие рекомендуемым требованиям</li>
                        <li>0.8 = 80% от рекомендуемых (близко)</li>
                        <li>0.5 = 50% от рекомендуемых (минимум)</li>
                        <li>1.2+ = превосходит рекомендуемые на 20% и больше</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select name="minPerformanceRatio" defaultValue="0">
                <SelectTrigger id="minPerformanceRatio" className="w-full border-zinc-800 bg-zinc-900">
                  <SelectValue placeholder="Любой" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Любой (включая минимальные)</SelectItem>
                  <SelectItem value="0.5">Хотя бы 50% от рекомендуемых</SelectItem>
                  <SelectItem value="0.8">Близко к рекомендуемым (80%)</SelectItem>
                  <SelectItem value="1">Только рекомендуемые и выше</SelectItem>
                  <SelectItem value="1.2">Повышенный запас (120%+)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-400 mt-1">
                Выберите минимальный порог производительности относительно рекомендуемых требований
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-center">
              <Button type="submit" className="px-8 py-2" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Найти подходящие игры
              </Button>
            </div>
            
            {/* Примечание об обязательных полях */}
            <p className="text-xs text-zinc-400 mt-3 text-center">
              <span className="text-red-500">*</span> — обязательные поля
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Ошибка */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Внимание</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Результаты */}
      {loading && (
        <div className="text-center py-4">
          <p className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
            Подбираем все подходящие игры...
          </p>
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="text-center py-4">
          <p className="text-zinc-500">Пока нечего показать — заполните параметры вашего компьютера выше.</p>
        </div>
      )}

      {!loading && games.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-2 text-center">
            Найденные игры ({games.length})
          </h3>
          <p className="text-sm text-zinc-400 text-center mb-4">
            Отсортированы по запасу производительности
            {games.length > 0 && games[0].performanceRatio ? 
              ` (лучшая игра: ×${games[0].performanceRatio.toFixed(1)})` : 
              ''}
          </p>

          {/* Цветовая легенда */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-xs">120%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-xs">100-120%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-600"></div>
              <span className="text-xs">80-99%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              <span className="text-xs">50-79%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-xs">&lt;50%</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
