"use client";

import { FormEvent, useEffect, useState, use } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Genre {
  id: number;
  name: string;
}

interface Platform {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
}

interface Component {
  id: number;
  name: string;
  type: string;
}

interface GameTag {
  tag: {
    id: number;
    name: string;
  };
}

export default function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.id;
  
  const router = useRouter();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    genreId: "",
    platformId: "",
    releaseYear: new Date().getFullYear(),
    imageUrl: "",
    selectedTags: [] as number[],
    // Requirements
    minCpuId: "",
    minGpuId: "",
    minRam: 4,
    minVram: 2,
    recCpuId: "",
    recGpuId: "",
    recRam: 8,
    recVram: 4,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Options for select inputs
  const [genres, setGenres] = useState<Genre[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [cpus, setCpus] = useState<Component[]>([]);
  const [gpus, setGpus] = useState<Component[]>([]);

  useEffect(() => {
    // Перенаправление, если пользователь не админ
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // Загрузка данных игры
  useEffect(() => {
    if (user?.role === "admin") {
      const fetchGameData = async () => {
        try {
          setIsLoading(true);
          // Загрузка данных игры
          const gameResponse = await fetch(`/api/games/${gameId}`);
          if (!gameResponse.ok) {
            throw new Error("Не удалось загрузить данные игры");
          }
          const gameData = await gameResponse.json();
          
          // Загрузка списков для выпадающих меню
          const [genresRes, platformsRes, tagsRes, componentsRes] = await Promise.all([
            fetch("/api/genres"),
            fetch("/api/platforms"),
            fetch("/api/tags"),
            fetch("/api/components")
          ]);
          
          const genresData = await genresRes.json();
          const platformsData = await platformsRes.json();
          const tagsData = await tagsRes.json();
          const componentsData = await componentsRes.json();
          
          // Фильтрация компонентов по типу
          const cpusList = componentsData.filter((comp: Component) => comp.type === "CPU");
          const gpusList = componentsData.filter((comp: Component) => comp.type === "GPU");
          
          // Установка данных формы из загруженной игры
          setFormData({
            title: gameData.title,
            genreId: gameData.genreId.toString(),
            platformId: gameData.platformId.toString(),
            releaseYear: gameData.releaseYear,
            imageUrl: "", // Изображение не загружается напрямую
            selectedTags: gameData.tags.map((t: GameTag) => t.tag.id),
            minCpuId: gameData.requirements[0]?.minCpuId.toString() || "",
            minGpuId: gameData.requirements[0]?.minGpuId.toString() || "",
            minRam: gameData.requirements[0]?.minRam || 4,
            minVram: (gameData.requirements[0]?.minVram || 2) * 1024, // Конвертируем из ГБ в МБ
            recCpuId: gameData.requirements[0]?.recCpuId.toString() || "",
            recGpuId: gameData.requirements[0]?.recGpuId.toString() || "",
            recRam: gameData.requirements[0]?.recRam || 8,
            recVram: (gameData.requirements[0]?.recVram || 4) * 1024, // Конвертируем из ГБ в МБ
          });
          
          // Установка опций для выпадающих списков
          setGenres(genresData);
          setPlatforms(platformsData);
          setTags(tagsData);
          setCpus(cpusList);
          setGpus(gpusList);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchGameData();
    }
  }, [user, gameId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTagChange = (tagId: number) => {
    setFormData(prev => {
      const selectedTags = [...prev.selectedTags];
      
      if (selectedTags.includes(tagId)) {
        return {
          ...prev,
          selectedTags: selectedTags.filter(id => id !== tagId)
        };
      } else {
        return {
          ...prev,
          selectedTags: [...selectedTags, tagId]
        };
      }
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);
    
    try {
      const response = await fetch("/api/admin/games", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: parseInt(gameId),
          title: formData.title,
          genreId: parseInt(formData.genreId),
          platformId: parseInt(formData.platformId),
          releaseYear: parseInt(String(formData.releaseYear)),
          imageUrl: formData.imageUrl || null,
          tagIds: formData.selectedTags,
          requirements: {
            minCpuId: parseInt(formData.minCpuId),
            minGpuId: parseInt(formData.minGpuId),
            minRam: parseInt(String(formData.minRam)),
            minVram: parseInt(String(formData.minVram)),
            recCpuId: parseInt(formData.recCpuId),
            recGpuId: parseInt(formData.recGpuId),
            recRam: parseInt(String(formData.recRam)),
            recVram: parseInt(String(formData.recVram))
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Ошибка при обновлении игры");
      }
      
      setSuccess(true);
      
      // Перенаправление к списку игр после короткой задержки
      setTimeout(() => {
        router.push("/admin/games");
      }, 1500);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка при обновлении игры";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsSaving(false);
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
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="mb-6">
        <Link 
          href="/admin/games" 
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={16} /> Вернуться к списку игр
        </Link>
      </div>
    
      <h1 className="text-3xl font-bold mb-6">Редактирование игры</h1>
      
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 text-white p-4 rounded-md mb-6">
          Игра успешно обновлена!
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-zinc-800 pb-2">Основная информация</h2>
              
              <div>
                <label htmlFor="title" className="block mb-2">
                  Название игры <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="genreId" className="block mb-2">
                  Жанр <span className="text-red-500">*</span>
                </label>
                <select
                  id="genreId"
                  name="genreId"
                  value={formData.genreId}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                  required
                >
                  <option value="">Выберите жанр</option>
                  {genres.map(genre => (
                    <option key={genre.id} value={genre.id}>{genre.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="platformId" className="block mb-2">
                  Платформа <span className="text-red-500">*</span>
                </label>
                <select
                  id="platformId"
                  name="platformId"
                  value={formData.platformId}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                  required
                >
                  <option value="">Выберите платформу</option>
                  {platforms.map(platform => (
                    <option key={platform.id} value={platform.id}>{platform.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="releaseYear" className="block mb-2">
                  Год выпуска <span className="text-red-500">*</span>
                </label>
                <input
                  id="releaseYear"
                  name="releaseYear"
                  type="number"
                  min="1970"
                  max={new Date().getFullYear() + 1}
                  value={formData.releaseYear}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="imageUrl" className="block mb-2">
                  URL изображения (опционально)
                </label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="text"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                  placeholder="http://example.com/image.jpg"
                />
              </div>
              
              <div>
                <label className="block mb-2">
                  Теги (опционально)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-zinc-900 border border-zinc-700 rounded-md">
                  {tags.map(tag => (
                    <div 
                      key={tag.id}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                        formData.selectedTags.includes(tag.id) 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                      onClick={() => handleTagChange(tag.id)}
                    >
                      {tag.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* System Requirements */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-zinc-800 pb-2">Системные требования</h2>
              
              <div className="bg-zinc-900 p-4 rounded-md border border-zinc-800">
                <h3 className="text-lg font-medium mb-3">Минимальные требования</h3>
                
                <div className="space-y-3">
                  <div>
                    <label htmlFor="minCpuId" className="block mb-1 text-sm">
                      Процессор <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="minCpuId"
                      name="minCpuId"
                      value={formData.minCpuId}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
                      required
                    >
                      <option value="">Выберите процессор</option>
                      {cpus.map(cpu => (
                        <option key={cpu.id} value={cpu.id}>{cpu.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="minGpuId" className="block mb-1 text-sm">
                      Видеокарта <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="minGpuId"
                      name="minGpuId"
                      value={formData.minGpuId}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
                      required
                    >
                      <option value="">Выберите видеокарту</option>
                      {gpus.map(gpu => (
                        <option key={gpu.id} value={gpu.id}>{gpu.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="minRam" className="block mb-1 text-sm">
                        Оперативная память (ГБ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="minRam"
                        name="minRam"
                        type="number"
                        min="1"
                        max="128"
                        value={formData.minRam}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="minVram" className="block mb-1 text-sm">
                        Видеопамять (МБ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="minVram"
                        name="minVram"
                        type="number"
                        value={formData.minVram}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-900 p-4 rounded-md border border-zinc-800">
                <h3 className="text-lg font-medium mb-3">Рекомендуемые требования</h3>
                
                <div className="space-y-3">
                  <div>
                    <label htmlFor="recCpuId" className="block mb-1 text-sm">
                      Процессор <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="recCpuId"
                      name="recCpuId"
                      value={formData.recCpuId}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
                      required
                    >
                      <option value="">Выберите процессор</option>
                      {cpus.map(cpu => (
                        <option key={cpu.id} value={cpu.id}>{cpu.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="recGpuId" className="block mb-1 text-sm">
                      Видеокарта <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="recGpuId"
                      name="recGpuId"
                      value={formData.recGpuId}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
                      required
                    >
                      <option value="">Выберите видеокарту</option>
                      {gpus.map(gpu => (
                        <option key={gpu.id} value={gpu.id}>{gpu.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="recRam" className="block mb-1 text-sm">
                        Оперативная память (ГБ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="recRam"
                        name="recRam"
                        type="number"
                        min="1"
                        max="128"
                        value={formData.recRam}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="recVram" className="block mb-1 text-sm">
                        Видеопамять (МБ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="recVram"
                        name="recVram"
                        type="number"
                        value={formData.recVram}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href="/admin/games"
              className="px-4 py-2 rounded-md bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
            >
              Отмена
            </Link>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              disabled={isSaving}
            >
              {isSaving ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 