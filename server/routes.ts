import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { getPlayer, updatePlayer } from "./player-store";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/status", (_req, res) => {
    res.json({ ok: true, service: "backend", time: new Date().toISOString() });
  });

  // Player profile (persistent via database or file store)
  app.get("/api/me", async (_req, res) => {
    try {
      const player = await getPlayer();
      res.json({
        id: player.id,
        name: player.name,
        level: player.level,
        xp: player.xp,
        rank: player.rank,
        title: player.title,
        stats: player.stats,
        progress: player.progress,
      });
    } catch (err) {
      console.error("Failed to load player:", err);
      res.status(500).json({ error: "Failed to load player" });
    }
  });

  app.patch("/api/me", async (req, res) => {
    const { xp, stats, name, title, progress } = req.body as {
      xp?: number;
      stats?: Record<string, number>;
      name?: string;
      title?: string;
      progress?: any;
    };

    const updates: Record<string, unknown> = {};
    if (typeof xp === "number") updates.xp = xp;
    if (stats && typeof stats === "object") updates.stats = stats;
    if (typeof name === "string") updates.name = name;
    if (typeof title === "string") updates.title = title;
    if (progress && typeof progress === "object") updates.progress = progress;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    try {
      const updated = await updatePlayer(updates);
      res.json(updated);
    } catch (err) {
      console.error("Failed to update player:", err);
      res.status(500).json({ error: "Failed to update player" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
