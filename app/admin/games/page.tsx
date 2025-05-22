"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, Plus, Search } from "lucide-react";

type Game = {
  id: number;
  title: string;
  genre: {
    id: number;
    name: string;
  };
  platform: {
    id: number;
    name: string;
  };
  releaseYear: number;
  tags: Array<{
    tag: {
      id: number;
      name: string;
    };
  }>;
};

export default function AdminGamesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Перенаправление, если пользователь не админ
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Загрузка списка игр при монтировании компонента
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/games");
        
        if (!response.ok) {
          throw new Error("Не удалось загрузить список игр");
        }
        
        const data = await response.json();
        setGames(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке игр");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === "admin") {
      fetchGames();
    }
  }, [user, deleteSuccess]);

  const handleDelete = async (id: number) => {
    try {
      setDeleteError(null);
      const response = await fetch(`/api/admin/games?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Ошибка при удалении игры");
      }

      setDeleteSuccess(true);
      setTimeout(() => {
        setDeleteSuccess(false);
        setShowDeleteModal(false);
        setDeleteId(null);
      }, 1500);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Произошла ошибка при удалении игры");
      console.error(err);
    }
  };

  // Фильтрация игр на основе строки поиска
  const filteredGames = games.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || (!user && loading)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null; // Страница перенаправит на главную
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Управление играми</h1>
        <Link 
          href="/admin/games/add" 
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus size={18} /> Добавить игру
        </Link>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Поле поиска */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Поиск игр по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {filteredGames.length === 0 ? (
            <div className="text-center text-gray-500 my-12">
              {games.length === 0 ? "Игры отсутствуют в базе данных" : "Нет игр, соответствующих запросу"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Жанр</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Платформа</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Год выпуска</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Теги</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {filteredGames.map((game) => (
                    <tr key={game.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{game.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{game.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{game.genre.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{game.platform.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{game.releaseYear}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {game.tags.map(tag => (
                            <span key={tag.tag.id} className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                              {tag.tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <Link 
                            href={`/admin/games/edit/${game.id}`}
                            className="text-blue-400 hover:text-blue-300"
                            aria-label={`Редактировать ${game.title}`}
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteId(game.id);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-500 hover:text-red-400"
                            aria-label={`Удалить ${game.title}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Подтвердите удаление</h3>
            <p className="mb-6">Вы уверены, что хотите удалить эту игру? Это действие нельзя отменить.</p>
            
            {deleteError && (
              <div className="bg-red-500 text-white p-3 rounded-md mb-4">
                {deleteError}
              </div>
            )}
            
            {deleteSuccess && (
              <div className="bg-green-500 text-white p-3 rounded-md mb-4">
                Игра успешно удалена!
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={deleteSuccess}
              >
                Отмена
              </button>
              <button
                onClick={() => deleteId && handleDelete(deleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={deleteSuccess}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 