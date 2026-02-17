import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import TerminalView from "@/components/TerminalView";
import { useProgress } from "@/lib/progress-context";

export default function TerminalScreen() {
  const insets = useSafeAreaInsets();
  const { addTerminalCommand } = useProgress();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: "#FF5F57" }]} />
            <View style={[styles.dot, { backgroundColor: "#FFBD2E" }]} />
            <View style={[styles.dot, { backgroundColor: "#28C840" }]} />
          </View>
          <Text style={styles.headerTitle}>Sandbox Terminal</Text>
        </View>
        <Ionicons name="terminal" size={18} color={Colors.textSecondary} />
      </View>
      <View style={styles.terminalContainer}>
        <TerminalView
          welcomeMessage={"Welcome to the sandbox terminal!\nType 'help' for available commands.\n"}
          onCommand={(cmd) => {
            addTerminalCommand(cmd);
            return null;
          }}
        />
      </View>
      <View
        style={[
          styles.footer,
          {
            paddingBottom:
              Platform.OS === "web" ? 84 : Math.max(insets.bottom, 16) + 50,
          },
        ]}
      >
        <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.footerText}>
          Practice any command freely. Type 'help' for a list.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  terminalContainer: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
