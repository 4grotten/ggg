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
  phone?: string | string[];
  email?: string | string[];
  company?: string | string[];
  position?: string | string[];
  notes?: string | string[];
  avatar_url?: string; // Will be set to base64 of image if avatar found
  avatar_image_index?: number; // Index of image with profile photo
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
    setProgress(5);

    try {
      // Step 1: Converting images (5% → 25%)
      const base64Images: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const b64 = await fileToBase64(files[i]);
        base64Images.push(b64);
        setProgress(5 + Math.round((20 * (i + 1)) / files.length));
      }

      // Step 2: Sending to AI (25% → 35%)
      setProgress(30);
      console.log(`Sending ${base64Images.length} images for extraction`);

      // Step 3: AI processing (35% → 85%) — simulate gradual progress while waiting
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      let currentProgress = 35;
      progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 2, 85);
        setProgress(currentProgress);
      }, 500);

      const { data, error } = await supabase.functions.invoke('extract-contact-from-images', {
        body: { images: base64Images }
      });

      if (progressInterval) clearInterval(progressInterval);

      // Step 4: Processing result (85% → 95%)
      setProgress(90);

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

      setProgress(95);
      
      const contact = data.contact as ExtractedContactData;
      
      // If AI detected an avatar image, use the corresponding base64 image
      if (typeof contact.avatar_image_index === 'number' && 
          contact.avatar_image_index >= 0 && 
          contact.avatar_image_index < base64Images.length) {
        contact.avatar_url = base64Images[contact.avatar_image_index];
        console.log(`Using image ${contact.avatar_image_index} as avatar`);
      }
      
      setProgress(100);
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
      // Keep 100% visible briefly before reset
      setTimeout(() => setProgress(0), 500);
    }
  }, [fileToBase64, t]);

  return {
    extractFromImages,
    isExtracting,
    progress,
  };
};
