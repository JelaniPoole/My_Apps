import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "@/lib/api";
import {
  defaultOwnedFrames,
  defaultOwnedThemes,
  defaultOwnedTitles,
  getTrackCosmeticReward,
  getNewlyMasteredTracks,
  getNextRank,
  getRank,
  TRACK_MASTERY_SHARD_REWARD,
} from "@/lib/linux-data";

export interface Stats {
  [key: string]: number;
  STR: number;
  INT: number;
  AGI: number;
  VIT: number;
  DEF: number;
}

interface DailyProgress {
  lessonsToday: number;
  challengesToday: number;
  commandsToday: number;
  questsClaimed: string[];
}

interface ProgressData {
  xp: number;
  essenceShards: number;
  stats: Stats;
  ownedTitles: string[];
  ownedFrames: string[];
  ownedThemes: string[];
  activeFrame: string;
  activeTheme: string;
  completedLessons: string[];
  completedChallenges: string[];
  currentStreak: number;
  lastActiveDate: string;
  terminalHistory: string[];
  dailyProgress: DailyProgress;
  totalPowerUps: number;
  title: string;
  masteredTracks: string[];
}

interface ProgressContextValue {
  xp: number;
  essenceShards: number;
  stats: Stats;
  ownedTitles: string[];
  ownedFrames: string[];
  ownedThemes: string[];
  activeFrame: string;
  activeTheme: string;
  totalPower: number;
  completedLessons: string[];
  completedChallenges: string[];
  currentStreak: number;
  terminalHistory: string[];
  dailyProgress: DailyProgress;
  level: number;
  xpForNextLevel: number;
  xpIntoCurrentLevel: number;
  xpProgress: number;
  rank: ReturnType<typeof getRank>;
  nextRank: ReturnType<typeof getNextRank>;
  title: string;
  pendingRankUp: { from: ReturnType<typeof getRank>; to: ReturnType<typeof getRank> } | null;
  masteredTracks: string[];
  pendingTrackMastery: {
    name: string;
    statType: keyof Stats;
    shardsAwarded: number;
    cosmeticReward?: {
      category: "title" | "frame" | "theme";
      label: string;
      color: string;
    } | null;
  } | null;
  addXp: (amount: number) => void;
  addShards: (amount: number) => void;
  spendShards: (amount: number) => boolean;
  addStat: (type: keyof Stats, amount: number) => void;
  completeLesson: (lessonId: string) => void;
  completeChallenge: (challengeId: string) => void;
  addTerminalCommand: (cmd: string) => void;
  claimDailyQuest: (questId: string) => void;
  unlockTitle: (title: string, cost: number) => boolean;
  unlockFrame: (frameId: string, cost: number) => boolean;
  unlockTheme: (themeId: string, cost: number) => boolean;
  equipTitle: (title: string) => void;
  equipFrame: (frameId: string) => void;
  equipTheme: (themeId: string) => void;
  dismissRankUp: () => void;
  dismissTrackMastery: () => void;
  isLoaded: boolean;
}

const STORAGE_KEY = "@terminal_quest_progress_v2";

const defaultProgress: ProgressData = {
  xp: 0,
  essenceShards: 0,
  stats: { STR: 1, INT: 1, AGI: 1, VIT: 1, DEF: 1 },
  ownedTitles: defaultOwnedTitles,
  ownedFrames: defaultOwnedFrames,
  ownedThemes: defaultOwnedThemes,
  activeFrame: "default",
  activeTheme: "default",
  completedLessons: [],
  completedChallenges: [],
  currentStreak: 0,
  lastActiveDate: "",
  terminalHistory: [],
  dailyProgress: { lessonsToday: 0, challengesToday: 0, commandsToday: 0, questsClaimed: [] },
  totalPowerUps: 0,
  title: "Novice",
  masteredTracks: [],
};

type ServerProgressPayload = Partial<ProgressData> & {
  xp?: number;
  stats?: Stats;
  progress?: Partial<ProgressData>;
};

