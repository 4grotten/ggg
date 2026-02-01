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

// Mock contacts for demo purposes
const MOCK_CONTACTS: SavedContact[] = [
  {
    id: 'mock-1',
    user_id: 'demo',
    full_name: 'Александр Петров',
    phone: '+971 50 123 4567',
    email: 'alex.petrov@gmail.com',
    company: 'Dubai Tech Solutions',
    position: 'CEO',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    notes: 'Партнёр по бизнесу, встреча каждый понедельник',
    payment_methods: [
      { id: 'pm-1', type: 'card', label: 'Visa Card', value: '4532 8721 4563 7823' },
      { id: 'pm-2', type: 'crypto', label: 'USDT TRC20', value: 'TJYxBLjN5gKPxTdMjrKPfpXUPe5BYUj9kD', network: 'trc20' }
    ],
    social_links: [
      { id: 'sl-1', networkId: 'telegram', networkName: 'Telegram', url: 'https://t.me/alexpetrov' },
      { id: 'sl-2', networkId: 'linkedin', networkName: 'LinkedIn', url: 'https://linkedin.com/in/alexpetrov' }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-2',
    user_id: 'demo',
    full_name: 'Мария Иванова',
    phone: '+971 55 987 6543',
    email: 'maria.ivanova@company.ae',
    company: 'Emirates Finance',
    position: 'CFO',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    notes: 'Финансовый консультант',
    payment_methods: [
      { id: 'pm-3', type: 'iban', label: 'UAE IBAN', value: 'AE07 0331 2345 6789 0123 456' }
    ],
    social_links: [
      { id: 'sl-3', networkId: 'instagram', networkName: 'Instagram', url: 'https://instagram.com/maria_ivanova' }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-3',
    user_id: 'demo',
    full_name: 'Ahmed Al-Rashid',
    phone: '+971 52 555 8899',
    email: 'ahmed@rashid-group.ae',
    company: 'Rashid Investment Group',
    position: 'Managing Director',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    notes: 'Инвестор, интересуется криптопроектами',
    payment_methods: [
      { id: 'pm-4', type: 'crypto', label: 'BTC', value: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', network: 'btc' },
      { id: 'pm-5', type: 'crypto', label: 'ETH', value: '0x742d35Cc6634C0532925a3b844Bc9e7595f1B2d1', network: 'erc20' }
    ],
    social_links: [
      { id: 'sl-4', networkId: 'twitter', networkName: 'X (Twitter)', url: 'https://x.com/ahmedrashid' }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-4',
    user_id: 'demo',
    full_name: 'Елена Смирнова',
    phone: '+7 925 123 4567',
    email: 'elena.smirnova@yandex.ru',
    company: 'Yandex',
    position: 'Product Manager',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    notes: 'Контакт из Москвы, работает удалённо',
    payment_methods: [
      { id: 'pm-6', type: 'card', label: 'MasterCard', value: '5412 9087 6543 3456' }
    ],
    social_links: [
      { id: 'sl-5', networkId: 'telegram', networkName: 'Telegram', url: 'https://t.me/elena_sm' },
      { id: 'sl-6', networkId: 'vk', networkName: 'VK', url: 'https://vk.com/elena_smirnova' }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-5',
    user_id: 'demo',
    full_name: 'John Smith',
    phone: '+1 555 123 4567',
    email: 'john.smith@techstartup.io',
    company: 'TechStartup Inc.',
    position: 'CTO',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    notes: 'Американский партнёр, разница во времени -8 часов',
    payment_methods: [
      { id: 'pm-7', type: 'paypal', label: 'PayPal', value: 'john.smith@techstartup.io' },
      { id: 'pm-8', type: 'crypto', label: 'USDC ERC20', value: '0x852d35Cc6634C0532925a3b844Bc9e7595f1C3e2', network: 'erc20' }
    ],
    social_links: [
      { id: 'sl-7', networkId: 'github', networkName: 'GitHub', url: 'https://github.com/johnsmith' },
      { id: 'sl-8', networkId: 'linkedin', networkName: 'LinkedIn', url: 'https://linkedin.com/in/johnsmith' }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-6',
    user_id: 'demo',
    full_name: 'Fatima Hassan',
    phone: '+971 56 777 8888',
    email: 'fatima@hassan-law.ae',
    company: 'Hassan & Partners Law Firm',
    position: 'Senior Partner',
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop&crop=face',
    notes: 'Юридический консультант по вопросам ОАЭ',
    payment_methods: [
      { id: 'pm-9', type: 'iban', label: 'Business IBAN', value: 'AE12 0456 7890 1234 5678 901' }
    ],
    social_links: [
      { id: 'sl-9', networkId: 'whatsapp', networkName: 'WhatsApp', url: 'https://wa.me/971567778888' }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useSavedContacts = () => {
  const { t } = useTranslation();
  // Initialize with mock contacts so they're always visible
  const [contacts, setContacts] = useState<SavedContact[]>(MOCK_CONTACTS);
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
    if (!userId) {
      // Even without auth, show mock contacts
      setContacts(MOCK_CONTACTS);
      return;
    }

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

      // Combine real contacts with mock contacts for demo
      const allContacts = [...parsedContacts, ...MOCK_CONTACTS].sort((a, b) => 
        a.full_name.localeCompare(b.full_name)
      );

      setContacts(allContacts);
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
