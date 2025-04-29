import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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

// Types
export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type Client = typeof clients.$inferSelect;
export type ClientWithProject = z.infer<typeof clientSchema>;

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