async function fetchServerProgress(): Promise<ServerProgressPayload | null> {
  try {
    const res = await fetch(apiUrl("/api/me"));
    if (!res.ok) return null;
    const data = (await res.json()) as ServerProgressPayload;
    const nested = data.progress ?? {};
    const normalized: ServerProgressPayload = {
      ...nested,
      xp: typeof data.xp === "number" ? data.xp : nested.xp,
      stats: typeof data.stats === "object" ? data.stats : nested.stats,
      title: data.title ?? nested.title,
    };
    if (typeof normalized.xp !== "number" || typeof normalized.stats !== "object") return null;
    return normalized;
  } catch {
    return null;
  }
}

async function syncProgressToServer(progress: ProgressData) {
  try {
    await fetch(apiUrl("/api/me"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        xp: progress.xp,
        stats: progress.stats,
        progress,
      }),
    });
  } catch {
    // Ignore sync failures; progress will remain in local cache.
  }
}

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 25)) + 1;
}

function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 25;
}

function xpForNextLevel(level: number): number {
  return level * level * 25;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressData>(defaultProgress);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingRankUp, setPendingRankUp] = useState<{
    from: ReturnType<typeof getRank>;
    to: ReturnType<typeof getRank>;
  } | null>(null);
  const [pendingTrackMastery, setPendingTrackMastery] = useState<{
    name: string;
    statType: keyof Stats;
    shardsAwarded: number;
    cosmeticReward?: {
      category: "title" | "frame" | "theme";
      label: string;
      color: string;
    } | null;
  } | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ProgressData>;
        const mergedStored: ProgressData = {
          ...defaultProgress,
          ...parsed,
          stats: {
            ...defaultProgress.stats,
            ...(parsed.stats ?? {}),
          },
          ownedTitles: parsed.ownedTitles ?? defaultProgress.ownedTitles,
          ownedFrames: parsed.ownedFrames ?? defaultProgress.ownedFrames,
          ownedThemes: parsed.ownedThemes ?? defaultProgress.ownedThemes,
          activeFrame: parsed.activeFrame ?? defaultProgress.activeFrame,
          activeTheme: parsed.activeTheme ?? defaultProgress.activeTheme,
          dailyProgress: {
            ...defaultProgress.dailyProgress,
            ...(parsed.dailyProgress ?? {}),
          },
          completedLessons: parsed.completedLessons ?? defaultProgress.completedLessons,
          completedChallenges: parsed.completedChallenges ?? defaultProgress.completedChallenges,
          terminalHistory: parsed.terminalHistory ?? defaultProgress.terminalHistory,
          essenceShards: parsed.essenceShards ?? defaultProgress.essenceShards,
          masteredTracks: parsed.masteredTracks ?? defaultProgress.masteredTracks,
        };
        const today = new Date().toDateString();
        const lastActive = mergedStored.lastActiveDate;

        let streak = mergedStored.currentStreak;
        let dailyProgress = mergedStored.dailyProgress;

        if (lastActive && lastActive !== today) {
          const lastDate = new Date(lastActive);
          const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diff > 1) streak = 0;
          dailyProgress = { lessonsToday: 0, challengesToday: 0, commandsToday: 0, questsClaimed: [] };
        }

        setProgress({ ...mergedStored, currentStreak: streak, dailyProgress });
      }
    } catch (e) {
      console.error("Failed to load progress", e);
    }

    // Try to merge with the server state (shared progress)
    const server = await fetchServerProgress();
    if (server) {
      setProgress((prev) => {
        const merged: ProgressData = {
          ...prev,
          xp: Math.max(prev.xp, server.xp ?? 0),
          essenceShards: Math.max(prev.essenceShards, server.essenceShards ?? 0),
          stats: {
            STR: Math.max(prev.stats.STR, server.stats?.STR ?? 0),
            INT: Math.max(prev.stats.INT, server.stats?.INT ?? 0),
            AGI: Math.max(prev.stats.AGI, server.stats?.AGI ?? 0),
            VIT: Math.max(prev.stats.VIT, server.stats?.VIT ?? 0),
            DEF: Math.max(prev.stats.DEF, server.stats?.DEF ?? 0),
          },
          ownedTitles: Array.from(new Set([...(prev.ownedTitles ?? []), ...(server.ownedTitles ?? [])])),
          ownedFrames: Array.from(new Set([...(prev.ownedFrames ?? []), ...(server.ownedFrames ?? [])])),
          ownedThemes: Array.from(new Set([...(prev.ownedThemes ?? []), ...(server.ownedThemes ?? [])])),
          activeFrame: server.activeFrame ?? prev.activeFrame,
          activeTheme: server.activeTheme ?? prev.activeTheme,
          completedLessons: Array.from(new Set([...prev.completedLessons, ...(server.completedLessons ?? [])])),
          completedChallenges: Array.from(new Set([...prev.completedChallenges, ...(server.completedChallenges ?? [])])),
          currentStreak: Math.max(prev.currentStreak, server.currentStreak ?? 0),
          lastActiveDate: server.lastActiveDate || prev.lastActiveDate,
          terminalHistory: Array.from(new Set([...prev.terminalHistory, ...(server.terminalHistory ?? [])])),
          dailyProgress: {
            lessonsToday: Math.max(prev.dailyProgress.lessonsToday, server.dailyProgress?.lessonsToday ?? 0),
            challengesToday: Math.max(prev.dailyProgress.challengesToday, server.dailyProgress?.challengesToday ?? 0),
            commandsToday: Math.max(prev.dailyProgress.commandsToday, server.dailyProgress?.commandsToday ?? 0),
            questsClaimed: Array.from(
              new Set([...prev.dailyProgress.questsClaimed, ...(server.dailyProgress?.questsClaimed ?? [])]),
            ),
          },
          totalPowerUps: Math.max(prev.totalPowerUps, server.totalPowerUps ?? 0),
          title: server.title ?? prev.title,
          masteredTracks: Array.from(
            new Set([...(prev.masteredTracks ?? []), ...(server.masteredTracks ?? [])]),
          ),
        };
        saveProgress(merged);
        return merged;
      });
    }

    setIsLoaded(true);
  }

  async function saveProgress(data: ProgressData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }

  function updateProgress(updater: (prev: ProgressData) => ProgressData) {
    setProgress((prev) => {
      const today = new Date().toDateString();
      const previousRank = getRank(calculateLevel(prev.xp));
      const updated = updater(prev);

      let streak = updated.currentStreak;
      if (updated.lastActiveDate !== today) {
        const lastDate = updated.lastActiveDate ? new Date(updated.lastActiveDate) : null;
        if (lastDate) {
          const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          streak = diff <= 1 ? updated.currentStreak + 1 : 1;
        } else {
          streak = 1;
        }
      }

      const newlyMasteredTracks = getNewlyMasteredTracks(
        prev.completedLessons,
        prev.completedChallenges,
        updated.completedLessons,
        updated.completedChallenges,
        updated.masteredTracks ?? [],
      );
      const primaryTrackReward =
        newlyMasteredTracks.length > 0
          ? getTrackCosmeticReward(newlyMasteredTracks[0].name)
          : null;
      const finalMasteredTracks = [
        ...(updated.masteredTracks ?? []),
        ...newlyMasteredTracks.map((category) => category.name),
      ];
      let final = {
        ...updated,
        currentStreak: streak,
        lastActiveDate: today,
        essenceShards:
          updated.essenceShards +
          newlyMasteredTracks.length * TRACK_MASTERY_SHARD_REWARD,
        masteredTracks: finalMasteredTracks,
      };
      if (primaryTrackReward) {
        if (
          primaryTrackReward.category === "title" &&
          !final.ownedTitles.includes(primaryTrackReward.unlockValue)
        ) {
          final = {
            ...final,
            ownedTitles: [...final.ownedTitles, primaryTrackReward.unlockValue],
            title: primaryTrackReward.unlockValue,
          };
        }
        if (
          primaryTrackReward.category === "frame" &&
          !final.ownedFrames.includes(primaryTrackReward.unlockValue)
        ) {
          final = {
            ...final,
            ownedFrames: [...final.ownedFrames, primaryTrackReward.unlockValue],
            activeFrame: primaryTrackReward.unlockValue,
          };
        }
        if (
          primaryTrackReward.category === "theme" &&
          !final.ownedThemes.includes(primaryTrackReward.unlockValue)
        ) {
          final = {
            ...final,
            ownedThemes: [...final.ownedThemes, primaryTrackReward.unlockValue],
            activeTheme: primaryTrackReward.unlockValue,
          };
        }
      }
      const nextRank = getRank(calculateLevel(final.xp));
      if (nextRank.rank !== previousRank.rank) {
        setPendingRankUp({ from: previousRank, to: nextRank });
      }
      if (newlyMasteredTracks.length > 0) {
        const track = newlyMasteredTracks[0];
        setPendingTrackMastery({
          name: track.name,
          statType: track.statType as keyof Stats,
          shardsAwarded: TRACK_MASTERY_SHARD_REWARD,
          cosmeticReward: primaryTrackReward
            ? {
                category: primaryTrackReward.category,
                label: primaryTrackReward.label,
                color: primaryTrackReward.color,
              }
            : null,
        });
      }
      saveProgress(final);
      void syncProgressToServer(final);
      return final;
    });
  }

  function addXp(amount: number) {
    updateProgress((prev) => ({ ...prev, xp: prev.xp + amount }));
  }

  function addShards(amount: number) {
    updateProgress((prev) => ({ ...prev, essenceShards: prev.essenceShards + amount }));
  }

  function spendShards(amount: number) {
    let success = false;
    updateProgress((prev) => {
      if (prev.essenceShards < amount) return prev;
      success = true;
      return { ...prev, essenceShards: prev.essenceShards - amount };
    });
    return success;
  }

  function addStat(type: keyof Stats, amount: number) {
    updateProgress((prev) => ({
      ...prev,
      stats: { ...prev.stats, [type]: prev.stats[type] + amount },
      totalPowerUps: prev.totalPowerUps + 1,
    }));
  }

  function completeLesson(lessonId: string) {
    updateProgress((prev) => {
      if (prev.completedLessons.includes(lessonId)) return prev;
      return {
        ...prev,
        completedLessons: [...prev.completedLessons, lessonId],
        dailyProgress: { ...prev.dailyProgress, lessonsToday: prev.dailyProgress.lessonsToday + 1 },
      };
    });
  }

  function completeChallenge(challengeId: string) {
    updateProgress((prev) => {
      if (prev.completedChallenges.includes(challengeId)) return prev;
      return {
        ...prev,
        completedChallenges: [...prev.completedChallenges, challengeId],
        essenceShards: prev.essenceShards + 15,
        dailyProgress: { ...prev.dailyProgress, challengesToday: prev.dailyProgress.challengesToday + 1 },
      };
    });
  }

  function addTerminalCommand(cmd: string) {
    updateProgress((prev) => {
      const history = [...prev.terminalHistory, cmd].slice(-100);
      const today = new Date().toDateString();
      return {
        ...prev,
        terminalHistory: history,
        lastActiveDate: today,
        dailyProgress: { ...prev.dailyProgress, commandsToday: prev.dailyProgress.commandsToday + 1 },
      };
    });
  }

  function claimDailyQuest(questId: string) {
    updateProgress((prev) => {
      if (prev.dailyProgress.questsClaimed.includes(questId)) return prev;
      return {
        ...prev,
        essenceShards: prev.essenceShards + 5,
        dailyProgress: { ...prev.dailyProgress, questsClaimed: [...prev.dailyProgress.questsClaimed, questId] },
      };
    });
  }

  function dismissRankUp() {
    setPendingRankUp(null);
  }

  function dismissTrackMastery() {
    setPendingTrackMastery(null);
  }

  function unlockTitle(titleToUnlock: string, cost: number) {
    let success = false;
    updateProgress((prev) => {
      if (prev.ownedTitles.includes(titleToUnlock) || prev.essenceShards < cost) return prev;
      success = true;
      return {
        ...prev,
        essenceShards: prev.essenceShards - cost,
        ownedTitles: [...prev.ownedTitles, titleToUnlock],
        title: titleToUnlock,
      };
    });
    return success;
  }

  function unlockFrame(frameId: string, cost: number) {
    let success = false;
    updateProgress((prev) => {
      if (prev.ownedFrames.includes(frameId) || prev.essenceShards < cost) return prev;
      success = true;
      return {
        ...prev,
        essenceShards: prev.essenceShards - cost,
        ownedFrames: [...prev.ownedFrames, frameId],
        activeFrame: frameId,
      };
    });
    return success;
  }

  function unlockTheme(themeId: string, cost: number) {
    let success = false;
    updateProgress((prev) => {
      if (prev.ownedThemes.includes(themeId) || prev.essenceShards < cost) return prev;
      success = true;
      return {
        ...prev,
        essenceShards: prev.essenceShards - cost,
        ownedThemes: [...prev.ownedThemes, themeId],
        activeTheme: themeId,
      };
    });
    return success;
  }

  function equipTitle(nextTitle: string) {
    updateProgress((prev) =>
      prev.ownedTitles.includes(nextTitle) ? { ...prev, title: nextTitle } : prev,
    );
  }

  function equipFrame(frameId: string) {
    updateProgress((prev) =>
      prev.ownedFrames.includes(frameId) ? { ...prev, activeFrame: frameId } : prev,
    );
  }

  function equipTheme(themeId: string) {
    updateProgress((prev) =>
      prev.ownedThemes.includes(themeId) ? { ...prev, activeTheme: themeId } : prev,
    );
  }

  const level = calculateLevel(progress.xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForNextLevel(level);
  const xpInto = progress.xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const rank = getRank(level);
  const nextR = getNextRank(level);
  const totalPower = Object.values(progress.stats).reduce((a, b) => a + b, 0);

  const value = useMemo(
    () => ({
      xp: progress.xp,
      essenceShards: progress.essenceShards,
      stats: progress.stats,
      ownedTitles: progress.ownedTitles,
      ownedFrames: progress.ownedFrames,
      ownedThemes: progress.ownedThemes,
      activeFrame: progress.activeFrame,
      activeTheme: progress.activeTheme,
      totalPower,
      completedLessons: progress.completedLessons,
      completedChallenges: progress.completedChallenges,
      currentStreak: progress.currentStreak,
      terminalHistory: progress.terminalHistory,
      dailyProgress: progress.dailyProgress,
      masteredTracks: progress.masteredTracks,
      level,
      xpForNextLevel: nextLevelXp,
      xpIntoCurrentLevel: xpInto,
      xpProgress: xpNeeded > 0 ? xpInto / xpNeeded : 1,
      rank,
      nextRank: nextR,
      title: progress.title,
      pendingRankUp,
      pendingTrackMastery,
      addXp,
      addShards,
      spendShards,
      addStat,
      completeLesson,
      completeChallenge,
      addTerminalCommand,
      claimDailyQuest,
      unlockTitle,
      unlockFrame,
      unlockTheme,
      equipTitle,
      equipFrame,
      equipTheme,
      dismissRankUp,
      dismissTrackMastery,
      isLoaded,
    }),
    [progress, isLoaded, pendingRankUp, pendingTrackMastery]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
