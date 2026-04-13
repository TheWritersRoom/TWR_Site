import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { pitchesTable } from "./projects";

export const pitchInvitesTable = pgTable("pitch_invites", {
  id: serial("id").primaryKey(),
  pitchId: integer("pitch_id").notNull().references(() => pitchesTable.id, { onDelete: "cascade" }),
  fromUserId: integer("from_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  toUserId: integer("to_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  message: text("message").default(""),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPitchInviteSchema = createInsertSchema(pitchInvitesTable).omit({ id: true, createdAt: true });
export type InsertPitchInvite = z.infer<typeof insertPitchInviteSchema>;
export type PitchInvite = typeof pitchInvitesTable.$inferSelect;
