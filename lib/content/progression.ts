import type { CategoryRoadmap, DailyQuest } from "./types";

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
