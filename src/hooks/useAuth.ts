import { useEffect, useState } from "react";
import { setupAuth, signOut as authSignOut, switchAccount as authSwitchAccount, type AuthUser } from "../auth.js";

interface UseAuthResult {
  user: AuthUser | null;
  authError: string | null;
  signOut: () => void;
  switchAccount: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setupAuth()
      .then(setUser)
      .catch(() => {
        setAuthError("Sign-in failed. Please check your credentials and try again.");
      });
  }, []);

  return { user, authError, signOut: authSignOut, switchAccount: authSwitchAccount };
}
