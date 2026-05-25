import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_TIMEOUT, BASE_URL } from '@constants/config';

export const TOKEN_KEY   = 'sohokari_token';
export const REFRESH_KEY = 'sohokari_refresh_token';

const isWeb = Platform.OS === 'web';
export const saveToken    = (t: string) => isWeb ? AsyncStorage.setItem(TOKEN_KEY, t)    : SecureStore.setItemAsync(TOKEN_KEY, t);
export const clearToken   = ()          => isWeb ? AsyncStorage.removeItem(TOKEN_KEY)     : SecureStore.deleteItemAsync(TOKEN_KEY);
export const getToken     = ()          => isWeb ? AsyncStorage.getItem(TOKEN_KEY)         : SecureStore.getItemAsync(TOKEN_KEY);
export const saveRefresh  = (t: string) => isWeb ? AsyncStorage.setItem(REFRESH_KEY, t)  : SecureStore.setItemAsync(REFRESH_KEY, t);
export const getRefresh   = ()          => isWeb ? AsyncStorage.getItem(REFRESH_KEY)      : SecureStore.getItemAsync(REFRESH_KEY);
export const clearRefresh = ()          => isWeb ? AsyncStorage.removeItem(REFRESH_KEY)   : SecureStore.deleteItemAsync(REFRESH_KEY);

const client = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Request: attach access token
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Token refresh with request queue ─────────────────────
// Requests that 401 while refresh is in-flight are queued
// and resolved/rejected once refresh completes.
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              original.headers!.Authorization = `Bearer ${token}`;
              resolve(client(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = await getRefresh();
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh-token`,
          {},
          { headers: { 'Refresh-Token': refreshToken } },
        );
        const newToken = res.data?.data?.accessToken;
        if (!newToken) throw new Error('No access token in refresh response');

        await saveToken(newToken);
        original.headers!.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return client(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Dispatch logout event so authStore can clear state
        // (avoids circular import by using a custom event)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('sohokari:logout'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message = error.response?.data?.message ?? error.message ?? 'Something went wrong';
    return Promise.reject(new Error(message));
  },
);

export default client;