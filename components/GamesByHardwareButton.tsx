'use client';

import { useAuth } from '@/lib/useAuth';
import { useState } from 'react';
import GameCard from '@/components/GameCard';

interface ImageData {
  type: string;
  data: number[];
}

interface Game {
  id: number;
  title: string;
  imageData?: ImageData | Buffer;
  genre?: { name: string };
  releaseYear?: number;
  score?: number;
  performanceRatio?: number;
}

const GamesByHardwareButton = () => {
  const { user, loading: authLoading } = useAuth();
  const [hardwareGames, setHardwareGames] = useState<Game[]>([]);
  const [hardwareLoading, setHardwareLoading] = useState(false);
  const [hardwareError, setHardwareError] = useState('');

  const handleShowHardwareGames = async () => {
    setHardwareLoading(true);
    setHardwareError('');
    try {
      const res = await fetch('/api/games/hardware');
      if (!res.ok) throw new Error('Ошибка API');
      const data = await res.json();
      setHardwareGames(data);
    } catch {
      setHardwareError('Не удалось получить игры по вашему профилю');
    } finally {
      setHardwareLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="mb-6">
      <button
        onClick={handleShowHardwareGames}
        className="mb-4 px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:outline-none"
        aria-label="Показать игры по моему железу"
        tabIndex={0}
      >
        Показать игры по моему железу
      </button>
      {hardwareLoading && <div className="mb-4 text-zinc-500">Загрузка...</div>}
      {hardwareError && <div className="mb-4 text-red-500">{hardwareError}</div>}
      {hardwareGames.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Игры, подходящие вашему железу:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {hardwareGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesByHardwareButton; 