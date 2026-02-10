/**
 * Contacts API — Apofiz Backend
 * Base: /api/v1/contacts/
 */

import { apiRequest } from './apiClient';
import { SavedContact, PaymentMethod, ContactSocialLink } from '@/types/contact';

// --- Response types ---

export interface ContactsListResponse {
  total_count: number;
  total_pages: number;
  list: SavedContact[];
}

// --- Endpoints ---

/** GET /contacts/?page=&limit= */
export async function fetchContacts(page = 1, limit = 100) {
  return apiRequest<ContactsListResponse>(`/contacts/?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
}

/** POST /contacts/ */
export async function createContact(body: {
  full_name: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  notes?: string;
  payment_methods?: PaymentMethod[];
  social_links?: ContactSocialLink[];
}) {
  return apiRequest<SavedContact>('/contacts/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** GET /contacts/{id}/ */
export async function getContact(id: string) {
  return apiRequest<SavedContact>(`/contacts/${id}/`, { method: 'GET' });
}

/** PATCH /contacts/{id}/ */
export async function updateContact(id: string, body: Record<string, unknown>) {
  return apiRequest<SavedContact>(`/contacts/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** DELETE /contacts/{id}/ */
export async function deleteContact(id: string) {
  return apiRequest<void>(`/contacts/${id}/`, { method: 'DELETE' });
}

/** POST /contacts/{id}/avatar/ — multipart/form-data */
export async function uploadContactAvatar(id: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  // We need a custom request because Content-Type must be multipart
  const { getAuthToken } = await import('./apiClient');
  const { APOFIZ_API_URL } = await import('@/config/apofiz');

  const headers: HeadersInit = {};
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${APOFIZ_API_URL}/contacts/${id}/avatar/`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return { data: null, error: err, status: response.status };
  }

  const data = await response.json();
  return { data: data as SavedContact, error: null, status: response.status };
}

/** DELETE /contacts/{id}/avatar/ */
export async function deleteContactAvatar(id: string) {
  return apiRequest<SavedContact>(`/contacts/${id}/avatar/`, { method: 'DELETE' });
}
