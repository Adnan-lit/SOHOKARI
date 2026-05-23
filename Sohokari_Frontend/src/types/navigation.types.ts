import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp }   from '@react-navigation/bottom-tabs';

// ─── Root Stack ───────────────────────────────────────────
export type RootStackParamList = {
  Auth:         undefined;
  CustomerApp:  undefined;
  ProviderApp:  undefined;

  // Shared modal screens
  ProviderProfile: { providerId: string };
  BookingDetail:   { bookingId: string };
  CreateBooking:   { providerId: string };
  ChatRoom:        { bookingId: string; participantName: string; receiverId?: string; chatId?: string };
  ReviewForm:      { bookingId: string; providerId: string };
  ReviewList:      { providerId: string };
  Search:          undefined;
  NearbyMap:       undefined;
  AIChat:          undefined;
};

// ─── Auth Stack ───────────────────────────────────────────
export type AuthStackParamList = {
  Splash:           undefined;
  Login:            undefined;
  RegisterCustomer: undefined;
  RegisterProvider: undefined;
};

// ─── Customer Tabs ────────────────────────────────────────
export type CustomerTabParamList = {
  Home:          undefined;
  Bookings:      undefined;
  Chat:          undefined;
  Notifications: undefined;
  Profile:       undefined;
};

// ─── Provider Tabs ────────────────────────────────────────
export type ProviderTabParamList = {
  Dashboard:     undefined;
  MyBookings:    undefined;
  Chat:          undefined;
  Notifications: undefined;
  Profile:       undefined;
};

// ─── Nav prop convenience types ───────────────────────────
export type RootNavProp        = NativeStackNavigationProp<RootStackParamList>;
export type AuthNavProp        = NativeStackNavigationProp<AuthStackParamList>;
export type CustomerTabNavProp = BottomTabNavigationProp<CustomerTabParamList>;
export type ProviderTabNavProp = BottomTabNavigationProp<ProviderTabParamList>;