import client from './client';
import type { BookingStatus } from '@constants/config';

// ✅ Matches BookingResponse from backend exactly
export type BookingResponse = {
  bookingId:          string;
  customerId:         string;
  customerName:       string;
  providerId:         string;
  providerName:       string;
  providerPhoto?:     string;
  serviceCategory:    string;
  scheduledDate:      string;
  scheduledTime:      string;
  notes?:             string;
  address:            string;
  status:             BookingStatus;
  cancellationReason?:string;
  rejectionReason?:   string;
  requestedAt?:       string;
  respondedAt?:       string;
  completedAt?:       string;
  createdAt?:         string;
};

// ✅ Matches CreateBookingRequest from backend
export type CreateBookingPayload = {
  providerId:      string;
  serviceCategory: string;
  scheduledDate:   string;  // YYYY-MM-DD → backend parses as LocalDate
  scheduledTime:   string;  // HH:mm:ss  → backend parses as LocalTime
  notes?:          string;
  address:         string;
};

// ✅ Backend wraps everything in ApiResponse<T> → { success, message, data }
type ApiResponse<T> = { success: boolean; message: string; data: T };
// ✅ /bookings/my returns Page<BookingResponse> → { content, totalElements, ... }
type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number };

export const bookingsApi = {
  create: async (payload: CreateBookingPayload): Promise<BookingResponse> => {
    const { data: res } = await client.post<ApiResponse<BookingResponse>>('/bookings', payload);
    return res.data;
  },

  // ✅ Backend has GET /bookings/{bookingId} — use it directly
  getById: async (id: string): Promise<BookingResponse> => {
    const { data: res } = await client.get<ApiResponse<BookingResponse>>(`/bookings/${id}`);
    return res.data;
  },

  // ✅ Returns Page — extract .content
  getMy: async (status?: BookingStatus, page = 0, size = 20): Promise<BookingResponse[]> => {
    const { data: res } = await client.get<ApiResponse<Page<BookingResponse>>>('/bookings/my', {
      params: { ...(status ? { status } : {}), page, size },
    });
    return res.data.content;
  },

  accept: async (id: string): Promise<BookingResponse> => {
    const { data: res } = await client.put<ApiResponse<BookingResponse>>(`/bookings/${id}/accept`);
    return res.data;
  },

  reject: async (id: string, reason: string): Promise<BookingResponse> => {
    const { data: res } = await client.put<ApiResponse<BookingResponse>>(`/bookings/${id}/reject`, { reason });
    return res.data;
  },

  start: async (id: string): Promise<BookingResponse> => {
    const { data: res } = await client.put<ApiResponse<BookingResponse>>(`/bookings/${id}/start`);
    return res.data;
  },

  complete: async (id: string): Promise<BookingResponse> => {
    const { data: res } = await client.put<ApiResponse<BookingResponse>>(`/bookings/${id}/complete`);
    return res.data;
  },

  cancel: async (id: string, reason = ''): Promise<BookingResponse> => {
    const { data: res } = await client.put<ApiResponse<BookingResponse>>(`/bookings/${id}/cancel`, { reason: reason || '' });
    return res.data;
  },
};