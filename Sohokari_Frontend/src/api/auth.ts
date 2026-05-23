import client, { saveToken } from './client';
import type {
  LoginRequest,
  RegisterCustomerRequest,
  RegisterProviderRequest,
} from '@app-types/models';

type AuthResponse = {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    name: string;
    role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
    email: string;
  };
};

const loginCustomer = async (data: LoginRequest) => {
  const { data: res } = await client.post<AuthResponse>('/auth/login', data);
  if (res.data?.accessToken) await saveToken(res.data.accessToken);
  return res;
};

const registerCustomer = async (data: RegisterCustomerRequest) => {
  const { data: res } = await client.post<AuthResponse>('/auth/register/customer', data);
  if (res.data?.accessToken) await saveToken(res.data.accessToken);
  return res;
};

const registerProvider = async (data: RegisterProviderRequest) => {
  const { data: res } = await client.post<AuthResponse>('/auth/register/provider', data);
  if (res.data?.accessToken) await saveToken(res.data.accessToken);
  return res;
};

export const authApi = {
  loginCustomer,
  registerCustomer,
  registerProvider,
};
