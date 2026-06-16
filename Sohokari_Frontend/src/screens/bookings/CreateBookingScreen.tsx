import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Switch,
  Modal,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";
import { Calendar } from "react-native-calendars";
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
  isUrgent: boolean;
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

  const { data: scheduling } = useQuery({
    queryKey: ["scheduling", params.providerId],
    queryFn: () => providersApi.getSchedulingSuggestions(params.providerId),
  });

  const getBusySlotsForDate = (dateStr: string) => {
    if (!scheduling || !scheduling.busySlots) return [];
    return scheduling.busySlots.filter(s => s.date === dateStr).map(s => s.time.substring(0, 5) + ":00");
  };

  const [form, setForm] = useState<FormState>({
    serviceCategory: provider?.serviceCategory ?? "",
    scheduledDate: "",
    scheduledTime: "",
    address: "",
    notes: "",
    isUrgent: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Pre-fill serviceCategory once provider data arrives
  useEffect(() => {
    if (provider?.serviceCategory && !form.serviceCategory) {
      setForm(prev => ({ ...prev, serviceCategory: provider.serviceCategory }));
    }
  }, [provider?.serviceCategory]);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const formatTime12Hour = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${m} ${suffix}`;
  };

  const isSlotPassedToday = (slot: string, dateStr: string) => {
    if (!dateStr) return false;
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + 
                     String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(now.getDate()).padStart(2, '0');
                     
    if (dateStr === todayStr) {
      const [slotH, slotM] = slot.split(':').map(Number);
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      if (slotH < currentH || (slotH === currentH && slotM <= currentM)) {
        return true;
      }
    }
    return false;
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: "error", text1: "Permission denied", text2: "Allow location access to use this feature." });
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocode.length > 0) {
        const place = geocode[0];
        const addrParts = [place.name, place.street, place.city, place.region].filter(Boolean);
        set("address")(addrParts.join(", "));
      }
    } catch (err: unknown) {
      Toast.show({ type: "error", text1: "Location Error", text2: "Could not fetch your location." });
    } finally {
      setIsLocating(false);
    }
  };

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
        isUrgent: form.isUrgent,
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
    onError: (err: Error) => {
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
          {/* Service Category (Locked) */}
          <Text style={styles.label}>Service Category</Text>
          <View style={[styles.picker, styles.pickerDisabled]}>
            <Ionicons
              name="construct-outline"
              size={18}
              color={Colors.textMuted}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.pickerVal}>
              {form.serviceCategory
                ? SERVICE_CATEGORIES.find((c) => c.key === form.serviceCategory)?.label
                : "Select category"}
            </Text>
            <Ionicons name="lock-closed" size={16} color={Colors.textMuted} />
          </View>
          <Text style={styles.helperText}>Category is locked to this provider's specialty.</Text>

          {/* Date Picker fallback */}
          <Text style={styles.label}>Scheduled Date</Text>
          <TouchableOpacity
            style={[styles.picker, errors.scheduledDate ? styles.pickerError : styles.pickerNormal, { marginBottom: 16 }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <Text style={form.scheduledDate ? styles.pickerVal : styles.pickerPlaceholder}>
              {form.scheduledDate || "Select Date"}
            </Text>
          </TouchableOpacity>
          {errors.scheduledDate && <Text style={styles.errorText}>{errors.scheduledDate}</Text>}

          {/* Calendar Modal */}
          <Modal visible={showDatePicker} transparent animationType="fade">
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1} 
              onPress={() => setShowDatePicker(false)}
            >
              <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                <Calendar
                  minDate={new Date().toISOString().split('T')[0]}
                  onDayPress={(day: { dateString: string }) => {
                    set("scheduledDate")(day.dateString);
                    set("scheduledTime")(""); // Reset time on date change
                    setShowDatePicker(false);
                  }}
                  theme={{
                    todayTextColor: Colors.primary,
                    selectedDayBackgroundColor: Colors.primary,
                    arrowColor: Colors.primary,
                  }}
                  markedDates={
                    form.scheduledDate ? {
                      [form.scheduledDate]: { selected: true, selectedColor: Colors.primary }
                    } : {}
                  }
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Time slot */}
          <Text style={styles.label}>Scheduled Time</Text>
          <TouchableOpacity
            style={[
              styles.picker,
              errors.scheduledTime ? styles.pickerError : styles.pickerNormal,
            ]}
            onPress={() => {
              if (!form.scheduledDate) {
                Toast.show({ type: "info", text1: "Select Date", text2: "Please select a date first." });
                return;
              }
              setShowSlots((p) => !p);
            }}
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
                ? formatTime12Hour(form.scheduledTime)
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
              {TIME_SLOTS.map((slot) => {
                const isBusy = getBusySlotsForDate(form.scheduledDate).includes(slot);
                const isPassed = isSlotPassedToday(slot, form.scheduledDate);
                const isUnavailable = isBusy || isPassed;

                if (isPassed) return null; // Hide past slots entirely for today

                return (
                <TouchableOpacity
                  key={slot}
                  disabled={isUnavailable}
                  style={[
                    styles.slotChip,
                    form.scheduledTime === slot && styles.slotChipActive,
                    isUnavailable && styles.slotChipBusy,
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
                      isUnavailable && styles.slotTextBusy,
                    ]}
                  >
                    {formatTime12Hour(slot)} {isBusy && "(Busy)"}
                  </Text>
                </TouchableOpacity>
              )})}
            </View>
          )}

          {/* Address */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Service Address"
                value={form.address}
                onChangeText={set("address")}
                error={errors.address}
                iconName="location-outline"
                placeholder="House 12, Road 5, Dhaka"
                multiline
              />
            </View>
            <TouchableOpacity 
              style={styles.locationBtn} 
              onPress={handleUseCurrentLocation}
              disabled={isLocating}
            >
              <Ionicons name="navigate" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <FormInput
            label="Notes (Optional)"
            value={form.notes}
            onChangeText={set("notes")}
            iconName="document-text-outline"
            placeholder="Describe the problem briefly…"
            multiline
          />

          {/* Urgent Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.label}>Urgent Booking</Text>
              <Text style={styles.toggleHint}>Provider will be notified immediately</Text>
            </View>
            <Switch
              value={form.isUrgent}
              onValueChange={(val) => setForm((prev) => ({ ...prev, isUrgent: val }))}
              trackColor={{ false: Colors.border, true: Colors.error }}
              thumbColor={Colors.white}
            />
          </View>

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
  pickerDisabled: { backgroundColor: Colors.background, borderColor: Colors.border, marginBottom: 12 },
  pickerPlaceholder: { flex: 1, fontSize: 15, color: Colors.textMuted },
  pickerVal: { flex: 1, fontSize: 15, color: Colors.text },
  helperText: { fontSize: 12, color: Colors.textMuted, marginTop: -8, marginBottom: 16, paddingLeft: 4 },
  errorText: { fontSize: 12, color: Colors.error, marginBottom: 12 },
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
  slotChipBusy: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    opacity: 0.5,
  },
  slotText: { fontSize: 13, color: Colors.text },
  slotTextActive: { color: Colors.white, fontWeight: "600" },
  slotTextBusy: { color: Colors.textMuted, textDecorationLine: "line-through" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toggleTextWrap: { flex: 1 },
  toggleHint: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    width: "90%",
    borderRadius: 16,
    padding: 16,
    elevation: 4,
  },
  locationBtn: {
    backgroundColor: Colors.primary,
    height: 52, // Match FormInput height
    width: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24, // Matches the FormInput marginBottom
  },
});