import fs from "fs";
import path from "path";

import { db, hasDb } from "./db";
import { eq } from "drizzle-orm";
import { players } from "../shared/schema";

export type PlayerProgress = {
  xp: number;
  stats: { STR: number; INT: number; AGI: number; VIT: number; DEF: number };
  completedLessons: string[];
  completedChallenges: string[];
  currentStreak: number;
  lastActiveDate: string;
  terminalHistory: string[];
  dailyProgress: {
    lessonsToday: number;
    challengesToday: number;
    commandsToday: number;
    questsClaimed: string[];
  };
  totalPowerUps: number;
  title: string;
};

export type PlayerRecord = {
  id: string;
  name: string;
  level: number;
  xp: number;
  rank: string;
  title: string;
  stats: { STR: number; INT: number; AGI: number; VIT: number; DEF: number };
  progress: PlayerProgress;
};

const DEMO_PLAYER_ID = "Jelani-1234"; // In a real app, this would be dynamic or tied to auth
const STORE_PATH = path.resolve(process.cwd(), "server", "player.json");

const DEFAULT_PROGRESS: PlayerProgress = {
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

const DEFAULT_PLAYER: PlayerRecord = {
  id: DEMO_PLAYER_ID,
  name: "Hunter",
  level: 1,
  xp: 0,
  rank: "E",
  title: "E-Rank Hunter",
  stats: { STR: 1, INT: 1, AGI: 1, VIT: 1, DEF: 1 },
  progress: DEFAULT_PROGRESS,
};

async function ensureFileData(): Promise<PlayerRecord> {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      await fs.promises.writeFile(STORE_PATH, JSON.stringify(DEFAULT_PLAYER, null, 2), "utf-8");
      return DEFAULT_PLAYER;
    }

    const raw = await fs.promises.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<PlayerRecord>;
    return {
      ...DEFAULT_PLAYER,
      ...parsed,
      progress: { ...DEFAULT_PROGRESS, ...(parsed.progress ?? {}) },
      stats: { ...DEFAULT_PLAYER.stats, ...(parsed.stats ?? {}) },
    };
  } catch (err) {
    console.warn("Failed to read player store, using defaults", err);
    return DEFAULT_PLAYER;
  }
}

async function writeFileData(data: PlayerRecord): Promise<void> {
  try {
    await fs.promises.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write player store", err);
  }
}

export async function getPlayer(): Promise<PlayerRecord> {
  if (hasDb && db) {
    const existing = await db
      .select()
      .from(players)
      .where(eq(players.id, DEMO_PLAYER_ID))
      .limit(1);

    if (existing.length) return existing[0] as PlayerRecord;

    const inserted = await db
      .insert(players)
      .values({ id: DEMO_PLAYER_ID, name: DEFAULT_PLAYER.name, progress: DEFAULT_PROGRESS })
      .returning();

    return inserted[0] as PlayerRecord;
  }

  return ensureFileData();
}

export async function updatePlayer(updates: Partial<PlayerRecord>): Promise<PlayerRecord> {
  if (hasDb && db) {
    const updated = await db
      .update(players)
      .set(updates as any)
      .where(eq(players.id, DEMO_PLAYER_ID))
      .returning();

    if (updated.length) return updated[0] as PlayerRecord;

    return getPlayer();
  }

  const current = await ensureFileData();
  const merged = {
    ...current,
    ...updates,
    stats: { ...current.stats, ...(updates.stats ?? {}) },
    progress: { ...current.progress, ...(updates.progress ?? {}) },
  };
  await writeFileData(merged);
  return merged;
}
