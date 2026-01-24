/**
 * API Client для Apofiz Backend
 * Base URL: https://test.apofiz.com/api/v1/
 * Формат токена: Token <40-символьный-hex-ключ>
 */

const API_BASE_URL = 'https://test.apofiz.com/api/v1';

// Ключ для хранения токена в localStorage
export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'auth_user';

// Типы для API ответов
export interface ApiError {
  message?: string;
  detail?: string;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

/**
 * Получить токен из localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Сохранить токен в localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Удалить токен из localStorage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

/**
 * Проверить, авторизован ли пользователь
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Основная функция для API запросов
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Подготовка заголовков
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Добавляем токен авторизации, если есть
  const token = getAuthToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Обработка 401 - невалидный токен
    if (response.status === 401) {
      removeAuthToken();
      // Редирект на страницу входа
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/phone';
      }
      return {
        data: null,
        error: { detail: 'Invalid token.' },
        status: 401,
      };
    }
    
    // Парсинг ответа
    let data: T | null = null;
    let error: ApiError | null = null;
    
    try {
      const json = await response.json();
      
      if (response.ok) {
        data = json as T;
      } else {
        error = json as ApiError;
      }
    } catch {
      // Ответ не содержит JSON
      if (!response.ok) {
        error = { message: `HTTP Error: ${response.status}` };
      }
    }
    
    return { data, error, status: response.status };
  } catch (err) {
    // Сетевая ошибка
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'Network error' },
      status: 0,
    };
  }
}

/**
 * GET запрос
 */
export async function apiGet<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST запрос
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT запрос
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH запрос
 */
export async function apiPatch<T = unknown>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE запрос
 */
export async function apiDelete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}
