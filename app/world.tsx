import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useProgress } from "@/lib/progress-context";
import { getNextWorldZone, getWorldZones, WorldZone } from "@/lib/linux-data";

function ZoneCard({
  zone,
  onPress,
}: {
  zone: WorldZone;
  onPress: () => void;
}) {
  const isLocked = zone.state === "locked";
  const isMastered = zone.state === "mastered";

  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      style={({ pressed }) => [styles.zoneCard, pressed && !isLocked && styles.pressed, isLocked && styles.zoneCardLocked]}
    >
      <LinearGradient
        colors={[
          isLocked ? Colors.surface : zone.accent + "16",
          Colors.surface,
        ]}
        style={styles.zoneGradient}
      >
        <View style={styles.zoneTop}>
          <View
            style={[
              styles.zoneIconWrap,
              {
                borderColor: isLocked ? Colors.border : zone.accent + "70",
                backgroundColor: isLocked ? Colors.background : zone.accent + "14",
              },
            ]}
          >
            <Ionicons
              name={(isLocked ? "lock-closed" : zone.icon) as any}
              size={20}
              color={isLocked ? Colors.textMuted : zone.accent}
            />
          </View>
          <View style={styles.zoneCopy}>
            <Text style={styles.zoneEyebrow}>{zone.trackName}</Text>
            <Text style={styles.zoneTitle}>{zone.zoneName}</Text>
            <Text style={styles.zoneTagline}>{zone.tagline}</Text>
          </View>
          <View
            style={[
              styles.zoneStateBadge,
              isLocked
                ? styles.zoneStateLocked
                : isMastered
                ? styles.zoneStateMastered
                : styles.zoneStateOpen,
            ]}
          >
            <Text
              style={[
                styles.zoneStateText,
                isLocked
                  ? styles.zoneStateTextLocked
                  : isMastered
                  ? styles.zoneStateTextMastered
                  : styles.zoneStateTextOpen,
              ]}
            >
              {isLocked ? "Sealed" : isMastered ? "Cleared" : "Open"}
            </Text>
          </View>
        </View>

        <Text style={styles.zoneAtmosphere}>{zone.atmosphere}</Text>

        <View style={styles.zoneProgressTop}>
          <Text style={styles.zoneProgressLabel}>Zone progress</Text>
          <Text style={styles.zoneProgressValue}>
            {zone.progress.completed}/{zone.progress.total}
          </Text>
        </View>
        <View style={styles.zoneProgressBg}>
          <View
            style={[
              styles.zoneProgressFill,
              {
                width: `${zone.progress.total > 0 ? zone.progress.pct * 100 : 0}%`,
                backgroundColor: isLocked ? Colors.textMuted : isMastered ? Colors.success : zone.accent,
              },
            ]}
          />
        </View>

        <Text style={styles.zoneNextText}>
          {isLocked
            ? zone.unlockRequirement
            : zone.recommendedLesson
            ? `Next lesson: ${zone.recommendedLesson.title}`
            : zone.recommendedChallenge
            ? `Next raid: ${zone.recommendedChallenge.title}`
            : "This zone is fully cleared."}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function WorldScreen() {
  const insets = useSafeAreaInsets();
  const { completedLessons, completedChallenges, masteredTracks } = useProgress();
  const [activeZone, setActiveZone] = useState<WorldZone | null>(null);

  const zones = useMemo(
    () => getWorldZones(completedLessons, completedChallenges),
    [completedLessons, completedChallenges],
  );
  const nextZone = useMemo(
    () => getNextWorldZone(completedLessons, completedChallenges),
    [completedLessons, completedChallenges],
  );
  const unlockedZones = zones.filter((zone) => zone.state !== "locked").length;
  const masteredZones = zones.filter((zone) => zone.state === "mastered").length;
  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTop + 8,
          paddingBottom: Platform.OS === "web" ? 36 : insets.bottom + 30,
        }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>World Map</Text>
            <Text style={styles.headerSubtitle}>Move through zones as your hunter path expands.</Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(350)} style={styles.heroCard}>
          <LinearGradient colors={[Colors.primary + "24", Colors.surface]} style={styles.heroGradient}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroEyebrow}>Current Focus</Text>
                <Text style={styles.heroTitle}>{nextZone?.zoneName ?? "World Clear"}</Text>
                <Text style={styles.heroText}>
                  {nextZone?.state === "locked"
                    ? nextZone.unlockRequirement
                    : nextZone?.recommendedLesson
                    ? `Advance with ${nextZone.recommendedLesson.title}, then return for the zone boss check.`
                    : nextZone?.recommendedChallenge
                    ? `The next pressure point here is ${nextZone.recommendedChallenge.title}.`
                    : "Every visible zone is already cleared."}
                </Text>
              </View>
              <View style={styles.heroCompass}>
                <Ionicons name="map" size={24} color={Colors.primary} />
              </View>
            </View>

            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{unlockedZones}</Text>
                <Text style={styles.heroStatLabel}>Zones Open</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{masteredZones}</Text>
                <Text style={styles.heroStatLabel}>Zones Cleared</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{masteredTracks.length}</Text>
                <Text style={styles.heroStatLabel}>Masteries</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Ionicons name="navigate" size={18} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Zones</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Open zones let you move freely. Sealed zones unlock as earlier areas are fully cleared.
        </Text>

        {zones.map((zone, index) => (
          <Animated.View key={zone.trackName} entering={FadeInDown.duration(320).delay(index * 45)}>
            <ZoneCard zone={zone} onPress={() => setActiveZone(zone)} />
          </Animated.View>
        ))}
      </ScrollView>

      <Modal visible={!!activeZone} transparent animationType="fade" onRequestClose={() => setActiveZone(null)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(260)} style={styles.modalCard}>
            <LinearGradient
              colors={[((activeZone?.accent ?? Colors.primary) + "24") as const, Colors.surface]}
              style={styles.modalGradient}
            >
              <View style={styles.modalTop}>
                <View
                  style={[
                    styles.modalIconWrap,
                    {
                      borderColor: (activeZone?.accent ?? Colors.primary) + "60",
                      backgroundColor: (activeZone?.accent ?? Colors.primary) + "14",
                    },
                  ]}
                >
                  <Ionicons name={(activeZone?.icon ?? "map") as any} size={26} color={activeZone?.accent ?? Colors.primary} />
                </View>
                <View style={styles.modalCopy}>
                  <Text style={styles.modalEyebrow}>{activeZone?.trackName}</Text>
                  <Text style={styles.modalTitle}>{activeZone?.zoneName}</Text>
                  <Text style={styles.modalTagline}>{activeZone?.tagline}</Text>
                </View>
              </View>

              <Text style={styles.modalBody}>{activeZone?.atmosphere}</Text>

              <View style={styles.modalProgressTop}>
                <Text style={styles.modalProgressLabel}>Zone completion</Text>
                <Text style={styles.modalProgressValue}>
                  {activeZone?.progress.completed ?? 0}/{activeZone?.progress.total ?? 0}
                </Text>
              </View>
              <View style={styles.modalProgressBg}>
                <View
                  style={[
                    styles.modalProgressFill,
                    {
                      width: `${activeZone?.progress.total ? activeZone.progress.pct * 100 : 0}%`,
                      backgroundColor:
                        activeZone?.state === "mastered"
                          ? Colors.success
                          : activeZone?.accent ?? Colors.primary,
                    },
                  ]}
                />
              </View>

              {activeZone?.recommendedLesson ? (
                <View style={styles.modalHintCard}>
                  <Text style={styles.modalHintEyebrow}>Next Lesson</Text>
                  <Text style={styles.modalHintTitle}>{activeZone.recommendedLesson.title}</Text>
                  <Text style={styles.modalHintText}>{activeZone.recommendedLesson.description}</Text>
                </View>
              ) : null}

              {activeZone?.recommendedChallenge ? (
                <View style={styles.modalHintCard}>
                  <Text style={styles.modalHintEyebrow}>Next Raid</Text>
                  <Text style={styles.modalHintTitle}>{activeZone.recommendedChallenge.title}</Text>
                  <Text style={styles.modalHintText}>{activeZone.recommendedChallenge.description}</Text>
                </View>
              ) : null}

              <View style={styles.modalActionRow}>
                <Pressable style={styles.secondaryButton} onPress={() => setActiveZone(null)}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </Pressable>
                {activeZone?.recommendedLesson ? (
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      const lessonId = activeZone.recommendedLesson?.id;
                      setActiveZone(null);
                      if (lessonId) router.push(`/lesson/${lessonId}`);
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Resume Lesson</Text>
                  </Pressable>
                ) : activeZone?.recommendedChallenge ? (
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      setActiveZone(null);
                      router.push("/challenges");
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Open Raids</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      setActiveZone(null);
                      router.push("/dungeons");
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Explore Dungeons</Text>
                  </Pressable>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pressed: { opacity: 0.88 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
  },
  headerCopy: { flex: 1 },
  headerTitle: { color: Colors.text, fontSize: 26, fontWeight: "800" },
  headerSubtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.primary + "28",
  },
  heroGradient: { padding: 18 },
  heroTop: { flexDirection: "row", alignItems: "flex-start" },
  heroEyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: { color: Colors.text, fontSize: 22, fontWeight: "800", marginTop: 6 },
  heroText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: "88%" },
  heroCompass: {
    marginLeft: "auto",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary + "28",
  },
  heroStats: {
    flexDirection: "row",
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatValue: { color: Colors.text, fontSize: 20, fontWeight: "800" },
  heroStatLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  heroStatDivider: { width: 1, backgroundColor: Colors.border },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  zoneCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneCardLocked: { opacity: 0.75 },
  zoneGradient: { padding: 16 },
  zoneTop: { flexDirection: "row", alignItems: "flex-start" },
  zoneIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 12,
  },
  zoneCopy: { flex: 1 },
  zoneEyebrow: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  zoneTitle: { color: Colors.text, fontSize: 19, fontWeight: "800", marginTop: 4 },
  zoneTagline: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  zoneStateBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  zoneStateLocked: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  zoneStateOpen: {
    backgroundColor: Colors.primary + "12",
    borderColor: Colors.primary + "34",
  },
  zoneStateMastered: {
    backgroundColor: Colors.success + "12",
    borderColor: Colors.success + "34",
  },
  zoneStateText: { fontSize: 11, fontWeight: "800" },
  zoneStateTextLocked: { color: Colors.textMuted },
  zoneStateTextOpen: { color: Colors.primary },
  zoneStateTextMastered: { color: Colors.success },
  zoneAtmosphere: { color: Colors.text, fontSize: 13, lineHeight: 20, marginTop: 12 },
  zoneProgressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  zoneProgressLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  zoneProgressValue: { color: Colors.textMuted, fontSize: 12, fontWeight: "700" },
  zoneProgressBg: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  zoneProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  zoneNextText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalGradient: { padding: 22 },
  modalTop: { flexDirection: "row", alignItems: "center" },
  modalIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 14,
  },
  modalCopy: { flex: 1 },
  modalEyebrow: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modalTitle: { color: Colors.text, fontSize: 24, fontWeight: "800", marginTop: 4 },
  modalTagline: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  modalBody: { color: Colors.text, fontSize: 14, lineHeight: 22, marginTop: 16 },
  modalProgressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
  },
  modalProgressLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  modalProgressValue: { color: Colors.textMuted, fontSize: 12, fontWeight: "700" },
  modalProgressBg: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  modalProgressFill: { height: "100%", borderRadius: 999 },
  modalHintCard: {
    marginTop: 14,
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHintEyebrow: {
    color: Colors.primary,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modalHintTitle: { color: Colors.text, fontSize: 15, fontWeight: "700", marginTop: 6 },
  modalHintText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: { color: Colors.text, fontSize: 14, fontWeight: "700" },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: Colors.background, fontSize: 14, fontWeight: "800" },
});
