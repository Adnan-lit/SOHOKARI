import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { providersApi } from "@api/providers";
import { bookingsApi } from "@api/bookings";
import { Colors } from "@theme/colors";
import { SERVICE_CATEGORIES, ServiceCategory } from "@constants/config";
import FormInput from "@components/forms/FormInput";
import Button from "@components/common/Button";
import type {
  RootNavProp,
  RootStackParamList,
} from "@app-types/navigation.types";

type RoutePropType = RouteProp<RootStackParamList, "CreateBooking">;

interface FormState {
  serviceCategory: ServiceCategory | "";
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  notes: string;
}
interface FormErrors {
  [k: string]: string | undefined;
}

const TIME_SLOTS = [
  "08:00:00",
  "09:00:00",
  "10:00:00",
  "11:00:00",
  "12:00:00",
  "13:00:00",
  "14:00:00",
  "15:00:00",
  "16:00:00",
  "17:00:00",
  "18:00:00",
];

export default function CreateBookingScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { params } = useRoute<RoutePropType>();
  const qc = useQueryClient();

  const { data: provider } = useQuery({
    queryKey: ["provider", params.providerId],
    queryFn: () => providersApi.getById(params.providerId),
  });

  const [form, setForm] = useState<FormState>({
    serviceCategory: provider?.serviceCategory ?? "",
    scheduledDate: "",
    scheduledTime: "",
    address: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Pre-fill serviceCategory once provider data arrives
  useEffect(() => {
    if (provider?.serviceCategory && !form.serviceCategory) {
      setForm(prev => ({ ...prev, serviceCategory: provider.serviceCategory }));
    }
  }, [provider?.serviceCategory]);
  const [showCats, setShowCats] = useState(false);
  const [showSlots, setShowSlots] = useState(false);

  const set = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.serviceCategory) e.serviceCategory = "Select a service category";
    if (!form.scheduledDate.trim()) {
      e.scheduledDate = "Select a date";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.scheduledDate.trim())) {
      e.scheduledDate = "Must be in YYYY-MM-DD format (e.g. 2026-05-26)";
    } else {
      const d = new Date(form.scheduledDate.trim());
      if (isNaN(d.getTime()) || d < new Date(new Date().toDateString())) {
        e.scheduledDate = "Enter a valid future date";
      }
    }
    if (!form.scheduledTime) e.scheduledTime = "Select a time slot";
    if (!form.address.trim()) e.address = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: () =>
      bookingsApi.create({
        providerId: params.providerId,
        serviceCategory: form.serviceCategory as ServiceCategory,
        scheduledDate: form.scheduledDate.trim(),
        scheduledTime: form.scheduledTime,
        address: form.address.trim(),
        notes: form.notes.trim() || undefined,
      }),
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: ["myBookings"] });
      Toast.show({
        type: "success",
        text1: "Booking created!",
        text2: "Waiting for provider to accept.",
      });
      navigation.replace("BookingDetail", { bookingId: booking.bookingId });
    },
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: "Booking failed",
        text2: err.message,
      });
    },
  });

  const handleSubmit = () => {
    if (validate()) mutation.mutate();
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
        {/* Provider info strip */}
        {provider && (
          <View style={styles.providerStrip}>
            <View style={styles.providerAvatar}>
              <Text style={styles.providerAvatarText}>
                {provider.name.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerCat}>
                {provider.serviceCategory.replace("_", " ")}
              </Text>
            </View>
            {provider.hourlyRate != null && (
              <Text style={styles.providerRate}>৳{provider.hourlyRate}/hr</Text>
            )}
          </View>
        )}

        <View style={styles.card}>
          {/* Service Category */}
          <Text style={styles.label}>Service Category</Text>
          <TouchableOpacity
            style={[
              styles.picker,
              errors.serviceCategory ? styles.pickerError : styles.pickerNormal,
            ]}
            onPress={() => setShowCats((p) => !p)}
          >
            <Ionicons
              name="construct-outline"
              size={18}
              color={Colors.textMuted}
              style={{ marginRight: 8 }}
            />
            <Text
              style={
                form.serviceCategory
                  ? styles.pickerVal
                  : styles.pickerPlaceholder
              }
            >
              {form.serviceCategory
                ? SERVICE_CATEGORIES.find((c) => c.key === form.serviceCategory)
                    ?.label
                : "Select category"}
            </Text>
            <Ionicons
              name={showCats ? "chevron-up" : "chevron-down"}
              size={16}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
          {errors.serviceCategory && (
            <Text style={styles.errorText}>{errors.serviceCategory}</Text>
          )}

          {showCats && (
            <View style={styles.dropdown}>
              {SERVICE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.dropItem,
                    form.serviceCategory === cat.key && styles.dropItemActive,
                  ]}
                  onPress={() => {
                    set("serviceCategory")(cat.key);
                    setShowCats(false);
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={
                      form.serviceCategory === cat.key
                        ? Colors.white
                        : Colors.primary
                    }
                  />
                  <Text
                    style={[
                      styles.dropItemText,
                      form.serviceCategory === cat.key &&
                        styles.dropItemTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Date */}
          <FormInput
            label="Scheduled Date"
            value={form.scheduledDate}
            onChangeText={set("scheduledDate")}
            error={errors.scheduledDate}
            iconName="calendar-outline"
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />

          {/* Time slot */}
          <Text style={styles.label}>Scheduled Time</Text>
          <TouchableOpacity
            style={[
              styles.picker,
              errors.scheduledTime ? styles.pickerError : styles.pickerNormal,
            ]}
            onPress={() => setShowSlots((p) => !p)}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={Colors.textMuted}
              style={{ marginRight: 8 }}
            />
            <Text
              style={
                form.scheduledTime ? styles.pickerVal : styles.pickerPlaceholder
              }
            >
              {form.scheduledTime
                ? form.scheduledTime.substring(0, 5)
                : "Select time slot"}
            </Text>
            <Ionicons
              name={showSlots ? "chevron-up" : "chevron-down"}
              size={16}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
          {errors.scheduledTime && (
            <Text style={styles.errorText}>{errors.scheduledTime}</Text>
          )}

          {showSlots && (
            <View style={styles.slotGrid}>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotChip,
                    form.scheduledTime === slot && styles.slotChipActive,
                  ]}
                  onPress={() => {
                    set("scheduledTime")(slot);
                    setShowSlots(false);
                  }}
                >
                  <Text
                    style={[
                      styles.slotText,
                      form.scheduledTime === slot && styles.slotTextActive,
                    ]}
                  >
                    {slot.substring(0, 5)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Address */}
          <FormInput
            label="Service Address"
            value={form.address}
            onChangeText={set("address")}
            error={errors.address}
            iconName="location-outline"
            placeholder="House 12, Road 5, Dhanmondi, Dhaka"
            multiline
          />

          {/* Notes */}
          <FormInput
            label="Notes (Optional)"
            value={form.notes}
            onChangeText={set("notes")}
            iconName="document-text-outline"
            placeholder="Describe the problem briefly…"
            multiline
          />

          <Button
            title="Confirm Booking"
            onPress={handleSubmit}
            loading={mutation.isPending}
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    paddingBottom: 40,
  },
  providerStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primary,
    padding: 16,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  providerAvatarText: { fontSize: 18, color: Colors.white, fontWeight: "700" },
  providerName: { fontSize: 15, fontWeight: "600", color: Colors.white },
  providerCat: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  providerRate: {
    marginLeft: "auto",
    fontSize: 15,
    fontWeight: "700",
    color: Colors.accentLight,
  },
  card: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
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
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 4,
  },
  pickerNormal: { borderColor: Colors.border },
  pickerError: { borderColor: Colors.error },
  pickerPlaceholder: { flex: 1, fontSize: 15, color: Colors.textMuted },
  pickerVal: { flex: 1, fontSize: 15, color: Colors.text },
  errorText: { fontSize: 12, color: Colors.error, marginBottom: 12 },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
  dropItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  dropItemActive: { backgroundColor: Colors.accent },
  dropItemText: { fontSize: 14, color: Colors.text },
  dropItemTextActive: { color: Colors.white, fontWeight: "600" },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  slotChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotText: { fontSize: 13, color: Colors.text },
  slotTextActive: { color: Colors.white, fontWeight: "600" },
});