/**
 * Devices API endpoints для Apofiz Backend
 */

import { apiGet, apiRequest } from './apiClient';

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

/**
 * Get all active devices for current user
 * GET /users/get_active_devices/
 */
export async function getActiveDevices() {
  return apiGet<ActiveDevice[]>('/users/get_active_devices/');
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
