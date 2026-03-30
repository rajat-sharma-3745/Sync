import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import type { LoginPayload, SignupPayload, User } from '../types/auth';
import { authApi } from '../api/authApi';
import { HttpError } from '../api/httpClient';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'auth:user';

const loadUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(LOCAL_STORAGE_USER_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
};

const persistUserToStorage = (user: User | null): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (user) {
    window.localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  }
};

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(() => loadUserFromStorage());
  const [initializing, setInitializing] = useState<boolean>(
    () => !loadUserFromStorage(),
  );
  const hasInitializedRef = useRef(false);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        setUser(null);
      } else {
        // For now just log; UiContext can surface this later.
        console.error('Failed to refresh user', error);
      }
    }
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    const run = async () => {
      if (!user) {
        try {
          await refreshUser();
        } finally {
          setInitializing(false);
        }
      } else {
        await refreshUser();
      }
    };

    void run();
  }, [refreshUser, user]);

  useEffect(() => {
    persistUserToStorage(user);
  }, [user]);

  const login = useCallback(
    async (payload: LoginPayload): Promise<void> => {
      const loggedInUser = await authApi.login(payload);
      setUser(loggedInUser);
    },
    [],
  );

  const signup = useCallback(
    async (payload: SignupPayload): Promise<void> => {
      const createdUser = await authApi.signup(payload);
      setUser(createdUser);
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const isAuthenticated = Boolean(user);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      initializing,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, isAuthenticated, initializing, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };

