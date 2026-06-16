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
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAuthStore } from "@store/authStore";
import { Colors } from "@theme/colors";
import { SERVICE_CATEGORIES, ServiceCategory } from "@constants/config";
import FormInput from "@components/forms/FormInput";
import Button from "@components/common/Button";
import type { AuthNavProp } from "@app-types/navigation.types";

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  nid: string;
  tradeLicense: string;
  serviceCategory: ServiceCategory | "";
}
interface FormErrors {
  [k: string]: string | undefined;
}

export default function RegisterProviderScreen() {
  const navigation = useNavigation<AuthNavProp>();
  const { registerProvider, loading } = useAuthStore();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    nid: "",
    tradeLicense: "",
    serviceCategory: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showCats, setShowCats] = useState(false);

  const set = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^01[3-9]\d{8}$/.test(form.phone))
      e.phone = "Enter valid BD number";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    if (!form.nid.trim()) e.nid = "NID is required";
    if (!form.tradeLicense.trim()) e.tradeLicense = "Trade license is required";
    if (!form.serviceCategory) e.serviceCategory = "Select a service category";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      let lat = 23.8103;
      let lng = 90.4125;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        lat = location.coords.latitude;
        lng = location.coords.longitude;
      }

      await registerProvider({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        nid: form.nid.trim(),
        tradeLicense: form.tradeLicense.trim(),
        serviceCategory: form.serviceCategory as ServiceCategory,
        latitude: lat,
        longitude: lng,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Registration failed",
        text2: err.message,
      });
    }
  };

  const selectedCat = SERVICE_CATEGORIES.find(
    (c) => c.key === form.serviceCategory,
  );

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
          <Text style={styles.title}>Join as Provider</Text>
          <Text style={styles.subtitle}>Offer your services on Sohokari</Text>
        </View>

        <View style={styles.card}>
          {/* Personal info */}
          <Text style={styles.section}>Personal Info</Text>
          <FormInput
            label="Full Name"
            value={form.name}
            onChangeText={set("name")}
            error={errors.name}
            iconName="person-outline"
            placeholder="Karim Ali"
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
            label="Phone"
            value={form.phone}
            onChangeText={set("phone")}
            error={errors.phone}
            iconName="call-outline"
            keyboardType="phone-pad"
            placeholder="01812345678"
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

          {/* Business info */}
          <Text style={[styles.section, { marginTop: 8 }]}>Business Info</Text>
          <FormInput
            label="NID Number"
            value={form.nid}
            onChangeText={set("nid")}
            error={errors.nid}
            iconName="card-outline"
            keyboardType="number-pad"
            placeholder="1234567890"
          />
          <FormInput
            label="Trade License"
            value={form.tradeLicense}
            onChangeText={set("tradeLicense")}
            error={errors.tradeLicense}
            iconName="document-outline"
            placeholder="TL-DHAKA-2024-001"
          />

          {/* Category picker */}
          <Text style={styles.label}>Service Category</Text>
          <TouchableOpacity
            style={[
              styles.picker,
              errors.serviceCategory ? styles.pickerError : styles.pickerNormal,
            ]}
            onPress={() => setShowCats((p) => !p)}
          >
            <Ionicons
              name={
                selectedCat ? (selectedCat.icon as any) : "construct-outline"
              }
              size={18}
              color={Colors.textMuted}
              style={{ marginRight: 8 }}
            />
            <Text
              style={
                selectedCat ? styles.pickerValue : styles.pickerPlaceholder
              }
            >
              {selectedCat ? selectedCat.label : "Select your service category"}
            </Text>
            <Ionicons
              name={showCats ? "chevron-up" : "chevron-down"}
              size={16}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
          {errors.serviceCategory ? (
            <Text style={styles.errorText}>{errors.serviceCategory}</Text>
          ) : null}

          {showCats && (
            <View style={styles.catList}>
              {SERVICE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catItem,
                    form.serviceCategory === cat.key && styles.catItemActive,
                  ]}
                  onPress={() => {
                    set("serviceCategory")(cat.key);
                    setShowCats(false);
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={18}
                    color={
                      form.serviceCategory === cat.key
                        ? Colors.white
                        : Colors.primary
                    }
                  />
                  <Text
                    style={[
                      styles.catLabel,
                      form.serviceCategory === cat.key && styles.catLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Button
            title="Create Provider Account"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: 20 }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already registered? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Sign In</Text>
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
  section: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryLight,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 4,
  },
  pickerNormal: { borderColor: Colors.border },
  pickerError: { borderColor: Colors.error },
  pickerPlaceholder: { flex: 1, fontSize: 15, color: Colors.textMuted },
  pickerValue: { flex: 1, fontSize: 15, color: Colors.text },
  errorText: { fontSize: 12, color: Colors.error, marginBottom: 12 },
  catList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  catItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  catItemActive: { backgroundColor: Colors.accent },
  catLabel: { fontSize: 15, color: Colors.text },
  catLabelActive: { color: Colors.white, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    flexWrap: "wrap",
  },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  link: { fontSize: 14, color: Colors.accent, fontWeight: "600" },
});