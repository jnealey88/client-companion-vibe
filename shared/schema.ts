import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  "schedule_discovery",
  "company_analysis",
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
  "status_update",
  "site_maintenance",
  "site_optimizer"
]);

// Define task status enum
export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed"
]);

// Table for client companion tasks
export const companionTasks = pgTable("companion_tasks", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  type: taskTypeEnum("type").notNull(),
  status: taskStatusEnum("status").notNull().default("pending"),
  content: text("content"),
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
    "schedule_discovery",
    "company_analysis",
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
    "status_update",
    "site_maintenance",
    "site_optimizer"
  ]),
  status: z.enum(["pending", "in_progress", "completed"]),
  content: z.string().nullable(),
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
