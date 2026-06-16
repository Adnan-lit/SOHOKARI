import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '@api/users';
import { useAuthStore } from '@store/authStore';
import { Colors } from '@theme/colors';
import Button from '@components/common/Button';

export default function EditCustomerProfileScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { name: storedName, profilePhoto: storedPhoto, phone: storedPhone, setProfile } = useAuthStore();

  const [name, setName] = useState(storedName || '');
  const [phone, setPhone] = useState(storedPhone || '');
  const [profilePhoto, setProfilePhoto] = useState(storedPhoto || '');

  const updateMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (updatedUser) => {
      // update auth store
      setProfile(updatedUser.name, updatedUser.phone, updatedUser.profilePhoto);
      Toast.show({ type: 'success', text1: 'Profile updated successfully' });
      navigation.goBack();
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    },
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission to access gallery is required!' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setProfilePhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Name is required' });
      return;
    }
    updateMutation.mutate({ name, phone, profilePhoto });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="person" size={40} color={Colors.textMuted} />
              </View>
            )}
            <View style={styles.editIcon}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={updateMutation.isPending}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  imageContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  imagePicker: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  image: { width: 100, height: 100, borderRadius: 50 },
  placeholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  editIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.primary, width: 30, height: 30,
    borderRadius: 15, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
  saveBtn: { marginTop: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
});
