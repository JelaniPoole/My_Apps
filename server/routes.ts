import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { players, quests, runs, items } from "../shared/schema";

interface RunStep {
  index: number;
  instruction: string;
  expectedCommand: string;
  hint: string;
  successMessage: string;
  output: string;
  completed: boolean;
  submittedCommand?: string;
}

const QUEST_STEPS: Record<string, RunStep[]> = {
  lesson: [
    { index: 0, instruction: "Find out where you are. Type 'pwd' to print your current directory.", expectedCommand: "pwd", hint: "pwd stands for 'print working directory'", successMessage: "You found your location!", output: "/home/hunter", completed: false },
    { index: 1, instruction: "List the contents of the current directory with 'ls'.", expectedCommand: "ls", hint: "ls stands for 'list'", successMessage: "You can see the files around you!", output: "quests  inventory  skills.sh  notes.txt", completed: false },
    { index: 2, instruction: "Move into the quests directory with 'cd quests'.", expectedCommand: "cd quests", hint: "cd stands for 'change directory'", successMessage: "You entered the quests folder!", output: "", completed: false },
    { index: 3, instruction: "Confirm your location with 'pwd'.", expectedCommand: "pwd", hint: "Use pwd to verify where you are", successMessage: "Step complete!", output: "/home/hunter/quests", completed: false },
  ],
  challenge: [
    { index: 0, instruction: "A boss appears! Search for its weakness. Use 'grep error boss.log'.", expectedCommand: "grep error boss.log", hint: "grep searches for patterns in files", successMessage: "You found the weakness!", output: "[CRITICAL] error: shield down at sector 7", completed: false },
    { index: 1, instruction: "Exploit the weakness! Make the attack script executable with 'chmod +x attack.sh'.", expectedCommand: "chmod +x attack.sh", hint: "chmod +x adds execute permission", successMessage: "Attack script ready!", output: "", completed: false },
    { index: 2, instruction: "Finish the boss! Copy the loot with 'cp loot.txt inventory/'.", expectedCommand: "cp loot.txt inventory/", hint: "cp copies files to a destination", successMessage: "Boss defeated! Loot secured!", output: "", completed: false },
  ],
  terminal: [
    { index: 0, instruction: "Warm up. Print your username with 'whoami'.", expectedCommand: "whoami", hint: "whoami shows the current user", successMessage: "Identity confirmed!", output: "hunter", completed: false },
    { index: 1, instruction: "Create a training log with 'touch training.log'.", expectedCommand: "touch training.log", hint: "touch creates an empty file", successMessage: "Training log created!", output: "", completed: false },
    { index: 2, instruction: "Record your progress. Type 'echo Level Up >> training.log'.", expectedCommand: "echo Level Up >> training.log", hint: "echo with >> appends to a file", successMessage: "Progress recorded!", output: "", completed: false },
  ],
  any: [
    { index: 0, instruction: "Check in for the day. Type 'echo I am here'.", expectedCommand: "echo I am here", hint: "echo prints text to the terminal", successMessage: "Attendance logged!", output: "I am here", completed: false },
  ],
};

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 28,
  rare: 15,
  epic: 6,
  legendary: 1,
};

const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9CA3AF",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  epic: "#A855F7",
  legendary: "#F59E0B",
};

