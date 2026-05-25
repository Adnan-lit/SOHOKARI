import React from "react";
import { NavigationContainer } from "@react-navigation/native";
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoggedIn, role, hydrateFromStorage } = useAuthStore();

  React.useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
