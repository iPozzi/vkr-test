import { prisma } from '@/lib/prisma';
import HardwareForm from '@/components/HardwareForm';
import GameSearch from '@/components/GameSearch';
import { Suspense } from 'react';

export default async function Home() {
  const [cpus, gpus] = await Promise.all([
    prisma.component.findMany({ where: { type: 'CPU' }, orderBy: { name: 'asc' } }),
    prisma.component.findMany({ where: { type: 'GPU' }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="container mx-auto py-10">   
      <div className="mb-12">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-semibold">Быстрый поиск по названию</h2>
        </div>
        <Suspense fallback={<div className="w-full max-w-md mx-auto h-10 bg-zinc-800 animate-pulse rounded-md"></div>}>
          <GameSearch />
        </Suspense>
      </div>
      
      <div>
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-semibold">Поиск по конфигурации</h2>
        </div>
        <HardwareForm cpus={cpus} gpus={gpus} />
      </div>
    </div>
  );
}