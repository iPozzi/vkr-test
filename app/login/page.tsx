"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Mail, Lock, LogIn } from 'lucide-react';
import * as Label from '@radix-ui/react-label';
import * as Toast from '@radix-ui/react-toast';

const LoginPage = () => {
  const { login, loading, error, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/profile');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      router.replace('/profile');
    } else {
      setOpen(true);
    }
  };

  return (
    <Toast.Provider swipeDirection="right">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold mb-6 text-center text-zinc-100 flex items-center justify-center gap-2">
            <LogIn className="w-7 h-7 text-blue-600" /> Вход
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label.Root htmlFor="email" className="block mb-1 font-medium text-zinc-100">Email</Label.Root>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-100 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-800 text-zinc-100"
                  required
                  aria-label="Email"
                  tabIndex={0}
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <Label.Root htmlFor="password" className="block mb-1 font-medium text-zinc-100">Пароль</Label.Root>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-100 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-800 text-zinc-100"
                  required
                  aria-label="Пароль"
                  tabIndex={0}
                  autoComplete="current-password"
                />
              </div>
              <div className="mt-2 text-right">
                <a
                  href="/forgot-password"
                  className="text-blue-600 underline text-sm hover:text-blue-500 transition"
                  tabIndex={0}
                  aria-label="Забыли пароль?"
                >
                  Забыли пароль?
                </a>
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-60"
              disabled={loading}
              aria-label="Войти"
              tabIndex={0}
            >
              <LogIn className="w-5 h-5" /> {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <div className="mt-6 text-center text-zinc-100">
            Нет аккаунта? <a href="/register" className="text-blue-600 underline">Зарегистрироваться</a>
          </div>
        </div>
        <Toast.Root open={open && !!error} onOpenChange={setOpen} duration={4000} className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span>Ошибка: {error}</span>
          <Toast.Close aria-label="Закрыть" className="ml-auto text-white hover:text-zinc-200">×</Toast.Close>
        </Toast.Root>
        <Toast.Viewport className="fixed bottom-4 right-4 z-50" />
      </div>
    </Toast.Provider>
  );
};

export default LoginPage; 