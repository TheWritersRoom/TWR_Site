import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const suggestionsTable = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  submitterId: integer("submitter_id").notNull().references(() => usersTable.id),
  originalText: text("original_text").notNull(),
  suggestedText: text("suggested_text").notNull(),
  comment: text("comment"),
  status: text("status", { enum: ["pending", "accepted", "discarded"] }).notNull().default("pending"),
  votingOpen: boolean("voting_open").notNull().default(false),
  ownerNote: text("owner_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSuggestionSchema = createInsertSchema(suggestionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestionsTable.$inferSelect;
