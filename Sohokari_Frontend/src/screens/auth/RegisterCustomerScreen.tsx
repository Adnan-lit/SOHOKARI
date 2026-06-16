import React, { useState } from "react";
import {
  View,
  Text,
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
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
}
interface FormErrors {
  [k: string]: string | undefined;
}

export default function RegisterCustomerScreen() {
  const navigation = useNavigation<AuthNavProp>();
  const { registerCustomer, loading } = useAuthStore();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const set = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^01[3-9]\d{8}$/.test(form.phone))
      e.phone = "Enter valid BD number (e.g. 01712345678)";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await registerCustomer({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
    } catch (err: unknown) {
      Toast.show({
        type: "error",
        text1: "Registration failed",
        text2: err instanceof Error ? err.message : "Registration failed",
      });
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
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Sign up as a customer</Text>
        </View>

        <View style={styles.card}>
          <FormInput
            label="Full Name"
            value={form.name}
            onChangeText={set("name")}
            error={errors.name}
            iconName="person-outline"
            placeholder="Rahim Uddin"
            autoCapitalize="words"
          />
          <FormInput
            label="Email"
            value={form.email}
            onChangeText={set("email")}
            error={errors.email}
            iconName="mail-outline"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <FormInput
            label="Phone Number"
            value={form.phone}
            onChangeText={set("phone")}
            error={errors.phone}
            iconName="call-outline"
            keyboardType="phone-pad"
            placeholder="01712345678"
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
          <FormInput
            label="Confirm Password"
            value={form.confirm}
            onChangeText={set("confirm")}
            error={errors.confirm}
            iconName="lock-closed-outline"
            isPassword
            placeholder="••••••••"
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.footer, { marginTop: 8 }]}>
          <Text style={styles.footerText}>Want to offer services? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("RegisterProvider")}
          >
            <Text style={styles.link}>Register as Provider</Text>
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
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: { marginBottom: 28 },
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