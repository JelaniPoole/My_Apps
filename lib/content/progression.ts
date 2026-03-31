import { orderedChallenges } from "./challenges";
import { orderedLessons } from "./lessons";
import type { Achievement, CategoryRoadmap, DailyQuest } from "./types";

export const RANKS = [
  { rank: "E", title: "E-Rank Hunter", minLevel: 1, color: "#808080" },
  { rank: "D", title: "D-Rank Hunter", minLevel: 5, color: "#4DA6FF" },
  { rank: "C", title: "C-Rank Hunter", minLevel: 10, color: "#39FF14" },
  { rank: "B", title: "B-Rank Hunter", minLevel: 15, color: "#FFB800" },
  { rank: "A", title: "A-Rank Hunter", minLevel: 25, color: "#FF6B35" },
  { rank: "S", title: "S-Rank Hunter", minLevel: 40, color: "#FF2D55" },
] as const;

export function getRank(level: number) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) current = r;
  }
  return current;
}

export function getNextRank(level: number) {
  const current = getRank(level);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export const DAILY_QUESTS: DailyQuest[] = [
  { id: "dq1", title: "Clear 1 Dungeon", description: "Complete any lesson", xpReward: 25, type: "lesson", target: 1 },
  { id: "dq2", title: "Defeat 1 Boss", description: "Complete any challenge", xpReward: 30, type: "challenge", target: 1 },
  { id: "dq3", title: "Run 10 Commands", description: "Practice in the training ground", xpReward: 20, type: "terminal", target: 10 },
  { id: "dq4", title: "Clear 2 Dungeons", description: "Complete 2 lessons", xpReward: 50, type: "lesson", target: 2 },
  { id: "dq5", title: "Defeat 2 Bosses", description: "Complete 2 challenges", xpReward: 60, type: "challenge", target: 2 },
  { id: "dq6", title: "Run 25 Commands", description: "Heavy training session", xpReward: 40, type: "terminal", target: 25 },
];

export function getDailyQuests(dateStr: string): DailyQuest[] {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % 3;
  return [
    DAILY_QUESTS[idx],
    DAILY_QUESTS[idx + 3],
    { id: "dq_streak", title: "Stay Active", description: "Open the app today", xpReward: 10, type: "any", target: 1 },
  ];
}

interface AdaptiveDailyQuestInput {
  completedLessons: string[];
  completedChallenges: string[];
  terminalHistory: string[];
  currentStreak: number;
}

export function getAdaptiveDailyQuests(
  dateStr: string,
  {
    completedLessons,
    completedChallenges,
    terminalHistory,
    currentStreak,
  }: AdaptiveDailyQuestInput,
): DailyQuest[] {
  const baseQuests = getDailyQuests(dateStr);
  const nextLesson =
    orderedLessons.find((lesson) => !completedLessons.includes(lesson.id)) ?? null;
  const nextChallenge =
    orderedChallenges.find(
      (challenge) => !completedChallenges.includes(challenge.id),
    ) ?? null;
  const uniqueCommands = new Set(
    terminalHistory.map((command) => command.trim().split(/\s+/)[0]).filter(Boolean),
  ).size;

  return baseQuests.map((quest) => {
    if (quest.type === "lesson" && nextLesson) {
      return {
        ...quest,
        title:
          quest.target > 1
            ? `Push Through ${quest.target} Lessons`
            : `Advance ${nextLesson.category}`,
        description: `Best next lesson: ${nextLesson.title}`,
      };
    }

    if (quest.type === "challenge" && nextChallenge) {
      return {
        ...quest,
        title:
          quest.target > 1
            ? `Defeat ${quest.target} Raid Bosses`
            : `Challenge Rank ${nextChallenge.difficulty}`,
        description: `Recommended boss: ${nextChallenge.title}`,
      };
    }

    if (quest.type === "terminal") {
      const terminalTarget = uniqueCommands >= 10 ? quest.target : Math.max(quest.target - 5, 5);
      return {
        ...quest,
        title: terminalTarget >= 20 ? "Heavy Training Session" : "Warm Up in Training",
        description:
          currentStreak >= 3
            ? "Keep your command streak alive in the terminal."
            : "Practice a few commands to build momentum.",
        target: terminalTarget,
      };
    }

    if (quest.type === "any") {
      return {
        ...quest,
        description:
          currentStreak > 0
            ? `Current streak: ${currentStreak} day${currentStreak === 1 ? "" : "s"}`
            : "Open the app and keep your hunter streak alive.",
      };
    }

    return quest;
  });
}

export const roadmapCategories: CategoryRoadmap[] = [
  { name: "Navigation", icon: "location", lessons: ["1", "11"], challenges: ["c1", "c2"], statType: "AGI" },
  { name: "Files", icon: "document", lessons: ["2", "3"], challenges: ["c3", "c4"], statType: "STR" },
  { name: "Viewing", icon: "eye", lessons: ["4", "12", "16"], challenges: ["c7", "c12"], statType: "INT" },
  { name: "Pipes & Text", icon: "git-merge", lessons: ["5", "6", "13"], challenges: ["c5", "c6", "c8"], statType: "INT" },
  { name: "Permissions", icon: "shield", lessons: ["7"], challenges: [], statType: "DEF" },
  { name: "Processes", icon: "activity", lessons: ["8"], challenges: ["c9"], statType: "VIT" },
  { name: "System", icon: "server", lessons: ["9", "14"], challenges: ["c10"], statType: "VIT" },
  { name: "Packages", icon: "cube", lessons: ["17"], challenges: ["c13"], statType: "VIT" },
  { name: "Logs", icon: "reader", lessons: ["18"], challenges: ["c14"], statType: "INT" },
  { name: "Git", icon: "logo-github", lessons: ["10", "15", "19"], challenges: ["c11", "c15"], statType: "INT" },
  { name: "Network", icon: "globe", lessons: [], challenges: ["c16"], statType: "AGI" },
  { name: "Advanced", icon: "construct", lessons: ["20"], challenges: ["c50"], statType: "AGI" },
];

export function getRoadmapProgress(completedLessons: string[], completedChallenges: string[]) {
  const progress: Record<string, { completed: number; total: number; pct: number }> = {};

  roadmapCategories.forEach((cat) => {
    const lessonComplete = cat.lessons.filter((id) => completedLessons.includes(id)).length;
    const challengeComplete = cat.challenges.filter((id) => completedChallenges.includes(id)).length;
    const total = cat.lessons.length + cat.challenges.length;
    const completed = lessonComplete + challengeComplete;
    progress[cat.name] = { completed, total, pct: total > 0 ? completed / total : 0 };
  });

  return progress;
}

export function getRecommendedLessons(
  completedLessons: string[],
  count = 3,
) {
  return orderedLessons
    .filter((lesson) => !completedLessons.includes(lesson.id))
    .slice(0, count);
}

export function getRecommendedChallenges(
  completedChallenges: string[],
  count = 3,
) {
  return orderedChallenges
    .filter((challenge) => !completedChallenges.includes(challenge.id))
    .slice(0, count);
}

interface AchievementProgressInput {
  completedLessons: string[];
  completedChallenges: string[];
  currentStreak: number;
  terminalHistory: string[];
}

export function getAchievements({
  completedLessons,
  completedChallenges,
  currentStreak,
  terminalHistory,
}: AchievementProgressInput): Achievement[] {
  const uniqueCommands = new Set(
    terminalHistory.map((command) => command.trim().split(/\s+/)[0]).filter(Boolean),
  ).size;
  const grepUses = terminalHistory.filter((command) =>
    command.trim().toLowerCase().startsWith("grep "),
  ).length;
  const gitUses = terminalHistory.filter((command) =>
    command.trim().toLowerCase().startsWith("git "),
  ).length;

  const baseAchievements = [
    {
      id: "first_dungeon",
      title: "Dungeon Initiate",
      description: "Clear your first lesson dungeon.",
      icon: "map",
      color: "#64D2FF",
      target: 1,
      progress: completedLessons.length,
    },
    {
      id: "first_raid",
      title: "Boss Breaker",
      description: "Defeat your first raid boss.",
      icon: "flash",
      color: "#FF8A5B",
      target: 1,
      progress: completedChallenges.length,
    },
    {
      id: "lesson_mastery",
      title: "Path Climber",
      description: "Clear 5 lesson dungeons.",
      icon: "trending-up",
      color: "#39FF14",
      target: 5,
      progress: completedLessons.length,
    },
    {
      id: "raid_hunter",
      title: "Raid Hunter",
      description: "Defeat 5 raid bosses.",
      icon: "shield",
      color: "#FFC83D",
      target: 5,
      progress: completedChallenges.length,
    },
    {
      id: "streak_keeper",
      title: "Stay Active",
      description: "Keep a 3-day streak alive.",
      icon: "flame",
      color: "#FFB800",
      target: 3,
      progress: currentStreak,
    },
    {
      id: "terminal_apprentice",
      title: "Terminal Apprentice",
      description: "Run 25 commands in total.",
      icon: "terminal",
      color: "#64D2FF",
      target: 25,
      progress: terminalHistory.length,
    },
    {
      id: "tool_collector",
      title: "Tool Collector",
      description: "Use 12 unique commands.",
      icon: "albums",
      color: "#A78BFA",
      target: 12,
      progress: uniqueCommands,
    },
    {
      id: "grep_master",
      title: "Grep Master",
      description: "Use `grep` 10 times.",
      icon: "search",
      color: "#4DA6FF",
      target: 10,
      progress: grepUses,
    },
    {
      id: "git_scout",
      title: "Git Scout",
      description: "Use Git commands 5 times.",
      icon: "git-branch",
      color: "#FF6B35",
      target: 5,
      progress: gitUses,
    },
  ];

  return baseAchievements.map((achievement) => ({
    ...achievement,
    progress: Math.min(achievement.progress, achievement.target),
    unlocked: achievement.progress >= achievement.target,
  }));
}
