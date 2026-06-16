import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@api/auth';
import { getToken, clearToken, clearRefresh, saveToken, setForceLogoutHandler } from '@api/client';
import { notificationsApi } from '@api/chat';
import { usersApi } from '@api/users';
import type { LoginRequest, RegisterCustomerRequest, RegisterProviderRequest, UserRole } from '@app-types/models';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const ROLE_KEY = 'sohokari_role';
const NAME_KEY = 'sohokari_name';
const EMAIL_KEY = 'sohokari_email';
const USERID_KEY = 'sohokari_userId';
const PHOTO_KEY = 'sohokari_photo';

const isWeb = Platform.OS === 'web';
const storeStr  = (k: string, v: string) => isWeb ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v);
const loadStr   = (k: string)             => isWeb ? AsyncStorage.getItem(k)    : SecureStore.getItemAsync(k);
const deleteStr = (k: string)             => isWeb ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k);

const storeLargeStr = (k: string, v: string) => AsyncStorage.setItem(k, v);
const loadLargeStr  = (k: string)            => AsyncStorage.getItem(k);
const deleteLargeStr = (k: string)           => AsyncStorage.removeItem(k);

interface JwtPayload { sub: string; exp: number; role?: string; }

interface AuthState {
  token:      string | null;
  userId:     string | null;
  name:       string | null;
  email:      string | null;
  role:       UserRole | null;
  profilePhoto: string | null;
  phone:       string | null;
  isLoggedIn: boolean;
  loading:    boolean;
  setProfile: (name: string, phone: string, profilePhoto: string) => void;
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
    storeStr(USERID_KEY, res.data.userId ?? ''),
    storeLargeStr(PHOTO_KEY, res.data.profilePhoto ?? ''),
  ]);
};

const clearMeta = async () => {
  await Promise.all([deleteStr(ROLE_KEY), deleteStr(NAME_KEY), deleteStr(EMAIL_KEY), deleteStr(USERID_KEY), deleteLargeStr(PHOTO_KEY)]);
};

const registerFcm = async () => {
  try {
    if (Constants.appOwnership === 'expo') {
      // Running in Expo Go — use Expo Push Token
    }
    const Notifications = await import('expo-notifications').catch(() => null);
    if (!Notifications) return;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    
    // Get Expo push token instead of native device token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId ?? '590e266c-f90d-478a-ae47-2d44db3351cc',
    });
    
    if (tokenData && tokenData.data) {
      await notificationsApi.registerFcmToken(tokenData.data);
    }
  } catch (_) {
    // Silently fail — push token registration is non-critical
  }
};

const updateLocationSilently = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    await usersApi.updateLocation(loc.coords.latitude, loc.coords.longitude);
  } catch (_) {
    // Silently fail — location update is non-critical
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  name: null,
  email: null,
  role: null,
  profilePhoto: null,
  phone: null,
  isLoggedIn: false,
  loading: true,

  setProfile: async (name, phone, profilePhoto) => {
    set({ name, phone, profilePhoto });
    await storeStr(NAME_KEY, name);
    if (profilePhoto) await storeLargeStr(PHOTO_KEY, profilePhoto);
  },

  loginCustomer: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.loginCustomer(data);
      await persistMeta(res);
      set({ ...applyAuth(res), profilePhoto: res.data.profilePhoto || null, loading: false });
      registerFcm();
      updateLocationSilently();
    } catch (e) { set({ loading: false }); throw e; }
  },

  registerCustomer: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.registerCustomer(data);
      await persistMeta(res);
      set({ ...applyAuth(res), profilePhoto: res.data.profilePhoto || null, loading: false });
      registerFcm();
      updateLocationSilently();
    } catch (e) { set({ loading: false }); throw e; }
  },

  registerProvider: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.registerProvider(data);
      await persistMeta(res);
      set({ ...applyAuth(res), profilePhoto: res.data.profilePhoto || null, loading: false });
      registerFcm();
    } catch (e) { set({ loading: false }); throw e; }
  },

  logout: async () => {
    await Promise.all([clearToken(), clearRefresh(), clearMeta()]);
    set({ token: null, userId: null, name: null, email: null, role: null, profilePhoto: null, isLoggedIn: false });
  },

  hydrateFromStorage: async () => {
    const token = await getToken();
    if (!token) {
        set({ isLoggedIn: false, loading: false });
        return;
    }
    // Register force-logout handler so token refresh failure triggers logout on all platforms
    setForceLogoutHandler(() => {
      Promise.all([clearToken(), clearRefresh()]).then(() => {
        set({ token: null, userId: null, name: null, email: null, role: null, profilePhoto: null, isLoggedIn: false });
      });
    });
    try {
      const { sub, exp, role: jwtRole } = jwtDecode<JwtPayload>(token);
      if (exp * 1000 < Date.now()) {
        await Promise.all([clearToken(), clearRefresh()]);
        set({ isLoggedIn: false, loading: false });
        return;
      }
      // Load persisted meta (name, email, role) stored at login time
      const [role, name, email, userId, photo] = await Promise.all([
        loadStr(ROLE_KEY),
        loadStr(NAME_KEY),
        loadStr(EMAIL_KEY),
        loadStr(USERID_KEY),
        loadLargeStr(PHOTO_KEY),
      ]);
      set({
        token,
        isLoggedIn: true,
        loading: false,
        email:  email  || sub,          // sub is email in JWT
        name:   name   || null,
        role:   (role  || jwtRole || null) as UserRole | null,
        userId: userId || null,
        profilePhoto: photo || null,
      });
      // Important: Register push token and location on app start
      registerFcm();
      updateLocationSilently();
    } catch {
      await clearToken();
    }
  },
}));