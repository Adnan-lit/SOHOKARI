import client from './client';

type ApiResponse<T> = { success: boolean; message: string; data: T };
type Page<T> = { content: T[]; totalElements: number; totalPages: number };

// ✅ Swagger: ChatMessageResponse
export type ChatMessageResponse = {
  messageId:   string;
  bookingId:   string;
  senderId:    string;
  senderName:  string;
  receiverId:  string;
  content:     string;
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION'; // SYSTEM removed, LOCATION added
  sentAt:      string;
  read:        boolean; // was isRead — Swagger says read
};

// ✅ Swagger: ConversationResponse
export type ConversationResponse = {
  bookingId:       string;
  otherUserId:     string;
  otherUserName:   string;
  otherUserPhoto?: string;
  lastMessage?:    string;
  lastMessageAt?:  string;
  unreadCount:     number;
};

// ✅ Swagger: Notification (with type enum + referenceId)
export type NotificationResponse = {
  id:           string;
  userId:       string;
  title:        string;
  body:         string;
  type:         | 'BOOKING_REQUESTED' | 'BOOKING_ACCEPTED' | 'BOOKING_REJECTED'
                | 'BOOKING_STARTED'   | 'BOOKING_COMPLETED'
                | 'NEW_MESSAGE'       | 'REVIEW_RECEIVED';
  referenceId?: string;
  read:         boolean;
  createdAt:    string;
};

export const chatApi = {
  sendMessage: async (payload: {
    bookingId:   string;
    receiverId:  string;
    content:     string;
    messageType: 'TEXT' | 'IMAGE' | 'LOCATION';
  }): Promise<ChatMessageResponse> => {
    const { data: res } = await client.post<ApiResponse<ChatMessageResponse>>('/chats/send', payload);
    return res.data;
  },

  getMessages: async (bookingId: string, page = 0, size = 50): Promise<ChatMessageResponse[]> => {
    const { data: res } = await client.get<ApiResponse<Page<ChatMessageResponse>>>(
      `/chats/${bookingId}/messages`, { params: { page, size } }
    );
    return res.data.content;
  },

  getConversations: async (): Promise<ConversationResponse[]> => {
    const { data: res } = await client.get<ApiResponse<ConversationResponse[]>>('/chats/conversations');
    return res.data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await client.delete(`/chats/${messageId}`);
  },
};

export const notificationsApi = {
  registerFcmToken: async (token: string): Promise<void> => {
    await client.post('/notifications/fcm-token', { token });
  },

  getAll: async (page = 0, size = 20): Promise<NotificationResponse[]> => {
    const { data: res } = await client.get<ApiResponse<Page<NotificationResponse>>>(
      '/notifications', { params: { page, size } }
    );
    return res.data.content;
  },

  // ✅ Swagger: returns ApiResponseMapStringLong → { "count": N }
  getUnreadCount: async (): Promise<number> => {
    const { data: res } = await client.get<ApiResponse<Record<string, number>>>('/notifications/unread-count');
    return res.data['count'] ?? Object.values(res.data)[0] ?? 0;
  },

  markRead: async (id: string): Promise<void> => {
    await client.put(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await client.put('/notifications/read-all');
  },
};