import React from 'react';
import type { ComponentProps } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
type IconName = ComponentProps<typeof Ionicons>['name'];
import Toast from 'react-native-toast-message';
import { paymentsApi, PaymentResponse, PaymentMethod } from '@api/payments';
import { Colors } from '@theme/colors';
import Button from '@components/common/Button';
import { useAuthStore } from '@store/authStore';
import type { RootStackParamList, RootNavProp } from '@app-types/navigation.types';

type RoutePropType = RouteProp<RootStackParamList, 'Invoice'>;

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; icon: IconName; color: string }> = {
  CASH:   { label: 'Cash',   icon: 'cash-outline',    color: '#4CAF50' },
  BKASH:  { label: 'bKash',  icon: 'phone-portrait-outline', color: '#E2136E' },
  NAGAD:  { label: 'Nagad',  icon: 'phone-portrait-outline', color: '#F6921E' },
  ROCKET: { label: 'Rocket', icon: 'phone-portrait-outline', color: '#8C1D83' },
};

export default function InvoiceScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { params } = useRoute<RoutePropType>();
  const qc = useQueryClient();
  const { role, userId } = useAuthStore();

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', params.bookingId],
    queryFn: () => paymentsApi.getByBooking(params.bookingId),
  });

  const confirmMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsApi.confirm(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment', params.bookingId] });
      Toast.show({ type: 'success', text1: 'Payment Confirmed ✅' });
    },
    onError: (e: Error) => Toast.show({ type: 'error', text1: 'Error', text2: e.message }),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.center}>
        <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.emptyText}>No payment record found</Text>
        <Text style={styles.emptySubtext}>Payment will appear here after the booking is completed</Text>
      </View>
    );
  }

  const pm = PAYMENT_LABELS[payment.paymentMethod];
  const isProvider = role === 'PROVIDER';
  const isPending = payment.paymentStatus === 'PENDING';
  const isConfirmed = payment.paymentStatus === 'CONFIRMED';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceIcon}>
          <Ionicons name="receipt" size={32} color={Colors.white} />
        </View>
        <Text style={styles.invoiceTitle}>
          {isConfirmed ? 'Invoice' : 'Payment Details'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: isConfirmed ? '#4CAF5020' : '#FF980020' }]}>
          <View style={[styles.statusDot, { backgroundColor: isConfirmed ? '#4CAF50' : '#FF9800' }]} />
          <Text style={[styles.statusText, { color: isConfirmed ? '#4CAF50' : '#FF9800' }]}>
            {payment.paymentStatus}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Total Amount</Text>
        <Text style={styles.amountValue}>৳{payment.amount?.toLocaleString('en-BD') ?? '0'}</Text>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.methodCard}>
          <View style={[styles.methodIcon, { backgroundColor: pm.color + '20' }]}>
            <Ionicons name={pm.icon} size={22} color={pm.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodName}>{pm.label}</Text>
            {payment.paymentMethod !== 'CASH' && payment.providerPaymentNumber && (
              <Text style={styles.methodNumber}>{payment.providerPaymentNumber}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Provider Payment Info for Customer */}
      {!isProvider && isPending && payment.paymentMethod !== 'CASH' && (
        <View style={styles.paymentInstructions}>
          <Ionicons name="information-circle" size={20} color={Colors.accent} />
          <Text style={styles.instructionText}>
            Send ৳{payment.amount?.toLocaleString('en-BD')} to {pm.label} number:{'\n'}
            <Text style={styles.instructionNumber}>{payment.providerPaymentNumber}</Text>
            {'\n'}The provider will confirm once payment is received.
          </Text>
        </View>
      )}

      {!isProvider && isPending && payment.paymentMethod === 'CASH' && (
        <View style={styles.paymentInstructions}>
          <Ionicons name="information-circle" size={20} color={Colors.accent} />
          <Text style={styles.instructionText}>
            Please pay ৳{payment.amount?.toLocaleString('en-BD')} in cash to the provider.{'\n'}
            The provider will confirm once payment is received.
          </Text>
        </View>
      )}

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailsCard}>
          <DetailRow label="Booking ID" value={payment.bookingId?.slice(-8).toUpperCase()} />
          <DetailRow label="Service" value={payment.serviceCategory?.replace('_', ' ') ?? 'N/A'} />
          <DetailRow label="Customer" value={payment.customerName ?? 'N/A'} />
          <DetailRow label="Provider" value={payment.providerName ?? 'N/A'} />
          {payment.address && <DetailRow label="Address" value={payment.address} />}
          {payment.createdAt && (
            <DetailRow label="Created" value={new Date(payment.createdAt).toLocaleDateString('en-BD', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })} />
          )}
          {payment.confirmedAt && (
            <DetailRow label="Confirmed" value={new Date(payment.confirmedAt).toLocaleDateString('en-BD', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })} />
          )}
        </View>
      </View>

      {/* Provider: Confirm Payment button */}
      {isProvider && isPending && (
        <View style={styles.actionSection}>
          <Button
            title="Confirm Payment Received"
            onPress={() => confirmMutation.mutate(payment.paymentId)}
            loading={confirmMutation.isPending}
          />
          <Text style={styles.confirmHint}>
            Only confirm after you have received the full payment
          </Text>
        </View>
      )}

      {/* Confirmed state */}
      {isConfirmed && (
        <View style={styles.confirmedBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.confirmedText}>Payment completed successfully</Text>
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },

  invoiceHeader: { alignItems: 'center', marginBottom: 24 },
  invoiceIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  invoiceTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  amountCard: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 20, elevation: 4,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  amountLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 4 },
  amountValue: { fontSize: 36, fontWeight: '800', color: Colors.white },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  methodCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  methodIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  methodName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  methodNumber: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },

  paymentInstructions: {
    backgroundColor: Colors.accent + '10', borderRadius: 14, padding: 16,
    flexDirection: 'row', marginBottom: 20, borderWidth: 1, borderColor: Colors.accent + '30',
  },
  instructionText: { flex: 1, marginLeft: 10, fontSize: 14, color: Colors.text, lineHeight: 22 },
  instructionNumber: { fontWeight: '800', fontSize: 16, color: Colors.primary },

  detailsCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLabel: { fontSize: 14, color: Colors.textMuted },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.text, maxWidth: '60%', textAlign: 'right' },

  actionSection: { marginTop: 8, marginBottom: 20 },
  confirmHint: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 10 },

  confirmedBanner: {
    backgroundColor: '#4CAF5010', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#4CAF5030', marginTop: 8,
  },
  confirmedText: { fontSize: 15, fontWeight: '600', color: '#4CAF50', marginLeft: 10 },
});
