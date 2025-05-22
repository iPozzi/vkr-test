"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Plus, Search } from "lucide-react";

type Genre = {
  id: number;
  name: string;
};

export default function AdminGenresPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Состояния для модальных окон
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  
  // Данные для форм
  const [newGenreName, setNewGenreName] = useState("");
  const [editGenre, setEditGenre] = useState<Genre | null>(null);
  const [deleteGenreId, setDeleteGenreId] = useState<number | null>(null);

  useEffect(() => {
    // Перенаправление, если пользователь не админ
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Загрузка списка жанров при монтировании компонента
    const fetchGenres = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/genres");
        
        if (!response.ok) {
          throw new Error("Не удалось загрузить список жанров");
        }
        
        const data = await response.json();
        setGenres(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке жанров");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === "admin") {
      fetchGenres();
    }
  }, [user, modalSuccess]);

  // Фильтрация жанров на основе строки поиска
  const filteredGenres = genres.filter(genre => 
    genre.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Обработчики событий для форм
  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    setModalSuccess(false);

    try {
      const response = await fetch("/api/admin/genres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newGenreName })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Не удалось создать жанр");
      }

      setModalSuccess(true);
      setNewGenreName("");
      
      // Закрыть модальное окно после задержки
      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess(false);
      }, 1500);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Произошла ошибка при создании жанра");
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGenre) return;
    
    setModalLoading(true);
    setModalError(null);
    setModalSuccess(false);

    try {
      const response = await fetch("/api/admin/genres", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: editGenre.id, name: editGenre.name })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Не удалось обновить жанр");
      }

      setModalSuccess(true);
      
      // Закрыть модальное окно после задержки
      setTimeout(() => {
        setShowEditModal(false);
        setModalSuccess(false);
        setEditGenre(null);
      }, 1500);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Произошла ошибка при обновлении жанра");
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteGenre = async () => {
    if (!deleteGenreId) return;
    
    setModalLoading(true);
    setModalError(null);
    setModalSuccess(false);

    try {
      const response = await fetch(`/api/admin/genres?id=${deleteGenreId}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Не удалось удалить жанр");
      }

      setModalSuccess(true);
      
      // Закрыть модальное окно после задержки
      setTimeout(() => {
        setShowDeleteModal(false);
        setModalSuccess(false);
        setDeleteGenreId(null);
      }, 1500);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Произошла ошибка при удалении жанра");
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/profile" 
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={16} /> Вернуться в профиль
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Управление жанрами</h1>
        <button 
          onClick={() => {
            setNewGenreName("");
            setModalError(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus size={18} /> Добавить жанр
        </button>
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
            placeholder="Поиск жанров..."
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
          {filteredGenres.length === 0 ? (
            <div className="text-center text-gray-500 my-12">
              {genres.length === 0 ? "Жанры отсутствуют в базе данных" : "Нет жанров, соответствующих запросу"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {filteredGenres.map((genre) => (
                    <tr key={genre.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{genre.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{genre.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setEditGenre({ ...genre });
                              setModalError(null);
                              setShowEditModal(true);
                            }}
                            className="text-blue-400 hover:text-blue-300"
                            aria-label={`Редактировать ${genre.name}`}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteGenreId(genre.id);
                              setModalError(null);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-500 hover:text-red-400"
                            aria-label={`Удалить ${genre.name}`}
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

      {/* Модальное окно добавления жанра */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Добавить новый жанр</h3>
            
            {modalError && (
              <div className="bg-red-500 text-white p-3 rounded-md mb-4">
                {modalError}
              </div>
            )}
            
            {modalSuccess && (
              <div className="bg-green-500 text-white p-3 rounded-md mb-4">
                Жанр успешно добавлен!
              </div>
            )}
            
            <form onSubmit={handleAddGenre}>
              <div className="mb-4">
                <label htmlFor="genreName" className="block mb-2 text-sm font-medium">
                  Название жанра
                </label>
                <input
                  type="text"
                  id="genreName"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                  disabled={modalLoading || modalSuccess}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  disabled={modalLoading || modalSuccess}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={modalLoading || modalSuccess}
                >
                  {modalLoading ? "Добавление..." : "Добавить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования жанра */}
      {showEditModal && editGenre && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Редактировать жанр</h3>
            
            {modalError && (
              <div className="bg-red-500 text-white p-3 rounded-md mb-4">
                {modalError}
              </div>
            )}
            
            {modalSuccess && (
              <div className="bg-green-500 text-white p-3 rounded-md mb-4">
                Жанр успешно обновлен!
              </div>
            )}
            
            <form onSubmit={handleEditGenre}>
              <div className="mb-4">
                <label htmlFor="editGenreName" className="block mb-2 text-sm font-medium">
                  Название жанра
                </label>
                <input
                  type="text"
                  id="editGenreName"
                  value={editGenre.name}
                  onChange={(e) => setEditGenre({ ...editGenre, name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                  disabled={modalLoading || modalSuccess}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  disabled={modalLoading || modalSuccess}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={modalLoading || modalSuccess}
                >
                  {modalLoading ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Подтвердите удаление</h3>
            <p className="mb-6">Вы уверены, что хотите удалить этот жанр? Это действие нельзя отменить.</p>
            
            {modalError && (
              <div className="bg-red-500 text-white p-3 rounded-md mb-4">
                {modalError}
              </div>
            )}
            
            {modalSuccess && (
              <div className="bg-green-500 text-white p-3 rounded-md mb-4">
                Жанр успешно удален!
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={modalLoading || modalSuccess}
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteGenre}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={modalLoading || modalSuccess}
              >
                {modalLoading ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 