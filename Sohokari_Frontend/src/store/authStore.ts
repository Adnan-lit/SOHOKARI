import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@api/auth';
import { getToken, clearToken, clearRefresh } from '@api/client';
import { notificationsApi } from '@api/chat';
import type { LoginRequest, RegisterCustomerRequest, RegisterProviderRequest, UserRole } from '@app-types/models';

interface JwtPayload { sub: string; exp: number; }

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

const applyAuth = (res: Awaited<ReturnType<typeof authApi.loginCustomer>>): Partial<AuthState> => ({
  token:      res.data.accessToken,
  userId:     res.data.userId,
  name:       res.data.name,
  email:      res.data.email,
  role:       res.data.role,
  isLoggedIn: true,
});

// Register FCM token silently after login (fire-and-forget)
const registerFcm = async () => {
  try {
    // expo-notifications must be installed; skip gracefully if not available
    const Notifications = await import('expo-notifications').catch(() => null);
    if (!Notifications) return;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const { data: fcmToken } = await Notifications.getExpoPushTokenAsync();
    if (fcmToken) await notificationsApi.registerFcmToken(fcmToken);
  } catch {}
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null, userId: null, name: null, email: null,
  role: null, isLoggedIn: false, loading: false,

  loginCustomer: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.loginCustomer(data);
      set({ ...applyAuth(res), loading: false });
      registerFcm();
    } catch (e) { set({ loading: false }); throw e; }
  },

  registerCustomer: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.registerCustomer(data);
      set({ ...applyAuth(res), loading: false });
      registerFcm();
    } catch (e) { set({ loading: false }); throw e; }
  },

  registerProvider: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.registerProvider(data);
      set({ ...applyAuth(res), loading: false });
      registerFcm();
    } catch (e) { set({ loading: false }); throw e; }
  },

  logout: async () => {
    await clearToken();
    await clearRefresh();
    set({ token: null, userId: null, name: null, email: null, role: null, isLoggedIn: false });
  },

  hydrateFromStorage: async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const { exp } = jwtDecode<JwtPayload>(token);
      if (exp * 1000 < Date.now()) { await clearToken(); await clearRefresh(); return; }
      // We don't have name/role from JWT sub alone — keep isLoggedIn true
      // and let next API call fail with 401→refresh if needed
      set({ token, isLoggedIn: true });
    } catch { await clearToken(); }
  },
}));