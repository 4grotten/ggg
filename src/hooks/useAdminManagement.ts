import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

      // Fetch profiles for each user
      const userIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, phone, first_name, last_name")
        .in("user_id", userIds);

      // Merge data
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

  // Search user by phone or user_id
  const searchUser = async (query: string): Promise<ProfileSearchResult | null> => {
    // Clean phone number
    const cleanQuery = query.replace(/\s+/g, "").replace(/^\+/, "");
    
    // Try to find by phone first
    let { data, error } = await supabase
      .from("profiles")
      .select("user_id, phone, first_name, last_name")
      .or(`phone.ilike.%${cleanQuery}%,user_id.eq.${query}`)
      .limit(1)
      .single();

    if (error || !data) {
      // Try exact phone match with + prefix
      const { data: phoneData } = await supabase
        .from("profiles")
        .select("user_id, phone, first_name, last_name")
        .ilike("phone", `%${cleanQuery}%`)
        .limit(1)
        .single();
      
      return phoneData || null;
    }

    return data;
  };

  // Add admin role
  const addAdmin = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Check if already has this role
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
    searchUser,
    addAdmin,
    removeAdmin,
  };
}
