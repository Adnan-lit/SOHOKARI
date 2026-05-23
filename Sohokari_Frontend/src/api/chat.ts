import client from './client';

type ApiResponse<T> = { success: boolean; message: string; data: T };
type Page<T> = { content: T[]; totalElements: number; totalPages: number };

// ✅ Matches ChatMessageResponse from backend
export type ChatMessageResponse = {
  messageId:   string;
  bookingId:   string;
  senderId:    string;
  senderName:  string;
  receiverId:  string;
  content:     string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  isRead:      boolean;
  sentAt:      string;
};

// ✅ Matches ConversationResponse from backend
export type ConversationResponse = {
  bookingId:      string;
  otherUserId:    string;
  otherUserName:  string;
  otherUserPhoto?:string;
  lastMessage?:   string;
  lastMessageAt?: string;
  unreadCount:    number;
};

// ✅ Matches Notification model from backend
export type NotificationResponse = {
  id:        string;
  userId:    string;
  title:     string;
  body:      string;
  read:      boolean;
  createdAt: string;
};

export const chatApi = {
  // ✅ POST /api/v1/chats/send
  sendMessage: async (payload: {
    bookingId:   string;
    receiverId:  string;
    content:     string;
    messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  }): Promise<ChatMessageResponse> => {
    const { data: res } = await client.post<ApiResponse<ChatMessageResponse>>('/chats/send', payload);
    return res.data;
  },

  // ✅ GET /api/v1/chats/{bookingId}/messages — returns Page<ChatMessageResponse>
  getMessages: async (bookingId: string, page = 0, size = 50): Promise<ChatMessageResponse[]> => {
    const { data: res } = await client.get<ApiResponse<Page<ChatMessageResponse>>>(
      `/chats/${bookingId}/messages`, { params: { page, size } }
    );
    return res.data.content;
  },

  // ✅ GET /api/v1/chats/conversations
  getConversations: async (): Promise<ConversationResponse[]> => {
    const { data: res } = await client.get<ApiResponse<ConversationResponse[]>>('/chats/conversations');
    return res.data;
  },
};

export const notificationsApi = {
  // ✅ POST /api/v1/notifications/fcm-token
  registerFcmToken: async (token: string): Promise<void> => {
    await client.post('/notifications/fcm-token', { token });
  },

  // ✅ GET /api/v1/notifications — returns Page<Notification>
  getAll: async (page = 0, size = 20): Promise<NotificationResponse[]> => {
    const { data: res } = await client.get<ApiResponse<Page<NotificationResponse>>>(
      '/notifications', { params: { page, size } }
    );
    return res.data.content;
  },

  // ✅ GET /api/v1/notifications/unread-count — returns { count: number }
  getUnreadCount: async (): Promise<number> => {
    const { data: res } = await client.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return res.data.count;
  },

  // ✅ PUT /api/v1/notifications/{id}/read — mark single
  markRead: async (id: string): Promise<void> => {
    await client.put(`/notifications/${id}/read`);
  },

  // ✅ PUT /api/v1/notifications/read-all
  markAllRead: async (): Promise<void> => {
    await client.put('/notifications/read-all');
  },
};