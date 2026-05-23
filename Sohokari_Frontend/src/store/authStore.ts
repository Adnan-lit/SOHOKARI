import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@api/auth';
import { getToken, clearToken } from '@api/client';
import {
  LoginRequest,
  RegisterCustomerRequest,
  RegisterProviderRequest,
  UserRole,
} from '@app-types/models';

interface JwtPayload {
  sub:   string;   // user id
  name:  string;
  email: string;
  role:  UserRole;
  exp:   number;
}

interface AuthState {
  token:      string | null;
  userId:     string | null;
  name:       string | null;
  email:      string | null;
  role:       UserRole | null;
  isLoggedIn: boolean;
  loading:    boolean;

  // actions
  loginCustomer:      (data: LoginRequest) => Promise<void>;
  registerCustomer:   (data: RegisterCustomerRequest) => Promise<void>;
  registerProvider:   (data: RegisterProviderRequest) => Promise<void>;
  logout:             () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
}

const decodeAndSet = (token: string): Partial<AuthState> => {
  try {
    const { sub, name, email, role } = jwtDecode<JwtPayload>(token);
    return { token, userId: sub, name, email, role, isLoggedIn: true };
  } catch {
    return {};
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token:      null,
  userId:     null,
  name:       null,
  email:      null,
  role:       null,
  isLoggedIn: false,
  loading:    false,

  loginCustomer: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.loginCustomer(data);
      const token = res.data?.accessToken;
      if (token) {
        set({
          ...decodeAndSet(token),
          userId: res.data.userId,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  registerCustomer: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.registerCustomer(data);
      const token = res.data?.accessToken;
      if (token) {
        set({
          ...decodeAndSet(token),
          userId: res.data.userId,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  registerProvider: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.registerProvider(data);
      const token = res.data?.accessToken;
      if (token) {
        set({
          ...decodeAndSet(token),
          userId: res.data.userId,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: async () => {
    await clearToken();
    set({
      token: null, userId: null, name: null,
      email: null, role: null, isLoggedIn: false,
    });
  },

  hydrateFromStorage: async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const payload = jwtDecode<JwtPayload>(token);
      if (payload.exp * 1000 < Date.now()) {
        await clearToken();
        return;
      }
      set(decodeAndSet(token));
    } catch {
      await clearToken();
    }
  },
}));
