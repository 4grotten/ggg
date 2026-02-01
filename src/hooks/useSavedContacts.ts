/**
 * Hook for managing saved contacts
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  SavedContact, 
  SavedContactInsert, 
  SavedContactUpdate,
  PaymentMethod,
  ContactSocialLink 
} from '@/types/contact';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Json } from '@/integrations/supabase/types';

export const useSavedContacts = () => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get Supabase auth user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all contacts
  const fetchContacts = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('saved_contacts')
        .select('*')
        .order('full_name', { ascending: true });

      if (fetchError) throw fetchError;

      // Parse JSONB fields
      const parsedContacts: SavedContact[] = (data || []).map((contact) => ({
        ...contact,
        payment_methods: (contact.payment_methods as unknown as PaymentMethod[]) || [],
        social_links: (contact.social_links as unknown as ContactSocialLink[]) || [],
      }));

      setContacts(parsedContacts);
    } catch (err: any) {
      console.error('Failed to fetch contacts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Create a new contact
  const createContact = async (contactData: Omit<SavedContactInsert, 'user_id'>): Promise<SavedContact | null> => {
    if (!userId) {
      toast.error(t('common.authRequired'));
      return null;
    }

    try {
      const insertData = {
        full_name: contactData.full_name,
        user_id: userId,
        phone: contactData.phone,
        email: contactData.email,
        company: contactData.company,
        position: contactData.position,
        avatar_url: contactData.avatar_url,
        notes: contactData.notes,
        payment_methods: (contactData.payment_methods || []) as unknown as Json,
        social_links: (contactData.social_links || []) as unknown as Json,
      };

      const { data, error: insertError } = await supabase
        .from('saved_contacts')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      const newContact: SavedContact = {
        ...data,
        payment_methods: (data.payment_methods as unknown as PaymentMethod[]) || [],
        social_links: (data.social_links as unknown as ContactSocialLink[]) || [],
      };

      setContacts(prev => [...prev, newContact].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      toast.success(t('contacts.created'));
      return newContact;
    } catch (err: any) {
      console.error('Failed to create contact:', err);
      toast.error(t('contacts.createError'));
      return null;
    }
  };

  // Update a contact
  const updateContact = async (id: string, updates: SavedContactUpdate): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.company !== undefined) dbUpdates.company = updates.company;
      if (updates.position !== undefined) dbUpdates.position = updates.position;
      if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.payment_methods !== undefined) {
        dbUpdates.payment_methods = updates.payment_methods as unknown as Json;
      }
      if (updates.social_links !== undefined) {
        dbUpdates.social_links = updates.social_links as unknown as Json;
      }

      const { error: updateError } = await supabase
        .from('saved_contacts')
        .update(dbUpdates)
        .eq('id', id);

      if (updateError) throw updateError;

      setContacts(prev => prev.map(contact => 
        contact.id === id ? { ...contact, ...updates } : contact
      ));
      toast.success(t('contacts.updated'));
      return true;
    } catch (err: any) {
      console.error('Failed to update contact:', err);
      toast.error(t('contacts.updateError'));
      return false;
    }
  };

  // Delete a contact
  const deleteContact = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('saved_contacts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast.success(t('contacts.deleted'));
      return true;
    } catch (err: any) {
      console.error('Failed to delete contact:', err);
      toast.error(t('contacts.deleteError'));
      return false;
    }
  };

  // Upload contact avatar
  const uploadAvatar = async (file: File, contactId: string): Promise<string | null> => {
    if (!userId) return null;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${contactId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('contact-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('contact-avatars')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      toast.error(t('contacts.avatarUploadError'));
      return null;
    }
  };

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchContacts();
    }
  }, [fetchContacts, userId]);

  return {
    contacts,
    isLoading,
    error,
    isAuthenticated: !!userId,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    uploadAvatar,
  };
};
