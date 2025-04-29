import { 
  Client, 
  InsertClient, 
  UpdateClient, 
  ClientFilters
} from "@shared/schema";

export interface IStorage {
  // Client operations
  getClients(filters?: ClientFilters): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: UpdateClient): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getClients(filters?: ClientFilters): Promise<Client[]> {
    try {
      // Import db here to avoid circular dependencies
      const { db } = await import('./db');
      const { clients } = await import('@shared/schema');
      const { eq, ilike, and, or, desc, asc } = await import('drizzle-orm');
      
      let query = db.select().from(clients);
      
      // Apply filters
      const conditions = [];
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
      
      if (filters?.status && filters.status !== "All Status") {
        conditions.push(eq(clients.status, filters.status.toLowerCase()));
      }
      
      if (filters?.industry && filters.industry !== "All Industries") {
        conditions.push(eq(clients.industry, filters.industry));
      }
      
      if (filters?.projectStatus && filters.projectStatus !== "All Projects") {
        const status = filters.projectStatus.split(' ')[0].toLowerCase();
        conditions.push(eq(clients.projectStatus, status));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply sorting
      if (filters?.sort) {
        switch (filters.sort) {
          case "Name (A-Z)":
            query = query.orderBy(asc(clients.name));
            break;
          case "Name (Z-A)":
            query = query.orderBy(desc(clients.name));
            break;
          case "Value (High-Low)":
            query = query.orderBy(desc(clients.projectValue));
            break;
          case "Value (Low-High)":
            query = query.orderBy(asc(clients.projectValue));
            break;
          default:
            // Sort by recent (last contact) by default
            query = query.orderBy(desc(clients.lastContact));
        }
      } else {
        // Default sort by recent
        query = query.orderBy(desc(clients.lastContact));
      }
      
      const clientsResult = await query;
      return clientsResult;
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
      
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, id));
      
      return client;
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
}

// Export the database storage implementation
export const storage = new DatabaseStorage();