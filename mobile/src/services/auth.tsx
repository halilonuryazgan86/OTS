import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { LoginResponse, User } from '../types/user';
import * as api from './api';

const TOKEN_KEY = 'ots_token';

// SecureStore web'de çalışmaz; web'de tarayıcı deposu kullanılır.
const storage = {
  get: () => (Platform.OS === 'web' ? Promise.resolve(localStorage.getItem(TOKEN_KEY)) : SecureStore.getItemAsync(TOKEN_KEY)),
  set: (v: string) =>
    Platform.OS === 'web' ? Promise.resolve(localStorage.setItem(TOKEN_KEY, v)) : SecureStore.setItemAsync(TOKEN_KEY, v),
  remove: () =>
    Platform.OS === 'web' ? Promise.resolve(localStorage.removeItem(TOKEN_KEY)) : SecureStore.deleteItemAsync(TOKEN_KEY),
};

type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    api.setAuthToken(null);
    setUser(null);
    await storage.remove().catch(() => {});
  }, []);

  // Açılışta kayıtlı token varsa oturumu sunucudan doğrular.
  useEffect(() => {
    api.setUnauthorizedHandler(() => void signOut());
    (async () => {
      try {
        const token = await storage.get();
        if (token) {
          api.setAuthToken(token);
          setUser(await api.getMe());
        }
      } catch {
        await signOut();
      } finally {
        setLoading(false);
      }
    })();
    return () => api.setUnauthorizedHandler(null);
  }, [signOut]);

  const startSession = useCallback(async (res: LoginResponse) => {
    api.setAuthToken(res.token);
    await storage.set(res.token);
    setUser(res.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => startSession(await api.login(email.trim(), password)),
    [startSession],
  );

  // Öğretmen kaydı: hesap açılınca doğrudan oturum başlar.
  const signUp = useCallback(
    async (fullName: string, email: string, password: string) =>
      startSession(await api.register(fullName.trim(), email.trim(), password)),
    [startSession],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) =>
      startSession(await api.changePassword(currentPassword, newPassword)),
    [startSession],
  );

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, changePassword, signOut }),
    [user, loading, signIn, signUp, changePassword, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı.');
  return ctx;
}
