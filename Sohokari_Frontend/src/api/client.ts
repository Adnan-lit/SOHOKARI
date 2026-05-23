import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_TIMEOUT, BASE_URL } from '@constants/config';

export const TOKEN_KEY = 'sohokari_token';

// ─── Create instance ──────────────────────────────────────
const client = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach token ───────────────────
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor — normalise errors ─────────────
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'Something went wrong';
    return Promise.reject(new Error(message));
  },
);

// ─── Token helpers ────────────────────────────────────────
const isWeb = Platform.OS === 'web';

export const saveToken = (token: string) =>
  isWeb
    ? AsyncStorage.setItem(TOKEN_KEY, token)
    : SecureStore.setItemAsync(TOKEN_KEY, token);

export const clearToken = () =>
  isWeb
    ? AsyncStorage.removeItem(TOKEN_KEY)
    : SecureStore.deleteItemAsync(TOKEN_KEY);

export const getToken = () =>
  isWeb
    ? AsyncStorage.getItem(TOKEN_KEY)
    : SecureStore.getItemAsync(TOKEN_KEY);

export default client;
