import { 
  Client, 
  InsertClient, 
  UpdateClient, 
  ClientFilters,
  CompanionTask,
  InsertCompanionTask,
  UpdateCompanionTask,
  User,
  InsertUser,
  UpdateUser,
  InsertUserClient
} from "@shared/schema";
import { Pool } from 'pg';
import session from "express-session";
import connectPg from "connect-pg-simple";

// Configure session stores
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Client operations
  getClients(filters?: ClientFilters): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: UpdateClient): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Client Companion Task operations
  getCompanionTasks(clientId: number): Promise<CompanionTask[]>;
  getCompanionTask(id: number): Promise<CompanionTask | undefined>;
  createCompanionTask(task: InsertCompanionTask): Promise<CompanionTask>;
  updateCompanionTask(id: number, task: UpdateCompanionTask): Promise<CompanionTask | undefined>;
  deleteCompanionTask(id: number): Promise<boolean>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: UpdateUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // User-Client relationship operations
  addClientToUser(userId: number, clientId: number): Promise<boolean>;
  removeClientFromUser(userId: number, clientId: number): Promise<boolean>;
  getUserClients(userId: number): Promise<Client[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  // Initialize with express's built-in memory store
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new session.MemoryStore();
  }
  async getClients(filters?: ClientFilters): Promise<Client[]> {
    try {
      // Import db here to avoid circular dependencies
      const { db } = await import('./db');
      const { clients } = await import('@shared/schema');
      const { eq, ilike, and, or, desc, asc } = await import('drizzle-orm');
      
      // Build query conditions
      const conditions = [];
      
      // Search filter
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(
          or(
            ilike(clients.name, searchTerm),
            ilike(clients.contactName, searchTerm),
            ilike(clients.industry, searchTerm)
          )
        );
      }
      
      // Status filter
      if (filters?.status && filters.status !== "All Status") {
        conditions.push(eq(clients.status, filters.status.toLowerCase()));
      }
      
      // Industry filter
      if (filters?.industry && filters.industry !== "All Industries") {
        conditions.push(eq(clients.industry, filters.industry));
      }
      
      // Project status filter
      if (filters?.projectStatus && filters.projectStatus !== "All Projects") {
        const status = filters.projectStatus.split(' ')[0].toLowerCase();
        conditions.push(eq(clients.projectStatus, status));
      }
      
      // Execute base query
      let baseQuery = db.select().from(clients);
      
      // Apply conditions if any
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions));
      }
      
      // Determine sort order
      let sortField;
      let sortOrder;
      
      if (filters?.sort) {
        switch (filters.sort) {
          case "Name (A-Z)":
            sortField = clients.name;
            sortOrder = "asc";
            break;
          case "Name (Z-A)":
            sortField = clients.name;
            sortOrder = "desc";
            break;
          case "Value (High-Low)":
            sortField = clients.projectValue;
            sortOrder = "desc";
            break;
          case "Value (Low-High)":
            sortField = clients.projectValue;
            sortOrder = "asc";
            break;
          default:
            sortField = clients.lastContact;
            sortOrder = "desc";
        }
      } else {
        sortField = clients.lastContact;
        sortOrder = "desc";
      }
      
      // Execute the query with the sort
      if (sortOrder === "asc") {
        return await baseQuery.orderBy(asc(sortField));
      } else {
        return await baseQuery.orderBy(desc(sortField));
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    try {
      const { db } = await import('./db');
      const { clients } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const result = await db
        .select()
        .from(clients)
        .where(eq(clients.id, id));
      
      return result[0];
    } catch (error) {
      console.error(`Error fetching client with ID ${id}:`, error);
      throw error;
    }
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    try {
      const { db } = await import('./db');
      const { clients } = await import('@shared/schema');
      
      const [newClient] = await db
        .insert(clients)
        .values({
          ...client,
          lastContact: new Date(),
          createdAt: new Date()
        })
        .returning();
      
      return newClient;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  }
  
  async updateClient(id: number, updateData: UpdateClient): Promise<Client | undefined> {
    try {
      const { db } = await import('./db');
      const { clients } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [updatedClient] = await db
        .update(clients)
        .set(updateData)
        .where(eq(clients.id, id))
        .returning();
      
      return updatedClient;
    } catch (error) {
      console.error(`Error updating client with ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteClient(id: number): Promise<boolean> {
    try {
      const { db } = await import('./db');
      const { clients } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const deletedClients = await db
        .delete(clients)
        .where(eq(clients.id, id))
        .returning();
      
      return deletedClients.length > 0;
    } catch (error) {
      console.error(`Error deleting client with ID ${id}:`, error);
      throw error;
    }
  }

  // Companion Task operations
  async getCompanionTasks(clientId: number): Promise<CompanionTask[]> {
    try {
      const { db } = await import('./db');
      const { companionTasks } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      return await db
        .select()
        .from(companionTasks)
        .where(eq(companionTasks.clientId, clientId))
        .orderBy(companionTasks.createdAt);
    } catch (error) {
      console.error(`Error fetching companion tasks for client ${clientId}:`, error);
      throw error;
    }
  }
  
  async getCompanionTask(id: number): Promise<CompanionTask | undefined> {
    try {
      const { db } = await import('./db');
      const { companionTasks } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const result = await db
        .select()
        .from(companionTasks)
        .where(eq(companionTasks.id, id));
      
      return result[0];
    } catch (error) {
      console.error(`Error fetching companion task with ID ${id}:`, error);
      throw error;
    }
  }
  
  async createCompanionTask(task: InsertCompanionTask): Promise<CompanionTask> {
    try {
      const { db } = await import('./db');
      const { companionTasks } = await import('@shared/schema');
      
      const [newTask] = await db
        .insert(companionTasks)
        .values({
          ...task,
          createdAt: new Date()
        })
        .returning();
      
      return newTask;
    } catch (error) {
      console.error("Error creating companion task:", error);
      throw error;
    }
  }
  
  async updateCompanionTask(id: number, updateData: UpdateCompanionTask): Promise<CompanionTask | undefined> {
    try {
      const { db } = await import('./db');
      const { companionTasks } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      // If the status is being updated to 'completed', add the completedAt timestamp
      const dataToUpdate: any = { ...updateData };
      if (updateData.status === 'completed') {
        dataToUpdate.completedAt = new Date();
      }
      
      const [updatedTask] = await db
        .update(companionTasks)
        .set(dataToUpdate)
        .where(eq(companionTasks.id, id))
        .returning();
      
      return updatedTask;
    } catch (error) {
      console.error(`Error updating companion task with ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteCompanionTask(id: number): Promise<boolean> {
    try {
      const { db } = await import('./db');
      const { companionTasks } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const deletedTasks = await db
        .delete(companionTasks)
        .where(eq(companionTasks.id, id))
        .returning();
      
      return deletedTasks.length > 0;
    } catch (error) {
      console.error(`Error deleting companion task with ID ${id}:`, error);
      throw error;
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      
      return result[0];
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const result = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      
      return result[0];
    } catch (error) {
      console.error(`Error fetching user with username ${username}:`, error);
      throw error;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    try {
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');
      
      const [newUser] = await db
        .insert(users)
        .values({
          ...user,
          createdAt: new Date()
        })
        .returning();
      
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUser(id: number, updateData: UpdateUser): Promise<User | undefined> {
    try {
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const deletedUsers = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      
      return deletedUsers.length > 0;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  }
  
  // User-Client relationship operations
  async addClientToUser(userId: number, clientId: number): Promise<boolean> {
    try {
      const { db } = await import('./db');
      const { userClients } = await import('@shared/schema');
      
      await db
        .insert(userClients)
        .values({
          userId,
          clientId
        })
        .onConflictDoNothing();
      
      return true;
    } catch (error) {
      console.error(`Error adding client ${clientId} to user ${userId}:`, error);
      throw error;
    }
  }
  
  async removeClientFromUser(userId: number, clientId: number): Promise<boolean> {
    try {
      const { db } = await import('./db');
      const { userClients } = await import('@shared/schema');
      const { and, eq } = await import('drizzle-orm');
      
      const result = await db
        .delete(userClients)
        .where(
          and(
            eq(userClients.userId, userId),
            eq(userClients.clientId, clientId)
          )
        )
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error removing client ${clientId} from user ${userId}:`, error);
      throw error;
    }
  }
  
  async getUserClients(userId: number): Promise<Client[]> {
    try {
      const { db } = await import('./db');
      const { userClients, clients } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      return await db
        .select()
        .from(clients)
        .innerJoin(userClients, eq(clients.id, userClients.clientId))
        .where(eq(userClients.userId, userId))
        .then(rows => rows.map(row => row.clients));
    } catch (error) {
      console.error(`Error fetching clients for user ${userId}:`, error);
      throw error;
    }
  }
}

// Export the database storage implementation
export const storage = new DatabaseStorage();