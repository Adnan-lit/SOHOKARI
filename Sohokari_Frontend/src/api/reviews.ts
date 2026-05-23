import client from './client';

type ApiResponse<T> = { success: boolean; message: string; data: T };
type Page<T> = { content: T[]; totalElements: number; totalPages: number };

// ✅ Matches ReviewResponse from backend exactly
export type ReviewResponse = {
  reviewId:             string;
  bookingId:            string;
  customerId:           string;
  customerName:         string;
  customerPhoto?:       string;
  providerId:           string;
  serviceQuality:       number;
  communication:        number;
  timeliness:           number;
  professionalBehavior: number;
  overallSatisfaction:  number;
  averageRating:        number;
  reviewText?:          string;
  createdAt:            string;
};

export type CreateReviewPayload = {
  bookingId:            string;
  serviceQuality:       number;
  communication:        number;
  timeliness:           number;
  professionalBehavior: number;
  overallSatisfaction:  number;
  reviewText?:          string;
};

export const reviewsApi = {
  // ✅ POST /api/v1/reviews
  create: async (payload: CreateReviewPayload): Promise<ReviewResponse> => {
    const { data: res } = await client.post<ApiResponse<ReviewResponse>>('/reviews', payload);
    return res.data;
  },

  // ✅ GET /api/v1/reviews/provider/{providerId} — returns Page<ReviewResponse>
  getByProvider: async (providerId: string, page = 0, size = 10): Promise<ReviewResponse[]> => {
    const { data: res } = await client.get<ApiResponse<Page<ReviewResponse>>>(
      `/reviews/provider/${providerId}`, { params: { page, size } }
    );
    return res.data.content;
  },

  // ✅ GET /api/v1/reviews/booking/{bookingId}/exists — returns { exists: boolean }
  checkExists: async (bookingId: string): Promise<boolean> => {
    const { data: res } = await client.get<ApiResponse<{ exists: boolean }>>(
      `/reviews/booking/${bookingId}/exists`
    );
    return res.data.exists;
  },

  // ✅ DELETE /api/v1/reviews/{reviewId}
  delete: async (reviewId: string): Promise<void> => {
    await client.delete(`/reviews/${reviewId}`);
  },
};