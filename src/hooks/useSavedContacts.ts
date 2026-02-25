/**
 * Hook for managing saved contacts via Apofiz API
 */

import { useState, useEffect, useCallback } from 'react';
import {
  SavedContact,
  SavedContactUpdate,
  PaymentMethod,
  ContactSocialLink,
} from '@/types/contact';
import {
  fetchContacts as apiFetchContacts,
  createContact as apiCreateContact,
  updateContact as apiUpdateContact,
  deleteContact as apiDeleteContact,
} from '@/services/api/contactsApi';
import { isAuthenticated } from '@/services/api/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useSavedContacts = () => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authed = isAuthenticated();

  // Fetch all contacts
  const fetchContacts = useCallback(async () => {
    if (!authed) {
      setContacts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetchContacts();
      // Backend may not have contacts endpoint yet — treat 404/500/502 as empty list
      if (res.status === 404 || res.status === 502 || res.status === 500) {
        setContacts([]);
        setIsLoading(false);
        return;
      }
      if (res.error) {
        const msg = res.error.detail || res.error.message || 'Fetch error';
        // Connection refused = backend is down, don't throw
        if (msg.includes('Connection refused') || msg.includes('tcp connect error')) {
          setContacts([]);
          setIsLoading(false);
          return;
        }
        throw new Error(msg);
      }

      const list = res.data ?? [];
      // Ensure arrays for nested fields
      const parsed: SavedContact[] = list.map((c) => ({
        ...c,
        payment_methods: (c.payment_methods as PaymentMethod[]) || [],
        social_links: (c.social_links as ContactSocialLink[]) || [],
      }));

      parsed.sort((a, b) => a.full_name.localeCompare(b.full_name));
      setContacts(parsed);
    } catch (err: any) {
      console.error('Failed to fetch contacts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [authed]);

  // Create a new contact
  const createContact = async (
    contactData: Omit<SavedContact, 'id' | 'created_at' | 'updated_at' | 'user_id'>
  ): Promise<SavedContact | null> => {
    if (!authed) {
      toast.error(t('common.authRequired'));
      return null;
    }

    try {
      const res = await apiCreateContact({
        full_name: contactData.full_name,
        phone: contactData.phone,
        email: contactData.email,
        company: contactData.company,
        position: contactData.position,
        notes: contactData.notes,
        payment_methods: contactData.payment_methods,
        social_links: contactData.social_links,
      });

      if (res.error) throw new Error(res.error.detail || res.error.message || 'Create error');

      const newContact: SavedContact = {
        ...res.data!,
        payment_methods: (res.data!.payment_methods as PaymentMethod[]) || [],
        social_links: (res.data!.social_links as ContactSocialLink[]) || [],
      };

      setContacts((prev) =>
        [...prev, newContact].sort((a, b) => a.full_name.localeCompare(b.full_name))
      );
      toast.success(t('contacts.created'));
      return newContact;
    } catch (err: any) {
      console.error('Failed to create contact:', err);
      toast.error(t('contacts.createError'));
      return null;
    }
  };

  // Update a contact
  const updateContactFn = async (id: string | number, updates: SavedContactUpdate): Promise<boolean> => {
    try {
      const res = await apiUpdateContact(id, updates as Record<string, unknown>);
      if (res.error) throw new Error(res.error.detail || res.error.message || 'Update error');

      setContacts((prev) =>
        prev.map((c) => (String(c.id) === String(id) ? { ...c, ...updates } : c))
      );
      toast.success(t('contacts.updated'));
      return true;
    } catch (err: any) {
      console.error('Failed to update contact:', err);
      toast.error(t('contacts.updateError'));
      return false;
    }
  };

  // Delete a contact
  const deleteContactFn = async (id: string | number): Promise<boolean> => {
    try {
      const res = await apiDeleteContact(id);
      if (res.error) throw new Error(res.error.detail || res.error.message || 'Delete error');

      setContacts((prev) => prev.filter((c) => String(c.id) !== String(id)));
      toast.success(t('contacts.deleted'));
      return true;
    } catch (err: any) {
      console.error('Failed to delete contact:', err);
      toast.error(t('contacts.deleteError'));
      return false;
    }
  };

  // Upload contact avatar to storage bucket
  const uploadAvatar = async (file: File, contactId: string): Promise<string | null> => {
    if (!authed) return null;

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${contactId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('contact-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('contact-avatars')
        .getPublicUrl(filePath);

      const url = urlData?.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : null;

      if (url) {
        setContacts((prev) =>
          prev.map((c) => (c.id === contactId ? { ...c, avatar_url: url } : c))
        );
      }

      return url;
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      toast.error(t('contacts.avatarUploadError'));
      return null;
    }
  };

  // Initial fetch
  useEffect(() => {
    if (authed) {
      fetchContacts();
    }
  }, [fetchContacts, authed]);

  return {
    contacts,
    isLoading,
    error,
    isAuthenticated: authed,
    fetchContacts,
    createContact,
    updateContact: updateContactFn,
    deleteContact: deleteContactFn,
    uploadAvatar,
  };
};
