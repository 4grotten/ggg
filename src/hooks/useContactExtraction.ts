/**
 * Hook for extracting contact data from images using AI
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod, ContactSocialLink } from '@/types/contact';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface ExtractedContactData {
  full_name?: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  notes?: string;
  avatar_url?: string;
  payment_methods?: PaymentMethod[];
  social_links?: ContactSocialLink[];
}

export const useContactExtraction = () => {
  const { t } = useTranslation();
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Convert File to base64 data URL
   */
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Extract contact data from multiple images
   */
  const extractFromImages = useCallback(async (files: File[]): Promise<ExtractedContactData | null> => {
    if (files.length === 0) {
      toast.error(t('contacts.noImagesSelected'));
      return null;
    }

    setIsExtracting(true);
    setProgress(10);

    try {
      // Convert files to base64
      setProgress(20);
      const imagePromises = files.map(file => fileToBase64(file));
      const base64Images = await Promise.all(imagePromises);
      
      setProgress(40);
      console.log(`Sending ${base64Images.length} images for extraction`);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('extract-contact-from-images', {
        body: { images: base64Images }
      });

      setProgress(80);

      if (error) {
        console.error('Extraction error:', error);
        
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast.error(t('contacts.rateLimitError'));
        } else if (error.message?.includes('402')) {
          toast.error(t('contacts.creditsError'));
        } else {
          toast.error(t('contacts.extractionError'));
        }
        return null;
      }

      if (!data?.success || !data?.contact) {
        console.error('No contact data in response:', data);
        toast.error(t('contacts.noDataExtracted'));
        return null;
      }

      setProgress(100);
      
      const contact = data.contact as ExtractedContactData;
      console.log('Extracted contact:', contact);

      // Show success with summary
      const fieldsFound = [
        contact.full_name && t('contacts.name'),
        contact.phone && t('contacts.phone'),
        contact.email && t('contacts.email'),
        contact.company && t('contacts.company'),
        (contact.payment_methods?.length || 0) > 0 && t('contacts.paymentMethods'),
        (contact.social_links?.length || 0) > 0 && t('contacts.socialLinks'),
      ].filter(Boolean);

      toast.success(t('contacts.extractionSuccess', { 
        count: fieldsFound.length,
        fields: fieldsFound.join(', ')
      }));

      return contact;

    } catch (err) {
      console.error('Failed to extract contact:', err);
      toast.error(t('contacts.extractionError'));
      return null;
    } finally {
      setIsExtracting(false);
      setProgress(0);
    }
  }, [fileToBase64, t]);

  return {
    extractFromImages,
    isExtracting,
    progress,
  };
};
