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
        currentModel: "google/gemini-3-flash-preview",
        availableModels: [
          { id: "openai/gpt-5", name: "GPT-5", description: "Мощный универсал. $15/1M input, $60/1M output" },
          { id: "openai/gpt-5-mini", name: "GPT-5 Mini", description: "Золотая середина. $3/1M input, $12/1M output" },
          { id: "openai/gpt-5-nano", name: "GPT-5 Nano", description: "Скорость и экономия. $0.50/1M input, $2/1M output" },
          { id: "openai/gpt-5.2", name: "GPT-5.2", description: "Новейшая модель OpenAI. $20/1M input, $80/1M output" },
          { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Топ Gemini. $7/1M input, $21/1M output" },
          { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro Preview", description: "Следующее поколение. $10/1M input, $30/1M output" },
          { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash Preview", description: "Быстрый и качественный. $0.15/1M input, $0.60/1M output" },
          { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Баланс цена/качество. $0.15/1M input, $0.60/1M output" },
          { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", description: "Самый дешёвый. $0.075/1M input, $0.30/1M output" },
          { id: "google/gemini-3-pro-image-preview", name: "Gemini 3 Pro Image", description: "Генерация изображений. $5/1M input, $15/1M output" },
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