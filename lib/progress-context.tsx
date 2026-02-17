import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ProgressData {
  xp: number;
  completedLessons: string[];
  completedChallenges: string[];
  currentStreak: number;
  lastActiveDate: string;
  terminalHistory: string[];
}

interface ProgressContextValue {
  xp: number;
  completedLessons: string[];
  completedChallenges: string[];
  currentStreak: number;
  terminalHistory: string[];
  level: number;
  xpForNextLevel: number;
  xpProgress: number;
  addXp: (amount: number) => void;
  completeLesson: (lessonId: string) => void;
  completeChallenge: (challengeId: string) => void;
  addTerminalCommand: (cmd: string) => void;
  isLoaded: boolean;
}

const STORAGE_KEY = "@terminal_quest_progress";

const defaultProgress: ProgressData = {
  xp: 0,
  completedLessons: [],
  completedChallenges: [],
  currentStreak: 0,
  lastActiveDate: "",
  terminalHistory: [],
};

function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function xpForLevel(level: number): number {
  return level * 100;
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
        if (lastActive) {
          const lastDate = new Date(lastActive);
          const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diff > 1) {
            streak = 0;
          }
        }

        setProgress({ ...parsed, currentStreak: streak });
      }
    } catch (e) {
      console.error("Failed to load progress", e);
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
          if (diff <= 1) {
            streak = updated.currentStreak + 1;
          } else {
            streak = 1;
          }
        } else {
          streak = 1;
        }
      }

      const final = { ...updated, currentStreak: streak, lastActiveDate: today };
      saveProgress(final);
      return final;
    });
  }

  function addXp(amount: number) {
    updateProgress((prev) => ({ ...prev, xp: prev.xp + amount }));
  }

  function completeLesson(lessonId: string) {
    updateProgress((prev) => {
      if (prev.completedLessons.includes(lessonId)) return prev;
      return { ...prev, completedLessons: [...prev.completedLessons, lessonId] };
    });
  }

  function completeChallenge(challengeId: string) {
    updateProgress((prev) => {
      if (prev.completedChallenges.includes(challengeId)) return prev;
      return { ...prev, completedChallenges: [...prev.completedChallenges, challengeId] };
    });
  }

  function addTerminalCommand(cmd: string) {
    setProgress((prev) => {
      const history = [...prev.terminalHistory, cmd].slice(-50);
      const updated = { ...prev, terminalHistory: history };
      saveProgress(updated);
      return updated;
    });
  }

  const level = calculateLevel(progress.xp);
  const xpNeeded = xpForLevel(level);
  const xpIntoLevel = progress.xp - (level - 1) * 100;

  const value = useMemo(
    () => ({
      xp: progress.xp,
      completedLessons: progress.completedLessons,
      completedChallenges: progress.completedChallenges,
      currentStreak: progress.currentStreak,
      terminalHistory: progress.terminalHistory,
      level,
      xpForNextLevel: xpNeeded,
      xpProgress: xpIntoLevel / 100,
      addXp,
      completeLesson,
      completeChallenge,
      addTerminalCommand,
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
