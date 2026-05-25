import client from './client';
import type { ServiceCategory } from '@constants/config';

type ApiResponse<T> = { success: boolean; message: string; data: T };

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

export type ReputationResponse = {
  providerId:           string;
  reputationScore?:     number;
  averageRating?:       number;
  completionRate?:      number;
  responseRate?:        number;
  totalReviews:         number;   // Long in Java → number (not optional)
  totalCompleted:       number;
  totalBookings:        number;
  badges:               string[];
  ratingComponent?:     number;
  completionComponent?: number;
  responseComponent?:   number;
  reviewComponent?:     number;
  badgeComponent?:      number;
};

// ✅ Swagger: ActivitySummaryResponse (was Record<string,unknown>)
export type ActivitySummaryResponse = {
  totalBookings:     number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings:   number;
  reviewsGiven:      number;
  reviewsReceived:   number;
  averageRating:     number;
};

export const providersApi = {
  getById: async (providerId: string): Promise<ProviderProfileResponse> => {
    const { data: res } = await client.get<ApiResponse<ProviderProfileResponse>>(`/providers/${providerId}`);
    return res.data;
  },

  getMyProfile: async (): Promise<ProviderProfileResponse> => {
    const { data: res } = await client.get<ApiResponse<ProviderProfileResponse>>('/providers/me');
    return res.data;
  },

  getNearby: async (params: { lat: number; lng: number; radius?: number; category?: ServiceCategory }): Promise<ProviderSummaryResponse[]> => {
    const { data: res } = await client.get<ApiResponse<ProviderSummaryResponse[]>>('/providers/nearby', { params });
    return res.data;
  },

  updateProfile: async (payload: {
    bio?: string; skills?: string[]; hourlyRate?: number;
    serviceArea?: string; longitude?: number; latitude?: number;
  }): Promise<ProviderProfileResponse> => {
    const { data: res } = await client.put<ApiResponse<ProviderProfileResponse>>('/providers/me/profile', payload);
    return res.data;
  },

  // ✅ Swagger: returns ApiResponseMapStringBoolean → {"isAvailable": true}
  toggleAvailability: async (): Promise<boolean> => {
    const { data: res } = await client.put<ApiResponse<Record<string, boolean>>>('/providers/me/availability');
    // Key is "isAvailable" based on backend field naming
    return res.data['isAvailable'] ?? Object.values(res.data)[0] ?? false;
  },

  getReputation: async (providerId: string): Promise<ReputationResponse> => {
    const { data: res } = await client.get<ApiResponse<ReputationResponse>>(`/providers/${providerId}/reputation`);
    return res.data;
  },

  search: async (params: {
    q?: string; category?: ServiceCategory; minPrice?: number; maxPrice?: number;
    minRating?: number; available?: boolean; lat?: number; lng?: number;
    radius?: number; sortBy?: string; page?: number; size?: number;
  }): Promise<ProviderSummaryResponse[]> => {
    const { data: res } = await client.get<ApiResponse<{ content: ProviderSummaryResponse[] }>>('/services/search', { params });
    return res.data.content;
  },

  getActivitySummary: async (): Promise<ActivitySummaryResponse> => {
    const { data: res } = await client.get<ApiResponse<ActivitySummaryResponse>>('/activity/summary');
    return res.data;
  },
};