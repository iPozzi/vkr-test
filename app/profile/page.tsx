"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { UserCircle, LogOut, Shield } from 'lucide-react';
import HardwareProfilePage from './hardware/page';
import Link from 'next/link';

const ProfilePage = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Загрузка...</div>;
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-start py-10">
      <div className="max-w-md w-full p-8 bg-card rounded-2xl shadow-xl flex flex-col items-center mb-8">
        <UserCircle className="w-16 h-16 text-blue-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-zinc-100">Профиль</h1>
        <div className="mb-2 w-full flex items-center justify-between">
          <span className="font-semibold text-zinc-100">Email:</span>
          <span className="text-zinc-100">{user.email}</span>
        </div>
        <div className="mb-2 w-full flex items-center justify-between">
          <span className="font-semibold text-zinc-100">Имя:</span>
          <span className="text-zinc-100">{user.name || '—'}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition focus:ring-2 focus:ring-red-400 focus:outline-none"
          aria-label="Выйти"
          tabIndex={0}
        >
          <LogOut className="w-5 h-5" /> Выйти
        </button>
      </div>
      {user.role === 'user' && (
        <div className="w-full max-w-2xl">
          <HardwareProfilePage />
        </div>
      )}
      {user.role === 'admin' && (
        <div className="max-w-2xl w-full p-6 bg-card rounded-2xl shadow flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4 text-zinc-100">Панель администратора</h2>
          <p className="text-center mb-4 text-zinc-300">У вас есть доступ к панели администратора для управления контентом системы.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/admin/games"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-800 hover:bg-red-700 transition text-white font-semibold focus:ring-2 focus:ring-red-400 focus:outline-none"
            >
              <Shield className="w-5 h-5" /> Управление играми
            </Link>
            <Link
              href="/admin/tags"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-800 hover:bg-blue-700 transition text-white font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <Shield className="w-5 h-5" /> Управление тегами
            </Link>
            <Link
              href="/admin/genres"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-800 hover:bg-green-700 transition text-white font-semibold focus:ring-2 focus:ring-green-400 focus:outline-none"
            >
              <Shield className="w-5 h-5" /> Управление жанрами
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 