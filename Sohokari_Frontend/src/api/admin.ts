import client from './client';
import { ProviderProfileResponse } from './providers';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export const adminApi = {
  getPendingVerifications: async (): Promise<ProviderProfileResponse[]> => {
    const { data: res } = await client.get<ApiResponse<ProviderProfileResponse[]>>('/admin/verifications/pending');
    return res.data;
  },
  approveVerification: async (providerId: string): Promise<ProviderProfileResponse> => {
    const { data: res } = await client.post<ApiResponse<ProviderProfileResponse>>(`/admin/verifications/${providerId}/approve`);
    return res.data;
  },
  rejectVerification: async (providerId: string): Promise<ProviderProfileResponse> => {
    const { data: res } = await client.post<ApiResponse<ProviderProfileResponse>>(`/admin/verifications/${providerId}/reject`);
    return res.data;
  },
};
