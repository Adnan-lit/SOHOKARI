import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@api/auth';
import { getToken, clearToken, clearRefresh, saveToken } from '@api/client';
import { notificationsApi } from '@api/chat';
import type { LoginRequest, RegisterCustomerRequest, RegisterProviderRequest, UserRole } from '@app-types/models';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const ROLE_KEY = 'sohokari_role';
const NAME_KEY = 'sohokari_name';
const EMAIL_KEY = 'sohokari_email';

const isWeb = Platform.OS === 'web';
const storeStr  = (k: string, v: string) => isWeb ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v);
const loadStr   = (k: string)             => isWeb ? AsyncStorage.getItem(k)    : SecureStore.getItemAsync(k);
const deleteStr = (k: string)             => isWeb ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k);

interface JwtPayload { sub: string; exp: number; role?: string; }

interface AuthState {
  token:      string | null;
  userId:     string | null;
  name:       string | null;
  email:      string | null;
  role:       UserRole | null;
  isLoggedIn: boolean;
  loading:    boolean;
  loginCustomer:      (data: LoginRequest) => Promise<void>;
  registerCustomer:   (data: RegisterCustomerRequest) => Promise<void>;
  registerProvider:   (data: RegisterProviderRequest) => Promise<void>;
  logout:             () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
}

type AuthRes = Awaited<ReturnType<typeof authApi.loginCustomer>>;

const applyAuth = (res: AuthRes): Partial<AuthState> => ({
  token:      res.data.accessToken,
  userId:     res.data.userId,
  name:       res.data.name,
  email:      res.data.email,
  role:       res.data.role as UserRole,
  isLoggedIn: true,
});

// Persist name, email, role so they survive app restart
const persistMeta = async (res: AuthRes) => {
  await Promise.all([
    storeStr(ROLE_KEY,  res.data.role  ?? ''),
    storeStr(NAME_KEY,  res.data.name  ?? ''),
    storeStr(EMAIL_KEY, res.data.email ?? ''),
  ]);
};

const registerFcm = async () => {
  try {
    if (Constants.appOwnership === 'expo') {
      console.warn('Skipping FCM registration: Not supported in Expo Go');
      return;
    }
    const Notifications = await import('expo-notifications').catch(() => null);
    if (!Notifications) return;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const tokenData = await Notifications.getDevicePushTokenAsync();
    if (tokenData && tokenData.data) {
      await notificationsApi.registerFcmToken(tokenData.data);
    }
  } catch (e) {
    console.warn('Failed to register FCM token:', e);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null, userId: null, name: null, email: null,
  role: null, isLoggedIn: false, loading: false,

  loginCustomer: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.loginCustomer(data);
      await persistMeta(res);
      set({ ...applyAuth(res), loading: false });
      registerFcm();
    } catch (e) { set({ loading: false }); throw e; }
  },

  registerCustomer: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.registerCustomer(data);
      await persistMeta(res);
      set({ ...applyAuth(res), loading: false });
      registerFcm();
    } catch (e) { set({ loading: false }); throw e; }
  },

  registerProvider: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.registerProvider(data);
      await persistMeta(res);
      set({ ...applyAuth(res), loading: false });
      registerFcm();
    } catch (e) { set({ loading: false }); throw e; }
  },

  logout: async () => {
    await Promise.all([clearToken(), clearRefresh(), deleteStr(ROLE_KEY), deleteStr(NAME_KEY), deleteStr(EMAIL_KEY)]);
    set({ token: null, userId: null, name: null, email: null, role: null, isLoggedIn: false });
  },

  hydrateFromStorage: async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const { sub, exp, role: jwtRole } = jwtDecode<JwtPayload>(token);
      if (exp * 1000 < Date.now()) {
        await Promise.all([clearToken(), clearRefresh()]);
        return;
      }
      // Load persisted meta (name, email, role) stored at login time
      const [role, name, email] = await Promise.all([
        loadStr(ROLE_KEY),
        loadStr(NAME_KEY),
        loadStr(EMAIL_KEY),
      ]);
      set({
        token,
        isLoggedIn: true,
        email:  email  || sub,          // sub is email in JWT
        name:   name   || null,
        role:   (role  || jwtRole || null) as UserRole | null,
        userId: null,                   // not in JWT; resolved on first API call
      });
    } catch {
      await clearToken();
    }
  },
}));