const LOOT_TABLE = [
  { name: "Rusty Dagger", description: "A basic blade for file slicing", rarity: "common", slot: "weapon", statBonus: { STR: 1 }, icon: "dagger" },
  { name: "Worn Leather Vest", description: "Minimal protection from errors", rarity: "common", slot: "armor", statBonus: { DEF: 1 }, icon: "vest" },
  { name: "Cracked Compass", description: "Helps navigate directories", rarity: "common", slot: "accessory", statBonus: { AGI: 1 }, icon: "compass" },
  { name: "Scroll of Echo", description: "Echoes your commands louder", rarity: "common", slot: "consumable", statBonus: { INT: 1 }, icon: "scroll" },
  { name: "Health Potion", description: "Restores system vitality", rarity: "common", slot: "consumable", statBonus: { VIT: 1 }, icon: "potion" },
  { name: "Steel Shortsword", description: "Cuts through files with ease", rarity: "uncommon", slot: "weapon", statBonus: { STR: 2, AGI: 1 }, icon: "sword" },
  { name: "Chainmail Shirt", description: "Layered defense against bugs", rarity: "uncommon", slot: "armor", statBonus: { DEF: 2, VIT: 1 }, icon: "chainmail" },
  { name: "Navigator's Ring", description: "cd without getting lost", rarity: "uncommon", slot: "accessory", statBonus: { AGI: 2, INT: 1 }, icon: "ring" },
  { name: "Manual of grep", description: "Search patterns revealed", rarity: "uncommon", slot: "accessory", statBonus: { INT: 2, STR: 1 }, icon: "book" },
  { name: "Vitality Stone", description: "Keeps processes alive", rarity: "uncommon", slot: "consumable", statBonus: { VIT: 2, DEF: 1 }, icon: "stone" },
  { name: "Shadow Blade", description: "Operates silently in the background", rarity: "rare", slot: "weapon", statBonus: { STR: 4, AGI: 2 }, icon: "shadow-blade" },
  { name: "Mithril Plate", description: "Lightweight but tough permissions", rarity: "rare", slot: "armor", statBonus: { DEF: 4, VIT: 2 }, icon: "plate" },
  { name: "Amulet of sudo", description: "Elevates your authority", rarity: "rare", slot: "accessory", statBonus: { DEF: 3, STR: 2, INT: 1 }, icon: "amulet" },
  { name: "Tome of Regex", description: "Master of pattern matching", rarity: "rare", slot: "accessory", statBonus: { INT: 4, AGI: 2 }, icon: "tome" },
  { name: "Demon King's Axe", description: "Cleaves entire directories", rarity: "epic", slot: "weapon", statBonus: { STR: 7, AGI: 3, VIT: 2 }, icon: "axe" },
  { name: "Dragon Scale Armor", description: "Firewall-grade protection", rarity: "epic", slot: "armor", statBonus: { DEF: 7, VIT: 3, STR: 2 }, icon: "dragon-armor" },
  { name: "Crown of Root", description: "Unlimited power over the system", rarity: "epic", slot: "accessory", statBonus: { INT: 5, DEF: 4, STR: 3 }, icon: "crown" },
  { name: "Monarch's Blade of Shadows", description: "The weapon of the Shadow Monarch himself", rarity: "legendary", slot: "weapon", statBonus: { STR: 12, AGI: 8, INT: 5, VIT: 3, DEF: 2 }, icon: "monarch-blade" },
  { name: "Armor of the Absolute", description: "Worn by those who conquered every dungeon", rarity: "legendary", slot: "armor", statBonus: { DEF: 12, VIT: 8, STR: 5, AGI: 3, INT: 2 }, icon: "absolute-armor" },
  { name: "Ring of System Mastery", description: "Total command over all processes", rarity: "legendary", slot: "accessory", statBonus: { INT: 10, AGI: 6, STR: 5, DEF: 5, VIT: 4 }, icon: "mastery-ring" },
];

interface QuestTemplate {
  title: string;
  description: string;
  xpReward: number;
  type: string;
  target: number;
  rank: string;
}

