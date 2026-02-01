import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OpenAIModel {
  id: string;
  name: string;
  description: string;
}

interface OpenAIStatus {
  hasKey: boolean;
  maskedKey: string | null;
  currentModel: string;
  availableModels: OpenAIModel[];
}

export function useOpenAISettings() {
  const [status, setStatus] = useState<OpenAIStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);
  const fetchedRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    // Prevent multiple fetches
    if (fetchedRef.current || isLoading) return;
    fetchedRef.current = true;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("admin-openai-settings", {
        body: { action: "get-status" },
      });

      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch OpenAI status:", error);
      // Set default status on error to prevent retry loop
      setStatus({
        hasKey: false,
        maskedKey: null,
        currentModel: "gpt-4o",
        availableModels: [
          { id: "gpt-4o", name: "GPT-4o", description: "Новейшая флагманская модель. $2.50/1M input, $10/1M output" },
          { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Быстрая и экономичная. $0.15/1M input, $0.60/1M output" },
          { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Мощная модель с vision. $10/1M input, $30/1M output" },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const verifyApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-openai-settings", {
        body: { action: "verify-key", apiKey },
      });

      if (error) throw error;
      
      if (data.valid) {
        toast.success("API ключ валиден");
        return true;
      } else {
        toast.error("Неверный API ключ");
        return false;
      }
    } catch (error) {
      console.error("Failed to verify API key:", error);
      toast.error("Ошибка проверки ключа");
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const updateModel = useCallback(async (model: string) => {
    setIsUpdatingModel(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-openai-settings", {
        body: { action: "update-model", model },
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success(`Модель изменена на ${model}`);
        setStatus(prev => prev ? { ...prev, currentModel: model } : null);
      }
    } catch (error) {
      console.error("Failed to update model:", error);
      toast.error("Ошибка обновления модели");
    } finally {
      setIsUpdatingModel(false);
    }
  }, []);

  const resetFetched = useCallback(() => {
    fetchedRef.current = false;
  }, []);

  return {
    status,
    isLoading,
    isVerifying,
    isUpdatingModel,
    fetchStatus,
    verifyApiKey,
    updateModel,
    resetFetched,
  };
}