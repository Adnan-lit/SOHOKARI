import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { adminApi } from '@api/admin';
import type { ProviderProfileResponse } from '@api/providers';
import { Colors } from '@theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen() {
  const [providers, setProviders] = useState<ProviderProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfileResponse | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPendingVerifications();
      setProviders(data);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : "Failed to fetch verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (providerId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await adminApi.approveVerification(providerId);
      } else {
        await adminApi.rejectVerification(providerId);
      }
      setSelectedProvider(null);
      fetchPending();
      Alert.alert('Success', `Provider ${action}d successfully`);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : `Failed to ${action} provider`);
    }
  };

  const renderItem = ({ item }: { item: ProviderProfileResponse }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedProvider(item)}>
      <Image source={{ uri: item.profilePhoto || 'https://via.placeholder.com/50' }} style={styles.avatar} />
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardEmail}>{item.email}</Text>
        <Text style={styles.cardCategory}>{item.serviceCategory}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={Colors.border} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Verifications</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : providers.length === 0 ? (
        <Text style={styles.emptyText}>No pending verifications.</Text>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(i) => i.providerId}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {selectedProvider && (
        <Modal visible animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Review Provider</Text>
            <TouchableOpacity onPress={() => setSelectedProvider(null)}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.label}>Name: <Text style={styles.value}>{selectedProvider.name}</Text></Text>
            <Text style={styles.label}>Category: <Text style={styles.value}>{selectedProvider.serviceCategory}</Text></Text>
            
            <Text style={styles.docLabel}>National ID (NID)</Text>
            {selectedProvider.nidImage ? (
              <Image source={{ uri: selectedProvider.nidImage }} style={styles.docImage} />
            ) : (
              <Text style={styles.missingText}>Missing</Text>
            )}

            <Text style={styles.docLabel}>Trade License</Text>
            {selectedProvider.tradeLicenseImage ? (
              <Image source={{ uri: selectedProvider.tradeLicenseImage }} style={styles.docImage} />
            ) : (
              <Text style={styles.missingText}>Missing</Text>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleAction(selectedProvider.providerId, 'reject')}>
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleAction(selectedProvider.providerId, 'approve')}>
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  header: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  cardContent: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  cardEmail: { fontSize: 14, color: Colors.textMuted },
  cardCategory: { fontSize: 12, color: Colors.primary, marginTop: 4, fontWeight: '500' },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalBody: { padding: 20 },
  label: { fontSize: 16, color: Colors.textMuted, marginBottom: 8 },
  value: { color: Colors.text, fontWeight: '600' },
  docLabel: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 24, marginBottom: 12 },
  docImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: Colors.background, resizeMode: 'cover' },
  missingText: { color: Colors.error, fontStyle: 'italic' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
  btn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  rejectBtn: { backgroundColor: Colors.error, marginRight: 8 },
  approveBtn: { backgroundColor: Colors.success, marginLeft: 8 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '600' }
});
