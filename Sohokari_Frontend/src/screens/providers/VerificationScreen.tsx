import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { providersApi } from '@api/providers';
import client from '@api/client';
import { Colors } from '@theme/colors';

export default function VerificationScreen() {
  const navigation = useNavigation();
  const [nidImage, setNidImage] = useState<string | null>(null);
  const [tradeLicenseImage, setTradeLicenseImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (setImage: (uri: string) => void) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadFile = async (uri: string): Promise<string> => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\\.(\\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    // React Native requires this cast for FormData file append
    formData.append('file', { uri, name: filename, type } as unknown as Blob);

    const { data } = await client.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.url;
  };

  const submitVerification = async () => {
    if (!nidImage) {
      Alert.alert('Error', 'Please upload your NID image');
      return;
    }
    setUploading(true);
    try {
      const nidUrl = await uploadFile(nidImage);
      let tradeLicenseUrl = '';
      if (tradeLicenseImage) {
        tradeLicenseUrl = await uploadFile(tradeLicenseImage);
      }

      await providersApi.submitVerification({
        nidImage: nidUrl,
        tradeLicenseImage: tradeLicenseUrl,
      });

      Alert.alert('Success', 'Verification submitted! An admin will review it shortly.');
      navigation.goBack();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to submit verification';
      Alert.alert('Error', message);
    } finally {
      setUploading(false);
    }
  };

  const renderImagePicker = (title: string, image: string | null, setImage: (uri: string) => void) => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerTitle}>{title}</Text>
      <TouchableOpacity style={styles.imageBox} onPress={() => pickImage(setImage)}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.placeholderText}>Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Identity Verification</Text>
      <Text style={styles.subtitle}>Upload your documents to get verified and start receiving jobs.</Text>
      
      {renderImagePicker('National ID (Front)', nidImage, setNidImage)}
      {renderImagePicker('Trade License (Optional)', tradeLicenseImage, setTradeLicenseImage)}

      <TouchableOpacity style={styles.submitBtn} onPress={submitVerification} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.submitBtnText}>Submit for Review</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  header: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 24 },
  pickerContainer: { marginBottom: 24 },
  pickerTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  imageBox: { height: 150, backgroundColor: Colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { marginTop: 8, color: Colors.textMuted, fontSize: 14 },
  submitBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
