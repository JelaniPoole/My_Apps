import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

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

interface Run {
  id: string;
  questId: string;
  status: "in_progress" | "completed" | "failed";
  currentStep: number;
  steps: RunStep[];
  startedAt: string;
  completedAt?: string;
}

const runs = new Map<string, Run>();

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
type ItemSlot = "weapon" | "armor" | "accessory" | "consumable";

interface LootItem {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  slot: ItemSlot;
  statBonus: Partial<Record<"STR" | "INT" | "AGI" | "VIT" | "DEF", number>>;
  icon: string;
}

interface InventoryItem extends LootItem {
  equipped: boolean;
  acquiredAt: string;
}

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

const LOOT_TABLE: Omit<LootItem, "id">[] = [
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

const inventory: InventoryItem[] = [];

function rollRarity(): Rarity {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) return rarity as Rarity;
  }
  return "common";
}

function dropLoot(): InventoryItem {
  const rarity = rollRarity();
  const candidates = LOOT_TABLE.filter((item) => item.rarity === rarity);
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    ...picked,
    id: generateId(),
    equipped: false,
    acquiredAt: new Date().toISOString(),
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

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

  app.post("/api/quests/:id/start", (req: Request, res: Response) => {
    const questId = req.params.id as string;
    const quest = storedQuests.find((q) => q.id === questId);

    if (!quest) {
      return res.status(404).json({ error: "Quest not found" });
    }

    const existingRun = Array.from(runs.values()).find(
      (r) => r.questId === questId && r.status === "in_progress"
    );
    if (existingRun) {
      return res.json(existingRun);
    }

    const templateSteps = QUEST_STEPS[quest.type] || QUEST_STEPS["any"];
    const steps: RunStep[] = templateSteps.map((s) => ({ ...s, completed: false, submittedCommand: undefined }));

    const run: Run = {
      id: generateId(),
      questId,
      status: "in_progress",
      currentStep: 0,
      steps,
      startedAt: new Date().toISOString(),
    };

    runs.set(run.id, run);
    res.json(run);
  });

  app.post("/api/runs/:runId/submit", (req: Request, res: Response) => {
    const runId = req.params.runId as string;
    const { command } = req.body || {};

    const run = runs.get(runId);
    if (!run) {
      return res.status(404).json({ error: "Run not found" });
    }

    if (run.status === "completed") {
      return res.status(400).json({ error: "Run already completed", run });
    }

    if (!command || typeof command !== "string") {
      return res.status(400).json({ error: "Missing 'command' in request body" });
    }

    const step = run.steps[run.currentStep];
    if (!step) {
      return res.status(400).json({ error: "No current step available" });
    }

    const trimmed = command.trim().toLowerCase();
    const expected = step.expectedCommand.toLowerCase();
    const correct = trimmed === expected;

    step.submittedCommand = command.trim();

    if (correct) {
      step.completed = true;

      if (run.currentStep < run.steps.length - 1) {
        run.currentStep++;
        return res.json({
          correct: true,
          output: step.output,
          successMessage: step.successMessage,
          completed: false,
          currentStep: run.currentStep,
          totalSteps: run.steps.length,
          nextInstruction: run.steps[run.currentStep].instruction,
          run,
        });
      } else {
        run.status = "completed";
        run.completedAt = new Date().toISOString();
        const loot = dropLoot();
        inventory.push(loot);
        return res.json({
          correct: true,
          output: step.output,
          successMessage: step.successMessage,
          completed: true,
          currentStep: run.currentStep,
          totalSteps: run.steps.length,
          lootDrop: loot,
          run,
        });
      }
    } else {
      return res.json({
        correct: false,
        hint: step.hint,
        instruction: step.instruction,
        currentStep: run.currentStep,
        totalSteps: run.steps.length,
        run,
      });
    }
  });

  app.get("/api/inventory", (_req: Request, res: Response) => {
    const equipped = inventory.filter((i) => i.equipped);
    const totalBonus: Record<string, number> = {};
    for (const item of equipped) {
      for (const [stat, val] of Object.entries(item.statBonus)) {
        totalBonus[stat] = (totalBonus[stat] || 0) + (val || 0);
      }
    }

    res.json({
      items: inventory,
      equipped,
      totalStatBonus: totalBonus,
      rarityColors: RARITY_COLORS,
    });
  });

  app.post("/api/inventory/equip", (req: Request, res: Response) => {
    const { itemId, unequip } = req.body || {};

    if (!itemId) {
      return res.status(400).json({ error: "Missing 'itemId' in request body" });
    }

    const item = inventory.find((i) => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found in inventory" });
    }

    if (unequip) {
      item.equipped = false;
      return res.json({ action: "unequipped", item, message: `${item.name} unequipped` });
    }

    if (item.slot !== "consumable") {
      const alreadyEquipped = inventory.find(
        (i) => i.equipped && i.slot === item.slot && i.id !== item.id
      );
      if (alreadyEquipped) {
        alreadyEquipped.equipped = false;
      }
    }

    item.equipped = true;
    res.json({ action: "equipped", item, message: `${item.name} equipped!` });
  });

  const httpServer = createServer(app);
  return httpServer;
}
