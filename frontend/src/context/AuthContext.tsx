import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../types/auth";
import { fetchMe, login as loginApi, register as registerApi } from "../services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Au chargement : si token présent, tenter /auth/me
  useEffect(() => {
    const init = async () => {
      try {
        const token = typeof window !== "undefined"
          ? window.localStorage.getItem("authToken")
          : null;

        if (!token) {
          setLoading(false);
          return;
        }

        const { user } = await fetchMe();
        setUser(user);
      } catch (e) {
        console.error(e);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("authToken");
        }
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const login = async (email: string, password: string) => {
    const { user, token } = await loginApi(email, password);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("authToken", token);
    }
    setUser(user);
  };

  const register = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    const { user, token } = await registerApi(email, password, displayName);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("authToken", token);
    }
    setUser(user);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("authToken");
    }
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
