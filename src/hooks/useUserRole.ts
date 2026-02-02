import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole } from "@/types/admin";

// Hardcoded admin phone numbers (temporary solution until users register)
const ADMIN_PHONE_NUMBERS = [
  "+971585333939",
  "+996555214242",
  "971585333939",
  "996555214242",
];

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

  // Check if user's phone number is in the hardcoded admin list
  const userPhone = user?.phone_number || "";
  const isHardcodedAdmin = ADMIN_PHONE_NUMBERS.some(
    (phone) => userPhone.includes(phone.replace("+", "")) || phone.includes(userPhone.replace("+", ""))
  );

  const hasAdminRole = roles?.includes("admin") ?? false;
  const isAdmin = hasAdminRole || isHardcodedAdmin;
  const isModerator = roles?.includes("moderator") ?? false;

  return {
    roles: roles ?? [],
    isAdmin,
    isModerator,
    isHardcodedAdmin,
    isLoading,
    error,
  };
}
