import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole } from "@/types/admin";

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id as unknown as string);

      if (error) {
        // If error is about RLS (user is not admin), return empty array
        if (error.code === "42501" || error.message.includes("row-level security")) {
          return [];
        }
        throw error;
      }

      return data?.map((r) => r.role as AppRole) ?? [];
    },
    enabled: !!user?.id,
    retry: false,
  });

  const isAdmin = roles?.includes("admin") ?? false;
  const isModerator = roles?.includes("moderator") ?? false;

  return {
    roles: roles ?? [],
    isAdmin,
    isModerator,
    isLoading,
    error,
  };
}
