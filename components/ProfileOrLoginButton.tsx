"use client";

import { useAuth } from '@/lib/useAuth';
import { UserCircle, LogIn } from 'lucide-react';
import Link from 'next/link';

const ProfileOrLoginButton = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (user) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        <Link
          href="/profile"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-blue-600 transition text-zinc-100 hover:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
          aria-label="Профиль"
          tabIndex={0}
        >
          <UserCircle className="w-6 h-6" /> Профиль
        </Link>
      </div>
    );
  }
  
  return (
    <Link
      href="/login"
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-blue-700 transition text-white focus:ring-2 focus:ring-blue-400 focus:outline-none ml-auto"
      aria-label="Войти"
      tabIndex={0}
    >
      <LogIn className="w-6 h-6" /> Войти
    </Link>
  );
};

export default ProfileOrLoginButton; 