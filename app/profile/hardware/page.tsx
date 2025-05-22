"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from '@/lib/useAuth';

interface Component {
  id: number;
  name: string;
  type: string;
  manufacturer: {
    id: number;
    name: string;
  };
}

interface HardwareProfile {
  id: number;
  cpuId: number;
  gpuId: number;
  ram: number;
  vram: number;
  createdAt: string;
  cpu: Component;
  gpu: Component;
}

export default function HardwareProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [cpus, setCpus] = useState<Component[]>([]);
  const [gpus, setGpus] = useState<Component[]>([]);
  
  const [profile, setProfile] = useState<HardwareProfile | null>(null);
  const [formData, setFormData] = useState({
    cpuId: "",
    gpuId: "",
    ram: 8,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load components and existing profile
  useEffect(() => {
    async function loadData() {
      try {
        // Load components
        const componentsRes = await fetch("/api/components");
        const componentsData: Component[] = await componentsRes.json();
        
        setCpus(componentsData.filter((comp) => comp.type === "CPU"));
        setGpus(componentsData.filter((comp) => comp.type === "GPU"));
        
        // Load existing profile if user is logged in
        if (user?.id) {
          const profileRes = await fetch(`/api/profile/hardware`);
          
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setProfile(profileData);
            
            // Populate form with existing data
            if (profileData) {
              setFormData({
                cpuId: profileData.cpuId.toString(),
                gpuId: profileData.gpuId.toString(),
                ram: profileData.ram,
              });
            }
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Ошибка при загрузке данных");
      } finally {
        setLoadingProfile(false);
      }
    }
    if (user) {
      loadData();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const method = profile ? "PUT" : "POST";
      
      const response = await fetch("/api/profile/hardware", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cpuId: parseInt(formData.cpuId),
          gpuId: parseInt(formData.gpuId),
          ram: Number(formData.ram),
          vram: 4096,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Ошибка при сохранении профиля");
      }
      
      setSuccess(true);
      setProfile(data);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Произошла ошибка";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Мой профиль оборудования</h1>
      
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 text-white p-4 rounded-md mb-6">
          Профиль оборудования успешно сохранен!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-zinc-800 pb-2">
            {profile ? "Обновить профиль" : "Создать профиль"}
          </h2>
          
          <div>
            <label htmlFor="cpuId" className="block mb-2">
              Процессор <span className="text-red-500">*</span>
            </label>
            <select
              id="cpuId"
              name="cpuId"
              value={formData.cpuId}
              onChange={handleInputChange}
              className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
              required
            >
              <option value="">Выберите CPU</option>
              {cpus.map(cpu => (
                <option key={cpu.id} value={cpu.id}>
                  {cpu.manufacturer.name} {cpu.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="gpuId" className="block mb-2">
              Видеокарта <span className="text-red-500">*</span>
            </label>
            <select
              id="gpuId"
              name="gpuId"
              value={formData.gpuId}
              onChange={handleInputChange}
              className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
              required
            >
              <option value="">Выберите GPU</option>
              {gpus.map(gpu => (
                <option key={gpu.id} value={gpu.id}>
                  {gpu.manufacturer.name} {gpu.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ram" className="block mb-2">
                RAM (ГБ) <span className="text-red-500">*</span>
              </label>
              <input
                id="ram"
                name="ram"
                type="number"
                min="1"
                step="1"
                value={formData.ram}
                onChange={handleInputChange}
                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-card hover:bg-white-700 rounded-md font-medium"
          >
            {loading 
              ? "Сохранение..." 
              : profile 
                ? "Обновить профиль" 
                : "Создать профиль"
            }
          </button>
        </div>
      </form>
      
      {profile && (
        <div className="mt-8 p-4 bg-card rounded-md">
          <h3 className="text-lg font-medium mb-2">Текущая конфигурация:</h3>
          <ul className="space-y-2">
            <li><strong>CPU:</strong> {profile.cpu.manufacturer.name} {profile.cpu.name}</li>
            <li><strong>GPU:</strong> {profile.gpu.manufacturer.name} {profile.gpu.name}</li>
            <li><strong>RAM:</strong> {profile.ram} ГБ</li>
          </ul>
        </div>
      )}
    </div>
  );
} 