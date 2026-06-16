import client from './client';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export type UserProfileResponse = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
};

export const usersApi = {
  updateLocation: async (latitude: number, longitude: number): Promise<{ latitude: number; longitude: number }> => {
    const { data: res } = await client.put<ApiResponse<{ latitude: number; longitude: number }>>('/users/me/location', {
      latitude,
      longitude,
    });
    return res.data;
  },

  getLocation: async (): Promise<{ latitude: number; longitude: number }> => {
    const { data: res } = await client.get<ApiResponse<{ latitude: number; longitude: number }>>('/users/me/location');
    return res.data;
  },

  updateProfile: async (data: { name?: string; phone?: string; profilePhoto?: string }): Promise<UserProfileResponse> => {
    const { data: res } = await client.put<ApiResponse<UserProfileResponse>>('/users/me/profile', data);
    return res.data;
  },
};
