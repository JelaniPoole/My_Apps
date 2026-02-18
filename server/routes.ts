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
        return res.json({
          correct: true,
          output: step.output,
          successMessage: step.successMessage,
          completed: true,
          currentStep: run.currentStep,
          totalSteps: run.steps.length,
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

  const httpServer = createServer(app);
  return httpServer;
}
