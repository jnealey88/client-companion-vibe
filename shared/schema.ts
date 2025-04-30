import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().default(new Date()),
});

// Client table definition
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name").notNull(),
  contactTitle: text("contact_title").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  industry: text("industry").notNull(),
  websiteUrl: text("website_url"),
  status: text("status").notNull().default("discovery"),
  projectName: text("project_name").notNull(),
  projectDescription: text("project_description"),
  projectStatus: text("project_status").notNull().default("active"),
  projectStartDate: timestamp("project_start_date").notNull().default(new Date()),
  projectEndDate: timestamp("project_end_date"),
  projectValue: integer("project_value").notNull().default(0),
  lastContact: timestamp("last_contact").notNull().default(new Date()),
  createdAt: timestamp("created_at").notNull().default(new Date()),
});

// Define task type enum
export const taskTypeEnum = pgEnum("task_type", [
  // Discovery phase tasks
  "company_analysis",
  "schedule_discovery",
  "proposal",
  
  // Planning phase tasks
  "define_scope",
  "contract", 
  "third_party",
  
  // Design and Development phase tasks
  "site_map",
  "ai_site_designer",
  "ai_qa_tool",
  
  // Post Launch Management phase tasks
  "seo_performance",
  "site_speed",
  "security_scan",
  "uptime_monitor"
]);

// Define task status enum
export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed"
]);

// User-client relation
export const userClients = pgTable("user_clients", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.clientId] }),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userClients: many(userClients)
}));

export const userClientsRelations = relations(userClients, ({ one }) => ({
  user: one(users, {
    fields: [userClients.userId],
    references: [users.id]
  }),
  client: one(clients, {
    fields: [userClients.clientId],
    references: [clients.id]
  })
}));

// Table for client companion tasks
export const companionTasks = pgTable("companion_tasks", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  type: taskTypeEnum("type").notNull(),
  status: taskStatusEnum("status").notNull().default("pending"),
  content: text("content"),
  metadata: text("metadata"), // For storing additional data like pricing information
  createdAt: timestamp("created_at").notNull().default(new Date()),
  completedAt: timestamp("completed_at"),
});

// Client Schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  lastContact: true,
});

export const clientSchema = z.object({
  id: z.number(),
  name: z.string(),
  contactName: z.string(),
  contactTitle: z.string(),
  email: z.string().email(),
  phone: z.string(),
  industry: z.string(),
  websiteUrl: z.string().nullable(),
  status: z.string(),
  projectName: z.string(),
  projectDescription: z.string().nullable(),
  projectStatus: z.string(),
  projectStartDate: z.date(),
  projectEndDate: z.date().nullable(),
  projectValue: z.number(),
  lastContact: z.date(),
  createdAt: z.date(),
});

export const updateClientSchema = insertClientSchema.partial();

// Companion Task Schemas
export const insertCompanionTaskSchema = createInsertSchema(companionTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const companionTaskSchema = z.object({
  id: z.number(),
  clientId: z.number(),
  type: z.enum([
    // Discovery phase tasks
    "company_analysis",
    "schedule_discovery",
    "proposal",
    
    // Planning phase tasks
    "define_scope",
    "contract", 
    "third_party",
    
    // Design and Development phase tasks
    "site_map",
    "ai_site_designer",
    "ai_qa_tool",
    
    // Post Launch Management phase tasks
    "seo_performance",
    "site_speed",
    "security_scan",
    "uptime_monitor"
  ]),
  status: z.enum(["pending", "in_progress", "completed"]),
  content: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
});

export const updateCompanionTaskSchema = insertCompanionTaskSchema.partial();

// Types
export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type Client = typeof clients.$inferSelect;
export type ClientWithProject = z.infer<typeof clientSchema>;

export type InsertCompanionTask = z.infer<typeof insertCompanionTaskSchema>;
export type UpdateCompanionTask = z.infer<typeof updateCompanionTaskSchema>;
export type CompanionTask = typeof companionTasks.$inferSelect;

// Filters/Sorting
export type ClientFilters = {
  projectStatus?: string;
  industry?: string;
  status?: string;
  search?: string;
  sort?: string;
};

export const statusOptions = ["All Status", "Discovery", "Planning", "Design and Development", "Post Launch Management"];
export const industryOptions = ["All Industries", "Technology", "Healthcare", "Education", "E-commerce", "Finance", "Media", "Sustainability", "Data Analytics"];
export const projectStatusOptions = ["All Projects", "Active Projects", "Completed Projects", "Pending Projects"];
export const sortOptions = ["Sort by: Recent", "Name (A-Z)", "Name (Z-A)", "Value (High-Low)", "Value (Low-High)"];

// User Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.date(),
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserSchema = insertUserSchema.partial();

// User Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;

// UserClient Types
export type UserClient = typeof userClients.$inferSelect;
export type InsertUserClient = typeof userClients.$inferInsert;
