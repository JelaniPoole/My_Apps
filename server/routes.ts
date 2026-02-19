import type { Express } from "express";
import { createServer, type Server } from "node:http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/status", (_req, res) => {
    res.json({ ok: true, service: "backend", time: new Date().toISOString() });
  });

  // Basic player profile (temporary hardcoded data)
  app.get("/api/me", (_req, res) => {
    res.json({
      id: "demo",
      name: "Jelani",
      level: 1,
      xp: 0,
      rank: "E",
      gold: 0,
      stats: { str: 1, dex: 1, int: 1, vit: 1 },
      inventory: [],
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
