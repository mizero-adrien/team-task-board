/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { AUTH_BLOCKED_EVENT, AUTH_TOKEN_KEY, AUTH_UNAUTHORIZED_EVENT, AUTH_USER_KEY } from "../../core/constants";
import { authService } from "./authService";
import type { Credentials, SignUpData, User } from "./types";

type AuthContextValue = {
  user: User | null;
  isAdmin: boolean;
  // False while a saved session is being checked with the server
  isReady: boolean;
  login: (credentials: Credentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ----- Saved session (localStorage) -----

const isUser = (value: unknown): value is User => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    (candidate.role === "user" || candidate.role === "admin")
  );
};

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw || !localStorage.getItem(AUTH_TOKEN_KEY)) return null;

    const parsed: unknown = JSON.parse(raw);
    return isUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveUser(user: User): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // Storage can be full or blocked. The session still works until the page closes.
  }
}

function saveSession(token: string, user: User): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  saveUser(user);
}

function clearSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function blockedReason(event: Event): string | null {
  if (!(event instanceof CustomEvent)) return null;

  const detail: unknown = event.detail;
  if (typeof detail !== "object" || detail === null || !("reason" in detail)) return null;

  const { reason } = detail as { reason: unknown };
  return typeof reason === "string" && reason ? reason : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [isReady, setIsReady] = useState(() => !localStorage.getItem(AUTH_TOKEN_KEY));

  // On startup, confirm a saved session with the server. This also refreshes the role,
  // which can have changed since the last visit.
  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return;

    let cancelled = false;

    authService
      .me()
      .then((fresh) => {
        if (cancelled) return;
        saveUser(fresh);
        setUser(fresh);
      })
      .catch(() => {
        // 401 and "blocked" are handled by the events below. Any other failure
        // (the server is asleep, no network) keeps the saved user, so a slow
        // server never signs people out.
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // The API layer announces session problems. We sign the user out here.
  useEffect(() => {
    const endSession = (message: string) => {
      // Several requests can fail at once. The first one clears the token,
      // so the others stop here and only one message is shown.
      if (!localStorage.getItem(AUTH_TOKEN_KEY)) return;

      clearSession();
      setUser(null);
      queryClient.clear();
      toast.error(message, { id: "session" });
    };

    const onUnauthorized = () => endSession("Your session expired. Please sign in again.");

    const onBlocked = (event: Event) => {
      const reason = blockedReason(event);
      endSession(reason ? `Your account has been blocked: ${reason}` : "Your account has been blocked.");
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    window.addEventListener(AUTH_BLOCKED_EVENT, onBlocked);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
      window.removeEventListener(AUTH_BLOCKED_EVENT, onBlocked);
    };
  }, [queryClient]);

  const login = async (credentials: Credentials) => {
    const { token, user: signedInUser } = await authService.login(credentials);

    // Everything in this app is private, so nothing from a previous user may stay cached
    queryClient.clear();
    saveSession(token, signedInUser);
    setUser(signedInUser);
  };

  const signUp = async ({ name, email, password }: SignUpData) => {
    await authService.register({ name, email, password });
    await login({ email, password });
  };

  const logout = () => {
    clearSession();
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === "admin", isReady, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
