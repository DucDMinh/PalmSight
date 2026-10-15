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
import type { UserSummaryDto } from "@palmsight/shared";

export type AuthUser = UserSummaryDto & {
  email?: string;
  firstname?: string;
  lastname?: string;
  roles?: string[];
  isFirstTimeLogin?: boolean;
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

export const AuthenticationProvider = ({
  children,
  initialAccessToken = null,
  initialUser = null,
  skipInitialRefresh = false,
}: AuthenticationProviderProps) => {
  //! State: in-memory token (no localStorage storage for access tokens per ADR-0008)
  const [accessToken, setAccessToken] = useState<string | null>(initialAccessToken);
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialAccessToken && !skipInitialRefresh);

  // Sync token to httpService on change
  useEffect(() => {
    httpService.setInMemoryToken(accessToken);
  }, [accessToken]);

  //! Function: set authenticated session
  const setAuthSession = useCallback(
    (session: { accessToken: string; user: AuthUser | UserSummaryDto }) => {
      setAccessToken(session.accessToken);
      httpService.setInMemoryToken(session.accessToken);
      setUser(session.user as AuthUser);
    },
    []
  );

  //! Function: update user profile in state
  const updateUser = useCallback((updatedFields: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  }, []);

  //! Function: refresh session via HttpOnly rt cookie
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.postRefresh();
      if ('accessToken' in response && response.accessToken) {
        setAccessToken(response.accessToken);
        httpService.setInMemoryToken(response.accessToken);
        if ('user' in response && response.user) {
          setUser(response.user as AuthUser);
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
            setUser(response.user as AuthUser);
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
      username: _username,
      password: _password,
    }: {
      username: string;
      password: string;
    }) => {
      try {
        setLoading(true);
        // Authentication logic calling real API per ADR-0008
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
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
