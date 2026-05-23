import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import dayjs        from 'dayjs';
import Toast        from 'react-native-toast-message';
import { bookingsApi }  from '@api/bookings';
import { reviewsApi }   from '@api/reviews';
import { useAuthStore } from '@store/authStore';
import { Colors }       from '@theme/colors';
import StatusBadge      from '@components/common/StatusBadge';
import Button           from '@components/common/Button';
import type { RootNavProp, RootStackParamList } from '@app-types/navigation.types';

type RoutePropType = RouteProp<RootStackParamList, 'BookingDetail'>;

export default function BookingDetailScreen() {
  const navigation           = useNavigation<RootNavProp>();
  const { params }           = useRoute<RoutePropType>();
  const qc                   = useQueryClient();
  const { role }             = useAuthStore();
  const [reasonModal, setReasonModal] = useState<'reject' | 'cancel' | null>(null);
  const [reason, setReason]           = useState('');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', params.bookingId],
    queryFn:  () => bookingsApi.getById(params.bookingId),
    staleTime: 10_000,
  });

  const { data: reviewExists } = useQuery({
    queryKey: ['reviewExists', params.bookingId],
    queryFn:  () => reviewsApi.checkExists(params.bookingId),
    enabled:  booking?.status === 'COMPLETED' && role === 'CUSTOMER',
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['booking', params.bookingId] });
    qc.invalidateQueries({ queryKey: ['myBookings'] });
  };

  const acceptM   = useMutation({ mutationFn: () => bookingsApi.accept(params.bookingId),   onSuccess: () => { invalidate(); Toast.show({ type: 'success', text1: 'Booking accepted!'  }); }, onError: (e: any) => Toast.show({ type: 'error', text1: e.message }) });
  const startM    = useMutation({ mutationFn: () => bookingsApi.start(params.bookingId),    onSuccess: () => { invalidate(); Toast.show({ type: 'success', text1: 'Service started!'  }); }, onError: (e: any) => Toast.show({ type: 'error', text1: e.message }) });
  const completeM = useMutation({ mutationFn: () => bookingsApi.complete(params.bookingId), onSuccess: () => { invalidate(); Toast.show({ type: 'success', text1: 'Service completed!'}); }, onError: (e: any) => Toast.show({ type: 'error', text1: e.message }) });
  const rejectM   = useMutation({ mutationFn: () => bookingsApi.reject(params.bookingId, reason),  onSuccess: () => { invalidate(); setReasonModal(null); Toast.show({ type: 'success', text1: 'Booking rejected' }); }, onError: (e: any) => Toast.show({ type: 'error', text1: e.message }) });
  const cancelM   = useMutation({ mutationFn: () => bookingsApi.cancel(params.bookingId, reason),  onSuccess: () => { invalidate(); setReasonModal(null); Toast.show({ type: 'success', text1: 'Booking cancelled'}); }, onError: (e: any) => Toast.show({ type: 'error', text1: e.message }) });

  if (isLoading || !booking) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const isProvider = role === 'PROVIDER';
  const isCustomer = role === 'CUSTOMER';
  const status     = booking.status;

  // Role-aware action buttons
  const actions = [];
  if (isProvider) {
    if (status === 'REQUESTED') {
      actions.push(
        <Button key="accept" title="Accept" onPress={() => acceptM.mutate()} loading={acceptM.isPending} style={{ flex: 1 }} />,
        <Button key="reject" title="Reject"  onPress={() => setReasonModal('reject')} variant="outline" style={{ flex: 1 }} />,
      );
    }
    if (status === 'ACCEPTED') {
      actions.push(<Button key="start" title="Start Service" onPress={() => startM.mutate()} loading={startM.isPending} style={{ flex: 1 }} />);
    }
    if (status === 'IN_PROGRESS') {
      actions.push(<Button key="complete" title="Mark Complete" onPress={() => completeM.mutate()} loading={completeM.isPending} style={{ flex: 1 }} />);
    }
  }
  if (isCustomer) {
    if (status === 'REQUESTED') {
      actions.push(<Button key="cancel" title="Cancel Booking" onPress={() => setReasonModal('cancel')} variant="outline" style={{ flex: 1 }} />);
    }
    if ((status === 'COMPLETED' || status === 'REVIEWED') && !reviewExists) {
      actions.push(
        <Button key="review" title="Leave a Review"
          onPress={() => navigation.navigate('ReviewForm', { bookingId: booking.bookingId, providerId: booking.providerId })}
          style={{ flex: 1 }} />
      );
    }
    if (['ACCEPTED', 'IN_PROGRESS'].includes(status)) {
      actions.push(
        <Button key="chat" title="Message Provider" variant="outline"
          onPress={() => navigation.navigate('ChatRoom', {
            bookingId: booking.bookingId,
            participantName: booking.providerName,
            receiverId: booking.providerId,
          })}
          style={{ flex: 1 }} />
      );
    }
  }

  // Timeline
  const timeline = [
    { step: 'REQUESTED',   label: 'Requested',   icon: 'time-outline'             },
    { step: 'ACCEPTED',    label: 'Accepted',     icon: 'checkmark-circle-outline' },
    { step: 'IN_PROGRESS', label: 'In Progress',  icon: 'construct-outline'        },
    { step: 'COMPLETED',   label: 'Completed',    icon: 'trophy-outline'           },
  ];
  const statusOrder = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED'];
  const currentIdx  = statusOrder.indexOf(status);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status banner */}
      <View style={styles.banner}>
        <StatusBadge status={status} />
        <Text style={styles.bannerDate}>
          {booking.scheduledDate ? dayjs(booking.scheduledDate).format('DD MMM YYYY') : ''}{' '}
          {booking.scheduledTime ? `at ${String(booking.scheduledTime).substring(0, 5)}` : ''}
        </Text>
      </View>

      {/* Timeline */}
      {!['CANCELLED', 'REJECTED'].includes(status) && (
        <View style={styles.timeline}>
          {timeline.map((t, i) => {
            const done    = statusOrder.indexOf(t.step) <= currentIdx;
            const current = t.step === status;
            return (
              <React.Fragment key={t.step}>
                <View style={styles.timelineStep}>
                  <View style={[styles.timelineDot, done && styles.timelineDotDone, current && styles.timelineDotCurrent]}>
                    <Ionicons name={t.icon as any} size={14} color={done ? Colors.white : Colors.textMuted} />
                  </View>
                  <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>{t.label}</Text>
                </View>
                {i < timeline.length - 1 && (
                  <View style={[styles.timelineLine, statusOrder.indexOf(timeline[i + 1].step) <= currentIdx && styles.timelineLineDone]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}

      {/* Booking details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        {[
          { icon: 'construct-outline',      label: 'Service',  value: booking.serviceCategory?.replace('_', ' ') },
          { icon: 'calendar-outline',       label: 'Date',     value: booking.scheduledDate ? dayjs(booking.scheduledDate).format('DD MMMM YYYY') : '—' },
          { icon: 'time-outline',           label: 'Time',     value: booking.scheduledTime ? String(booking.scheduledTime).substring(0, 5) : '—' },
          { icon: 'location-outline',       label: 'Address',  value: booking.address },
          ...(booking.notes ? [{ icon: 'document-text-outline', label: 'Notes', value: booking.notes }] : []),
          ...(booking.cancellationReason ? [{ icon: 'close-circle-outline', label: 'Cancelled', value: booking.cancellationReason }] : []),
          ...(booking.rejectionReason    ? [{ icon: 'close-circle-outline', label: 'Rejected',  value: booking.rejectionReason    }] : []),
        ].map(({ icon, label, value }) => (
          <View key={label} style={styles.detailRow}>
            <Ionicons name={icon as any} size={16} color={Colors.textMuted} />
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Provider / Customer info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{isProvider ? 'Customer' : 'Provider'}</Text>
        <View style={styles.personRow}>
          <View style={styles.personAvatar}>
            <Text style={styles.personAvatarText}>
              {(isProvider ? booking.customerName : booking.providerName)?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.personName}>
            {isProvider ? booking.customerName : booking.providerName}
          </Text>
        </View>
      </View>

      {actions.length > 0 && (
        <View style={styles.actionsRow}>{actions}</View>
      )}

      {/* Reason modal */}
      <Modal visible={!!reasonModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {reasonModal === 'reject' ? 'Reason for Rejection' : 'Reason for Cancellation'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Enter reason…"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Back"    variant="outline" onPress={() => setReasonModal(null)} style={{ flex: 1 }} />
              <Button title="Confirm" onPress={() => reasonModal === 'reject' ? rejectM.mutate() : cancelM.mutate()}
                loading={rejectM.isPending || cancelM.isPending} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner:    { backgroundColor: Colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  bannerDate:{ fontSize: 13, color: Colors.textSecondary },
  timeline:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 20, marginTop: 8, marginHorizontal: 16, borderRadius: 14 },
  timelineStep:    { alignItems: 'center', gap: 6 },
  timelineDot:     { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: Colors.accent },
  timelineDotCurrent: { backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.accentLight },
  timelineLabel:   { fontSize: 9, color: Colors.textMuted, textAlign: 'center', width: 60 },
  timelineLabelDone: { color: Colors.accent, fontWeight: '600' },
  timelineLine:    { flex: 1, height: 2, backgroundColor: Colors.border, marginBottom: 18 },
  timelineLineDone:{ backgroundColor: Colors.accent },
  section:      { backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  detailRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  detailLabel:  { fontSize: 13, color: Colors.textMuted, width: 64 },
  detailValue:  { fontSize: 13, color: Colors.text, flex: 1, fontWeight: '500' },
  personRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  personAvatarText: { fontSize: 18, color: Colors.white, fontWeight: '700' },
  personName:   { fontSize: 15, fontWeight: '600', color: Colors.text },
  actionsRow:   { flexDirection: 'row', gap: 10, margin: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 16 },
  modalTitle:   { fontSize: 16, fontWeight: '700', color: Colors.text },
  modalInput:   { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, minHeight: 80, fontSize: 14, color: Colors.text, textAlignVertical: 'top' },
});