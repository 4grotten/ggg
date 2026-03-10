/**
 * Auth API endpoints для Apofiz Backend
 */

import { apiPost, apiGet, apiRequest, setAuthToken, getAuthToken, AUTH_USER_KEY } from './apiClient';
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
  user_id?: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  avatar: AvatarData | null;
  username: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | null;
  has_empty_fields: boolean;
  role: string | null;
  is_verified?: boolean;
  verification_status?: string;
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
  const response = await apiGet<any>('/users/me/');
  
  // При успехе нормализуем и сохраняем данные пользователя
  if (response.data) {
    const raw = response.data;
    
    // Normalize API response to flat UserProfile
    // API returns: { user_id, full_name, phone, email, gender, avatar_url, apofiz_data: { username, date_of_birth, phone_number, avatar, ... } }
    const apofiz = raw.apofiz_data || {};
    const normalized: UserProfile = {
      id: raw.id || apofiz.id,
      user_id: raw.user_id,
      full_name: raw.full_name || apofiz.full_name || '',
      phone_number: raw.phone || apofiz.phone_number || raw.phone_number || '',
      email: raw.email || apofiz.email || null,
      avatar: apofiz.avatar || (raw.avatar_url ? { id: 0, file: raw.avatar_url, large: raw.avatar_url, medium: raw.avatar_url, small: raw.avatar_url } : null),
      username: apofiz.username || raw.username || null,
      date_of_birth: apofiz.date_of_birth || raw.date_of_birth || null,
      gender: raw.gender || apofiz.gender || null,
      has_empty_fields: apofiz.has_empty_fields ?? raw.has_empty_fields ?? false,
      role: raw.role || null,
      is_verified: raw.is_verified,
      verification_status: raw.verification_status,
    };

    // Fallback phone from cached login data
    if (!normalized.phone_number) {
      try {
        const cached = localStorage.getItem(AUTH_USER_KEY);
        if (cached) {
          const prev = JSON.parse(cached) as UserProfile;
          if (prev.phone_number) {
            normalized.phone_number = prev.phone_number;
          }
        }
      } catch {}
    }

    response.data = normalized as any;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalized));
    saveCurrentAccount(normalized);
  }
  
  return response as { data: UserProfile | null; error: any; status: number };
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
 * Загрузка аватарки
 * POST /files/
 */
export async function uploadAvatar(file: File): Promise<AvatarData> {
  const formData = new FormData();
  formData.append('file', file);
  
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const url = `${SUPABASE_URL}/functions/v1/cards-proxy?endpoint=${encodeURIComponent('/files/')}`;
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };
  
  if (token) {
    headers['x-backend-token'] = token;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
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

// ============ Social Networks API ============

export interface SocialNetworkItem {
  id: number;
  url: string;
}

export interface SetSocialNetworksResponse {
  message: string;
  networks: SocialNetworkItem[];
}

/**
 * Get user social networks
 * GET /users/<user_id>/social_networks/
 */
export async function getSocialNetworks(userId: number) {
  return apiGet<SocialNetworkItem[]>(`/users/${userId}/social_networks/`);
}

/**
 * Set user social networks (replaces all)
 * POST /users/social_networks/
 */
export async function setSocialNetworks(urls: string[]) {
  return apiPost<SetSocialNetworksResponse>('/users/social_networks/', { networks: urls });
}

// ============ Change Auth Number API ============

export interface ChangeAuthNumberRequest {
  old_phone_number: string;
  new_phone_number: string;
  code?: number;
}

export interface ChangeAuthNumberResponse {
  message: string;
}

/**
 * Change and verify auth phone number
 * POST /users/doChangeAndVerifyNewNumber/
 */
export async function changeAuthNumber(data: ChangeAuthNumberRequest) {
  const body: Record<string, any> = {
    old_phone_number: data.old_phone_number,
    new_phone_number: data.new_phone_number,
  };
  if (data.code !== undefined) {
    body.code = data.code;
  }
  return apiPost<ChangeAuthNumberResponse>('/users/doChangeAndVerifyNewNumber/', body);
}

// ============ Phone Numbers API ============

export interface PhoneNumberItem {
  id?: number;
  phone_number: string;
}

export interface SetPhoneNumbersResponse {
  message: string;
  numbers: PhoneNumberItem[];
}

/**
 * Get user phone numbers
 * GET /users/<user_id>/phone_numbers/
 */
export async function getPhoneNumbers(userId: number) {
  return apiGet<PhoneNumberItem[]>(`/users/${userId}/phone_numbers/`);
}

/**
 * Set user phone numbers (replaces all)
 * POST /users/phone_numbers/
 */
export async function updatePhoneNumbers(phoneNumbers: string[]) {
  return apiPost<SetPhoneNumbersResponse>('/users/phone_numbers/', { phone_numbers: phoneNumbers });
}