const QUEST_POOL: Record<string, QuestTemplate[]> = {
  E: [
    { title: "Clear 1 Dungeon", description: "Complete any lesson", xpReward: 25, type: "lesson", target: 1, rank: "E" },
    { title: "Defeat 1 Boss", description: "Complete any challenge", xpReward: 30, type: "challenge", target: 1, rank: "E" },
    { title: "Run 5 Commands", description: "Practice in the training ground", xpReward: 15, type: "terminal", target: 5, rank: "E" },
    { title: "Run 10 Commands", description: "Train harder today", xpReward: 20, type: "terminal", target: 10, rank: "E" },
    { title: "Stay Active", description: "Open the app today", xpReward: 10, type: "any", target: 1, rank: "E" },
    { title: "Clear 2 Dungeons", description: "Complete 2 lessons", xpReward: 50, type: "lesson", target: 2, rank: "E" },
    { title: "Defeat 2 Bosses", description: "Complete 2 challenges", xpReward: 60, type: "challenge", target: 2, rank: "E" },
  ],
  D: [
    { title: "Clear 2 Dungeons", description: "Push through 2 lessons", xpReward: 60, type: "lesson", target: 2, rank: "D" },
    { title: "Defeat 2 Bosses", description: "Take on 2 bosses", xpReward: 70, type: "challenge", target: 2, rank: "D" },
    { title: "Run 20 Commands", description: "Serious training session", xpReward: 35, type: "terminal", target: 20, rank: "D" },
    { title: "Clear 3 Dungeons", description: "A real grind", xpReward: 80, type: "lesson", target: 3, rank: "D" },
    { title: "Stay Active", description: "Show up every day", xpReward: 15, type: "any", target: 1, rank: "D" },
    { title: "Defeat 3 Bosses", description: "Triple threat", xpReward: 90, type: "challenge", target: 3, rank: "D" },
    { title: "Run 30 Commands", description: "Command mastery", xpReward: 45, type: "terminal", target: 30, rank: "D" },
  ],
  C: [
    { title: "Clear 3 Dungeons", description: "Clear 3 dungeons today", xpReward: 90, type: "lesson", target: 3, rank: "C" },
    { title: "Defeat 3 Bosses", description: "Defeat 3 bosses", xpReward: 100, type: "challenge", target: 3, rank: "C" },
    { title: "Run 40 Commands", description: "Intense training", xpReward: 50, type: "terminal", target: 40, rank: "C" },
    { title: "Clear 4 Dungeons", description: "Dungeon marathon", xpReward: 120, type: "lesson", target: 4, rank: "C" },
    { title: "Stay Active", description: "Consistency is key", xpReward: 20, type: "any", target: 1, rank: "C" },
    { title: "Defeat 4 Bosses", description: "Boss rush", xpReward: 130, type: "challenge", target: 4, rank: "C" },
    { title: "Run 50 Commands", description: "Elite training", xpReward: 60, type: "terminal", target: 50, rank: "C" },
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

function rollRarity(): Rarity {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) return rarity as Rarity;
  }
  return "common";
}

