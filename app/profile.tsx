import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import {
  getFrameColor,
  getTerminalThemePreview,
  shopItems,
} from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

type PickerType = "name" | "title" | "frame" | "theme" | null;

function buildTitleOptions(ownedTitles: string[]) {
  return ownedTitles.map((ownedTitle) => {
    const item = shopItems.find(
      (shopItem) => shopItem.category === "title" && shopItem.unlockValue === ownedTitle,
    );
    return {
      value: ownedTitle,
      icon: item?.icon ?? "ribbon",
      color: item?.color ?? Colors.primary,
      description: item?.description ?? "Default hunter title.",
    };
  });
}

function buildFrameOptions(ownedFrames: string[]) {
  return ownedFrames.map((ownedFrame) => {
    const item = shopItems.find(
      (shopItem) => shopItem.category === "frame" && shopItem.unlockValue === ownedFrame,
    );
    return {
      value: ownedFrame,
      icon: item?.icon ?? "ellipse-outline",
      color: getFrameColor(ownedFrame, item?.color ?? Colors.primary),
      description: item?.description ?? "Default hunter frame.",
    };
  });
}

function buildThemeOptions(ownedThemes: string[]) {
  return ownedThemes.map((ownedTheme) => {
    const item = shopItems.find(
      (shopItem) => shopItem.category === "theme" && shopItem.unlockValue === ownedTheme,
    );
    return {
      value: ownedTheme,
      icon: item?.icon ?? "terminal",
      color: item?.color ?? Colors.primary,
      description: item?.description ?? "Default terminal theme.",
      preview: item?.preview ?? "hunter@system:~$ ready",
    };
  });
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [activePicker, setActivePicker] = useState<PickerType>(null);
  const {
    hunterName,
    title,
    rank,
    level,
    activeFrame,
    activeTheme,
    ownedTitles,
    ownedFrames,
    ownedThemes,
    setHunterName,
    equipTitle,
    equipFrame,
    equipTheme,
  } = useProgress();
  const [draftName, setDraftName] = useState(hunterName);
  const webTop = Platform.OS === "web" ? 67 : 0;

  const titleOptions = useMemo(() => buildTitleOptions(ownedTitles), [ownedTitles]);
  const frameOptions = useMemo(() => buildFrameOptions(ownedFrames), [ownedFrames]);
  const themeOptions = useMemo(() => buildThemeOptions(ownedThemes), [ownedThemes]);

  function openNameEditor() {
    setDraftName(hunterName);
    setActivePicker("name");
  }

  function saveName() {
    setHunterName(draftName);
    setActivePicker(null);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTop + 8,
          paddingBottom: Platform.OS === "web" ? 36 : insets.bottom + 24,
        }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Hunter Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your name, title, frame, and terminal identity.</Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(360)} style={styles.heroCard}>
          <LinearGradient colors={[Colors.primary + "22", Colors.surface]} style={styles.heroGradient}>
            <View style={[styles.heroBadge, { borderColor: getFrameColor(activeFrame, rank.color) }]}>
              <Text style={[styles.heroBadgeText, { color: getFrameColor(activeFrame, rank.color) }]}>
                {rank.rank}
              </Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroName}>{hunterName}</Text>
              <Text style={styles.heroMeta}>{title} · {rank.title} · Level {level}</Text>
              <Text style={styles.heroTheme}>Frame: {activeFrame} · Theme: {activeTheme}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(360).delay(80)} style={styles.menuCard}>
          <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]} onPress={openNameEditor}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name="person" size={18} color={Colors.primary} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={styles.menuTitle}>Hunter Name</Text>
                <Text style={styles.menuValue}>{hunterName}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>

          <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]} onPress={() => setActivePicker("title")}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name="ribbon" size={18} color={Colors.xpGold} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={styles.menuTitle}>Titles</Text>
                <Text style={styles.menuValue}>{title} · {ownedTitles.length} unlocked</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>

          <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]} onPress={() => setActivePicker("frame")}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { borderColor: getFrameColor(activeFrame, Colors.primary) + "50", borderWidth: 1 }]}>
                <Ionicons name="ellipse-outline" size={18} color={getFrameColor(activeFrame, Colors.primary)} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={styles.menuTitle}>Frames</Text>
                <Text style={styles.menuValue}>{activeFrame} · {ownedFrames.length} unlocked</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>

          <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]} onPress={() => setActivePicker("theme")}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name="terminal" size={18} color={Colors.accent} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={styles.menuTitle}>Terminal Themes</Text>
                <Text style={styles.menuValue}>{activeTheme} · {ownedThemes.length} unlocked</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Modal visible={activePicker === "name"} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(260)} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Hunter Name</Text>
            <Text style={styles.modalBody}>Choose the name the System uses when tracking your growth.</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              style={styles.nameInput}
              placeholder="Hunter name"
              placeholderTextColor={Colors.textMuted}
              maxLength={24}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setActivePicker(null)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={saveName}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={activePicker === "title"} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(260)} style={styles.selectorCard}>
            <Text style={styles.modalTitle}>Unlocked Titles</Text>
            <Text style={styles.modalBody}>Choose the title shown under your hunter name.</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {titleOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [styles.optionRow, pressed && styles.pressed, title === option.value && styles.optionRowActive]}
                  onPress={() => {
                    equipTitle(option.value);
                    setActivePicker(null);
                  }}
                >
                  <View style={[styles.optionIcon, { backgroundColor: option.color + "16" }]}>
                    <Ionicons name={option.icon as any} size={18} color={option.color} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>{option.value}</Text>
                    <Text style={styles.optionText}>{option.description}</Text>
                  </View>
                  {title === option.value ? <Ionicons name="checkmark-circle" size={20} color={Colors.success} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={activePicker === "frame"} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(260)} style={styles.selectorCard}>
            <Text style={styles.modalTitle}>Unlocked Frames</Text>
            <Text style={styles.modalBody}>Pick the frame that wraps your hunter badge across the app.</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {frameOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [styles.optionRow, pressed && styles.pressed, activeFrame === option.value && styles.optionRowActive]}
                  onPress={() => {
                    equipFrame(option.value);
                    setActivePicker(null);
                  }}
                >
                  <View style={[styles.frameBadge, { borderColor: option.color }]}>
                    <Text style={[styles.frameBadgeText, { color: option.color }]}>H</Text>
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>{option.value}</Text>
                    <Text style={styles.optionText}>{option.description}</Text>
                  </View>
                  {activeFrame === option.value ? <Ionicons name="checkmark-circle" size={20} color={Colors.success} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={activePicker === "theme"} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(260)} style={styles.selectorCard}>
            <Text style={styles.modalTitle}>Unlocked Themes</Text>
            <Text style={styles.modalBody}>Choose the terminal look that follows your training and dungeon screens.</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {themeOptions.map((option) => {
                const previewTheme = getTerminalThemePreview(option.value);
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [styles.themeRow, pressed && styles.pressed, activeTheme === option.value && styles.optionRowActive]}
                    onPress={() => {
                      equipTheme(option.value);
                      setActivePicker(null);
                    }}
                  >
                    <View style={styles.optionCopy}>
                      <Text style={styles.optionTitle}>{option.value}</Text>
                      <Text style={styles.optionText}>{option.description}</Text>
                      <View
                        style={[
                          styles.themePreview,
                          { backgroundColor: previewTheme.background, borderColor: previewTheme.border },
                        ]}
                      >
                        <Text style={styles.themePreviewLine}>
                          <Text style={{ color: previewTheme.prompt }}>hunter@system:~$ </Text>
                          <Text style={{ color: previewTheme.input }}>{option.preview}</Text>
                        </Text>
                        <Text style={[styles.themePreviewOutput, { color: previewTheme.output }]}>
                          Theme preview online.
                        </Text>
                      </View>
                    </View>
                    {activeTheme === option.value ? <Ionicons name="checkmark-circle" size={20} color={Colors.success} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const monoFont = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

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
    borderColor: Colors.primary + "24",
  },
  heroGradient: { padding: 18, flexDirection: "row", alignItems: "center" },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    marginRight: 14,
  },
  heroBadgeText: { fontSize: 28, fontWeight: "900" },
  heroCopy: { flex: 1 },
  heroName: { color: Colors.text, fontSize: 22, fontWeight: "800" },
  heroMeta: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  heroTheme: { color: Colors.accent, fontSize: 12, marginTop: 8, fontWeight: "700" },
  menuCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuCopy: { flex: 1 },
  menuTitle: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  menuValue: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorCard: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "78%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: "800" },
  modalBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 16 },
  nameInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 16,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
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
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  optionRowActive: {
    borderColor: Colors.success + "55",
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  optionCopy: { flex: 1 },
  optionTitle: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  optionText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
  frameBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  frameBadgeText: { fontSize: 18, fontWeight: "900" },
  themeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  themePreview: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  themePreviewLine: {
    fontFamily: monoFont,
    fontSize: 12,
  },
  themePreviewOutput: {
    fontFamily: monoFont,
    fontSize: 11,
    marginTop: 6,
  },
});
