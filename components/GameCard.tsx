// components/GameCard.tsx
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ImageData {
  type: string;
  data: number[];
}

interface Props {
  game: {
    id: number;
    title: string;
    imageData?: ImageData | Buffer | Uint8Array | null;
    genre?: { name: string } | null;
    releaseYear?: number | null;
    score?: number;
    performanceRatio?: number;
  };
}

export default function GameCard({ game }: Props) {
  // Простая обработка изображения - если не получается, то карточка без картинки
  let base64 = null;
  
  if (game.imageData) {
    try {
      // Пробуем обработать любой формат данных
      if (typeof game.imageData === 'object' && 'data' in game.imageData) {
        base64 = Buffer.from(game.imageData.data).toString('base64');
      } else if (game.imageData) {
        base64 = Buffer.from(game.imageData).toString('base64');
      }
    } catch {
      // Если не получилось - просто игнорируем, покажем карточку без картинки
      base64 = null;
    }
  }

  const hasImage = !!base64;

  // Определение цвета для запаса производительности
  const getPerformanceBadgeStyle = (ratio?: number) => {
    if (!ratio) return 'bg-zinc-800 text-zinc-200 border-zinc-700';
    if (ratio >= 1.2) return 'bg-green-900/80 text-green-100 border-green-600'; // Отличный запас
    if (ratio >= 1.0) return 'bg-blue-900/80 text-blue-100 border-blue-600';   // Рекомендуемые требования
    if (ratio >= 0.8) return 'bg-amber-900/80 text-amber-100 border-amber-600'; // Хороший запас, близкий к рекомендуемым
    if (ratio >= 0.5) return 'bg-orange-900/80 text-orange-100 border-orange-600'; // Средний запас
    return 'bg-red-900/80 text-red-100 border-red-600'; // Минимальные требования
  };

  // Читабельное отображение запаса
  const getPerformanceText = (ratio?: number) => {
    if (!ratio) return 'Н/Д';
    return `×${ratio.toFixed(1)}`;
  };

  return (
    <Link href={`/games/${game.id}`} className="block">
      <Card className="relative h-48 overflow-hidden transition-all hover:shadow-md border-zinc-800">
        {/* Фон */}
        {hasImage ? (
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url(data:image/jpeg;base64,${base64})` 
            }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-zinc-800" />
        )}
        
        {/* Затенение - более мягкое для карточек без изображения */}
        <div className={`absolute inset-0 w-full h-full ${
          hasImage 
            ? 'bg-gradient-to-t from-black/80 to-black/25' 
            : 'bg-gradient-to-t from-zinc-900/60 to-zinc-800/20'
        }`} />
        
        {/* Контент карточки */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
          <h3 className="text-lg font-bold text-white line-clamp-1 mb-1">
            {game.title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {game.genre && (
              <Badge variant="secondary" className="z-10">
                {game.genre.name}
              </Badge>
            )}
            {game.performanceRatio && (
              <Badge variant="outline" className={`z-10 ${getPerformanceBadgeStyle(game.performanceRatio)}`}>
                {getPerformanceText(game.performanceRatio)}
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-zinc-200 flex flex-wrap gap-2">
            {game.releaseYear && <span>Год: {game.releaseYear}</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
