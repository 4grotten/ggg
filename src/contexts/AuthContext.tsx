/**
 * AuthContext — глобальное состояние авторизации
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { 
  getCurrentUser, 
  logout as apiLogout, 
  uploadAvatar as apiUploadAvatar,
  updateProfile as apiUpdateProfile,
  type UserProfile,
  type AvatarData
} from '@/services/api/authApi';
import { 
  getAuthToken,
  setAuthToken,
  removeAuthToken, 
  isAuthenticated as checkIsAuthenticated,
  AUTH_USER_KEY 
} from '@/services/api/apiClient';
import { saveCurrentAccount } from '@/hooks/useMultiAccount';

// Синхронизация токена с основным сайтом Apofiz
const syncWithApofiz = (token: string, user: UserProfile | null) => {
  const apofizState = {
    userStore: {
      user: user,
      token: token
    }
  };
  
  // Записываем cookie которую читает Apofiz фронтенд
  Cookies.set('state', JSON.stringify(apofizState), { 
    expires: 7,        // 7 дней, как у Apofiz
    path: '/',         // доступна на всём домене
    sameSite: 'Lax'
  });
};

// Удаление синхронизации при logout
const clearApofizSync = () => {
  Cookies.remove('state', { path: '/' });
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  updateUserProfile: (data: {
    full_name: string;
    avatar_id?: number;
    email?: string;
    gender?: string;
    date_of_birth?: string;
    username?: string;
  }) => Promise<void>;
  /** Switch to a different user instantly (from saved accounts) */
  switchUser: (userData: UserProfile, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Роуты, которые не требуют авторизации
const PUBLIC_ROUTES = ['/auth/phone', '/auth/code', '/auth/profile'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const hasCheckedRef = useRef(false);

  // Keep Apofiz cookie in sync whenever we have both token + user.
  // This avoids any ordering issues where token is persisted slightly before/after user is set.
  useEffect(() => {
    const token = getAuthToken();
    if (token && user) {
      syncWithApofiz(token, user);
    }
    if (!token) {
      // If token disappears (e.g. manual removal), ensure Apofiz cookie is cleared too.
      clearApofizSync();
    }
  }, [user]);

  // Проверка токена при загрузке приложения
  const checkAuth = useCallback(async () => {
    // Выполняем проверку один раз при загрузке приложения,
    // чтобы не делать GET /users/me/ на каждый переход между страницами.
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // 1. Попробовать прочитать токен из куки state (от Apofiz)
    // Это обеспечивает синхронизацию Apofiz → EasyCard
    const stateCookie = Cookies.get('state');
    if (stateCookie && !getAuthToken()) {
      try {
        const parsed = JSON.parse(stateCookie);
        const cookieToken = parsed?.userStore?.token;
        const cookieUser = parsed?.userStore?.user;
        
        if (cookieToken) {
          // Сохранить токен в localStorage EasyCard
          setAuthToken(cookieToken);
          
          // Если есть user в куке — сразу установить (будет перезаписан после валидации)
          if (cookieUser) {
            setUser(cookieUser);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(cookieUser));
          }
        }
      } catch {
        // Невалидный JSON в куке — игнорируем
      }
    }

    // 2. Теперь проверяем токен (может быть из localStorage или только что из куки)
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
    
    // ВАЖНО: Удаляем токен ТОЛЬКО при 401 (невалидный токен)
    // При других ошибках (сеть, 500) оставляем пользователя залогиненным
    if (response.status === 401) {
      // Токен точно невалидный — сервер это подтвердил
      removeAuthToken();
      setUser(null);
      
      // Редирект на страницу входа, если не на публичном роуте
      const pathname = window.location.pathname;
      if (!PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        navigate('/auth/phone', { replace: true });
      }
    } else if (response.data) {
      // Успешный ответ — обновляем данные пользователя
      setUser(response.data);
    }
    // При других ошибках (сеть, 500) — оставляем кэшированного пользователя
    
    setIsLoading(false);
  }, [navigate]);

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
    
    // Синхронизируем с Apofiz
    const token = getAuthToken();
    if (token) {
      syncWithApofiz(token, userData);
      // Save to multi-account storage
      saveCurrentAccount(userData);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Игнорируем ошибки при logout
    } finally {
      removeAuthToken();
      clearApofizSync(); // Удаляем cookie при logout
      setUser(null);
      navigate('/auth/phone', { replace: true });
    }
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const response = await getCurrentUser();
    if (response.data) {
      setUser(response.data);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
      
      // Синхронизируем с Apofiz при обновлении профиля
      const token = getAuthToken();
      if (token) {
        syncWithApofiz(token, response.data);
      }
    }
  }, []);

  // Если токен появляется после первичной загрузки (например, после логина на /auth/phone),
  // подтягиваем профиль и обновляем UI.
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    if (isLoading) return;
    if (user) return;

    // Не блокируем UI — просто синхронизируем профиль
    refreshUser();
  }, [location.pathname, isLoading, user, refreshUser]);

  const updateAvatar = useCallback(async (file: File) => {
    // 1. Загружаем файл и получаем id
    const avatarData = await apiUploadAvatar(file);
    
    // 2. Обновляем профиль с новым avatar_id
    if (user) {
      await apiUpdateProfile({
        full_name: user.full_name,
        avatar_id: avatarData.id,
        email: user.email || undefined,
        gender: user.gender || undefined,
        date_of_birth: user.date_of_birth || undefined,
        username: user.username || undefined,
      });
    }
    
    // 3. Обновляем данные пользователя
    await refreshUser();
  }, [user, refreshUser]);

  const updateUserProfile = useCallback(async (data: {
    full_name: string;
    avatar_id?: number;
    email?: string;
    gender?: string;
    date_of_birth?: string;
    username?: string;
  }) => {
    await apiUpdateProfile(data);
    await refreshUser();
  }, [refreshUser]);

  /** Switch to a different user instantly (for multi-account) */
  const switchUser = useCallback((userData: UserProfile, token: string) => {
    // 1. Set token
    setAuthToken(token);
    // 2. Set user in localStorage
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    // 3. Update React state immediately
    setUser(userData);
    // 4. Sync with Apofiz
    syncWithApofiz(token, userData);
    console.log('[AuthContext] Switched to user:', userData.id, userData.full_name);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && checkIsAuthenticated(),
    isLoading,
    login,
    logout,
    refreshUser,
    updateAvatar,
    updateUserProfile,
    switchUser,
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
