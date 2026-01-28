/**
 * Devices API endpoints для Apofiz Backend
 */

import { apiGet, apiPost, apiRequest } from './apiClient';

export interface ActiveDevice {
  id: number;
  key: string;
  user: number;
  location: string | null;
  device: string | null;
  ip: string;
  log_time: string;
  version_app: string | null;
  is_active: boolean;
  operating_system: string | null;
  user_agent: string | null;
  last_active: string | null;
  expired_time_choice: number | null;
  expired_time: string | null;
}

export interface PaginatedResponse<T> {
  total_count: number;
  total_pages: number;
  list: T[];
}

/**
 * Get all active devices for current user (paginated)
 * GET /users/get_active_devices/?page=1&limit=50
 */
export async function getActiveDevices(page = 1, limit = 50) {
  return apiGet<PaginatedResponse<ActiveDevice>>(`/users/get_active_devices/?page=${page}&limit=${limit}`);
}

/**
 * Get authorization history (paginated)
 * GET /users/authorisation_history/?page=1&limit=20
 */
export async function getAuthorizationHistory(page = 1, limit = 20) {
  return apiGet<PaginatedResponse<ActiveDevice>>(`/users/authorisation_history/?page=${page}&limit=${limit}`);
}

/**
 * Get device details
 * GET /users/get_token_detail/<id>/
 */
export async function getDeviceDetail(deviceId: number) {
  return apiGet<ActiveDevice>(`/users/get_token_detail/${deviceId}/`);
}

/**
 * Delete/logout a device
 * DELETE /users/get_token_detail/<id>/
 */
export async function deleteDevice(deviceId: number) {
  return apiRequest<void>(`/users/get_token_detail/${deviceId}/`, { method: 'DELETE' });
}

/**
 * Deactivate user profile
 * POST /users/deactivate/
 */
export async function deactivateProfile() {
  return apiPost<{ success: boolean }>('/users/deactivate/');
}
