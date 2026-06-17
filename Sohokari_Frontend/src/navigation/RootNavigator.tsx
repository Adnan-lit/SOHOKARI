import React from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@store/authStore";
import type { RootStackParamList } from "@app-types/navigation.types";
import { Colors } from "@theme/colors";

import AuthNavigator from "./AuthNavigator";
import CustomerNavigator from "./CustomerNavigator";
import ProviderNavigator from "./ProviderNavigator";

// Direct imports — React.lazy is not supported in React Native
import ProviderProfileScreen from "@screens/providers/ProviderProfileScreen";
import BookingDetailScreen from "@screens/bookings/BookingDetailScreen";
import CreateBookingScreen from "@screens/bookings/CreateBookingScreen";
import ChatRoomScreen from "@screens/chat/ChatRoomScreen";
import ReviewFormScreen from "@screens/reviews/ReviewFormScreen";
import ReviewListScreen from "@screens/reviews/ReviewListScreen";
import SearchScreen from "@screens/home/SearchScreen";
import NearbyMapScreen from "@screens/providers/NearbyMapScreen";
import AIChatScreen from "@screens/home/AIChatScreen";
import EditProviderProfileScreen from "@screens/providers/EditProviderProfileScreen";
import EarningsScreen from "@screens/providers/EarningsScreen";
import ActivitySummaryScreen from "@screens/providers/ActivitySummaryScreen";
import VerificationScreen from "@screens/providers/VerificationScreen";
import EditCustomerProfileScreen from "@screens/profile/EditCustomerProfileScreen";
import AdminDashboardScreen from "@screens/admin/AdminDashboardScreen";
import LocationPickerScreen from "@screens/common/LocationPickerScreen";
import InvoiceScreen from "@screens/bookings/InvoiceScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function RootNavigator() {
  const { isLoggedIn, role, hydrateFromStorage } = useAuthStore();

  React.useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: "600" },
          animation: "slide_from_right",
        }}
      >
        {!isLoggedIn ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : role === "ADMIN" ? (
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{ title: "Admin Dashboard", headerShown: true }}
          />
        ) : role === "PROVIDER" ? (
          <Stack.Screen
            name="ProviderApp"
            component={ProviderNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="CustomerApp"
            component={CustomerNavigator}
            options={{ headerShown: false }}
          />
        )}

        <Stack.Screen
          name="ProviderProfile"
          component={ProviderProfileScreen}
          options={{ title: "Provider Profile" }}
        />
        <Stack.Screen
          name="BookingDetail"
          component={BookingDetailScreen}
          options={{ title: "Booking Details" }}
        />
        <Stack.Screen
          name="CreateBooking"
          component={CreateBookingScreen}
          options={{ title: "Book Service" }}
        />
        <Stack.Screen
          name="ChatRoom"
          component={ChatRoomScreen}
          options={({ route }) => ({ title: route.params.participantName })}
        />
        <Stack.Screen
          name="ReviewForm"
          component={ReviewFormScreen}
          options={{ title: "Leave a Review" }}
        />
        <Stack.Screen
          name="ReviewList"
          component={ReviewListScreen}
          options={{ title: "Reviews" }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: "Search" }}
        />
        <Stack.Screen
          name="NearbyMap"
          component={NearbyMapScreen}
          options={{ title: "Nearby Providers" }}
        />
        <Stack.Screen
          name="AIChat"
          component={AIChatScreen}
          options={{ title: "AI Assistant" }}
        />
        <Stack.Screen
          name="EditProviderProfile"
          component={EditProviderProfileScreen}
          options={{ title: "Edit Profile" }}
        />
        <Stack.Screen
          name="EditCustomerProfile"
          component={EditCustomerProfileScreen}
          options={{ title: "Edit Profile" }}
        />
        <Stack.Screen
          name="Earnings"
          component={EarningsScreen}
          options={{ title: "Earnings Dashboard" }}
        />
        <Stack.Screen
          name="ActivitySummary"
          component={ActivitySummaryScreen}
          options={{ title: "Activity Summary" }}
        />
        <Stack.Screen
          name="Verification"
          component={VerificationScreen}
          options={{ title: "Identity Verification" }}
        />
        <Stack.Screen
          name="LocationPicker"
          component={LocationPickerScreen}
          options={{ title: "Pick Location", presentation: "modal" }}
        />
        <Stack.Screen
          name="Invoice"
          component={InvoiceScreen}
          options={{ title: "Payment / Invoice" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
