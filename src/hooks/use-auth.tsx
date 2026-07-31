import { createContext, useContext, useEffect, useState } from 'react';
import type { TeamRole } from '@/lib/api-client-react';

export interface AuthUser {
  id: number;
  merchantId: number;
  storeName: string | null;
  name: string;
  email: string;
  role: TeamRole;
  token: string;
  installedStoreId?:number
  whatsapp_api_key?:string
}

export type LoginError =
  | 'invalid_credentials'
  | 'inactive_account'
  | 'network_error';

type Role = 'admin' | 'merchant';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: LoginError;
    role?: Role;
  }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'chatgate_auth_user';
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: email,
            password,
          }),
        }
      );
      console.log(JSON.stringify(response))

      if (!response.ok) {
        return {
          success: false as const,
          error: 'invalid_credentials' as const,
        };
      }

      const data = await response.json();

      const authUser: AuthUser = {
        id: data.id,
        merchantId: data.merchantId,
        storeName: data.storeName,
        name: data.username,
        email: data.username,
        role: data.role as TeamRole,
        token: data.token,
        installedStoreId:data?.installedStoreId,
        whatsapp_api_key:data?.whatsapp_api_key
      };

      setUser(authUser);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(authUser)
      );

      return {
        success: true as const,
        role: data.role as Role,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false as const,
        error: 'network_error' as const,
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}