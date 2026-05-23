import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@app-types/navigation.types";

import SplashScreen from "@screens/auth/SplashScreen";
import LoginScreen from "@screens/auth/LoginScreen";
import RegisterCustomerScreen from "@screens/auth/RegisterCustomerScreen";
import RegisterProviderScreen from "@screens/auth/RegisterProviderScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="RegisterCustomer"
        component={RegisterCustomerScreen}
      />
      <Stack.Screen
        name="RegisterProvider"
        component={RegisterProviderScreen}
      />
    </Stack.Navigator>
  );
}
