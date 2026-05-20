import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { suggestionsTable } from "./suggestions";
import { usersTable } from "./users";

export const suggestionVotesTable = pgTable("suggestion_votes", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").notNull().references(() => suggestionsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  vote: text("vote", { enum: ["original", "amendment"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("unique_suggestion_user_vote").on(t.suggestionId, t.userId),
]);

export type SuggestionVote = typeof suggestionVotesTable.$inferSelect;
