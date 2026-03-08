import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPut } from "@/services/api/apiClient";

export interface UserNotificationSettings {
  telegram_username: string | null;
  telegram_enabled: boolean;
  whatsapp_number: string | null;
  whatsapp_enabled: boolean;
  email_address: string | null;
  email_enabled: boolean;
  tg_bot?: string;
}

export function useUserNotificationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-notification-settings"],
    queryFn: async () => {
      const res = await apiGet<UserNotificationSettings>("/users/notifications/settings/");
      if (res.error) throw new Error(res.error.detail || res.error.message);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<UserNotificationSettings>) => {
      const current = query.data || {
        telegram_username: null,
        telegram_enabled: false,
        whatsapp_number: null,
        whatsapp_enabled: false,
        email_address: null,
        email_enabled: false,
      };
      
      const body: UserNotificationSettings = {
        telegram_username: patch.telegram_username ?? current.telegram_username,
        telegram_enabled: patch.telegram_enabled ?? current.telegram_enabled,
        whatsapp_number: patch.whatsapp_number ?? current.whatsapp_number,
        whatsapp_enabled: patch.whatsapp_enabled ?? current.whatsapp_enabled,
        email_address: patch.email_address ?? current.email_address,
        email_enabled: patch.email_enabled ?? current.email_enabled,
      };

      const res = await apiPut<UserNotificationSettings>("/users/notifications/settings/", body);
      if (res.error) throw new Error(res.error.detail || res.error.message);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-notification-settings"], data);
    },
    onError: () => {
      toast.error("Ошибка сохранения настроек");
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
