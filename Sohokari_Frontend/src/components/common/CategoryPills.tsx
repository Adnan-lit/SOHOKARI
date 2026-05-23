import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons }            from '@expo/vector-icons';
import { Colors }              from '@theme/colors';
import { SERVICE_CATEGORIES, ServiceCategory } from '@constants/config';

interface Props {
  selected:  ServiceCategory | null;
  onSelect:  (cat: ServiceCategory | null) => void;
}

export default function CategoryPills({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {/* All pill */}
      <TouchableOpacity
        style={[styles.pill, !selected && styles.pillActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.pillText, !selected && styles.pillTextActive]}>All</Text>
      </TouchableOpacity>

      {SERVICE_CATEGORIES.map(cat => {
        const active = selected === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(active ? null : cat.key)}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={active ? Colors.white : Colors.primary}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.primary, backgroundColor: Colors.surface,
  },
  pillActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText:       { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  pillTextActive: { color: Colors.white, fontWeight: '600' },
});