import type { BookingStatus, ServiceCategory } from '@constants/config';

export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterCustomerRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type RegisterProviderRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
  nid: string;
  tradeLicense: string;
  serviceCategory: ServiceCategory;
  latitude: number;
  longitude: number;
};

export type Provider = {
  _id: string;
  name: string;
  serviceCategory: ServiceCategory;
  available: boolean;
  rating?: number;
  distance?: number;
  hourlyRate?: number;
  bio?: string;
  totalReviews?: number;
  serviceArea?: string;
  phone?: string;
  skills?: string[];
};

export type Customer = {
  _id: string;
  name: string;
  phone?: string;
};

export type Booking = {
  _id: string;
  providerId: string | Provider;
  customerId: string | Customer;
  serviceCategory: ServiceCategory;
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime?: string;
  address: string;
  notes?: string;
};

export type Review = {
  _id: string;
  providerId: string | Provider;
  customerId: string | Customer;
  overallSatisfaction: number;
  reviewText?: string;
};

export type Reputation = {
  averageRating: number;
  totalJobs?: number;
  categoryScores?: Record<string, number>;
  badges: string[];
};

export type ChatMessage = {
  _id: string;
  bookingId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  createdAt: string;
};

export type Conversation = {
  bookingId: string;
  participant?: {
    _id?: string;
    name?: string;
  };
  lastMessage?: {
    content?: string;
    createdAt?: string;
  };
  unreadCount: number;
};

export type Notification = {
  _id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};
