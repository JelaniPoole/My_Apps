import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useProgress } from "@/lib/progress-context";
import { orderedLessons, Lesson, getNextWorldZone, getWorldZones, WorldZone } from "@/lib/linux-data";
import TerminalView from "@/components/TerminalView";

const diffColors: Record<string, string> = {
  E: Colors.rankE,
  D: Colors.rankD,
  C: Colors.rankC,
  B: Colors.rankB,
  A: Colors.rankA,
};

function DungeonCard({
  lesson,
  cleared,
  onEnter,
}: {
  lesson: Lesson;
  cleared: boolean;
  onEnter: () => void;
}) {
  return (
    <Pressable onPress={onEnter} style={({ pressed }) => [styles.dungeonCard, pressed && styles.pressed]}>
      <LinearGradient
        colors={[cleared ? Colors.success + "15" : diffColors[lesson.difficulty] + "15", Colors.surface]}
        style={styles.dungeonGradient}
      >
        <View style={styles.dungeonTop}>
          <View style={[styles.dungeonIconWrap, { borderColor: cleared ? Colors.success + "60" : diffColors[lesson.difficulty] + "60" }]}>
            <Ionicons
              name={cleared ? "checkmark-circle" : (lesson.icon as any)}
              size={24}
              color={cleared ? Colors.success : diffColors[lesson.difficulty]}
            />
          </View>
          <View style={styles.dungeonInfo}>
            <Text style={styles.dungeonName}>{lesson.dungeonName}</Text>
            <Text style={styles.dungeonTitle}>{lesson.title}</Text>
          </View>
          <View style={[styles.diffBadge, { backgroundColor: diffColors[lesson.difficulty] + "20" }]}>
            <Text style={[styles.diffText, { color: diffColors[lesson.difficulty] }]}>{lesson.difficulty}</Text>
          </View>
        </View>
        <Text style={styles.dungeonDesc}>{lesson.description}</Text>
        <View style={styles.dungeonFooter}>
          <View style={styles.rewardRow}>
            <Ionicons name="star" size={12} color={Colors.xpGold} />
            <Text style={styles.rewardText}>{lesson.xpReward} XP</Text>
          </View>
          <View style={styles.rewardRow}>
            <Text style={[styles.rewardText, { color: Colors["stat" + lesson.statReward.type as keyof typeof Colors] as string }]}>
              +{lesson.statReward.amount} {lesson.statReward.type}
            </Text>
          </View>
          <View style={styles.stepCount}>
            <Ionicons name="layers" size={12} color={Colors.textMuted} />
            <Text style={styles.stepText}>{lesson.steps.length} floors</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function ZoneCard({
  zone,
  onPress,
}: {
  zone: WorldZone;
  onPress: () => void;
}) {
  const isLocked = zone.state === "locked";
  const isMastered = zone.state === "mastered";
  const gateLabel =
    zone.gateState === "sealed"
      ? "Sealed"
      : zone.gateState === "unstable"
      ? "Unstable"
      : zone.gateState === "cleared"
      ? "Cleared"
      : "Open";

  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      style={({ pressed }) => [styles.zoneCard, pressed && !isLocked && styles.pressed, isLocked && styles.zoneCardLocked]}
    >
      <LinearGradient colors={[isLocked ? Colors.surface : zone.accent + "16", Colors.surface]} style={styles.zoneGradient}>
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
              isLocked ? styles.zoneStateLocked : isMastered ? styles.zoneStateMastered : styles.zoneStateOpen,
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
              {gateLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.zoneAtmosphere}>{zone.atmosphere}</Text>

        <View style={styles.zonePressureRow}>
          <View style={styles.zonePressurePill}>
            <Text style={styles.zonePressureText}>Danger {zone.dangerRating}</Text>
          </View>
          <View style={styles.zonePressurePill}>
            <Text style={[styles.zonePressureText, { color: zone.accent }]}>Power {zone.recommendedPower}</Text>
          </View>
          {zone.eliteZone ? (
            <View style={[styles.zonePressurePill, styles.zoneElitePill]}>
              <Text style={[styles.zonePressureText, { color: Colors.xpGold }]}>Elite Gate</Text>
            </View>
          ) : null}
        </View>

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

export default function Dungeons() {
  const insets = useSafeAreaInsets();
  const { completedLessons, completedChallenges, masteredTracks, completeLesson, addXp, addStat, activeTheme } = useProgress();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewMode, setViewMode] = useState<"journey" | "library">("journey");
  const [listMode, setListMode] = useState<"active" | "completed">("active");
  const [activeZone, setActiveZone] = useState<WorldZone | null>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function handleCommand(cmd: string, helpers: { runDefaultCommand: (cmd: string) => { output: string; type: "output" | "error" | "success" } }) {
    if (!activeLesson) return { output: "", type: "output" as const };
    const step = activeLesson.steps[currentStep];
    if (!step) return { output: "", type: "output" as const };

    const trimmed = cmd.trim().toLowerCase();
    const acceptedCommands = (step.acceptedCommands ?? [step.expectedCommand]).map((command) =>
      command.trim().replace(/\s+/g, " ").toLowerCase()
    );

    if (acceptedCommands.includes(trimmed.replace(/\s+/g, " "))) {
      const defaultResult = helpers.runDefaultCommand(cmd);
      if (currentStep < activeLesson.steps.length - 1) {
        setTimeout(() => setCurrentStep((s) => s + 1), 500);
      } else {
        if (!completedLessons.includes(activeLesson.id)) {
          addXp(activeLesson.xpReward);
          addStat(activeLesson.statReward.type, activeLesson.statReward.amount);
          completeLesson(activeLesson.id);
        }
        setTimeout(() => setShowComplete(true), 500);
      }
      return {
        output: step.output || defaultResult.output,
        type: step.output ? "output" as const : defaultResult.type,
        extraLines: [
          {
            id: "",
            text: step.successMessage,
            type: "success" as const,
          },
        ],
      };
    }
    return {
      output: `Command not recognized. ${step.hint}`,
      type: "error" as const,
    };
  }

  function closeDungeon() {
    setActiveLesson(null);
    setCurrentStep(0);
    setShowComplete(false);
  }

  const webTop = Platform.OS === "web" ? 67 : 0;
  const activeLessons = orderedLessons.filter((lesson) => !completedLessons.includes(lesson.id));
  const clearedLessons = orderedLessons.filter((lesson) => completedLessons.includes(lesson.id));
  const visibleLessons = listMode === "active" ? activeLessons : clearedLessons;
  const focusLesson = activeLessons[0] ?? null;
  const zones = useMemo(
    () => getWorldZones(completedLessons, completedChallenges),
    [completedLessons, completedChallenges]
  );
  const nextZone = useMemo(
    () => getNextWorldZone(completedLessons, completedChallenges),
    [completedLessons, completedChallenges]
  );
  const unlockedZones = zones.filter((zone) => zone.state !== "locked").length;
  const masteredZones = zones.filter((zone) => zone.state === "mastered").length;

  function startLesson(lesson: Lesson) {
    setActiveZone(null);
    setActiveLesson(lesson);
    setCurrentStep(0);
    setShowComplete(false);
  }

  if (activeLesson) {
    const step = activeLesson.steps[currentStep];
    return (
      <View style={styles.container}>
        <View style={[styles.dungeonHeader, { paddingTop: insets.top + webTop + 8 }]}>
          <Pressable onPress={closeDungeon} hitSlop={16}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <View style={styles.dungeonHeaderCenter}>
            <Text style={styles.dungeonHeaderTitle}>{activeLesson.dungeonName}</Text>
            <Text style={styles.floorText}>
              Floor {currentStep + 1}/{activeLesson.steps.length}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAwareScrollViewCompat
          style={styles.activeBodyScroll}
          contentContainerStyle={[
            styles.activeBodyContent,
            {
              paddingBottom:
                Platform.OS === "web" ? 20 : isKeyboardVisible ? 0 : insets.bottom + 88,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bottomOffset={0}
          extraKeyboardSpace={0}
        >
          <View style={styles.floorProgress}>
            {activeLesson.steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.floorDot,
                  i < currentStep
                    ? styles.floorCleared
                    : i === currentStep
                    ? styles.floorCurrent
                    : styles.floorLocked,
                ]}
              />
            ))}
          </View>

          <View style={styles.lessonPanel}>
            <View style={styles.instructionCard}>
              <View style={styles.lessonMetaRow}>
                <View style={styles.lessonChip}>
                  <Text style={styles.lessonChipLabel}>Concept</Text>
                  <Text style={styles.lessonChipValue}>{step?.concept}</Text>
                </View>
                <View style={styles.lessonChip}>
                  <Text style={styles.lessonChipLabel}>Track</Text>
                  <Text style={styles.lessonChipValue}>{activeLesson.category}</Text>
                </View>
              </View>
              <View style={styles.instructionHeader}>
                <Ionicons name="alert-circle" size={18} color={Colors.accent} />
                <Text style={styles.instructionText}>{step?.instruction}</Text>
              </View>
              <Text style={styles.explanationText}>{step?.explanation}</Text>
              {step?.example ? (
                <View style={styles.exampleBox}>
                  <Text style={styles.exampleLabel}>Example</Text>
                  <Text style={styles.exampleText}>{step.example}</Text>
                </View>
              ) : null}
              {step?.whyItWorks ? (
                <View style={styles.whyBox}>
                  <Text style={styles.whyLabel}>Why it works</Text>
                  <Text style={styles.whyText}>{step.whyItWorks}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.terminalWrap}>
              <TerminalView
                commandHandler={handleCommand}
                autoFocus={false}
                initialCwd={activeLesson.terminalSeed?.cwd}
                initialDirectories={activeLesson.terminalSeed?.directories}
                initialFiles={activeLesson.terminalSeed?.files}
                minHeight={280}
                themeId={activeTheme}
              />
            </View>
          </View>
        </KeyboardAwareScrollViewCompat>

        <Modal visible={showComplete} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.completeCard}>
              <LinearGradient colors={[Colors.primary + "30", Colors.surface]} style={styles.completeGradient}>
                <Ionicons name="trophy" size={48} color={Colors.xpGold} />
                <Text style={styles.completeTitle}>DUNGEON CLEARED</Text>
                <Text style={styles.completeName}>{activeLesson.dungeonName}</Text>

                <View style={styles.rewardsSection}>
                  <View style={styles.rewardItem}>
                    <Ionicons name="star" size={20} color={Colors.xpGold} />
                    <Text style={styles.rewardAmount}>+{activeLesson.xpReward} XP</Text>
                  </View>
                  <View style={styles.rewardItem}>
                    <Ionicons name="trending-up" size={20} color={Colors["stat" + activeLesson.statReward.type as keyof typeof Colors] as string} />
                    <Text style={[styles.rewardAmount, { color: Colors["stat" + activeLesson.statReward.type as keyof typeof Colors] as string }]}>
                      +{activeLesson.statReward.amount} {activeLesson.statReward.type}
                    </Text>
                  </View>
                </View>

                <Pressable style={styles.closeBtn} onPress={closeDungeon}>
                  <Text style={styles.closeBtnText}>Continue</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90, paddingTop: insets.top + webTop }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Ionicons name="map" size={22} color={Colors.primary} />
          <Text style={styles.pageTitle}>World</Text>
        </View>
        <Text style={styles.pageSubtitle}>Follow the guided path through each zone, or open the full lesson library whenever you want.</Text>

        <View style={styles.topModeWrap}>
          <Pressable
            onPress={() => setViewMode("journey")}
            style={[styles.topModeButton, viewMode === "journey" && styles.topModeButtonActive]}
          >
            <Ionicons name="compass" size={14} color={viewMode === "journey" ? Colors.text : Colors.textSecondary} />
            <Text style={[styles.topModeText, viewMode === "journey" && styles.topModeTextActive]}>Journey</Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode("library")}
            style={[styles.topModeButton, viewMode === "library" && styles.topModeButtonActive]}
          >
            <Ionicons name="albums" size={14} color={viewMode === "library" ? Colors.text : Colors.textSecondary} />
            <Text style={[styles.topModeText, viewMode === "library" && styles.topModeTextActive]}>Library</Text>
          </Pressable>
        </View>

        {viewMode === "journey" ? (
          <>
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
          </>
        ) : (
          <>
        {listMode === "active" && focusLesson ? (
          <Pressable
            onPress={() => {
              startLesson(focusLesson);
            }}
            style={({ pressed }) => [styles.focusCard, pressed && styles.pressed]}
          >
            <View style={styles.focusHeader}>
              <Text style={styles.focusEyebrow}>Focus Next</Text>
              <Text style={[styles.focusRank, { color: diffColors[focusLesson.difficulty] }]}>
                Rank {focusLesson.difficulty}
              </Text>
            </View>
            <Text style={styles.focusTitle}>{focusLesson.title}</Text>
            <Text style={styles.focusText}>
              Best next lesson in the path. It builds your {focusLesson.statReward.type} track through {focusLesson.category.toLowerCase()}.
            </Text>
            <Text style={styles.focusAction}>Enter {focusLesson.dungeonName}</Text>
          </Pressable>
        ) : null}

        <View style={styles.segmentWrap}>
          <Pressable
            onPress={() => setListMode("active")}
            style={[
              styles.segmentButton,
              listMode === "active" && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                listMode === "active" && styles.segmentTextActive,
              ]}
            >
              Continue
            </Text>
            <Text
              style={[
                styles.segmentCount,
                listMode === "active" && styles.segmentCountActive,
              ]}
            >
              {activeLessons.length}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setListMode("completed")}
            style={[
              styles.segmentButton,
              listMode === "completed" && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                listMode === "completed" && styles.segmentTextActive,
              ]}
            >
              Completed
            </Text>
            <Text
              style={[
                styles.segmentCount,
                listMode === "completed" && styles.segmentCountActive,
              ]}
            >
              {clearedLessons.length}
            </Text>
          </Pressable>
        </View>

        {listMode === "active" ? (
          <Text style={styles.sectionHint}>Unfinished lessons stay here in learning order.</Text>
        ) : (
          <Text style={styles.sectionHint}>Cleared lessons live here so the main path stays clean.</Text>
        )}

        {visibleLessons.length ? (
          visibleLessons.map((lesson, idx) => (
            <Animated.View key={lesson.id} entering={FadeInDown.duration(400).delay(idx * 80)}>
              <DungeonCard
                lesson={lesson}
                cleared={completedLessons.includes(lesson.id)}
                onEnter={() => startLesson(lesson)}
              />
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name={listMode === "active" ? "sparkles" : "checkmark-done-circle"}
              size={26}
              color={listMode === "active" ? Colors.accent : Colors.success}
            />
            <Text style={styles.emptyTitle}>
              {listMode === "active" ? "All current lessons cleared" : "No completed lessons yet"}
            </Text>
            <Text style={styles.emptyText}>
              {listMode === "active"
                ? "Switch to Completed to replay a cleared dungeon, or add new lesson packs next."
                : "Clear a dungeon and it will move here automatically."}
            </Text>
          </View>
        )}
          </>
        )}
      </ScrollView>

      <Modal visible={!!activeZone} transparent animationType="fade" onRequestClose={() => setActiveZone(null)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(260)} style={styles.modalCard}>
            <LinearGradient colors={[(activeZone?.accent ?? Colors.primary) + "24", Colors.surface]} style={styles.modalGradient}>
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

              <View style={styles.modalPressureRow}>
                <View style={styles.modalPressurePill}>
                  <Text style={styles.modalPressureText}>Danger {activeZone?.dangerRating ?? "Low"}</Text>
                </View>
                <View style={styles.modalPressurePill}>
                  <Text style={[styles.modalPressureText, { color: activeZone?.accent ?? Colors.primary }]}>
                    Recommended Power {activeZone?.recommendedPower ?? 0}
                  </Text>
                </View>
                {activeZone?.eliteZone ? (
                  <View style={[styles.modalPressurePill, styles.modalElitePill]}>
                    <Text style={[styles.modalPressureText, { color: Colors.xpGold }]}>Elite Zone</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.modalThreatCard}>
                <Text style={styles.modalThreatLabel}>Gate Reading</Text>
                <Text style={styles.modalThreatText}>{activeZone?.threatLabel}</Text>
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
                  <Pressable style={styles.primaryButton} onPress={() => startLesson(activeZone.recommendedLesson!)}>
                    <Text style={styles.primaryButtonText}>Resume Lesson</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      setActiveZone(null);
                      router.push("/challenges");
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Open Raids</Text>
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
  pressed: { opacity: 0.8 },

  pageHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginTop: 16 },
  pageTitle: { color: Colors.text, fontSize: 24, fontWeight: "800" },
  pageSubtitle: { color: Colors.textSecondary, fontSize: 14, marginHorizontal: 20, marginTop: 4, marginBottom: 16 },
  topModeWrap: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  topModeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  topModeButtonActive: { backgroundColor: Colors.background },
  topModeText: { color: Colors.textSecondary, fontSize: 14, fontWeight: "700" },
  topModeTextActive: { color: Colors.text },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.primary + "28",
    marginBottom: 8,
  },
  heroGradient: { padding: 18 },
  heroTop: { flexDirection: "row", alignItems: "flex-start" },
  heroEyebrow: { color: Colors.primary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
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
  heroStats: { flexDirection: "row", marginTop: 18, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatValue: { color: Colors.text, fontSize: 20, fontWeight: "800" },
  heroStatLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  heroStatDivider: { width: 1, backgroundColor: Colors.border },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginTop: 18, marginBottom: 8 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  sectionSubtitle: { color: Colors.textMuted, fontSize: 12, marginHorizontal: 20, marginBottom: 14 },
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
  zoneEyebrow: { color: Colors.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  zoneTitle: { color: Colors.text, fontSize: 19, fontWeight: "800", marginTop: 4 },
  zoneTagline: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  zoneStateBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  zoneStateLocked: { backgroundColor: Colors.background, borderColor: Colors.border },
  zoneStateOpen: { backgroundColor: Colors.primary + "12", borderColor: Colors.primary + "34" },
  zoneStateMastered: { backgroundColor: Colors.success + "12", borderColor: Colors.success + "34" },
  zoneStateText: { fontSize: 11, fontWeight: "800" },
  zoneStateTextLocked: { color: Colors.textMuted },
  zoneStateTextOpen: { color: Colors.primary },
  zoneStateTextMastered: { color: Colors.success },
  zoneAtmosphere: { color: Colors.text, fontSize: 13, lineHeight: 20, marginTop: 12 },
  zonePressureRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  zonePressurePill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  zonePressureText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "700" },
  zoneElitePill: { borderColor: Colors.xpGold + "35" },
  zoneProgressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 8 },
  zoneProgressLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  zoneProgressValue: { color: Colors.textMuted, fontSize: 12, fontWeight: "700" },
  zoneProgressBg: { height: 6, borderRadius: 999, overflow: "hidden", backgroundColor: Colors.background },
  zoneProgressFill: { height: "100%", borderRadius: 999 },
  zoneNextText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  focusCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  focusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  focusEyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  focusRank: {
    fontSize: 12,
    fontWeight: "700",
  },
  focusTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  focusText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  focusAction: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
  },
  segmentWrap: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
  },
  segmentButtonActive: {
    backgroundColor: Colors.background,
  },
  segmentText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: Colors.text,
  },
  segmentCount: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  segmentCountActive: {
    color: Colors.accent,
  },
  sectionHint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 14,
  },
  emptyState: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
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
  modalEyebrow: { color: Colors.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  modalTitle: { color: Colors.text, fontSize: 24, fontWeight: "800", marginTop: 4 },
  modalTagline: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  modalBody: { color: Colors.text, fontSize: 14, lineHeight: 22, marginTop: 16 },
  modalPressureRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  modalPressurePill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  modalPressureText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "700" },
  modalElitePill: { borderColor: Colors.xpGold + "30" },
  modalThreatCard: {
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accent + "26",
    backgroundColor: Colors.background,
  },
  modalThreatLabel: { color: Colors.accent, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.3 },
  modalThreatText: { color: Colors.text, fontSize: 14, lineHeight: 21, marginTop: 8 },
  modalHintCard: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  modalHintEyebrow: { color: Colors.primary, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.1 },
  modalHintTitle: { color: Colors.text, fontSize: 16, fontWeight: "700", marginTop: 8 },
  modalHintText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
  modalActionRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  primaryButtonText: { color: Colors.background, fontSize: 15, fontWeight: "800" },

  dungeonCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  dungeonGradient: { padding: 16 },
  dungeonTop: { flexDirection: "row", alignItems: "center" },
  dungeonIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  dungeonInfo: { flex: 1, marginLeft: 12 },
  dungeonName: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  dungeonTitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  diffBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  diffText: { fontSize: 13, fontWeight: "800" },
  dungeonDesc: { color: Colors.textSecondary, fontSize: 13, marginTop: 10, marginLeft: 58 },
  dungeonFooter: { flexDirection: "row", alignItems: "center", marginTop: 12, marginLeft: 58, gap: 16 },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rewardText: { fontSize: 12, fontWeight: "600", color: Colors.xpGold },
  stepCount: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepText: { color: Colors.textMuted, fontSize: 12 },

  dungeonHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  dungeonHeaderCenter: { flex: 1, alignItems: "center" },
  dungeonHeaderTitle: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  floorText: { color: Colors.textSecondary, fontSize: 11, marginTop: 1 },

  floorProgress: { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 10 },
  activeBodyScroll: { flex: 1 },
  activeBodyContent: { paddingHorizontal: 18, paddingTop: 2 },
  lessonPanel: {
    gap: 10,
  },
  floorDot: { width: 6, height: 6, borderRadius: 3 },
  floorCleared: { backgroundColor: Colors.success },
  floorCurrent: { backgroundColor: Colors.accent, width: 18 },
  floorLocked: { backgroundColor: Colors.border },

  instructionCard: {
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  lessonMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  lessonChip: {
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  lessonChipLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  lessonChipValue: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  instructionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  instructionText: { flex: 1, color: Colors.text, fontSize: 18, lineHeight: 28, fontWeight: "700" },
  explanationText: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
  },
  exampleBox: {
    marginTop: 16,
    paddingTop: 14,
  },
  exampleLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  exampleText: {
    color: Colors.terminalGreen,
    fontSize: 15,
    marginTop: 8,
  },
  whyBox: {
    marginTop: 12,
    paddingTop: 12,
  },
  whyLabel: {
    color: Colors.accent,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  whyText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },

  terminalWrap: {
    paddingTop: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  completeCard: { borderRadius: 20, overflow: "hidden", width: "100%", maxWidth: 340, borderWidth: 1, borderColor: Colors.primary + "40" },
  completeGradient: { padding: 32, alignItems: "center" },
  completeTitle: { color: Colors.xpGold, fontSize: 22, fontWeight: "900", marginTop: 16, letterSpacing: 2 },
  completeName: { color: Colors.textSecondary, fontSize: 14, marginTop: 6 },
  rewardsSection: { marginTop: 24, gap: 12 },
  rewardItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  rewardAmount: { color: Colors.xpGold, fontSize: 18, fontWeight: "700" },
  closeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 28,
  },
  closeBtnText: { color: Colors.text, fontSize: 16, fontWeight: "700" },
});
