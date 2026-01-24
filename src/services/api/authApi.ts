/**
 * Auth API endpoints для Apofiz Backend
 */

import { apiPost, apiGet, setAuthToken, AUTH_USER_KEY } from './apiClient';

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
  type: 'register_auth_type' | 'whatsapp_auth_type';
}

export interface ResendCodeResponse {
  message: string;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface UserProfile {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  avatar: { id: number; file: string } | null;
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
  email?: string;
  gender?: 'male' | 'female';
  date_of_birth?: string; // YYYY-MM-DD
  username?: string;
}

export interface SetPasswordRequest {
  password: string;
}

export interface ForgotPasswordRequest {
  phone_number: string;
}

export interface LogoutResponse {
  message: string;
}

// ============ API Functions ============

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
  
  // При успехе сохраняем токен
  if (response.data?.token) {
    setAuthToken(response.data.token);
  }
  
  return response;
}

/**
 * Повторная отправка кода
 * POST /resend_code/
 */
export async function resendCode(
  phone_number: string, 
  type: 'register_auth_type' | 'whatsapp_auth_type' = 'register_auth_type'
) {
  return apiPost<ResendCodeResponse>('/resend_code/', { phone_number, type });
}

/**
 * Логин с паролем
 * POST /login/
 */
export async function login(phone_number: string, password: string) {
  const response = await apiPost<LoginResponse>('/login/', { 
    phone_number, 
    password 
  });
  
  // При успехе сохраняем токен и данные пользователя
  if (response.data?.token) {
    setAuthToken(response.data.token);
    if (response.data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
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
 * Получение профиля текущего пользователя
 * GET /users/me/
 */
export async function getCurrentUser() {
  const response = await apiGet<UserProfile>('/users/me/');
  
  // При успехе сохраняем данные пользователя
  if (response.data) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
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
 * Сброс пароля
 * POST /users/forgot_password/
 */
export async function forgotPassword(phone_number: string) {
  return apiPost<{ message: string }>('/users/forgot_password/', { phone_number });
}
