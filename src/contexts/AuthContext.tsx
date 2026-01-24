/**
 * AuthContext — глобальное состояние авторизации
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  getCurrentUser, 
  logout as apiLogout, 
  type UserProfile 
} from '@/services/api/authApi';
import { 
  getAuthToken, 
  removeAuthToken, 
  isAuthenticated as checkIsAuthenticated,
  AUTH_USER_KEY 
} from '@/services/api/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Роуты, которые не требуют авторизации
const PUBLIC_ROUTES = ['/auth/phone', '/auth/code', '/auth/profile'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Проверка токена при загрузке приложения
  const checkAuth = useCallback(async () => {
    const token = getAuthToken();
    
    if (!token) {
      setIsLoading(false);
      setUser(null);
      return;
    }

    // Пробуем загрузить из localStorage
    const cachedUser = localStorage.getItem(AUTH_USER_KEY);
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        // ignore
      }
    }

    // Проверяем токен через API
    const response = await getCurrentUser();
    
    if (response.error || !response.data) {
      // Токен невалидный
      removeAuthToken();
      setUser(null);
      
      // Редирект на страницу входа, если не на публичном роуте
      if (!PUBLIC_ROUTES.some(route => location.pathname.startsWith(route))) {
        navigate('/auth/phone', { replace: true });
      }
    } else {
      setUser(response.data);
    }
    
    setIsLoading(false);
  }, [navigate, location.pathname]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Редирект неавторизованных пользователей
  useEffect(() => {
    if (!isLoading && !user) {
      const isPublicRoute = PUBLIC_ROUTES.some(route => location.pathname.startsWith(route));
      if (!isPublicRoute && location.pathname !== '/') {
        // Разрешаем главную страницу без авторизации для демо
        // В production можно убрать это условие
      }
    }
  }, [isLoading, user, location.pathname, navigate]);

  const login = useCallback((userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Игнорируем ошибки при logout
    } finally {
      removeAuthToken();
      setUser(null);
      navigate('/auth/phone', { replace: true });
    }
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const response = await getCurrentUser();
    if (response.data) {
      setUser(response.data);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && checkIsAuthenticated(),
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
