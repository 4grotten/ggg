import { useState, useCallback } from "react";
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

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-openai-settings", {
        body: { action: "get-status" },
      });

      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch OpenAI status:", error);
      toast.error("Не удалось загрузить статус OpenAI");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        // Update local status
        setStatus(prev => prev ? { ...prev, currentModel: model } : null);
      }
    } catch (error) {
      console.error("Failed to update model:", error);
      toast.error("Ошибка обновления модели");
    } finally {
      setIsUpdatingModel(false);
    }
  }, []);

  return {
    status,
    isLoading,
    isVerifying,
    isUpdatingModel,
    fetchStatus,
    verifyApiKey,
    updateModel,
  };
}