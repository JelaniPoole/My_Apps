import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "@/lib/api";
import { getDailyQuests, getRank, getNextRank } from "@/lib/linux-data";

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
  stats: Stats;
  completedLessons: string[];
  completedChallenges: string[];
  currentStreak: number;
  lastActiveDate: string;
  terminalHistory: string[];
  dailyProgress: DailyProgress;
  totalPowerUps: number;
  title: string;
}

interface ProgressContextValue {
  xp: number;
  stats: Stats;
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
  addXp: (amount: number) => void;
  addStat: (type: keyof Stats, amount: number) => void;
  completeLesson: (lessonId: string) => void;
  completeChallenge: (challengeId: string) => void;
  addTerminalCommand: (cmd: string) => void;
  claimDailyQuest: (questId: string) => void;
  isLoaded: boolean;
}

const STORAGE_KEY = "@terminal_quest_progress_v2";

const defaultProgress: ProgressData = {
  xp: 0,
  stats: { STR: 1, INT: 1, AGI: 1, VIT: 1, DEF: 1 },
  completedLessons: [],
  completedChallenges: [],
  currentStreak: 0,
  lastActiveDate: "",
  terminalHistory: [],
  dailyProgress: { lessonsToday: 0, challengesToday: 0, commandsToday: 0, questsClaimed: [] },
  totalPowerUps: 0,
  title: "Novice",
};

type ServerProgressPayload = Partial<ProgressData> & {
  xp?: number;
  stats?: Stats;
};

async function fetchServerProgress(): Promise<ServerProgressPayload | null> {
  try {
    const res = await fetch(apiUrl("/api/me"));
    if (!res.ok) return null;
    const data = (await res.json()) as ServerProgressPayload;
    if (typeof data.xp !== "number" || typeof data.stats !== "object") return null;
    return data;
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

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ProgressData;
        const today = new Date().toDateString();
        const lastActive = parsed.lastActiveDate;

        let streak = parsed.currentStreak;
        let dailyProgress = parsed.dailyProgress;

        if (lastActive && lastActive !== today) {
          const lastDate = new Date(lastActive);
          const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diff > 1) streak = 0;
          dailyProgress = { lessonsToday: 0, challengesToday: 0, commandsToday: 0, questsClaimed: [] };
        }

        setProgress({ ...parsed, currentStreak: streak, dailyProgress });
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
          stats: {
            STR: Math.max(prev.stats.STR, server.stats?.STR ?? 0),
            INT: Math.max(prev.stats.INT, server.stats?.INT ?? 0),
            AGI: Math.max(prev.stats.AGI, server.stats?.AGI ?? 0),
            VIT: Math.max(prev.stats.VIT, server.stats?.VIT ?? 0),
            DEF: Math.max(prev.stats.DEF, server.stats?.DEF ?? 0),
          },
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

      const final = { ...updated, currentStreak: streak, lastActiveDate: today };
      saveProgress(final);
      void syncProgressToServer(final);
      return final;
    });
  }

  function addXp(amount: number) {
    updateProgress((prev) => ({ ...prev, xp: prev.xp + amount }));
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
        dailyProgress: { ...prev.dailyProgress, questsClaimed: [...prev.dailyProgress.questsClaimed, questId] },
      };
    });
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
      stats: progress.stats,
      totalPower,
      completedLessons: progress.completedLessons,
      completedChallenges: progress.completedChallenges,
      currentStreak: progress.currentStreak,
      terminalHistory: progress.terminalHistory,
      dailyProgress: progress.dailyProgress,
      level,
      xpForNextLevel: nextLevelXp,
      xpIntoCurrentLevel: xpInto,
      xpProgress: xpNeeded > 0 ? xpInto / xpNeeded : 1,
      rank,
      nextRank: nextR,
      title: progress.title,
      addXp,
      addStat,
      completeLesson,
      completeChallenge,
      addTerminalCommand,
      claimDailyQuest,
      isLoaded,
    }),
    [progress, isLoaded]
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
