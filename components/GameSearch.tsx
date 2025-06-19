'use client';

import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks';
import { Card, CardContent } from './ui/card';
import { Search } from 'lucide-react';

interface Game {
  id: number;
  title: string;
}

export default function GameSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  useEffect(() => {
    const fetchGames = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/games/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error fetching game results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, [debouncedQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/games?search=${encodeURIComponent(query)}`);
    }
  };

  const handleFocus = () => {
    setShowResults(true);
  };

  const handleBlur = () => {
    if (query.trim()) {
      setTimeout(() => setShowResults(false), 150);
    }
  };

  return (
    <Card className="shadow-md max-w-xl mx-auto border-zinc-800 bg-card">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <Input
              type="text"
              placeholder="Введите название игры..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full pl-10 pr-4 border-zinc-800 bg-zinc-900"
            />
            {showResults && results.length > 0 && (
              <div className="absolute left-0 right-0 w-full bg-zinc-900 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto border border-zinc-800 z-10">
                <ul className="py-1">
                  {results.map((game) => (
                    <li key={game.id}>
                      <Link
                        href={`/games/${game.id}`}
                        className="block px-4 py-2 hover:bg-zinc-800 text-zinc-200"
                      >
                        {game.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Button type="submit" className="shrink-0">Найти</Button>
        </form>
        
        {isLoading && (
          <div className="mt-2 text-sm text-zinc-500 text-center">
            Поиск игр...
          </div>
        )}
        
        {!isLoading && debouncedQuery && results.length === 0 && (
          <div className="mt-2 text-sm text-zinc-500 text-center">
            Игр не найдено. Попробуйте изменить запрос.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 