import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@theme/colors";
import type { Provider } from "@app-types/models";

interface Props {
  provider: Provider;
  onPress: () => void;
  compact?: boolean;
}

export default function ProviderCard({ provider, onPress, compact }: Props) {
  const rating = provider.rating ?? 0;
  const distance =
    provider.distance != null
      ? provider.distance < 1
        ? `${(provider.distance * 1000).toFixed(0)} m`
        : `${provider.distance.toFixed(1)} km`
      : null;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compact}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={styles.compactAvatar}>
          <Text style={styles.avatarText}>
            {provider.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.compactName} numberOfLines={1}>
            {provider.name}
          </Text>
          <Text style={styles.compactCat}>{provider.serviceCategory}</Text>
        </View>
        <View style={styles.compactRight}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: provider.available
                  ? Colors.success
                  : Colors.textMuted,
              },
            ]}
          />
          {rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color={Colors.warning} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {provider.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name} numberOfLines={1}>
            {provider.name}
          </Text>
          <View style={styles.catRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catText}>
                {provider.serviceCategory.replace("_", " ")}
              </Text>
            </View>
            <View
              style={[
                styles.availBadge,
                { backgroundColor: provider.available ? "#E1F5EE" : "#F3F4F6" },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: provider.available
                      ? Colors.success
                      : Colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.availText,
                  {
                    color: provider.available
                      ? Colors.success
                      : Colors.textMuted,
                  },
                ]}
              >
                {provider.available ? "Available" : "Busy"}
              </Text>
            </View>
          </View>
        </View>
        {provider.hourlyRate != null && (
          <View style={styles.priceBox}>
            <Text style={styles.priceAmount}>৳{provider.hourlyRate}</Text>
            <Text style={styles.priceUnit}>/hr</Text>
          </View>
        )}
      </View>

      {/* Bio */}
      {provider.bio ? (
        <Text style={styles.bio} numberOfLines={2}>
          {provider.bio}
        </Text>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        {rating > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={Colors.warning} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            {provider.totalReviews != null && (
              <Text style={styles.reviewCount}> ({provider.totalReviews})</Text>
            )}
          </View>
        )}
        {distance && (
          <View style={styles.distRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color={Colors.textMuted}
            />
            <Text style={styles.distText}>{distance} away</Text>
          </View>
        )}
        {provider.serviceArea ? (
          <View style={styles.distRow}>
            <Ionicons name="map-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.distText} numberOfLines={1}>
              {provider.serviceArea}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  header: { flexDirection: "row", alignItems: "flex-start" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, color: Colors.white, fontWeight: "700" },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },
  catRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  catBadge: {
    backgroundColor: "#EBF0F8",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  catText: { fontSize: 11, color: Colors.primaryLight, fontWeight: "600" },
  availBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  availText: { fontSize: 11, fontWeight: "600" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  priceBox: { alignItems: "flex-end", marginLeft: 8 },
  priceAmount: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  priceUnit: { fontSize: 11, color: Colors.textMuted },
  bio: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
  footer: { flexDirection: "row", gap: 12, marginTop: 10, flexWrap: "wrap" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13, color: Colors.text, fontWeight: "600" },
  reviewCount: { fontSize: 12, color: Colors.textMuted },
  distRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  distText: { fontSize: 12, color: Colors.textMuted },

  // compact
  compact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  compactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  compactName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  compactCat: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  compactRight: { alignItems: "flex-end", gap: 4 },
});
