import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { apiRequest } from "@/services/api/apiClient";
import { toast } from "sonner";
import { AppRole } from "@/types/admin";

interface AdminUser {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface ProfileSearchResult {
  user_id: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
}

/** Shape returned by GET /accounts/admin/users/limits/ */
export interface BackendClient {
  user_id: string;
  full_name: string;
  phone: string;
  email?: string;
  gender?: string | null;
  language?: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: 'admin' | 'moderator' | 'user';
  is_verified: boolean;
  referral_level: string | null;
  cards_count: number;
  total_cards_balance: number;
  accounts_count: number;
  total_bank_balance: number;
  crypto_wallets_count: number;
  total_crypto_balance: number;
  limits: {
    custom_settings_enabled: boolean;
    transfer_min: string | null;
    transfer_max: string | null;
    daily_transfer_limit: string | null;
    monthly_transfer_limit: string | null;
    withdrawal_min: string | null;
    withdrawal_max: string | null;
    daily_withdrawal_limit: string | null;
    monthly_withdrawal_limit: string | null;
    card_to_card_percent: string | null;
    bank_transfer_percent: string | null;
    network_fee_percent: string | null;
    currency_conversion_percent: string | null;
  };
}

/** Shape returned by GET /accounts/admin/users/<id>/detail/ */
export interface BackendClientDetail extends BackendClient {
  cards: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    balance: number;
    last_four_digits: string | null;
    expiry_date: string | null;
    created_at: string;
  }>;
  accounts: Array<{
    id: string;
    iban: string;
    bank_name: string;
    beneficiary: string;
    balance: number;
    is_active: boolean;
  }>;
  wallets: Array<{
    id: string;
    network: string;
    token: string;
    address: string;
    balance: number;
    is_active: boolean;
    created_at: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    description: string | null;
    merchant_name: string | null;
    sender_name: string | null;
    receiver_name: string | null;
    fee: number | null;
    exchange_rate: number | null;
    original_amount: number | null;
    original_currency: string | null;
    created_at: string;
  }>;
}

export function useAdminManagement() {
  const queryClient = useQueryClient();

  // Fetch all admins with their profile info
  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, phone, first_name, last_name")
        .in("user_id", userIds);

      return data.map((role) => {
        const profile = profiles?.find((p) => p.user_id === role.user_id);
        return {
          ...role,
          phone: profile?.phone || null,
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
        } as AdminUser;
      });
    },
  });

  // Fetch all clients from backend API
  const { data: clients, isLoading: clientsLoading, refetch: refetchClients } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const res = await apiRequest<BackendClient[]>("/admin/users/limits/");
      if (res.error || !res.data) throw new Error(res.error?.detail || res.error?.message || "Failed to fetch clients");
      return res.data;
    },
  });

  // Search clients (local filter on already-fetched data)
  const searchClients = async (query: string): Promise<BackendClient[]> => {
    const cleanQuery = query.replace(/\s+/g, "").toLowerCase();
    if (!clients) return [];
    return clients.filter((c) => {
      const phone = (c.phone || "").replace(/\s+/g, "").replace(/^\+/, "").toLowerCase();
      const name = (c.full_name || "").toLowerCase();
      return phone.includes(cleanQuery) || name.includes(cleanQuery);
    });
  };

  // Search user by phone or user_id
  const searchUser = async (query: string): Promise<ProfileSearchResult | null> => {
    const cleanQuery = query.replace(/\s+/g, "").replace(/^\+/, "");
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);

    if (isUUID) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, phone, first_name, last_name")
        .eq("user_id", query)
        .maybeSingle();
      return data;
    }

    const { data } = await supabase
      .from("profiles")
      .select("user_id, phone, first_name, last_name")
      .ilike("phone", `%${cleanQuery}%`)
      .limit(1)
      .maybeSingle();
    return data;
  };

  // Add admin role
  const addAdmin = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", role)
        .single();

      if (existing) {
        throw new Error("Пользователь уже имеет эту роль");
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Роль успешно добавлена");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка при добавлении роли");
    },
  });

  // Remove admin role
  const removeAdmin = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Роль успешно удалена");
    },
    onError: () => {
      toast.error("Ошибка при удалении роли");
    },
  });

  return {
    admins,
    isLoading,
    clients,
    clientsLoading,
    refetchClients,
    searchUser,
    searchClients,
    addAdmin,
    removeAdmin,
  };
}
