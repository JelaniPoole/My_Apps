import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const players = pgTable("players", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("Hunter"),
  rank: text("rank").notNull().default("E"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  stats: jsonb("stats").notNull().default({ STR: 1, INT: 1, AGI: 1, VIT: 1, DEF: 1 }),
  title: text("title").notNull().default("E-Rank Hunter"),
  progress: jsonb("progress").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

export const quests = pgTable("quests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  xpReward: integer("xp_reward").notNull(),
  type: text("type").notNull(),
  target: integer("target").notNull(),
  rank: text("rank").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Quest = typeof quests.$inferSelect;
export type InsertQuest = typeof quests.$inferInsert;

export const runs = pgTable("runs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  questId: varchar("quest_id").notNull(),
  status: text("status").notNull().default("in_progress"),
  currentStep: integer("current_step").notNull().default(0),
  steps: jsonb("steps").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type Run = typeof runs.$inferSelect;
export type InsertRun = typeof runs.$inferInsert;

export const items = pgTable("items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  rarity: text("rarity").notNull(),
  slot: text("slot").notNull(),
  statBonus: jsonb("stat_bonus").notNull(),
  icon: text("icon").notNull(),
  equipped: boolean("equipped").notNull().default(false),
  acquiredAt: timestamp("acquired_at").notNull().defaultNow(),
});

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
