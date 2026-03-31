import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { shopItems } from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

function frameColor(frameId: string, fallback: string) {
  switch (frameId) {
    case "neon":
      return "#64D2FF";
    case "ember":
      return "#FF8A5B";
    default:
      return fallback;
  }
}

function getTerminalPreviewTheme(themeId: string) {
  switch (themeId) {
    case "shadowcore":
      return {
        background: "#090811",
        border: "#352759",
        prompt: "#64D2FF",
        input: "#B794F4",
        output: Colors.text,
      };
    case "frostbyte":
      return {
        background: "#07131A",
        border: "#1E5362",
        prompt: "#8BE9FD",
        input: "#64D2FF",
        output: "#DDF7FF",
      };
    case "emberline":
      return {
        background: "#140B09",
        border: "#5B2F24",
        prompt: "#FFB800",
        input: "#FF8A5B",
        output: "#FFE9DE",
      };
    default:
      return {
        background: "#0A0E14",
        border: Colors.border,
        prompt: Colors.accent,
        input: Colors.terminalGreen,
        output: Colors.text,
      };
  }
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "warning";
    title: string;
    body: string;
  } | null>(null);
  const {
    essenceShards,
    ownedTitles,
    ownedFrames,
    ownedThemes,
    activeFrame,
    activeTheme,
    title,
    unlockTitle,
    unlockFrame,
    unlockTheme,
    equipTitle,
    equipFrame,
    equipTheme,
  } = useProgress();

  const webTop = Platform.OS === "web" ? 67 : 0;
  const grouped = {
    titles: shopItems.filter((item) => item.category === "title"),
    frames: shopItems.filter((item) => item.category === "frame"),
    themes: shopItems.filter((item) => item.category === "theme"),
  };

  function owned(item: (typeof shopItems)[number]) {
    switch (item.category) {
      case "title":
        return ownedTitles.includes(item.unlockValue);
      case "frame":
        return ownedFrames.includes(item.unlockValue);
      case "theme":
        return ownedThemes.includes(item.unlockValue);
    }
  }

  function equipped(item: (typeof shopItems)[number]) {
    switch (item.category) {
      case "title":
        return title === item.unlockValue;
      case "frame":
        return activeFrame === item.unlockValue;
      case "theme":
        return activeTheme === item.unlockValue;
    }
  }

  function handlePress(item: (typeof shopItems)[number]) {
    if (owned(item)) {
      if (item.category === "title") equipTitle(item.unlockValue);
      if (item.category === "frame") equipFrame(item.unlockValue);
      if (item.category === "theme") equipTheme(item.unlockValue);
      setFeedback({
        tone: "success",
        title: `${item.title} equipped`,
        body: `Your hunter loadout now uses this ${item.category}.`,
      });
      return;
    }

    let unlocked = false;
    if (item.category === "title") unlocked = unlockTitle(item.unlockValue, item.cost);
    if (item.category === "frame") unlocked = unlockFrame(item.unlockValue, item.cost);
    if (item.category === "theme") unlocked = unlockTheme(item.unlockValue, item.cost);

    if (unlocked) {
      setFeedback({
        tone: "success",
        title: `${item.title} unlocked`,
        body: `${item.cost} shards consumed. The new ${item.category} is active now.`,
      });
      return;
    }

    setFeedback({
      tone: "warning",
      title: "Not enough shards",
      body: `You need ${item.cost - essenceShards} more shard${item.cost - essenceShards === 1 ? "" : "s"} to unlock ${item.title}.`,
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTop + 8,
          paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 24,
        }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Essence Shop</Text>
            <Text style={styles.subtitle}>Spend shards on hunter cosmetics and terminal style.</Text>
          </View>
          <View style={styles.shardBadge}>
            <Ionicons name="diamond" size={14} color={Colors.xpGold} />
            <Text style={styles.shardText}>{essenceShards}</Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(350)} style={styles.previewCard}>
          <View style={[styles.previewFrame, { borderColor: frameColor(activeFrame, Colors.primary) }]}>
            <Text style={[styles.previewRank, { color: frameColor(activeFrame, Colors.primary) }]}>H</Text>
          </View>
          <View style={styles.previewCopy}>
            <Text style={styles.previewTitle}>{title}</Text>
            <Text style={styles.previewText}>Active frame: {activeFrame} · Active theme: {activeTheme}</Text>
          </View>
        </Animated.View>

        {feedback ? (
          <Animated.View
            entering={FadeInDown.duration(250)}
            style={[
              styles.feedbackCard,
              feedback.tone === "success" ? styles.feedbackSuccess : styles.feedbackWarning,
            ]}
          >
            <View
              style={[
                styles.feedbackIcon,
                feedback.tone === "success" ? styles.feedbackIconSuccess : styles.feedbackIconWarning,
              ]}
            >
              <Ionicons
                name={feedback.tone === "success" ? "checkmark-circle" : "alert-circle"}
                size={18}
                color={feedback.tone === "success" ? Colors.success : Colors.xpGold}
              />
            </View>
            <View style={styles.feedbackCopy}>
              <Text style={styles.feedbackTitle}>{feedback.title}</Text>
              <Text style={styles.feedbackBody}>{feedback.body}</Text>
            </View>
            <Pressable onPress={() => setFeedback(null)} style={styles.feedbackClose}>
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </Animated.View>
        ) : null}

        <Text style={styles.sectionTitle}>Titles</Text>
        {grouped.titles.map((item, index) => (
          <Animated.View key={item.id} entering={FadeInDown.duration(350).delay(40 * index)}>
            <Pressable style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]} onPress={() => handlePress(item)}>
              <View style={[styles.itemIcon, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <View style={styles.titlePreview}>
                  <Text style={[styles.titlePreviewRank, { color: frameColor(activeFrame, Colors.primary) }]}>H</Text>
                  <Text style={styles.titlePreviewText}>{item.unlockValue}</Text>
                </View>
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.itemCost}>{owned(item) ? (equipped(item) ? "Equipped" : "Owned") : `${item.cost}`}</Text>
                <Text style={styles.itemAction}>{owned(item) ? (equipped(item) ? "Active" : "Equip") : "Unlock"}</Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}

        <Text style={styles.sectionTitle}>Frames</Text>
        {grouped.frames.map((item, index) => (
          <Animated.View key={item.id} entering={FadeInDown.duration(350).delay(40 * index)}>
            <Pressable style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]} onPress={() => handlePress(item)}>
              <View style={[styles.itemIcon, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <View style={styles.framePreviewRow}>
                  <View style={[styles.framePreviewBadge, { borderColor: frameColor(item.unlockValue, item.color) }]}>
                    <Text style={[styles.framePreviewLetter, { color: frameColor(item.unlockValue, item.color) }]}>H</Text>
                  </View>
                  <Text style={styles.framePreviewText}>Hunter profile frame preview</Text>
                </View>
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.itemCost}>{owned(item) ? (equipped(item) ? "Equipped" : "Owned") : `${item.cost}`}</Text>
                <Text style={styles.itemAction}>{owned(item) ? (equipped(item) ? "Active" : "Equip") : "Unlock"}</Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}

        <Text style={styles.sectionTitle}>Terminal Themes</Text>
        {grouped.themes.map((item, index) => (
          <Animated.View key={item.id} entering={FadeInDown.duration(350).delay(40 * index)}>
            <Pressable style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]} onPress={() => handlePress(item)}>
              <View style={[styles.itemIcon, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <View
                  style={[
                    styles.terminalPreview,
                    {
                      backgroundColor: getTerminalPreviewTheme(item.unlockValue).background,
                      borderColor: getTerminalPreviewTheme(item.unlockValue).border,
                    },
                  ]}
                >
                  <Text style={styles.terminalPreviewLine}>
                    <Text style={{ color: getTerminalPreviewTheme(item.unlockValue).prompt }}>hunter@system:~$ </Text>
                    <Text style={{ color: getTerminalPreviewTheme(item.unlockValue).input }}>
                      {item.preview ?? "preview"}
                    </Text>
                  </Text>
                  <Text
                    style={[
                      styles.terminalPreviewOutput,
                      { color: getTerminalPreviewTheme(item.unlockValue).output },
                    ]}
                  >
                    Theme preview online.
                  </Text>
                </View>
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.itemCost}>{owned(item) ? (equipped(item) ? "Equipped" : "Owned") : `${item.cost}`}</Text>
                <Text style={styles.itemAction}>{owned(item) ? (equipped(item) ? "Active" : "Equip") : "Unlock"}</Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
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
  title: { color: Colors.text, fontSize: 26, fontWeight: "800" },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  shardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shardText: { color: Colors.xpGold, fontSize: 13, fontWeight: "700" },
  previewCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  previewFrame: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    marginRight: 14,
  },
  previewRank: { fontSize: 24, fontWeight: "900" },
  previewCopy: { flex: 1 },
  previewTitle: { color: Colors.text, fontSize: 17, fontWeight: "700" },
  previewText: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  feedbackCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  feedbackSuccess: {
    backgroundColor: Colors.success + "10",
    borderColor: Colors.success + "35",
  },
  feedbackWarning: {
    backgroundColor: Colors.xpGold + "10",
    borderColor: Colors.xpGold + "35",
  },
  feedbackIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  feedbackIconSuccess: {
    backgroundColor: Colors.success + "14",
  },
  feedbackIconWarning: {
    backgroundColor: Colors.xpGold + "14",
  },
  feedbackCopy: {
    flex: 1,
  },
  feedbackTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  feedbackBody: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  feedbackClose: {
    marginLeft: 10,
    padding: 2,
  },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: "700", marginHorizontal: 20, marginTop: 18, marginBottom: 10 },
  itemCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pressed: { opacity: 0.88 },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemCopy: { flex: 1 },
  itemTitle: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  itemDescription: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
  titlePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingTop: 2,
  },
  titlePreviewRank: {
    fontSize: 18,
    fontWeight: "900",
  },
  titlePreviewText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  framePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  framePreviewBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  framePreviewLetter: {
    fontSize: 16,
    fontWeight: "900",
  },
  framePreviewText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  terminalPreview: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  terminalPreviewLine: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 12,
  },
  terminalPreviewOutput: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 11,
    marginTop: 6,
  },
  itemMeta: { marginLeft: 10, alignItems: "flex-end" },
  itemCost: { color: Colors.xpGold, fontSize: 14, fontWeight: "700" },
  itemAction: { color: Colors.primary, fontSize: 12, fontWeight: "700", marginTop: 6 },
});
