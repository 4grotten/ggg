/**
 * Contacts API — uEasyCard Backend
 * Base: /api/v1/accounts/contacts/
 * All requests go through cards-proxy edge function.
 */

import { apiRequest } from './apiClient';
import { SavedContact, PaymentMethod, ContactSocialLink } from '@/types/contact';

// --- Endpoints ---

/** GET /accounts/contacts/ — returns flat array of contacts */
export async function fetchContacts() {
  return apiRequest<SavedContact[]>('/contacts/', {
    method: 'GET',
  });
}

/** POST /accounts/contacts/ */
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

/** GET /accounts/contacts/{id}/ */
export async function getContact(id: string | number) {
  return apiRequest<SavedContact>(`/contacts/${id}/`, { method: 'GET' });
}

/** PATCH /accounts/contacts/{id}/ */
export async function updateContact(id: string | number, body: Record<string, unknown>) {
  return apiRequest<SavedContact>(`/contacts/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** DELETE /accounts/contacts/{id}/ */
export async function deleteContact(id: string | number) {
  return apiRequest<void>(`/contacts/${id}/`, { method: 'DELETE' });
}

/** POST /accounts/contacts/{id}/avatar/ — multipart/form-data */
export async function uploadContactAvatar(id: string | number, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const { getAuthToken } = await import('./apiClient');
  
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const url = `${SUPABASE_URL}/functions/v1/cards-proxy?endpoint=${encodeURIComponent(`/accounts/contacts/${id}/avatar/`)}`;

  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };
  const token = getAuthToken();
  if (token) {
    headers['x-backend-token'] = token;
  }

  const response = await fetch(url, {
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

/** DELETE /accounts/contacts/{id}/avatar/ */
export async function deleteContactAvatar(id: string | number) {
  return apiRequest<SavedContact>(`/contacts/${id}/avatar/`, { method: 'DELETE' });
}
