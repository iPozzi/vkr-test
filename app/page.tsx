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
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Подбор игр для вашего компьютера</h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Находите игры, которые подойдут именно вашей конфигурации
        </p>
      </div>
      
      <div className="mb-12">
        <div className="flex flex-col items-center mb-6">
          <div className="inline-flex items-center justify-center rounded-full bg-zinc-800 p-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold">Быстрый поиск по названию</h2>
        </div>
        <Suspense fallback={<div className="w-full max-w-md mx-auto h-10 bg-zinc-800 animate-pulse rounded-md"></div>}>
          <GameSearch />
        </Suspense>
      </div>
      
      <div>
        <div className="flex flex-col items-center mb-6">
          <div className="inline-flex items-center justify-center rounded-full bg-zinc-800 p-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M7 22H5c-.5 0-1-.2-1.4-.6C3.2 21 3 20.5 3 20V7c0-1.1.9-2 2-2h10" />
              <path d="M16 3h5v5" />
              <path d="M16 8 8.9 15.1" />
              <path d="M15 20v-1.5a2.5 2.5 0 0 0-5 0V20" />
              <path d="M9 11.5V10" />
              <path d="M19 14c1.1 0 2 .9 2 2a2 2 0 1 1-4 0 2 2 0 0 1 2-2Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold">Поиск по конфигурации</h2>
        </div>
        <HardwareForm cpus={cpus} gpus={gpus} />
      </div>
    </div>
  );
}