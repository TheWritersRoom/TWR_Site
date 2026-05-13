import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const referralCodesTable = pgTable("referral_codes", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  code:      text("code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const referredUsersTable = pgTable("referred_users", {
  id:              serial("id").primaryKey(),
  referrerId:      integer("referrer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  referredId:      integer("referred_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  signupInkAwarded: boolean("signup_ink_awarded").notNull().default(false),
  proInkAwarded:    boolean("pro_ink_awarded").notNull().default(false),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
