import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface GameParams {
  id: string;
}

export async function generateStaticParams() {
  const games = await prisma.game.findMany({ select: { id: true } });
  return games.map((game) => ({
    id: game.id.toString(),
  }));
}

async function getGameDetails(gameId: number) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      genre: true,
      platform: true,
      tags: {
        include: { tag: true },
      },
      requirements: {
        include: {
          minCpu: {
            include: { manufacturer: true },
          },
          minGpu: {
            include: { manufacturer: true },
          },
          recCpu: {
            include: { manufacturer: true },
          },
          recGpu: {
            include: { manufacturer: true },
          },
        },
      },
    },
  });

  if (!game) {
    throw new Error(`Game with ID ${gameId} not found`);
  }

  return game;
}

export default async function GamePage({
  params,
}: {
  params: Promise<GameParams>;
}) {
  const { id } = await params;
  const gameId = parseInt(id);
  
  if (isNaN(gameId)) {
    throw new Error('Invalid game ID');
  }

  const game = await getGameDetails(gameId);
  const requirement = game.requirements[0]; // Assuming a game has at least one requirement set

  // Преобразуем imageData в base64
  const base64 = game.imageData
    ? Buffer.from(game.imageData).toString('base64')
    : null;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link 
          href="/" 
          className="text-blue-500 hover:text-blue-700 transition-colors"
        >
          ← Вернуться на главную
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{game.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge>{game.genre.name}</Badge>
                <Badge variant="outline">{game.platform.name}</Badge>
                {game.tags.map((tag) => (
                  <Badge key={tag.tagId} variant="secondary">
                    {tag.tag.name}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {base64 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/jpeg;base64,${base64}`}
                  alt={game.title}
                  className="w-full rounded-md object-cover mb-4"
                  style={{ maxHeight: '300px' }}
                />
              )}
              <div className="mb-4">
                <p className="text-lg">Год выпуска: {game.releaseYear}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {requirement && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Системные требования</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Минимальные</h3>
                    <ul className="space-y-2">
                      <li>
                        <span className="font-medium">Процессор:</span>{' '}
                        {requirement.minCpu.manufacturer.name} {requirement.minCpu.name}
                      </li>
                      <li>
                        <span className="font-medium">Видеокарта:</span>{' '}
                        {requirement.minGpu.manufacturer.name} {requirement.minGpu.name}
                      </li>
                      <li>
                        <span className="font-medium">ОЗУ:</span> {requirement.minRam} ГБ
                      </li>
                      <li>
                        <span className="font-medium">Видеопамять:</span> {requirement.minVram} ГБ
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Рекомендуемые</h3>
                    <ul className="space-y-2">
                      <li>
                        <span className="font-medium">Процессор:</span>{' '}
                        {requirement.recCpu.manufacturer.name} {requirement.recCpu.name}
                      </li>
                      <li>
                        <span className="font-medium">Видеокарта:</span>{' '}
                        {requirement.recGpu.manufacturer.name} {requirement.recGpu.name}
                      </li>
                      <li>
                        <span className="font-medium">ОЗУ:</span> {requirement.recRam} ГБ
                      </li>
                      <li>
                        <span className="font-medium">Видеопамять:</span> {requirement.recVram} ГБ
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 