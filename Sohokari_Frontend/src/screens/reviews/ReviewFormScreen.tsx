import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient }        from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast        from 'react-native-toast-message';
import { reviewsApi } from '@api/reviews';
import { Colors }     from '@theme/colors';
import Button         from '@components/common/Button';
import FormInput      from '@components/forms/FormInput';
import type { RootNavProp, RootStackParamList } from '@types/navigation.types';

type RoutePropType = RouteProp<RootStackParamList, 'ReviewForm'>;

const CRITERIA = [
  { key: 'serviceQuality',       label: 'Service Quality'       },
  { key: 'communication',        label: 'Communication'         },
  { key: 'timeliness',           label: 'Timeliness'            },
  { key: 'professionalBehavior', label: 'Professional Behavior' },
  { key: 'overallSatisfaction',  label: 'Overall Satisfaction'  },
] as const;

type CriteriaKey = typeof CRITERIA[number]['key'];

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.starRow}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(s => (
          <TouchableOpacity key={s} onPress={() => onChange(s)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Ionicons
              name={s <= value ? 'star' : 'star-outline'}
              size={28}
              color={s <= value ? Colors.warning : Colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ReviewFormScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { params } = useRoute<RoutePropType>();
  const qc         = useQueryClient();

  const [ratings, setRatings] = useState<Record<CriteriaKey, number>>({
    serviceQuality:       0,
    communication:        0,
    timeliness:           0,
    professionalBehavior: 0,
    overallSatisfaction:  0,
  });
  const [reviewText, setReviewText] = useState('');
  const [errors, setErrors]         = useState<Partial<Record<CriteriaKey, string>>>({});

  const setRating = (key: CriteriaKey) => (val: number) =>
    setRatings(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    const e: Partial<Record<CriteriaKey, string>> = {};
    CRITERIA.forEach(({ key }) => {
      if (!ratings[key]) e[key] = 'Please rate this';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: () => reviewsApi.create({
      bookingId:            params.bookingId,
      ...ratings,
      reviewText:           reviewText.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', params.providerId] });
      qc.invalidateQueries({ queryKey: ['reviewExists', params.bookingId] });
      Toast.show({ type: 'success', text1: 'Review submitted!', text2: 'Thank you for your feedback.' });
      navigation.goBack();
    },
    onError: (err: any) => Toast.show({ type: 'error', text1: 'Failed', text2: err.message }),
  });

  const avg = Object.values(ratings).filter(v => v > 0);
  const avgScore = avg.length ? (avg.reduce((a, b) => a + b, 0) / avg.length).toFixed(1) : '—';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Average preview */}
        <View style={styles.avgBox}>
          <Text style={styles.avgScore}>{avgScore}</Text>
          <View style={styles.avgStars}>
            {[1,2,3,4,5].map(s => (
              <Ionicons key={s} name="star" size={16}
                color={s <= Math.round(Number(avgScore)) ? Colors.warning : Colors.border} />
            ))}
          </View>
          <Text style={styles.avgLabel}>Your overall rating</Text>
        </View>

        <View style={styles.card}>
          {CRITERIA.map(({ key, label }) => (
            <View key={key}>
              <StarRow label={label} value={ratings[key]} onChange={setRating(key)} />
              {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Write a Review <Text style={styles.optional}>(optional)</Text></Text>
          <FormInput
            label=""
            value={reviewText}
            onChangeText={setReviewText}
            iconName="create-outline"
            placeholder="Share your experience with this provider…"
            multiline
            style={{ minHeight: 80 }}
          />
        </View>

        <Button
          title="Submit Review"
          onPress={() => { if (validate()) mutation.mutate(); }}
          loading={mutation.isPending}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: Colors.background, padding: 16, paddingBottom: 40 },

  avgBox:   { alignItems: 'center', paddingVertical: 24, backgroundColor: Colors.primary, borderRadius: 16, marginBottom: 16 },
  avgScore: { fontSize: 56, fontWeight: '700', color: Colors.white, lineHeight: 64 },
  avgStars: { flexDirection: 'row', gap: 4, marginTop: 4 },
  avgLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 },

  card:      { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  optional:  { fontSize: 13, color: Colors.textMuted, fontWeight: '400' },

  starRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  starLabel: { fontSize: 14, color: Colors.text, flex: 1 },
  stars:     { flexDirection: 'row', gap: 4 },
  errorText: { fontSize: 12, color: Colors.error, marginBottom: 6 },

  submitBtn: { marginTop: 8 },
});