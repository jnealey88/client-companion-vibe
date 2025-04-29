import { 
  Client, 
  InsertClient, 
  UpdateClient, 
  Project, 
  InsertProject, 
  ClientFilters,
  ClientWithProjects
} from "@shared/schema";

export interface IStorage {
  // Client operations
  getClients(filters?: ClientFilters): Promise<ClientWithProjects[]>;
  getClient(id: number): Promise<ClientWithProjects | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: UpdateClient): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Project operations
  getProjects(clientId?: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private clientIdCounter: number;
  private projectIdCounter: number;

  constructor() {
    this.clients = new Map();
    this.projects = new Map();
    this.clientIdCounter = 1;
    this.projectIdCounter = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample clients
    const sampleClients: InsertClient[] = [
      {
        name: "TechVision Inc.",
        contactName: "Jonathan Chen",
        contactTitle: "CEO",
        email: "jonathan@techvision.example",
        phone: "+1 (555) 123-4567",
        industry: "Technology",
        status: "Active",
        logo: "/client-logos/techvision.svg",
        totalValue: 120000,
      },
      {
        name: "Greenleaf Solutions",
        contactName: "Sarah Johnson",
        contactTitle: "Marketing Director",
        email: "sarah@greenleaf.example",
        phone: "+1 (555) 234-5678",
        industry: "Sustainability",
        status: "Pending",
        logo: "/client-logos/greenleaf.svg",
        totalValue: 75000,
      },
      {
        name: "Horizon Media Group",
        contactName: "Marcus Taylor",
        contactTitle: "Creative Director",
        email: "marcus@horizonmedia.example",
        phone: "+1 (555) 345-6789",
        industry: "Media",
        status: "Active",
        logo: "/client-logos/horizon.svg",
        totalValue: 95000,
      },
      {
        name: "BlueWave Analytics",
        contactName: "Priya Sharma",
        contactTitle: "CTO",
        email: "priya@bluewave.example",
        phone: "+1 (555) 456-7890",
        industry: "Data Analytics",
        status: "Completed",
        logo: "/client-logos/bluewave.svg",
        totalValue: 65000,
      },
      {
        name: "Summit Financial Partners",
        contactName: "Robert Williams",
        contactTitle: "COO",
        email: "robert@summit.example",
        phone: "+1 (555) 567-8901",
        industry: "Finance",
        status: "On Hold",
        logo: "/client-logos/summit.svg",
        totalValue: 150000,
      }
    ];

    // Add sample clients
    sampleClients.forEach(client => {
      this.createClient(client);
    });

    // Create projects for TechVision
    this.createProject({
      clientId: 1,
      name: "Website Redesign",
      description: "Complete overhaul of corporate website",
      status: "active",
      value: 45000,
      startDate: new Date("2023-02-15"),
    });

    this.createProject({
      clientId: 1,
      name: "Mobile App Development",
      description: "iOS and Android app for customer portal",
      status: "active",
      value: 60000,
      startDate: new Date("2023-03-01"),
    });

    this.createProject({
      clientId: 1,
      name: "SEO Optimization",
      description: "Search engine optimization campaign",
      status: "active",
      value: 15000,
      startDate: new Date("2023-04-10"),
    });

    this.createProject({
      clientId: 1,
      name: "Email Marketing Setup",
      description: "Email marketing campaign setup",
      status: "completed",
      value: 8000,
      startDate: new Date("2023-01-10"),
      endDate: new Date("2023-02-28"),
    });

    this.createProject({
      clientId: 1,
      name: "Analytics Dashboard",
      description: "Custom analytics dashboard",
      status: "completed",
      value: 12000,
      startDate: new Date("2022-11-01"),
      endDate: new Date("2023-01-15"),
    });

    // Create projects for Greenleaf
    this.createProject({
      clientId: 2,
      name: "Sustainability Report Website",
      description: "Interactive web presentation of annual sustainability report",
      status: "active",
      value: 30000,
      startDate: new Date("2023-05-01"),
    });
    
    this.createProject({
      clientId: 2,
      name: "Brand Identity Refresh",
      description: "Update visual identity to emphasize sustainability",
      status: "completed",
      value: 45000,
      startDate: new Date("2022-12-01"),
      endDate: new Date("2023-03-15"),
    });
    
    // Create projects for Horizon Media
    this.createProject({
      clientId: 3,
      name: "Digital Content Platform",
      description: "New content management system for media distribution",
      status: "active",
      value: 55000,
      startDate: new Date("2023-04-01"),
    });
    
    this.createProject({
      clientId: 3,
      name: "Video Production Portal",
      description: "Client portal for video production projects",
      status: "active",
      value: 40000,
      startDate: new Date("2023-05-15"),
    });
    
    this.createProject({
      clientId: 3,
      name: "Social Media Dashboard",
      description: "Analytics dashboard for social media campaigns",
      status: "completed",
      value: 25000,
      startDate: new Date("2022-10-01"),
      endDate: new Date("2023-01-31"),
    });
    
    this.createProject({
      clientId: 3,
      name: "Podcast Network Website",
      description: "Website for podcast network",
      status: "completed",
      value: 35000,
      startDate: new Date("2022-08-15"),
      endDate: new Date("2022-12-20"),
    });
    
    // Create projects for BlueWave
    this.createProject({
      clientId: 4,
      name: "Data Visualization Tool",
      description: "Interactive data visualization tool",
      status: "completed",
      value: 40000,
      startDate: new Date("2022-09-01"),
      endDate: new Date("2023-02-28"),
    });
    
    this.createProject({
      clientId: 4,
      name: "Business Intelligence Dashboard",
      description: "Executive dashboard for business intelligence",
      status: "completed",
      value: 25000,
      startDate: new Date("2022-07-15"),
      endDate: new Date("2022-12-15"),
    });
    
    // Create projects for Summit
    this.createProject({
      clientId: 5,
      name: "Investment Portal",
      description: "Client investment portal with secure access",
      status: "active",
      value: 70000,
      startDate: new Date("2023-03-15"),
    });
    
    this.createProject({
      clientId: 5,
      name: "Financial Planning App",
      description: "Mobile app for financial planning",
      status: "on hold",
      value: 55000,
      startDate: new Date("2023-02-01"),
    });
    
    this.createProject({
      clientId: 5,
      name: "Advisor Dashboard",
      description: "Dashboard for financial advisors",
      status: "completed",
      value: 25000,
      startDate: new Date("2022-10-15"),
      endDate: new Date("2023-01-31"),
    });
  }

  // Client CRUD operations
  async getClients(filters?: ClientFilters): Promise<ClientWithProjects[]> {
    let clientsArray = Array.from(this.clients.values());
    
    // Apply filters if provided
    if (filters) {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        clientsArray = clientsArray.filter(client => 
          client.name.toLowerCase().includes(searchTerm) || 
          client.contactName.toLowerCase().includes(searchTerm) ||
          client.industry.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.status && filters.status !== "All Status") {
        clientsArray = clientsArray.filter(client => 
          client.status.toLowerCase() === filters.status?.toLowerCase()
        );
      }
      
      if (filters.industry && filters.industry !== "All Industries") {
        clientsArray = clientsArray.filter(client => 
          client.industry === filters.industry
        );
      }
      
      // Apply sorting
      if (filters.sort) {
        switch (filters.sort) {
          case "Name (A-Z)":
            clientsArray.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "Name (Z-A)":
            clientsArray.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case "Value (High-Low)":
            clientsArray.sort((a, b) => b.totalValue - a.totalValue);
            break;
          case "Value (Low-High)":
            clientsArray.sort((a, b) => a.totalValue - b.totalValue);
            break;
          default:
            // Sort by recent (last contact) by default
            clientsArray.sort((a, b) => b.lastContact.getTime() - a.lastContact.getTime());
        }
      } else {
        // Default sort by recent
        clientsArray.sort((a, b) => b.lastContact.getTime() - a.lastContact.getTime());
      }
    }
    
    // Get projects for each client
    return Promise.all(clientsArray.map(async (client) => {
      const projects = await this.getProjects(client.id);
      const activeProjects = projects.filter(p => p.status === "active");
      
      if (filters?.projectStatus && filters.projectStatus !== "All Projects") {
        if (filters.projectStatus === "Active Projects" && activeProjects.length === 0) {
          return null;
        } else if (filters.projectStatus === "Completed Projects" && 
                  !projects.some(p => p.status === "completed")) {
          return null;
        } else if (filters.projectStatus === "Pending Projects" && 
                  !projects.some(p => p.status === "pending")) {
          return null;
        }
      }
      
      return {
        ...client,
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status
        }))
      };
    })).then(clients => clients.filter(Boolean) as ClientWithProjects[]);
  }

  async getClient(id: number): Promise<ClientWithProjects | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const projects = await this.getProjects(id);
    return {
      ...client,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status
      }))
    };
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const client: Client = {
      id,
      ...clientData,
      lastContact: clientData.lastContact || new Date(),
      createdAt: new Date()
    };
    
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, updateData: UpdateClient): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient: Client = {
      ...client,
      ...updateData,
      // Keep original values for these fields unless explicitly updated
      lastContact: updateData.lastContact || client.lastContact,
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    if (!this.clients.has(id)) return false;
    
    // Delete all projects associated with this client
    const clientProjects = await this.getProjects(id);
    for (const project of clientProjects) {
      await this.deleteProject(project.id);
    }
    
    return this.clients.delete(id);
  }

  // Project CRUD operations
  async getProjects(clientId?: number): Promise<Project[]> {
    let projectsArray = Array.from(this.projects.values());
    
    if (clientId) {
      projectsArray = projectsArray.filter(project => project.clientId === clientId);
    }
    
    return projectsArray;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const project: Project = {
      id,
      ...projectData,
    };
    
    this.projects.set(id, project);
    
    // Update client's total value
    const client = this.clients.get(projectData.clientId);
    if (client) {
      client.totalValue = (client.totalValue || 0) + projectData.value;
      this.clients.set(client.id, client);
    }
    
    return project;
  }

  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    // If value is being updated, adjust client's total value
    if (updateData.value !== undefined && updateData.value !== project.value) {
      const valueDifference = updateData.value - project.value;
      const client = this.clients.get(project.clientId);
      if (client) {
        client.totalValue = (client.totalValue || 0) + valueDifference;
        this.clients.set(client.id, client);
      }
    }
    
    const updatedProject: Project = {
      ...project,
      ...updateData,
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    const project = this.projects.get(id);
    if (!project) return false;
    
    // Update client's total value
    const client = this.clients.get(project.clientId);
    if (client) {
      client.totalValue = (client.totalValue || 0) - project.value;
      this.clients.set(client.id, client);
    }
    
    return this.projects.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  async getClients(filters?: ClientFilters): Promise<ClientWithProjects[]> {
    try {
      // Import db here to avoid circular dependencies
      const { db } = await import('./db');
      const { clients, projects } = await import('@shared/schema');
      const { eq, ilike, and, or, desc, asc } = await import('drizzle-orm');
      
      let query = db.select().from(clients)
      
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
            query = query.orderBy(desc(clients.totalValue));
            break;
          case "Value (Low-High)":
            query = query.orderBy(asc(clients.totalValue));
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
      
      // Get projects for each client
      const clientsWithProjects = await Promise.all(
        clientsResult.map(async (client) => {
          const clientProjects = await db
            .select({
              id: projects.id,
              name: projects.name,
              status: projects.status
            })
            .from(projects)
            .where(eq(projects.clientId, client.id));
          
          // Filter by project status if needed
          if (filters?.projectStatus && filters.projectStatus !== "All Projects") {
            if (filters.projectStatus === "Active Projects" && 
                !clientProjects.some(p => p.status === "active")) {
              return null;
            } else if (filters.projectStatus === "Completed Projects" && 
                      !clientProjects.some(p => p.status === "completed")) {
              return null;
            } else if (filters.projectStatus === "Pending Projects" && 
                      !clientProjects.some(p => p.status === "pending")) {
              return null;
            }
          }
          
          return {
            ...client,
            projects: clientProjects
          };
        })
      );
      
      return clientsWithProjects.filter(Boolean) as ClientWithProjects[];
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  }
  
  async getClient(id: number): Promise<ClientWithProjects | undefined> {
    try {
      const { db } = await import('./db');
      const { clients, projects } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, id));
      
      if (!client) return undefined;
      
      const clientProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status
        })
        .from(projects)
        .where(eq(projects.clientId, id));
      
      return {
        ...client,
        projects: clientProjects
      };
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
          lastContact: client.lastContact || new Date(),
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
      const { clients, projects } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // First delete associated projects to maintain referential integrity
      await db
        .delete(projects)
        .where(eq(projects.clientId, id));
      
      // Then delete the client
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
  
  async getProjects(clientId?: number): Promise<Project[]> {
    try {
      const { db } = await import('./db');
      const { projects } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      let query = db.select().from(projects);
      
      if (clientId) {
        query = query.where(eq(projects.clientId, clientId));
      }
      
      return await query;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    try {
      const { db } = await import('./db');
      const { projects } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id));
      
      return project;
    } catch (error) {
      console.error(`Error fetching project with ID ${id}:`, error);
      throw error;
    }
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    try {
      const { db } = await import('./db');
      const { projects, clients } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Begin transaction
      const [newProject] = await db.transaction(async (tx) => {
        // Create the project
        const [newProject] = await tx
          .insert(projects)
          .values(project)
          .returning();
        
        // Update client's total value
        await tx
          .update(clients)
          .set({
            totalValue: (client) => `${client.totalValue} + ${project.value}`
          })
          .where(eq(clients.id, project.clientId));
        
        return [newProject];
      });
      
      return newProject;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }
  
  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    try {
      const { db } = await import('./db');
      const { projects, clients } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Begin transaction if value is being updated
      if ('value' in updateData) {
        return db.transaction(async (tx) => {
          // Get current project to calculate value difference
          const [currentProject] = await tx
            .select()
            .from(projects)
            .where(eq(projects.id, id));
          
          if (!currentProject) return undefined;
          
          const valueDifference = (updateData.value || 0) - currentProject.value;
          
          // Update client's total value if value is changing
          if (valueDifference !== 0) {
            await tx
              .update(clients)
              .set({
                totalValue: (client) => `${client.totalValue} + ${valueDifference}`
              })
              .where(eq(clients.id, currentProject.clientId));
          }
          
          // Update the project
          const [updatedProject] = await tx
            .update(projects)
            .set(updateData)
            .where(eq(projects.id, id))
            .returning();
          
          return updatedProject;
        });
      } else {
        // Simple update without value change
        const [updatedProject] = await db
          .update(projects)
          .set(updateData)
          .where(eq(projects.id, id))
          .returning();
        
        return updatedProject;
      }
    } catch (error) {
      console.error(`Error updating project with ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteProject(id: number): Promise<boolean> {
    try {
      const { db } = await import('./db');
      const { projects, clients } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Begin transaction
      return db.transaction(async (tx) => {
        // Get current project to update client's total value
        const [currentProject] = await tx
          .select()
          .from(projects)
          .where(eq(projects.id, id));
        
        if (!currentProject) return false;
        
        // Update client's total value
        await tx
          .update(clients)
          .set({
            totalValue: (client) => `${client.totalValue} - ${currentProject.value}`
          })
          .where(eq(clients.id, currentProject.clientId));
        
        // Delete the project
        const deletedProjects = await tx
          .delete(projects)
          .where(eq(projects.id, id))
          .returning();
        
        return deletedProjects.length > 0;
      });
    } catch (error) {
      console.error(`Error deleting project with ID ${id}:`, error);
      throw error;
    }
  }
}

// Export the database storage implementation
export const storage = new DatabaseStorage();
