import { pgTable, text, serial, timestamp, integer, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type", { enum: ["book", "script"] }).notNull().default("book"),
  content: text("content").notNull().default(""),
  synopsis: text("synopsis"),
  contentMode: text("content_mode", { enum: ["full", "synopsis"] }).notNull().default("full"),
  genres: text("genres").notNull().default("[]"),
  notes: text("notes"),
  ownershipTerms: text("ownership_terms", { enum: ["sole", "shared"] }).notNull().default("sole"),
  ownershipNotes: text("ownership_notes"),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  collaboratorLimit: integer("collaborator_limit").notNull().default(6),
  // Publishing
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishVisibility: text("publish_visibility", { enum: ["all", "matched", "contributors"] }).notNull().default("all"),
  feedbackEnabled: boolean("feedback_enabled").notNull().default(false),
  feedbackAudience: text("feedback_audience", { enum: ["all", "matched", "contributors"] }).notNull().default("all"),
  feedbackVisibility: text("feedback_visibility", { enum: ["public", "private"] }).notNull().default("public"),
  isAdultContent: boolean("is_adult_content").notNull().default(false),
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

export const ratingsTable = pgTable("ratings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [uniqueIndex("ratings_project_user_idx").on(t.projectId, t.userId)]);

export const pitchesTable = pgTable("pitches", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["book", "script", "other"] }).notNull().default("other"),
  genres: text("genres").notNull().default("[]"),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const pitchResponsesTable = pgTable("pitch_responses", {
  id: serial("id").primaryKey(),
  pitchId: integer("pitch_id").notNull().references(() => pitchesTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: text("type", { enum: ["feedback", "interest"] }).notNull(),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const joinRequestsTable = pgTable("join_requests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  message: text("message").notNull().default(""),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("join_requests_project_user_idx").on(t.projectId, t.userId),
  index("join_requests_project_status_idx").on(t.projectId, t.status),
]);

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
export type Feedback = typeof feedbackTable.$inferSelect;
export type Rating = typeof ratingsTable.$inferSelect;
export type Pitch = typeof pitchesTable.$inferSelect;
export type PitchResponse = typeof pitchResponsesTable.$inferSelect;
export type JoinRequest = typeof joinRequestsTable.$inferSelect;
