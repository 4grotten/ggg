import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole } from "@/types/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Hardcoded admin phone numbers (temporary solution until users register)
const ADMIN_PHONE_NUMBERS = [
  "+971585333939",
  "+996555214242",
  "971585333939",
  "996555214242",
];

export function useUserRole() {
  const { user } = useAuth();
  const backendRole = user?.role ?? null;
  const cloudRoleUserId = (() => {
    const candidates = [user?.user_id, typeof user?.id === "string" ? user.id : null];
    return candidates.find((value): value is string => !!value && UUID_RE.test(value)) ?? null;
  })();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ["user-roles", cloudRoleUserId],
    queryFn: async () => {
      if (!cloudRoleUserId) return [] as AppRole[];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", cloudRoleUserId);

      if (error) {
        if (error.code === "42501" || error.message.includes("row-level security")) {
          return [] as AppRole[];
        }
        throw error;
      }

      return data?.map((r) => r.role as AppRole) ?? [];
    },
    enabled: !!cloudRoleUserId,
    retry: false,
  });

  const userPhone = user?.phone_number || "";
  const isHardcodedAdmin = ADMIN_PHONE_NUMBERS.some(
    (phone) => userPhone.includes(phone.replace("+", "")) || phone.includes(userPhone.replace("+", ""))
  );

  const effectiveRoles = Array.from(new Set<string>([...(roles ?? []), ...(backendRole ? [backendRole] : [])]));
  const hasAdminRole = effectiveRoles.includes("admin") || effectiveRoles.includes("root");
  const isAdmin = hasAdminRole || isHardcodedAdmin;
  const isModerator = effectiveRoles.includes("moderator");

  return {
    roles: effectiveRoles,
    isAdmin,
    isModerator,
    isHardcodedAdmin,
    isLoading,
    error,
  };
}
