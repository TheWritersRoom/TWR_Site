import { pgTable, text, serial, timestamp, integer, index, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const plannersTable = pgTable("structure_planners", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  projectId: integer("project_id").references(() => projectsTable.id),
  title: text("title").notNull(),
  synopsis: text("synopsis"),
  mediaType: text("media_type", { enum: ["tv", "book", "serial", "other"] }).notNull().default("tv"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("planners_owner_idx").on(t.ownerId),
]);

export const plannerCardsTable = pgTable("planner_cards", {
  id: serial("id").primaryKey(),
  plannerId: integer("planner_id").notNull().references(() => plannersTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  episodeNumber: text("episode_number"),
  title: text("title").notNull().default("Untitled"),
  logline: text("logline"),
  synopsis: text("synopsis"),
  theme: text("theme"),
  characterArc: text("character_arc"),
  characters: text("characters").notNull().default("[]"),
  tags: text("tags").notNull().default("[]"),
  status: text("status", { enum: ["draft", "outline", "writing", "complete"] }).notNull().default("draft"),
  wordCount: integer("word_count").notNull().default(0),
  targetWordCount: integer("target_word_count"),
  assignee: text("assignee"),
  dueDate: text("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("planner_cards_planner_idx").on(t.plannerId),
  index("planner_cards_position_idx").on(t.plannerId, t.position),
]);

export const plannerContributorsTable = pgTable("planner_contributors", {
  id: serial("id").primaryKey(),
  plannerId: integer("planner_id").notNull().references(() => plannersTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["viewer", "editor"] }).notNull().default("editor"),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("unique_planner_contributor").on(t.plannerId, t.userId),
  index("planner_contrib_planner_idx").on(t.plannerId),
]);

export type Planner = typeof plannersTable.$inferSelect;
export type PlannerCard = typeof plannerCardsTable.$inferSelect;
export type PlannerContributor = typeof plannerContributorsTable.$inferSelect;
