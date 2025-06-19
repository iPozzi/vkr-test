import { prisma } from '@/lib/prisma';
import GameCard from '@/components/GameCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GamesByHardwareButton from '@/components/GamesByHardwareButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React from 'react';

interface Game {
  id: number;
  title: string;
  releaseYear: number | null;
  imageData: Buffer | null;
  genre: {
    id: number;
    name: string;
  } | null;
}

interface Genre {
  id: number;
  name: string;
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : '';
  const genreId = typeof resolvedParams.genreId === 'string' ? resolvedParams.genreId : '';

  // Получаем жанры
  const genres: Genre[] = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  // Получаем игры с фильтрацией по жанру
  const games = await prisma.game.findMany({
    where: {
      ...(search
        ? {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(genreId && genreId !== 'any'
        ? { genreId: Number(genreId) }
        : {}),
    },
    select: {
      id: true,
      title: true,
      releaseYear: true,
      imageData: true,
      genre: {
        select: {
          id: true,
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
      <form action="/games" className="mb-6 flex flex-col sm:flex-row gap-2 max-w-2xl">
        <Input
          type="text"
          name="search"
          placeholder="Поиск игр..."
          defaultValue={search}
          className="w-full"
        />
        <Select name="genreId" defaultValue={genreId || 'any'}>
          <SelectTrigger id="genreId" className="w-full sm:max-w-xs border-zinc-800 bg-zinc-900">
            <SelectValue placeholder="Любой жанр" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Любой жанр</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Найти</Button>
      </form>

      {(search || (genreId && genreId !== 'any')) && (
        <p className="mb-4">
          {search && (
            <>
              Результаты поиска для: <span className="font-medium">{search}</span>
            </>
          )}
          {genreId && genreId !== 'any' && (
            <>
              {search ? ' | ' : ''}Жанр: <span className="font-medium">{genres.find(g => String(g.id) === genreId)?.name || 'Неизвестно'}</span>
            </>
          )}
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