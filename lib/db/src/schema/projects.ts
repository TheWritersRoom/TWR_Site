import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type", { enum: ["book", "script"] }).notNull().default("book"),
  content: text("content").notNull().default(""),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  // Publishing
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishVisibility: text("publish_visibility", { enum: ["all", "matched", "contributors"] }).notNull().default("all"),
  feedbackEnabled: boolean("feedback_enabled").notNull().default(false),
  feedbackAudience: text("feedback_audience", { enum: ["all", "matched", "contributors"] }).notNull().default("all"),
  feedbackVisibility: text("feedback_visibility", { enum: ["public", "private"] }).notNull().default("public"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
export type Feedback = typeof feedbackTable.$inferSelect;
