import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import httpService from "@/services/httpService";
import { UserInfo } from "@/interfaces/user";

interface AuthenticationContextI {
  loading: boolean;
  isLogged: boolean;
  user: UserInfo | null;
  login: ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => Promise<void> | void;
  logout: () => void;
}

const AuthenticationContext = createContext<AuthenticationContextI>({
  loading: false,
  isLogged: false,
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthenticationContext);

const AuthenticationProvider = ({ children }: { children: ReactNode }) => {
  //! State
  const [token, setToken] = useState(httpService.getTokenStorage());
  const [user, setUser] = useState<UserInfo | null>(
    httpService.getUserStorage()
  );
  const [isLogging, setIsLogging] = useState(false);

  //! Function
  const login = useCallback(
    async ({
      username: _username,
      password: _password,
    }: {
      username: string;
      password: string;
    }) => {
      try {
        setIsLogging(true);
        // Authentication logic will call real API per ADR-0008
      } catch (error) {
        console.error(error);
      } finally {
        setIsLogging(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    httpService.clearStorage();
    window.sessionStorage.clear();
    setToken("");
    setUser(null);
    window.location.reload();
  }, []);

  //! Return
  const value = useMemo(() => {
    return {
      loading: isLogging,
      isLogged: Boolean(user && token),
      user,
      logout,
      login,
    };
  }, [login, logout, user, token, isLogging]);

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export default AuthenticationProvider;
