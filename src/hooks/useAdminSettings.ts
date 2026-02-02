import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminSetting } from "@/types/admin";
import { toast } from "sonner";

export function useAdminSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .order("category", { ascending: true })
        .order("key", { ascending: true });

      if (error) throw error;
      return data as AdminSetting[];
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ category, key, value }: { category: string; key: string; value: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("admin_settings")
        .update({ 
          value, 
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq("category", category)
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Настройка обновлена");
    },
    onError: (error) => {
      console.error("Error updating setting:", error);
      toast.error("Ошибка при обновлении настройки");
    },
  });

  // Group settings by category
  const getSettingsByCategory = (category: string) => {
    return settings?.filter((s) => s.category === category) ?? [];
  };

  // Get a single setting value
  const getSettingValue = (category: string, key: string): number | undefined => {
    return settings?.find((s) => s.category === category && s.key === key)?.value;
  };

  return {
    settings,
    isLoading,
    error,
    updateSetting,
    getSettingsByCategory,
    getSettingValue,
    exchangeRates: getSettingsByCategory("exchange_rates"),
    fees: getSettingsByCategory("fees"),
    limits: getSettingsByCategory("limits"),
  };
}
