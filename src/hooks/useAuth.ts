import { useCallback, useEffect, useState } from "react";
import {
  isEmbedded,
  setupAuth,
  tryExistingSession,
  openAuthPopup,
  signOut as authSignOut,
  type AuthUser,
} from "../auth.js";

interface UseAuthResult {
  user: AuthUser | null;
  authError: string | null;
  needsSignIn: boolean;
  loading: boolean;
  handleSignIn: () => void;
  signOut: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isEmbedded) {
      tryExistingSession()
        .then((existingUser) => {
          if (existingUser) {
            setUser(existingUser);
            return;
          }

          setNeedsSignIn(true);
        })
        .catch(() => setNeedsSignIn(true))
        .finally(() => setLoading(false));
    } else {
      // Standalone: redirect flow handles everything
      setupAuth()
        .then(setUser)
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Sign-in failed. Please try again.";
          setAuthError(message);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const handleSignIn = useCallback(() => {
    setNeedsSignIn(false);
    setAuthError(null);
    if (isEmbedded) {
      // Open a popup that does redirect-flow OAuth, then relays creds back
      openAuthPopup()
        .then(setUser)
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Sign-in failed.";
          setNeedsSignIn(true);
          setAuthError(message);
        });
    } else {
      setupAuth()
        .then(setUser)
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Sign-in failed.";
          setNeedsSignIn(true);
          setAuthError(message);
        });
    }
  }, []);

  return {
    user, authError, needsSignIn, loading,
    handleSignIn, signOut: authSignOut,
  };
}
