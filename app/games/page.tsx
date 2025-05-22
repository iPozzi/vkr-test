import { prisma } from '@/lib/prisma';
import GameCard from '@/components/GameCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GamesByHardwareButton from '@/components/GamesByHardwareButton';

// Добавляем интерфейс для типа данных игры
interface Game {
  id: number;
  title: string;
  releaseYear: number | null;
  imageData: Buffer | null;
  genre: {
    name: string;
  } | null;
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : '';
  
  const games = await prisma.game.findMany({
    where: search ? {
      title: {
        contains: search,
        mode: 'insensitive',
      },
    } : undefined,
    select: {
      id: true,
      title: true,
      releaseYear: true,
      imageData: true,
      genre: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      title: 'asc',
    },
    take: 50,
  }) as Game[];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Игры</h1>
      <GamesByHardwareButton />
      <form action="/games" className="mb-6 flex gap-2 max-w-md">
        <Input 
          type="text" 
          name="search" 
          placeholder="Поиск игр..." 
          defaultValue={search}
          className="w-full"
        />
        <Button type="submit">Найти</Button>
      </form>
      
      {search && (
        <p className="mb-4">
          Результаты поиска для: <span className="font-medium">{search}</span>
          {games.length === 0 && ' (Игры не найдены)'}
        </p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
} 