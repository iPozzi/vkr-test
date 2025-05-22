"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function AddGamePage() {
  const router = useRouter();
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
    minVram: 2 * 1024, // 2 ГБ в МБ
    recCpuId: "",
    recGpuId: "",
    recRam: 8,
    recVram: 4 * 1024, // 4 ГБ в МБ
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Options for select inputs
  const [genres, setGenres] = useState<Genre[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [cpus, setCpus] = useState<Component[]>([]);
  const [gpus, setGpus] = useState<Component[]>([]);

  // Load options for dropdowns
  useEffect(() => {
    async function loadOptions() {
      try {
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
        
        setGenres(genresData);
        setPlatforms(platformsData);
        setTags(tagsData);
        
        // Filter components by type
        setCpus(componentsData.filter((comp: Component) => comp.type === "CPU"));
        setGpus(componentsData.filter((comp: Component) => comp.type === "GPU"));
      } catch (err) {
        setError("Ошибка при загрузке данных");
        console.error(err);
      }
    }
    
    loadOptions();
  }, []);

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
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const response = await fetch("/api/admin/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
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
        throw new Error(data.message || "Ошибка при добавлении игры");
      }
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: "",
        genreId: "",
        platformId: "",
        releaseYear: new Date().getFullYear(),
        imageUrl: "",
        selectedTags: [],
        minCpuId: "",
        minGpuId: "",
        minRam: 4,
        minVram: 2 * 1024, // 2 ГБ в МБ
        recCpuId: "",
        recGpuId: "",
        recRam: 8,
        recVram: 4 * 1024, // 4 ГБ в МБ
      });
      
      // Navigate to games list after short delay
      setTimeout(() => {
        router.push("/games");
        router.refresh();
      }, 1500);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка при добавлении игры";
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Добавить новую игру</h1>
      
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 text-white p-4 rounded-md mb-6">
          Игра успешно добавлена!
        </div>
      )}
      
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
                URL изображения
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div>
              <label className="block mb-2">
                Теги
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <label key={tag.id} className="flex items-center space-x-1 p-2 bg-zinc-800 rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedTags.includes(tag.id)}
                      onChange={() => handleTagChange(tag.id)}
                      className="form-checkbox"
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          {/* System Requirements */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-zinc-800 pb-2">Системные требования</h2>
            
            <h3 className="font-medium">Минимальные:</h3>
            <div>
              <label htmlFor="minCpuId" className="block mb-2">
                Процессор <span className="text-red-500">*</span>
              </label>
              <select
                id="minCpuId"
                name="minCpuId"
                value={formData.minCpuId}
                onChange={handleInputChange}
                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                required
              >
                <option value="">Выберите CPU</option>
                {cpus.map(cpu => (
                  <option key={cpu.id} value={cpu.id}>{cpu.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="minGpuId" className="block mb-2">
                Видеокарта <span className="text-red-500">*</span>
              </label>
              <select
                id="minGpuId"
                name="minGpuId"
                value={formData.minGpuId}
                onChange={handleInputChange}
                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                required
              >
                <option value="">Выберите GPU</option>
                {gpus.map(gpu => (
                  <option key={gpu.id} value={gpu.id}>{gpu.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="minRam" className="block mb-2">
                  RAM (ГБ) <span className="text-red-500">*</span>
                </label>
                <input
                  id="minRam"
                  name="minRam"
                  type="number"
                  min="1"
                  value={formData.minRam}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="minVram" className="block mb-2">
                  VRAM (МБ) <span className="text-red-500">*</span>
                </label>
                <input
                  id="minVram"
                  name="minVram"
                  type="number"
                  value={formData.minVram}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                  required
                />
              </div>
            </div>
            
            <h3 className="font-medium">Рекомендуемые:</h3>
            <div>
              <label htmlFor="recCpuId" className="block mb-2">
                Процессор <span className="text-red-500">*</span>
              </label>
              <select
                id="recCpuId"
                name="recCpuId"
                value={formData.recCpuId}
                onChange={handleInputChange}
                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                required
              >
                <option value="">Выберите CPU</option>
                {cpus.map(cpu => (
                  <option key={cpu.id} value={cpu.id}>{cpu.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="recGpuId" className="block mb-2">
                Видеокарта <span className="text-red-500">*</span>
              </label>
              <select
                id="recGpuId"
                name="recGpuId"
                value={formData.recGpuId}
                onChange={handleInputChange}
                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                required
              >
                <option value="">Выберите GPU</option>
                {gpus.map(gpu => (
                  <option key={gpu.id} value={gpu.id}>{gpu.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="recRam" className="block mb-2">
                  RAM (ГБ) <span className="text-red-500">*</span>
                </label>
                <input
                  id="recRam"
                  name="recRam"
                  type="number"
                  min="1"
                  value={formData.recRam}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="recVram" className="block mb-2">
                  VRAM (МБ) <span className="text-red-500">*</span>
                </label>
                <input
                  id="recVram"
                  name="recVram"
                  type="number"
                  value={formData.recVram}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium"
          >
            {loading ? "Добавление..." : "Добавить игру"}
          </button>
        </div>
      </form>
    </div>
  );
} 