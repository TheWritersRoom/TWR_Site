import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  avatarUrl: text("avatar_url"),
  role: text("role", { enum: ["author", "contributor", "both"] }).notNull().default("both"),
  isAdmin: boolean("is_admin").notNull().default(false),
  genres: text("genres").default("[]"),
  mediaInterests: text("media_interests").default(""),
  bio: text("bio"),
  credentials: text("credentials"),
  openToApproach: boolean("open_to_approach").notNull().default(false),
  profilePublic: boolean("profile_public").notNull().default(true),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationTokenExpiresAt: timestamp("email_verification_token_expires_at", { withTimezone: true }),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  subscriptionTier: text("subscription_tier", { enum: ["free", "pro"] }).notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
