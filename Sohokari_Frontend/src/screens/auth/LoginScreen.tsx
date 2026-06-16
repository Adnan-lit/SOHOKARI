import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@store/authStore";
import { Colors } from "@theme/colors";
import FormInput from "@components/forms/FormInput";
import Button from "@components/common/Button";
import type { AuthNavProp } from "@app-types/navigation.types";

interface FormState {
  email: string;
  password: string;
}
interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const navigation = useNavigation<AuthNavProp>();
  const { loginCustomer, loading } = useAuthStore();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  const set = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await loginCustomer({
        email: form.email.trim(),
        password: form.password,
      });
      // RootNavigator auto-redirects on isLoggedIn change
    } catch (err: unknown) {
      Toast.show({ type: "error", text1: "Login failed", text2: err instanceof Error ? err.message : "Login failed" });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your Sohokari account</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <FormInput
            label="Email"
            value={form.email}
            onChangeText={set("email")}
            error={errors.email}
            iconName="mail-outline"
            keyboardType="email-address"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <FormInput
            label="Password"
            value={form.password}
            onChangeText={set("password")}
            error={errors.password}
            iconName="lock-closed-outline"
            isPassword
            placeholder="••••••••"
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </View>

        {/* Footer links */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("RegisterCustomer")}
          >
            <Text style={styles.link}>Register as Customer</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.footer, { marginTop: 8 }]}>
          <Text style={styles.footerText}>Are you a service provider? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("RegisterProvider")}
          >
            <Text style={styles.link}>Join as Provider</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 120, height: 120, borderRadius: 20, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 6,
  },
  subtitle: { fontSize: 15, color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    flexWrap: "wrap",
  },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  link: { fontSize: 14, color: Colors.accent, fontWeight: "600" },
});