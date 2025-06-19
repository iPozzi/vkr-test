"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Plus, Search } from "lucide-react";

interface Manufacturer {
  id: number;
  name: string;
}

interface ComponentItem {
  id: number;
  name: string;
  type: string;
  manufacturerId: number;
  manufacturer: Manufacturer;
  benchmarkScore: number;
}

const COMPONENT_TYPES = [
  { value: "CPU", label: "Процессор" },
  { value: "GPU", label: "Видеокарта" },
];

export default function AdminComponentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Модальные окна
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Данные для форм
  const [newComponent, setNewComponent] = useState({
    name: "",
    type: "CPU",
    manufacturerId: 0,
    benchmarkScore: 1000,
  });
  const [editComponent, setEditComponent] = useState<ComponentItem | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/admin/components");
        if (!res.ok) throw new Error("Не удалось загрузить компоненты");
        const data = await res.json();
        setComponents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки компонентов");
      } finally {
        setIsLoading(false);
      }
    };
    if (user && user.role === "admin") fetchData();
  }, [user, modalSuccess]);

  useEffect(() => {
    const fetchManufacturers = async () => {
      const res = await fetch("/api/admin/manufacturers");
      if (res.ok) {
        const data = await res.json();
        setManufacturers(data);
      }
    };
    if (user && user.role === "admin") fetchManufacturers();
  }, [user]);

  // Фильтрация
  const filteredComponents = components.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Добавление
  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    setModalSuccess(false);
    try {
      const res = await fetch("/api/admin/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newComponent,
          manufacturerId: Number(newComponent.manufacturerId),
          benchmarkScore: Number(newComponent.benchmarkScore),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Не удалось создать компонент");
      setModalSuccess(true);
      setNewComponent({ name: "", type: "CPU", manufacturerId: 0, benchmarkScore: 1000 });
      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess(false);
      }, 1500);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Ошибка создания компонента");
    } finally {
      setModalLoading(false);
    }
  };

  // Редактирование
  const handleEditComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editComponent) return;
    setModalLoading(true);
    setModalError(null);
    setModalSuccess(false);
    try {
      const res = await fetch("/api/admin/components", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editComponent.id,
          name: editComponent.name,
          type: editComponent.type,
          manufacturerId: Number(editComponent.manufacturerId),
          benchmarkScore: Number(editComponent.benchmarkScore),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Не удалось обновить компонент");
      setModalSuccess(true);
      setTimeout(() => {
        setShowEditModal(false);
        setModalSuccess(false);
        setEditComponent(null);
      }, 1500);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Ошибка обновления компонента");
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
  if (!user || user.role !== "admin") return null;

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
        <h1 className="text-3xl font-bold">Управление компонентами</h1>
        <button 
          onClick={() => {
            setNewComponent({ name: "", type: "CPU", manufacturerId: 0, benchmarkScore: 1000 });
            setModalError(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus size={18} /> Добавить компонент
        </button>
      </div>
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      {/* Поиск */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Поиск компонентов..."
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
          {filteredComponents.length === 0 ? (
            <div className="text-center text-gray-500 my-12">
              {components.length === 0 ? "Компоненты отсутствуют в базе данных" : "Нет компонентов, соответствующих запросу"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Тип</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Производитель</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Баллы</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {filteredComponents.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{c.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{c.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{c.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{c.manufacturer?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{c.benchmarkScore}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditComponent({ ...c });
                            setModalError(null);
                            setShowEditModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                          aria-label={`Редактировать ${c.name}`}
                        >
                          <Edit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* Модальное окно добавления */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Добавить новый компонент</h3>
            {modalError && (
              <div className="bg-red-500 text-white p-3 rounded-md mb-4">{modalError}</div>
            )}
            {modalSuccess && (
              <div className="bg-green-500 text-white p-3 rounded-md mb-4">Компонент успешно добавлен!</div>
            )}
            <form onSubmit={handleAddComponent}>
              <div className="mb-4">
                <label htmlFor="componentName" className="block mb-2 text-sm font-medium">Название</label>
                <input
                  type="text"
                  id="componentName"
                  value={newComponent.name}
                  onChange={e => setNewComponent({ ...newComponent, name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                  disabled={modalLoading || modalSuccess}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="componentType" className="block mb-2 text-sm font-medium">Тип</label>
                <select
                  id="componentType"
                  value={newComponent.type}
                  onChange={e => setNewComponent({ ...newComponent, type: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                  disabled={modalLoading || modalSuccess}
                >
                  {COMPONENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="componentManufacturer" className="block mb-2 text-sm font-medium">Производитель</label>
                <select
                  id="componentManufacturer"
                  value={newComponent.manufacturerId}
                  onChange={e => setNewComponent({ ...newComponent, manufacturerId: Number(e.target.value) })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                  disabled={modalLoading || modalSuccess}
                >
                  <option value={0} disabled>Выберите производителя</option>
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="componentScore" className="block mb-2 text-sm font-medium">Баллы производительности</label>
                <input
                  type="number"
                  id="componentScore"
                  value={newComponent.benchmarkScore}
                  onChange={e => setNewComponent({ ...newComponent, benchmarkScore: Number(e.target.value) })}
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
      {/* Модальное окно редактирования */}
      {showEditModal && editComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Редактировать компонент</h3>
            {modalError && (
              <div className="bg-red-500 text-white p-3 rounded-md mb-4">{modalError}</div>
            )}
            {modalSuccess && (
              <div className="bg-green-500 text-white p-3 rounded-md mb-4">Компонент успешно обновлен!</div>
            )}
            <form onSubmit={handleEditComponent}>
              <div className="mb-4">
                <label htmlFor="editComponentName" className="block mb-2 text-sm font-medium">Название</label>
                <input
                  type="text"
                  id="editComponentName"
                  value={editComponent.name}
                  onChange={e => setEditComponent({ ...editComponent, name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                  disabled={modalLoading || modalSuccess}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="editComponentType" className="block mb-2 text-sm font-medium">Тип</label>
                <select
                  id="editComponentType"
                  value={editComponent.type}
                  onChange={e => setEditComponent({ ...editComponent, type: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                  disabled={modalLoading || modalSuccess}
                >
                  {COMPONENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="editComponentManufacturer" className="block mb-2 text-sm font-medium">Производитель</label>
                <select
                  id="editComponentManufacturer"
                  value={editComponent.manufacturerId}
                  onChange={e => setEditComponent({ ...editComponent, manufacturerId: Number(e.target.value) })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                  disabled={modalLoading || modalSuccess}
                >
                  <option value={0} disabled>Выберите производителя</option>
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="editComponentScore" className="block mb-2 text-sm font-medium">Баллы производительности</label>
                <input
                  type="number"
                  id="editComponentScore"
                  value={editComponent.benchmarkScore}
                  onChange={e => setEditComponent({ ...editComponent, benchmarkScore: Number(e.target.value) })}
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
    </div>
  );
} 