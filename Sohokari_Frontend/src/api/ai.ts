import client from './client';
import type { ServiceCategory } from '@constants/config';

type ApiResponse<T> = { success: boolean; message: string; data: T };

// ✅ Matches RecommendationResponse from backend
export type RecommendationResponse = {
  providerId:          string;
  name:                string;
  profilePhoto?:       string;
  serviceCategory:     ServiceCategory;
  skills?:             string[];
  hourlyRate?:         number;
  averageRating?:      number;
  reputationScore?:    number;
  isAvailable:         boolean;
  badges?:             string[];
  distanceKm?:         number;
  recommendationScore?:number;
};

// ✅ Matches AiChatResponse from backend
export type AiChatResponse = {
  sessionId:          string;
  reply:              string;
  detectedIntent?:    string;
  suggestedProviders: RecommendationResponse[];
  totalProviderFound: number;
};

// ✅ Matches SmartMatchResponse from backend
export type SmartMatchResponse = {
  extractedKeywords:  string[];
  detectedCategory:   string;
  matchedProviders:   RecommendationResponse[];
  totalFound:         number;
};

// ✅ Matches SchedulingSuggestionResponse from backend
export type SchedulingSuggestionResponse = {
  suggestedSlots: { date: string; time: string; reason: string }[];
  busySlots:      { date: string; time: string; reason: string }[];
  note?:          string;
};

export const aiApi = {
  // ✅ POST /api/v1/ai/chat
  chat: async (payload: {
    message:    string;
    latitude?:  number;
    longitude?: number;
    sessionId?: string;
  }): Promise<AiChatResponse> => {
    const { data: res } = await client.post<ApiResponse<AiChatResponse>>('/ai/chat', payload);
    return res.data;
  },

  // ✅ DELETE /api/v1/ai/chat/history
  clearHistory: async (): Promise<void> => {
    await client.delete('/ai/chat/history');
  },

  // ✅ POST /api/v1/matching/find
  smartMatch: async (payload: {
    requirementText: string;
    latitude?:       number;
    longitude?:      number;
  }): Promise<SmartMatchResponse> => {
    const { data: res } = await client.post<ApiResponse<SmartMatchResponse>>('/matching/find', payload);
    return res.data;
  },

  // ✅ GET /api/v1/recommendations
  getRecommendations: async (params: {
    lat?:       number;
    lng?:       number;
    category?:  ServiceCategory;
    limit?:     number;
  }): Promise<RecommendationResponse[]> => {
    const { data: res } = await client.get<ApiResponse<RecommendationResponse[]>>('/recommendations', { params });
    return res.data;
  },
};