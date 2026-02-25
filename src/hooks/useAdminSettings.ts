import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/api/apiClient";
import { AdminSetting } from "@/types/admin";
import { toast } from "sonner";

/** Raw shape returned by GET /accounts/admin/settings/ */
interface BackendAdminSetting {
  id: number;
  category: string;
  key: string;
  value: string; // e.g. "1.000000"
  description: string | null;
  updated_at: string;
}

/** Map backend response to the existing AdminSetting type used by the UI */
const mapSetting = (s: BackendAdminSetting): AdminSetting => ({
  id: String(s.id),
  category: s.category as AdminSetting["category"],
  key: s.key,
  value: parseFloat(s.value),
  description: s.description,
  updated_at: s.updated_at,
  updated_by: null,
});

export function useAdminSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await apiRequest<BackendAdminSetting[]>("/admin/settings/");
      if (res.error || !res.data) {
        const msg = res.error?.detail || res.error?.message || "Failed to fetch settings";
        if (msg.includes('Connection refused') || msg.includes('tcp connect error')) {
          return [] as AdminSetting[];
        }
        throw new Error(msg);
      }
      return res.data.map(mapSetting);
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ category, key, value }: { category: string; key: string; value: number }) => {
      const res = await apiRequest<BackendAdminSetting>("/admin/settings/", {
        method: "PUT",
        body: JSON.stringify({ category, key, value }),
      });
      if (res.error || !res.data) throw new Error(res.error?.detail || res.error?.message || "Failed to update setting");
      return mapSetting(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Настройка обновлена");
    },
    onError: (error) => {
      console.error("Error updating setting:", error);
      toast.error("Ошибка при обновлении настройки");
    },
  });

  const getSettingsByCategory = (category: string) => {
    return settings?.filter((s) => s.category === category) ?? [];
  };

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
