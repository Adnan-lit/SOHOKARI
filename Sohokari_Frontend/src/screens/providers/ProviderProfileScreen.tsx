import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { providersApi } from "@api/providers";
import { reviewsApi } from "@api/reviews";
import { Colors } from "@theme/colors";
import { statusColor } from "@theme/colors";
import Button from "@components/common/Button";
import type {
  RootNavProp,
  RootStackParamList,
} from "@app-types/navigation.types";

type RoutePropType = RouteProp<RootStackParamList, "ProviderProfile">;

export default function ProviderProfileScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { params } = useRoute<RoutePropType>();
  const { providerId } = params;

  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider", providerId],
    queryFn: () => providersApi.getById(providerId),
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", providerId],
    queryFn: () => reviewsApi.getByProvider(providerId),
  });

  const { data: reputation } = useQuery({
    queryKey: ["reputation", providerId],
    queryFn: () => providersApi.getReputation(providerId),
  });

  if (isLoading || !provider) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const rating = provider.rating ?? 0;
  const avgScore = reputation?.averageRating ?? rating;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {provider.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{provider.name}</Text>
        <View style={styles.catBadge}>
          <Text style={styles.catText}>
            {provider.serviceCategory.replace("_", " ")}
          </Text>
        </View>
        <View style={styles.availRow}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: provider.available
                  ? Colors.success
                  : Colors.error,
              },
            ]}
          />
          <Text
            style={[
              styles.availText,
              { color: provider.available ? Colors.success : Colors.error },
            ]}
          >
            {provider.available ? "Available Now" : "Currently Busy"}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>
            {avgScore > 0 ? avgScore.toFixed(1) : "—"}
          </Text>
          <View style={{ flexDirection: "row", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name="star"
                size={12}
                color={
                  s <= Math.round(avgScore) ? Colors.warning : Colors.border
                }
              />
            ))}
          </View>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>
            {reputation?.totalJobs ?? provider.totalReviews ?? 0}
          </Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>
            {provider.hourlyRate ? `৳${provider.hourlyRate}` : "—"}
          </Text>
          <Text style={styles.statLabel}>Per Hour</Text>
        </View>
      </View>

      {/* Book button */}
      {provider.available && (
        <View style={styles.bookWrap}>
          <Button
            title="Book This Provider"
            onPress={() =>
              navigation.navigate("CreateBooking", { providerId: provider._id })
            }
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* About */}
      {provider.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{provider.bio}</Text>
        </View>
      ) : null}

      {/* Skills */}
      {provider.skills && provider.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillRow}>
            {provider.skills.map((s, i) => (
              <View key={i} style={styles.skillChip}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Service area */}
      {provider.serviceArea && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Area</Text>
          <View style={styles.infoRow}>
            <Ionicons name="map-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.infoText}>{provider.serviceArea}</Text>
          </View>
        </View>
      )}

      {/* Reputation breakdown */}
      {reputation?.categoryScores && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reputation Breakdown</Text>
          {Object.entries(reputation.categoryScores).map(([key, val]) => (
            <View key={key} style={styles.repRow}>
              <Text style={styles.repLabel}>
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Text>
              <View style={styles.repBar}>
                <View
                  style={[styles.repFill, { width: `${(val / 5) * 100}%` }]}
                />
              </View>
              <Text style={styles.repVal}>{(val as number).toFixed(1)}</Text>
            </View>
          ))}
          {reputation.badges.length > 0 && (
            <View style={styles.badgeRow}>
              {reputation.badges.map((b, i) => (
                <View key={i} style={styles.badge}>
                  <Text style={styles.badgeText}>🏅 {b}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Reviews */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ReviewList", { providerId: provider._id })
            }
          >
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        {reviews && reviews.length > 0 ? (
          reviews.slice(0, 3).map((review) => (
            <View key={review._id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>
                  {typeof review.customerId === "object"
                    ? review.customerId.name
                    : "Customer"}
                </Text>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name="star"
                      size={12}
                      color={
                        s <= review.overallSatisfaction
                          ? Colors.warning
                          : Colors.border
                      }
                    />
                  ))}
                </View>
              </View>
              {review.reviewText ? (
                <Text style={styles.reviewText}>{review.reviewText}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.noReviews}>No reviews yet</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  hero: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, color: Colors.white, fontWeight: "700" },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 8,
  },
  catBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 10,
  },
  catText: { fontSize: 13, color: Colors.white, fontWeight: "600" },
  availRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 13, fontWeight: "600" },

  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 14,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statVal: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },

  bookWrap: { paddingHorizontal: 16, marginTop: 16, flexDirection: "row" },

  section: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  viewAll: { fontSize: 13, color: Colors.accent, fontWeight: "600" },
  bioText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    backgroundColor: "#EBF0F8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillText: { fontSize: 13, color: Colors.primaryLight, fontWeight: "500" },

  repRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  repLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 110,
    textTransform: "capitalize",
  },
  repBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  repFill: { height: "100%", backgroundColor: Colors.accent, borderRadius: 3 },
  repVal: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
    width: 28,
    textAlign: "right",
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  badge: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 12, color: Colors.warning, fontWeight: "600" },

  reviewCard: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewAuthor: { fontSize: 13, fontWeight: "600", color: Colors.text },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  noReviews: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },
});
