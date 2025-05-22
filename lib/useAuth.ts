import { useState, useEffect, useCallback } from 'react';

export type User = {
  id: number;
  email: string;
  name?: string;
  role: string;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        await fetchUser();
        return true;
      } else {
        const data = await res.json();
        setError(data.message || 'Ошибка логина');
        return false;
      }
    } catch {
      setError('Ошибка логина');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (res.ok) {
        // После регистрации сразу логиним
        return await login(email, password);
      } else {
        const data = await res.json();
        setError(data.message || 'Ошибка регистрации');
        return false;
      }
    } catch {
      setError('Ошибка регистрации');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch {
      setError('Ошибка выхода');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      await fetch('/api/auth/refresh', { method: 'POST' });
      await fetchUser();
    } catch {}
  };

  return { user, loading, error, login, register, logout, refresh };
};

export const useUser = () => useAuth().user; 