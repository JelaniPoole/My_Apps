import type { Express } from "express";
import { createServer, type Server } from "http";

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

  const httpServer = createServer(app);
  return httpServer;
}
