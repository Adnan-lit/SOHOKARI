import client from './client';
import type { ServiceCategory } from '@constants/config';

type ApiResponse<T> = { success: boolean; message: string; data: T };

// ✅ Matches ProviderProfileResponse from backend
export type ProviderProfileResponse = {
  userId:                  string;
  name:                    string;
  email:                   string;
  phone?:                  string;
  profilePhoto?:           string;
  providerId:              string;
  serviceCategory:         ServiceCategory;
  skills?:                 string[];
  bio?:                    string;
  hourlyRate?:             number;
  serviceArea?:            string;
  averageRating?:          number;
  reputationScore?:        number;
  totalCompletedBookings?: number;
  totalReviews?:           number;
  isAvailable:             boolean;
  nidVerified?:            boolean;
  tradeLicenseVerified?:   boolean;
  badges?:                 string[];
  memberSince?:            string;
};

// ✅ Matches ProviderSummaryResponse from backend (used in nearby + search)
export type ProviderSummaryResponse = {
  providerId:              string;
  userId:                  string;
  name:                    string;
  profilePhoto?:           string;
  serviceCategory:         ServiceCategory;
  skills?:                 string[];
  hourlyRate?:             number;
  averageRating?:          number;
  reputationScore?:        number;
  totalCompletedBookings?: number;
  isAvailable:             boolean;
  badges?:                 string[];
  serviceArea?:            string;
  distanceKm?:             number;
};

// ✅ Matches ReputationResponse from backend
export type ReputationResponse = {
  providerId:          string;
  reputationScore?:    number;
  averageRating?:      number;
  completionRate?:     number;
  responseRate?:       number;
  totalReviews?:       number;
  totalCompleted?:     number;
  totalBookings?:      number;
  badges:              string[];
  ratingComponent?:    number;
  completionComponent?:number;
  responseComponent?:  number;
  reviewComponent?:    number;
  badgeComponent?:     number;
};

export const providersApi = {
  // ✅ GET /api/v1/providers/{providerId} — returns ProviderProfileResponse
  getById: async (providerId: string): Promise<ProviderProfileResponse> => {
    const { data: res } = await client.get<ApiResponse<ProviderProfileResponse>>(`/providers/${providerId}`);
    return res.data;
  },

  // ✅ GET /api/v1/providers/me — provider's own profile
  getMyProfile: async (): Promise<ProviderProfileResponse> => {
    const { data: res } = await client.get<ApiResponse<ProviderProfileResponse>>('/providers/me');
    return res.data;
  },

  // ✅ GET /api/v1/providers/nearby — params: lat, lng, radius, category
  getNearby: async (params: { lat: number; lng: number; radius?: number; category?: ServiceCategory }): Promise<ProviderSummaryResponse[]> => {
    const { data: res } = await client.get<ApiResponse<ProviderSummaryResponse[]>>('/providers/nearby', { params });
    return res.data;
  },

  // ✅ PUT /api/v1/providers/me/profile
  updateProfile: async (payload: {
    bio?: string; skills?: string[]; hourlyRate?: number;
    serviceArea?: string; longitude?: number; latitude?: number;
  }): Promise<ProviderProfileResponse> => {
    const { data: res } = await client.put<ApiResponse<ProviderProfileResponse>>('/providers/me/profile', payload);
    return res.data;
  },

  // ✅ PUT /api/v1/providers/me/availability — returns { isAvailable: boolean }
  toggleAvailability: async (): Promise<boolean> => {
    const { data: res } = await client.put<ApiResponse<{ isAvailable: boolean }>>('/providers/me/availability');
    return res.data.isAvailable;
  },

  // ✅ GET /api/v1/providers/{providerId}/reputation
  getReputation: async (providerId: string): Promise<ReputationResponse> => {
    const { data: res } = await client.get<ApiResponse<ReputationResponse>>(`/providers/${providerId}/reputation`);
    return res.data;
  },

  // ✅ GET /api/v1/services/search — note: different base path!
  search: async (params: {
    q?: string; category?: ServiceCategory; minPrice?: number; maxPrice?: number;
    minRating?: number; available?: boolean; sortBy?: string; page?: number; size?: number;
  }): Promise<ProviderSummaryResponse[]> => {
    const { data: res } = await client.get<ApiResponse<{ content: ProviderSummaryResponse[] }>>('/services/search', { params });
    return res.data.content;
  },
};