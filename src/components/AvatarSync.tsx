/**
 * AvatarSync - Синхронизирует аватар из AuthContext с AvatarContext
 * Должен быть размещён внутри обоих провайдеров
 */

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatar } from "@/contexts/AvatarContext";

export const AvatarSync = () => {
  const { user } = useAuth();
  const { syncWithUser } = useAvatar();

  useEffect(() => {
    if (user?.avatar) {
      syncWithUser(user.avatar);
    }
  }, [user?.avatar, syncWithUser]);

  return null;
};
