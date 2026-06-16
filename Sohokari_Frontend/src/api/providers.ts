import client from './client';
import type { ServiceCategory } from '@constants/config';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export type VerificationStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type ProviderProfileResponse = {
  userId:                  string;
  name:                    string;
  email:                   string;
  phone?:                  string;
  profilePhoto?:           string;
  providerId:              string;
  serviceCategory:         ServiceCategory;
  skills?:                 string[];
  portfolio?:              string[];
  bio?:                    string;
  hourlyRate?:             number;
  serviceArea?:            string;
  latitude?:               number;
  longitude?:              number;
  averageRating?:          number;
  reputationScore?:        number;
  totalCompletedBookings?: number;
  totalReviews?:           number;
  isAvailable:             boolean;
  nidVerified:             boolean;
  nidImage?:               string;
  tradeLicenseVerified:    boolean;
  tradeLicenseImage?:      string;
  verificationStatus?:     VerificationStatus;
  badges?:                 string[];
  memberSince?:            string;
  acceptedPaymentMethods?: ('CASH' | 'BKASH' | 'NAGAD' | 'ROCKET')[];
  paymentMobileNumber?:    string;
};

export type ProviderSummaryResponse = {
  providerId:              string;
  userId:                  string;
  name:                    string;
  profilePhoto?:           string;
  serviceCategory:         ServiceCategory;
  skills?:                 string[];
  portfolio?:              string[];
  hourlyRate?:             number;
  averageRating?:          number;
  reputationScore?:        number;
  totalCompletedBookings?: number;
  isAvailable:             boolean;
  badges?:                 string[];
  serviceArea?:            string;
  distanceKm?:             number;
  latitude?:               number;
  longitude?:              number;
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

export type TimeSlot = {
  date: string;
  time: string;
  reason?: string;
};

export type SchedulingSuggestionResponse = {
  suggestedSlots: TimeSlot[];
  busySlots: TimeSlot[];
  note?: string;
};

export type EarningsResponse = {
  totalEarnings: number;
  recentEarnings: number;
  totalCompleted: number;
  hourlyRate: number;
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
    profilePhoto?: string; portfolio?: string[];
    acceptedPaymentMethods?: ('CASH' | 'BKASH' | 'NAGAD' | 'ROCKET')[];
    paymentMobileNumber?: string;
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

  submitVerification: async (data: { nidImage: string; tradeLicenseImage: string }): Promise<ProviderProfileResponse> => {
    const { data: res } = await client.post<ApiResponse<ProviderProfileResponse>>('/providers/me/submit-verification', data);
    return res.data;
  },

  getReputation: async (providerId: string): Promise<ReputationResponse> => {
    const { data: res } = await client.get<ApiResponse<ReputationResponse>>(`/providers/${providerId}/reputation`);
    return res.data;
  },

  search: async (data: {
    keyword?: string;
    category?: ServiceCategory;
    maxHourlyRate?: number;
    minRating?: number;
    latitude?: number;
    longitude?: number;
    maxDistanceKm?: number;
  }): Promise<ProviderSummaryResponse[]> => {
    const { data: res } = await client.post<ApiResponse<ProviderSummaryResponse[]>>('/providers/search', data);
    return res.data;
  },

  getActivitySummary: async (): Promise<ActivitySummaryResponse> => {
    const { data: res } = await client.get<ApiResponse<ActivitySummaryResponse>>('/activity/summary');
    return res.data;
  },

  getSchedulingSuggestions: async (providerId: string): Promise<SchedulingSuggestionResponse> => {
    const { data: res } = await client.get<ApiResponse<SchedulingSuggestionResponse>>(`/scheduling/suggest/${providerId}`);
    return res.data;
  },

  getEarnings: async (): Promise<EarningsResponse> => {
    const { data: res } = await client.get<ApiResponse<EarningsResponse>>('/providers/me/earnings');
    return res.data;
  },
};