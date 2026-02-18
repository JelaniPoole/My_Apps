import type { Express } from "express";
import { createServer, type Server } from "http";

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: "lesson" | "challenge" | "terminal" | "any";
  target: number;
  rank: string;
}

const QUEST_POOL: Record<string, Quest[]> = {
  E: [
    { id: "", title: "Clear 1 Dungeon", description: "Complete any lesson", xpReward: 25, type: "lesson", target: 1, rank: "E" },
    { id: "", title: "Defeat 1 Boss", description: "Complete any challenge", xpReward: 30, type: "challenge", target: 1, rank: "E" },
    { id: "", title: "Run 5 Commands", description: "Practice in the training ground", xpReward: 15, type: "terminal", target: 5, rank: "E" },
    { id: "", title: "Run 10 Commands", description: "Train harder today", xpReward: 20, type: "terminal", target: 10, rank: "E" },
    { id: "", title: "Stay Active", description: "Open the app today", xpReward: 10, type: "any", target: 1, rank: "E" },
    { id: "", title: "Clear 2 Dungeons", description: "Complete 2 lessons", xpReward: 50, type: "lesson", target: 2, rank: "E" },
    { id: "", title: "Defeat 2 Bosses", description: "Complete 2 challenges", xpReward: 60, type: "challenge", target: 2, rank: "E" },
  ],
  D: [
    { id: "", title: "Clear 2 Dungeons", description: "Push through 2 lessons", xpReward: 60, type: "lesson", target: 2, rank: "D" },
    { id: "", title: "Defeat 2 Bosses", description: "Take on 2 bosses", xpReward: 70, type: "challenge", target: 2, rank: "D" },
    { id: "", title: "Run 20 Commands", description: "Serious training session", xpReward: 35, type: "terminal", target: 20, rank: "D" },
    { id: "", title: "Clear 3 Dungeons", description: "A real grind", xpReward: 80, type: "lesson", target: 3, rank: "D" },
    { id: "", title: "Stay Active", description: "Show up every day", xpReward: 15, type: "any", target: 1, rank: "D" },
    { id: "", title: "Defeat 3 Bosses", description: "Triple threat", xpReward: 90, type: "challenge", target: 3, rank: "D" },
    { id: "", title: "Run 30 Commands", description: "Command mastery", xpReward: 45, type: "terminal", target: 30, rank: "D" },
  ],
  C: [
    { id: "", title: "Clear 3 Dungeons", description: "Clear 3 dungeons today", xpReward: 90, type: "lesson", target: 3, rank: "C" },
    { id: "", title: "Defeat 3 Bosses", description: "Defeat 3 bosses", xpReward: 100, type: "challenge", target: 3, rank: "C" },
    { id: "", title: "Run 40 Commands", description: "Intense training", xpReward: 50, type: "terminal", target: 40, rank: "C" },
    { id: "", title: "Clear 4 Dungeons", description: "Dungeon marathon", xpReward: 120, type: "lesson", target: 4, rank: "C" },
    { id: "", title: "Stay Active", description: "Consistency is key", xpReward: 20, type: "any", target: 1, rank: "C" },
    { id: "", title: "Defeat 4 Bosses", description: "Boss rush", xpReward: 130, type: "challenge", target: 4, rank: "C" },
    { id: "", title: "Run 50 Commands", description: "Elite training", xpReward: 60, type: "terminal", target: 50, rank: "C" },
  ],
};

["B", "A", "S"].forEach((rank) => {
  QUEST_POOL[rank] = QUEST_POOL["C"].map((q) => ({
    ...q,
    rank,
    xpReward: Math.round(q.xpReward * (rank === "B" ? 1.3 : rank === "A" ? 1.6 : 2)),
    target: Math.round(q.target * (rank === "B" ? 1.2 : rank === "A" ? 1.5 : 2)),
  }));
});

let storedQuests: Quest[] = [];
let storedQuestsDate = "";

function generateQuests(rank: string): Quest[] {
  const pool = QUEST_POOL[rank] || QUEST_POOL["E"];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 5);
  return selected.map((q, i) => ({
    ...q,
    id: `quest_${Date.now()}_${i}`,
  }));
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/status", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/me", (_req, res) => {
    res.json({
      id: 1,
      name: "Hunter",
      rank: "E",
      level: 1,
      xp: 0,
      stats: { STR: 1, INT: 1, AGI: 1, VIT: 1, DEF: 1 },
      title: "E-Rank Hunter",
    });
  });

  app.post("/api/quests/generate", (req, res) => {
    const rank = (req.body?.rank as string) || "E";
    const today = new Date().toISOString().slice(0, 10);

    storedQuests = generateQuests(rank.toUpperCase());
    storedQuestsDate = today;

    res.json({ date: today, quests: storedQuests });
  });

  app.get("/api/quests/today", (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);

    if (storedQuestsDate !== today || storedQuests.length === 0) {
      storedQuests = generateQuests("E");
      storedQuestsDate = today;
    }

    res.json({ date: storedQuestsDate, quests: storedQuests });
  });

  const httpServer = createServer(app);
  return httpServer;
}
