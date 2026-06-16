import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { providersApi } from '@api/providers';
import { filesApi } from '@api/files';
import { Colors } from '@theme/colors';
import FormInput from '@components/forms/FormInput';
import Button from '@components/common/Button';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image, TouchableOpacity, Text } from 'react-native';
import type { RootStackParamList } from '@app-types/navigation.types';
import type { PaymentMethod } from '@api/payments';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; color: string }[] = [
  { value: 'CASH',   label: 'Cash',   color: '#4CAF50' },
  { value: 'BKASH',  label: 'bKash',  color: '#E2136E' },
  { value: 'NAGAD',  label: 'Nagad',  color: '#F6921E' },
  { value: 'ROCKET', label: 'Rocket', color: '#8C1D83' },
];

export default function EditProviderProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditProviderProfile'>>();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: () => providersApi.getMyProfile(),
  });

  const [form, setForm] = useState({
    bio: '',
    skills: '',
    hourlyRate: '',
    serviceArea: '',
  });

  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMobileNumber, setPaymentMobileNumber] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio || '',
        skills: profile.skills ? profile.skills.join(', ') : '',
        hourlyRate: profile.hourlyRate ? profile.hourlyRate.toString() : '',
        serviceArea: profile.serviceArea || '',
      });
      if (profile.latitude) setLatitude(profile.latitude);
      if (profile.longitude) setLongitude(profile.longitude);
      setProfilePhoto(profile.profilePhoto || null);
      setPortfolio(profile.portfolio || []);
      setAcceptedPaymentMethods((profile as any).acceptedPaymentMethods || []);
      setPaymentMobileNumber((profile as any).paymentMobileNumber || '');
    }
  }, [profile]);

  useEffect(() => {
    // Check if we returned from LocationPicker
    if (route.params?.pickedLocation) {
      setLatitude(route.params.pickedLocation.latitude);
      setLongitude(route.params.pickedLocation.longitude);
      // Clear params to avoid loop
      navigation.setParams({ pickedLocation: undefined });
    }
  }, [route.params?.pickedLocation]);

  const handlePickMap = () => {
    navigation.navigate('LocationPicker', { 
      returnScreen: 'EditProviderProfile',
      currentLat: latitude,
      currentLng: longitude,
    });
  };

  const handleUseGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Location permission is required.' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      Toast.show({ type: 'success', text1: 'Location Updated', text2: 'Location set via GPS' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Location Error', text2: e.message });
    }
  };

  const pickImage = async (type: 'profile' | 'portfolio') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: type === 'profile',
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      try {
        setUploading(true);
        const url = await filesApi.uploadFile(uri);
        if (type === 'profile') {
          setProfilePhoto(url);
        } else {
          setPortfolio(prev => [...prev, url]);
        }
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Upload Failed', text2: err.message });
      } finally {
        setUploading(false);
      }
    }
  };

  const mutation = useMutation({
    mutationFn: () => providersApi.updateProfile({
      bio: form.bio,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      serviceArea: form.serviceArea,
      latitude,
      longitude,
      profilePhoto: profilePhoto || undefined,
      portfolio: portfolio,
      acceptedPaymentMethods: acceptedPaymentMethods,
      paymentMobileNumber: paymentMobileNumber || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myProfile'] });
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been successfully updated.',
      });
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err.message,
      });
    },
  });

  const set = (key: keyof typeof form) => (val: string) => setForm(prev => ({ ...prev, [key]: val }));

  if (isLoading) {
    return <View style={styles.container} />; // Or a loading spinner
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={() => pickImage('profile')} style={styles.avatarWrap} disabled={uploading}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>Pick Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <FormInput
            label="Bio"
            value={form.bio}
            onChangeText={set('bio')}
            iconName="information-circle-outline"
            placeholder="Tell us about yourself..."
            multiline
          />
          <FormInput
            label="Skills (comma separated)"
            value={form.skills}
            onChangeText={set('skills')}
            iconName="build-outline"
            placeholder="e.g. Plumbing, Carpentry"
          />
          <FormInput
            label="Hourly Rate (৳)"
            value={form.hourlyRate}
            onChangeText={set('hourlyRate')}
            iconName="cash-outline"
            placeholder="e.g. 500"
            keyboardType="number-pad"
          />
          <FormInput
            label="Service Area"
            value={form.serviceArea}
            onChangeText={set('serviceArea')}
            iconName="location-outline"
            placeholder="e.g. Dhanmondi, Dhaka"
          />

          <View style={styles.locationSection}>
            <Text style={styles.label}>Precise Location</Text>
            {latitude && longitude ? (
              <Text style={styles.locationText}>Saved: {latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
            ) : (
              <Text style={styles.locationTextMuted}>No exact location set</Text>
            )}
            <View style={styles.locationRow}>
              <TouchableOpacity style={styles.locBtn} onPress={handlePickMap}>
                <Text style={styles.locBtnText}>📍 Pick on Map</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.locBtnAlt} onPress={handleUseGPS}>
                <Text style={styles.locBtnTextAlt}>🛰 Use GPS</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.portfolioSection}>
            <Text style={styles.label}>Portfolio Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll}>
              {portfolio.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.portfolioImage} />
              ))}
              <TouchableOpacity onPress={() => pickImage('portfolio')} style={styles.addPortfolioBtn} disabled={uploading}>
                <Text style={styles.addPortfolioText}>+ Add</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Payment Methods Section */}
          <View style={styles.paymentSection}>
            <Text style={styles.label}>Accepted Payment Methods</Text>
            <View style={styles.paymentChips}>
              {PAYMENT_OPTIONS.map(pm => {
                const selected = acceptedPaymentMethods.includes(pm.value);
                return (
                  <TouchableOpacity
                    key={pm.value}
                    style={[
                      styles.paymentChip,
                      selected && { backgroundColor: pm.color, borderColor: pm.color },
                    ]}
                    onPress={() => {
                      setAcceptedPaymentMethods(prev =>
                        selected ? prev.filter(m => m !== pm.value) : [...prev, pm.value]
                      );
                    }}
                  >
                    <Text style={[
                      styles.paymentChipText,
                      selected && { color: '#fff' },
                    ]}>{pm.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {acceptedPaymentMethods.some(m => m !== 'CASH') && (
              <FormInput
                label="Payment Mobile Number"
                value={paymentMobileNumber}
                onChangeText={setPaymentMobileNumber}
                iconName="call-outline"
                placeholder="e.g. 01712345678"
                keyboardType="phone-pad"
              />
            )}
          </View>

          <Button
            title="Save Changes"
            onPress={() => mutation.mutate()}
            loading={mutation.isPending || uploading}
            style={styles.btn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  btn: {
    marginTop: 16,
  },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EBF0F8', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  portfolioSection: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  portfolioScroll: { flexDirection: 'row' },
  portfolioImage: { width: 80, height: 80, borderRadius: 8, marginRight: 8, backgroundColor: '#EBF0F8' },
  addPortfolioBtn: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#EBF0F8', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  addPortfolioText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  locationSection: { marginBottom: 20 },
  locationText: { fontSize: 13, color: Colors.text, marginBottom: 8 },
  locationTextMuted: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  locationRow: { flexDirection: 'row', gap: 10 },
  locBtn: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  locBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  locBtnAlt: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  locBtnTextAlt: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  paymentSection: { marginBottom: 20 },
  paymentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  paymentChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  paymentChipText: { fontSize: 14, fontWeight: '600', color: Colors.text },
});
