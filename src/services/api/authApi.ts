/**
 * Auth API endpoints для Apofiz Backend
 */

import { apiPost, apiGet, setAuthToken, getAuthToken, AUTH_USER_KEY } from './apiClient';
import { saveCurrentAccount } from '@/hooks/useMultiAccount';

// ============ Types ============

export interface RegisterAuthRequest {
  phone_number: string;
}

export interface RegisterAuthResponse {
  message: string;
  is_new_user: boolean;
  token: string | null;
  temporary_code_enabled?: boolean;
  email?: boolean;
}

export interface VerifyCodeRequest {
  code: number;
  phone_number: string;
}

export interface VerifyCodeResponse {
  message: string;
  token: string;
  is_new_user: boolean;
}

export interface ResendCodeRequest {
  phone_number: string;
  type: 'register_auth_type' | 'whatsapp_auth_type' | 'email_auth_type';
}

export interface ResendCodeResponse {
  message: string;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
  location?: string;
  device?: string;
}

export interface AvatarData {
  id: number;
  file: string;
  name?: string;
  large: string | null;
  medium: string | null;
  small: string | null;
}

export interface UserProfile {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  avatar: AvatarData | null;
  username: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | null;
  has_empty_fields: boolean;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: UserProfile;
}

export interface InitProfileRequest {
  full_name: string;
  avatar_id?: number;
  email?: string;
  gender?: 'male' | 'female';
  date_of_birth?: string; // YYYY-MM-DD
  username?: string;
}

export interface SetPasswordRequest {
  password: string;
}

export type ForgotPasswordMethod = 'sms' | 'whatsapp' | 'email';

export interface ForgotPasswordRequest {
  phone_number: string;
  method?: ForgotPasswordMethod;
}

export interface ForgotPasswordResponse {
  message: string;
  method: ForgotPasswordMethod;
  available_methods: ForgotPasswordMethod[];
}

export interface LogoutResponse {
  message: string;
}

// ============ API Functions ============

/**
 * Отправка OTP на номер телефона (перед регистрацией)
 * POST /otp/send/
 */
export async function sendOtp(phone_number: string, type: 'sms' | 'whatsapp' = 'whatsapp') {
  return apiPost<{ message: string }>('/otp/send/', { 
    phone_number, 
    type 
  });
}

/**
 * Проверка OTP кода
 * POST /otp/verify/
 */
export async function verifyOtp(phone_number: string, code: string) {
  const response = await apiPost<{ 
    is_valid: boolean; 
    error?: string; 
    token?: string | null; 
    is_new_user?: boolean | null;
  }>('/otp/verify/', { 
    phone_number, 
    code 
  });
  
  // При успешной верификации сохраняем токен
  if (response.data?.is_valid && response.data?.token) {
    setAuthToken(response.data.token);
    
    // Для существующего пользователя сразу подтягиваем профиль
    if (!response.data.is_new_user) {
      await getCurrentUser();
    }
  }
  
  return response;
}

/**
 * Регистрация / проверка номера телефона
 * POST /register_auth/
 */
export async function registerAuth(phone_number: string) {
  return apiPost<RegisterAuthResponse>('/register_auth/', { phone_number });
}

/**
 * Подтверждение СМС-кода
 * POST /verify_code/
 */
export async function verifyCode(phone_number: string, code: number) {
  const response = await apiPost<VerifyCodeResponse>('/verify_code/', { 
    phone_number, 
    code 
  });
  
  // При успехе сохраняем токен и подтягиваем профиль
  if (response.data?.token) {
    setAuthToken(response.data.token);
    
    // Для существующего пользователя сразу подтягиваем профиль
    if (!response.data.is_new_user) {
      await getCurrentUser();
    }
  }
  
  return response;
}

/**
 * Повторная отправка кода
 * POST /resend_code/
 */
export async function resendCode(
  phone_number: string, 
  type: 'register_auth_type' | 'whatsapp_auth_type' | 'email_auth_type' = 'register_auth_type'
) {
  return apiPost<ResendCodeResponse>('/resend_code/', { phone_number, type });
}

/**
 * Логин с паролем
 * POST /login/
 */
