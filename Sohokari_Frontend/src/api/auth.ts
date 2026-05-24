import client, { saveToken, saveRefresh } from './client';
import type { LoginRequest, RegisterCustomerRequest, RegisterProviderRequest } from '@app-types/models';

export type AuthResponse = {
  success: boolean;
  message: string;
  data: {
    accessToken:  string;
    refreshToken: string;
    userId:       string;
    name:         string;
    role:         'CUSTOMER' | 'PROVIDER' | 'ADMIN';
    email:        string;
  };
};

const handleAuth = async (res: AuthResponse) => {
  if (res.data?.accessToken)  await saveToken(res.data.accessToken);
  if (res.data?.refreshToken) await saveRefresh(res.data.refreshToken);
  return res;
};

export const authApi = {
  loginCustomer: async (data: LoginRequest) => {
    const { data: res } = await client.post<AuthResponse>('/auth/login', data);
    return handleAuth(res);
  },
  registerCustomer: async (data: RegisterCustomerRequest) => {
    const { data: res } = await client.post<AuthResponse>('/auth/register/customer', data);
    return handleAuth(res);
  },
  registerProvider: async (data: RegisterProviderRequest) => {
    const { data: res } = await client.post<AuthResponse>('/auth/register/provider', data);
    return handleAuth(res);
  },
};