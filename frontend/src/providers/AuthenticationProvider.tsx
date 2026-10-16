import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import httpService from "@/services/httpService";
import authService from "@/services/authService";
import useAuthStore from "@/stores/useAuthStore";
import type {
  UserSummaryDto,
  UserReferralInfoDto,
  AuthProvider,
} from "@palmsight/shared";

export type AuthUser = UserSummaryDto & {
  email?: string | null;
  firstname?: string;
  lastname?: string;
  roles?: string[];
  isFirstTimeLogin?: boolean;
  hasPassword?: boolean;
  providers?: AuthProvider[];
  referral?: UserReferralInfoDto;
  referralLink?: string;
  avatar?: string;
};

export interface AuthenticationContextI {
  loading: boolean;
  isLogged: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  setAuthSession: (session: { accessToken: string; user: AuthUser | UserSummaryDto }) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  refreshSession: () => Promise<boolean>;
}

const AuthenticationContext = createContext<AuthenticationContextI>({
  loading: false,
  isLogged: false,
  accessToken: null,
  user: null,
  login: async () => {},
  logout: () => {},
  setAuthSession: () => {},
  updateUser: () => {},
  refreshSession: async () => false,
});

export const useAuth = () => useContext(AuthenticationContext);

interface AuthenticationProviderProps {
  children: ReactNode;
  initialAccessToken?: string | null;
  initialUser?: AuthUser | null;
  skipInitialRefresh?: boolean;
}

/**
 * Safely parse payload from a JWT token in browser / Node environment.
 * Does not verify signature (signature is verified by backend).
 */
export function parseJwt<T = Record<string, any>>(token: string): T | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const decodedStr =
      typeof atob === "function"
        ? atob(padded)
        : typeof Buffer !== "undefined"
          ? Buffer.from(padded, "base64").toString("binary")
          : "";
    if (!decodedStr) return null;
    try {
      const jsonPayload = decodeURIComponent(
        decodedStr
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload) as T;
    } catch {
      return JSON.parse(decodedStr) as T;
    }
  } catch {
    return null;
  }
}

/**
 * Enriches user object with email extracted from JWT token if user has no email.
 */
export const enrichUserWithJwt = (
  user: AuthUser | UserSummaryDto | null,
  token: string | null
): AuthUser | null => {
  if (!user) return null;
  const enriched: AuthUser = { ...user };
  if (!enriched.email && token) {
    const decoded = parseJwt<{ email?: string }>(token);
    if (decoded?.email) {
      enriched.email = decoded.email;
    }
  }
  return enriched;
};

export const AuthenticationProvider = ({
  children,
  initialAccessToken = null,
  initialUser = null,
  skipInitialRefresh = false,
}: AuthenticationProviderProps) => {
  //! State: in-memory token (no localStorage storage for access tokens per ADR-0008)
  const [accessToken, setAccessToken] = useState<string | null>(initialAccessToken);
  const [user, setUser] = useState<AuthUser | null>(() =>
    enrichUserWithJwt(initialUser, initialAccessToken)
  );
  const [loading, setLoading] = useState(!initialAccessToken && !skipInitialRefresh);

  // Sync token to httpService on change
  useEffect(() => {
    httpService.setInMemoryToken(accessToken);
  }, [accessToken]);

  //! Function: set authenticated session
  const setAuthSession = useCallback(
    (session: { accessToken: string; user: AuthUser | UserSummaryDto }) => {
      const enrichedUser =
        enrichUserWithJwt(session.user, session.accessToken) ||
        (session.user as AuthUser);
      setAccessToken(session.accessToken);
      httpService.setInMemoryToken(session.accessToken);
      setUser(enrichedUser);
      useAuthStore.getState().setAuthSession({
        accessToken: session.accessToken,
        user: enrichedUser,
      });
    },
    []
  );

  //! Function: update user profile in state
  const updateUser = useCallback((updatedFields: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
    useAuthStore.getState().updateUser(updatedFields);
  }, []);

  //! Function: refresh session via HttpOnly rt cookie
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.postRefresh();
      if ('accessToken' in response && response.accessToken) {
        setAccessToken(response.accessToken);
        httpService.setInMemoryToken(response.accessToken);
        if ('user' in response && response.user) {
          const enrichedUser =
            enrichUserWithJwt(response.user, response.accessToken) ||
            (response.user as AuthUser);
          setUser(enrichedUser);
          useAuthStore.getState().setAuthSession({
            accessToken: response.accessToken,
            user: enrichedUser,
          });
        }
        return true;
      }
      return false;
    } catch {
      setAccessToken(null);
      httpService.setInMemoryToken(null);
      return false;
    }
  }, []);

  //! Silent refresh on initial load (if not skipped in tests)
  useEffect(() => {
    if (skipInitialRefresh || initialAccessToken) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    authService
      .postRefresh()
      .then((response) => {
        if (!isMounted) return;
        if ('accessToken' in response && response.accessToken) {
          setAccessToken(response.accessToken);
          httpService.setInMemoryToken(response.accessToken);
          if ('user' in response && response.user) {
            const enrichedUser =
              enrichUserWithJwt(response.user, response.accessToken) ||
              (response.user as AuthUser);
            setUser(enrichedUser);
            useAuthStore.getState().setAuthSession({
              accessToken: response.accessToken,
              user: enrichedUser,
            });
          }
        }
      })
      .catch(() => {
        // Unauthenticated session, no active cookie
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [skipInitialRefresh, initialAccessToken]);

  //! Function: login
  const login = useCallback(
    async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      try {
        setLoading(true);
        const data = await authService.postLogin({ login: username, password });
        setAuthSession({
          accessToken: data.accessToken,
          user: data.user,
        });
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setAuthSession]
  );

  //! Function: logout
  const logout = useCallback(() => {
    authService.postLogout().catch(() => {});
    httpService.setInMemoryToken(null);
    httpService.clearStorage();
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
    }
    setAccessToken(null);
    setUser(null);
    useAuthStore.getState().clearAuthSession();
  }, []);

  //! Context value
  const value = useMemo<AuthenticationContextI>(() => {
    return {
      loading,
      isLogged: Boolean(user && accessToken),
      accessToken,
      user,
      logout,
      login,
      setAuthSession,
      updateUser,
      refreshSession,
    };
  }, [loading, user, accessToken, logout, login, setAuthSession, updateUser, refreshSession]);

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export default AuthenticationProvider;