export async function login(
  phone_number: string, 
  password: string,
  options?: { location?: string; device?: string }
) {
  const response = await apiPost<LoginResponse>('/login/', { 
    phone_number, 
    password,
    ...(options?.location && { location: options.location }),
    ...(options?.device && { device: options.device }),
  });
  
  // При успехе сохраняем токен и данные пользователя
  if (response.data?.token) {
    setAuthToken(response.data.token);
    if (response.data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
      // Persist for multi-account switching
      saveCurrentAccount(response.data.user);
    }
  }
  
  return response;
}

/**
 * Инициализация профиля (после регистрации)
 * POST /init_profile/
 */
export async function initProfile(data: InitProfileRequest) {
  const response = await apiPost<UserProfile>('/init_profile/', data);
  
  // При успехе сохраняем данные пользователя
  if (response.data) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
    // Persist for multi-account switching
    saveCurrentAccount(response.data);
  }
  
  return response;
}

/**
 * Установка пароля
 * POST /set_password/
 */
export async function setPassword(password: string) {
  return apiPost<{ message: string }>('/set_password/', { password });
}

/**
 * Смена пароля (для авторизованного пользователя)
 * POST /users/doChangePassword/
 */
export async function changePassword(old_password: string, new_password: string) {
  return apiPost<{ message: string }>('/users/doChangePassword/', { 
    old_password, 
    new_password 
  });
}

/**
 * Получение профиля текущего пользователя
 * GET /users/me/
 */
export async function getCurrentUser() {
  const response = await apiGet<UserProfile>('/users/me/');
  
  // При успехе сохраняем данные пользователя
  if (response.data) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
    // Persist for multi-account switching
    saveCurrentAccount(response.data);
  }
  
  return response;
}

/**
 * Логаут
 * POST /logout/
 */
export async function logout() {
  return apiPost<LogoutResponse>('/logout/');
}

/**
 * Получить привязанный email пользователя
 * GET /users/get_email/
 */
export async function getUserEmail() {
  return apiGet<{ email: string | null }>('/users/get_email/');
}

/**
 * Отправить код сброса пароля на email
 * POST /users/forgot_password_email/
 */
export async function forgotPasswordEmail() {
  return apiPost<{ message: string }>('/users/forgot_password_email/');
}

/**
 * Сброс пароля — запрос кода
 * POST /users/forgot_password/
 * @param phone_number - номер телефона
 * @param method - способ отправки: 'sms' | 'whatsapp' | 'email'
 */
export async function forgotPassword(phone_number: string, method?: ForgotPasswordMethod) {
  return apiPost<ForgotPasswordResponse>('/users/forgot_password/', { 
    phone_number,
    ...(method && { method })
  });
}

/**
 * Проверка кода сброса пароля
 * POST /users/verify_reset_code/
 */
export async function verifyResetCode(phone_number: string, code: string) {
  return apiPost<{ 
    is_valid: boolean; 
    error?: string; 
    token?: string;
  }>('/users/verify_reset_code/', { phone_number, code });
}

/**
 * Установка нового пароля после сброса
 * POST /users/reset_password/
 */
export async function resetPassword(
  phone_number: string, 
  code: string, 
  new_password: string,
  token?: string
) {
  return apiPost<{ message: string }>('/users/reset_password/', { 
    phone_number, 
    code, 
    new_password,
    ...(token && { token })
  });
}

/**
 * Загрузка аватарки
 * POST /files/
 */
export async function uploadAvatar(file: File): Promise<AvatarData> {
  const formData = new FormData();
  formData.append('file', file);
  
  const url = 'https://test.apofiz.com/api/v1/files/';
  const token = getAuthToken();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`
      // НЕ указывать Content-Type — браузер сам поставит multipart boundary
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload avatar');
  }
  
  return response.json();
}

/**
 * Обновить профиль (с привязкой аватарки)
 * POST /init_profile/
 */
export async function updateProfile(data: {
  full_name: string;
  avatar_id?: number;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  username?: string;
}) {
  const response = await apiPost<UserProfile>('/init_profile/', data);
  
  // При успехе сохраняем данные пользователя
  if (response.data) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
    // Persist for multi-account switching
    saveCurrentAccount(response.data);
  }
  
  return response;
}