function pickLoot() {
  const rarity = rollRarity();
  const candidates = LOOT_TABLE.filter((item) => item.rarity === rarity);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/status", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/me", async (_req: Request, res: Response) => {
    try {
      let [player] = await db.select().from(players).limit(1);
      if (!player) {
        [player] = await db.insert(players).values({
          name: "Hunter",
          rank: "E",
          level: 1,
          xp: 0,
          stats: { STR: 1, INT: 1, AGI: 1, VIT: 1, DEF: 1 },
          title: "E-Rank Hunter",
        }).returning();
      }
      res.json(player);
    } catch (err) {
      console.error("Error in /api/me:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/quests/generate", async (req: Request, res: Response) => {
    try {
      const rank = ((req.body?.rank as string) || "E").toUpperCase();
      const today = new Date().toISOString().slice(0, 10);

      await db.delete(quests).where(eq(quests.date, today));

      const pool = QUEST_POOL[rank] || QUEST_POOL["E"];
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 5);

      const inserted = await db.insert(quests).values(
        selected.map((q) => ({
          title: q.title,
          description: q.description,
          xpReward: q.xpReward,
          type: q.type,
          target: q.target,
          rank: q.rank,
          date: today,
        }))
      ).returning();

      res.json({ date: today, quests: inserted });
    } catch (err) {
      console.error("Error in /api/quests/generate:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/quests/today", async (_req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      let todayQuests = await db.select().from(quests).where(eq(quests.date, today));

      if (todayQuests.length === 0) {
        const pool = QUEST_POOL["E"];
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5);

        todayQuests = await db.insert(quests).values(
          selected.map((q) => ({
            title: q.title,
            description: q.description,
            xpReward: q.xpReward,
            type: q.type,
            target: q.target,
            rank: q.rank,
            date: today,
          }))
        ).returning();
      }

      res.json({ date: today, quests: todayQuests });
    } catch (err) {
      console.error("Error in /api/quests/today:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/quests/:id/start", async (req: Request, res: Response) => {
    try {
      const questId = req.params.id as string;
      const [quest] = await db.select().from(quests).where(eq(quests.id, questId));

      if (!quest) {
        return res.status(404).json({ error: "Quest not found" });
      }

      const [existingRun] = await db.select().from(runs)
        .where(and(eq(runs.questId, questId), eq(runs.status, "in_progress")));

      if (existingRun) {
        return res.json(existingRun);
      }

      const templateSteps = QUEST_STEPS[quest.type] || QUEST_STEPS["any"];
      const steps: RunStep[] = templateSteps.map((s) => ({ ...s, completed: false, submittedCommand: undefined }));

      const [run] = await db.insert(runs).values({
        questId,
        status: "in_progress",
        currentStep: 0,
        steps,
      }).returning();

      res.json(run);
    } catch (err) {
      console.error("Error in /api/quests/:id/start:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/runs/:runId/submit", async (req: Request, res: Response) => {
    try {
      const runId = req.params.runId as string;
      const { command } = req.body || {};

      const [run] = await db.select().from(runs).where(eq(runs.id, runId));
      if (!run) {
        return res.status(404).json({ error: "Run not found" });
      }

      if (run.status === "completed") {
        return res.status(400).json({ error: "Run already completed", run });
      }

      if (!command || typeof command !== "string") {
        return res.status(400).json({ error: "Missing 'command' in request body" });
      }

      const stepsData = run.steps as RunStep[];
      const step = stepsData[run.currentStep];
      if (!step) {
        return res.status(400).json({ error: "No current step available" });
      }

      const trimmed = command.trim().toLowerCase();
      const expected = step.expectedCommand.toLowerCase();
      const correct = trimmed === expected;

      step.submittedCommand = command.trim();

      if (correct) {
        step.completed = true;

        if (run.currentStep < stepsData.length - 1) {
          const newStep = run.currentStep + 1;
          const [updatedRun] = await db.update(runs)
            .set({ steps: stepsData, currentStep: newStep })
            .where(eq(runs.id, runId))
            .returning();

          return res.json({
            correct: true,
            output: step.output,
            successMessage: step.successMessage,
            completed: false,
            currentStep: newStep,
            totalSteps: stepsData.length,
            nextInstruction: stepsData[newStep].instruction,
            run: updatedRun,
          });
        } else {
          const [updatedRun] = await db.update(runs)
            .set({ steps: stepsData, status: "completed", completedAt: new Date() })
            .where(eq(runs.id, runId))
            .returning();

          const lootData = pickLoot();
          const [lootItem] = await db.insert(items).values({
            name: lootData.name,
            description: lootData.description,
            rarity: lootData.rarity,
            slot: lootData.slot,
            statBonus: lootData.statBonus,
            icon: lootData.icon,
            equipped: false,
          }).returning();

          return res.json({
            correct: true,
            output: step.output,
            successMessage: step.successMessage,
            completed: true,
            currentStep: run.currentStep,
            totalSteps: stepsData.length,
            lootDrop: lootItem,
            run: updatedRun,
          });
        }
      } else {
        await db.update(runs)
          .set({ steps: stepsData })
          .where(eq(runs.id, runId));

        return res.json({
          correct: false,
          hint: step.hint,
          instruction: step.instruction,
          currentStep: run.currentStep,
          totalSteps: stepsData.length,
          run: { ...run, steps: stepsData },
        });
      }
    } catch (err) {
      console.error("Error in /api/runs/:runId/submit:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/inventory", async (_req: Request, res: Response) => {
    try {
      const allItems = await db.select().from(items);
      const equipped = allItems.filter((i) => i.equipped);
      const totalBonus: Record<string, number> = {};
      for (const item of equipped) {
        const bonus = item.statBonus as Record<string, number>;
        for (const [stat, val] of Object.entries(bonus)) {
          totalBonus[stat] = (totalBonus[stat] || 0) + (val || 0);
        }
      }

      res.json({
        items: allItems,
        equipped,
        totalStatBonus: totalBonus,
        rarityColors: RARITY_COLORS,
      });
    } catch (err) {
      console.error("Error in /api/inventory:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/inventory/equip", async (req: Request, res: Response) => {
    try {
      const { itemId, unequip } = req.body || {};

      if (!itemId) {
        return res.status(400).json({ error: "Missing 'itemId' in request body" });
      }

      const [item] = await db.select().from(items).where(eq(items.id, itemId));
      if (!item) {
        return res.status(404).json({ error: "Item not found in inventory" });
      }

      if (unequip) {
        const [updated] = await db.update(items)
          .set({ equipped: false })
          .where(eq(items.id, itemId))
          .returning();
        return res.json({ action: "unequipped", item: updated, message: `${updated.name} unequipped` });
      }

      if (item.slot !== "consumable") {
        await db.update(items)
          .set({ equipped: false })
          .where(and(eq(items.equipped, true), eq(items.slot, item.slot)));
      }

      const [updated] = await db.update(items)
        .set({ equipped: true })
        .where(eq(items.id, itemId))
        .returning();

      res.json({ action: "equipped", item: updated, message: `${updated.name} equipped!` });
    } catch (err) {
      console.error("Error in /api/inventory/equip:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
