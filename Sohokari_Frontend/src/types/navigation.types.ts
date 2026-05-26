import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp }   from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';

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

// ─── Root Stack ───────────────────────────────────────────
export type RootStackParamList = {
  Auth:         NavigatorScreenParams<AuthStackParamList> | undefined;
  CustomerApp:  NavigatorScreenParams<CustomerTabParamList> | undefined;
  ProviderApp:  NavigatorScreenParams<ProviderTabParamList> | undefined;

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

// ─── Nav prop convenience types ───────────────────────────
export type RootNavProp        = NativeStackNavigationProp<RootStackParamList>;

export type AuthNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type CustomerTabNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ProviderTabNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ProviderTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;