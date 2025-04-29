import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  updateClientSchema, 
  ClientFilters,
  insertCompanionTaskSchema,
  updateCompanionTaskSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import {
  generateMarketResearch,
  generateProposal,
  generateContract,
  generateSiteMap,
  generateStatusUpdate,
  TaskType
} from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ===== Client Routes =====
  
  // Get all clients with filters
  app.get("/api/clients", async (req: Request, res: Response) => {
    try {
      const filters: ClientFilters = {
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        industry: req.query.industry as string | undefined,
        projectStatus: req.query.projectStatus as string | undefined,
        sort: req.query.sort as string | undefined
      };
      
      const clients = await storage.getClients(filters);
      return res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      return res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Get client by ID
  app.get("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      return res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      return res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  // Create new client
  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      const validationResult = insertClientSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const newClient = await storage.createClient(validationResult.data);
      return res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      return res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Update client
  app.patch("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const validationResult = updateClientSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const updatedClient = await storage.updateClient(id, validationResult.data);
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      return res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      return res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Delete client
  app.delete("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const result = await storage.deleteClient(id);
      if (!result) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      return res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Handle project requests for backward compatibility
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      // Return empty array for backward compatibility
      return res.json([]);
    } catch (error) {
      console.error("Error handling projects request:", error);
      return res.status(500).json({ message: "Failed to process request" });
    }
  });
  
  // ===== Client Companion Routes =====
  
  // Get all companion tasks for a client
  app.get("/api/clients/:clientId/companion-tasks", async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const tasks = await storage.getCompanionTasks(clientId);
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching companion tasks:", error);
      return res.status(500).json({ message: "Failed to fetch companion tasks" });
    }
  });
  
  // Get a specific companion task
  app.get("/api/companion-tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getCompanionTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      return res.json(task);
    } catch (error) {
      console.error("Error fetching companion task:", error);
      return res.status(500).json({ message: "Failed to fetch companion task" });
    }
  });
  
  // Create a new companion task
  app.post("/api/clients/:clientId/companion-tasks", async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const validationResult = insertCompanionTaskSchema.safeParse({ ...req.body, clientId });
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const newTask = await storage.createCompanionTask(validationResult.data);
      return res.status(201).json(newTask);
    } catch (error) {
      console.error("Error creating companion task:", error);
      return res.status(500).json({ message: "Failed to create companion task" });
    }
  });
  
  // Update a companion task
  app.patch("/api/companion-tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const validationResult = updateCompanionTaskSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const updatedTask = await storage.updateCompanionTask(id, validationResult.data);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      return res.json(updatedTask);
    } catch (error) {
      console.error("Error updating companion task:", error);
      return res.status(500).json({ message: "Failed to update companion task" });
    }
  });
  
  // Delete a companion task
  app.delete("/api/companion-tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const result = await storage.deleteCompanionTask(id);
      if (!result) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting companion task:", error);
      return res.status(500).json({ message: "Failed to delete companion task" });
    }
  });
  
  // Generate content using AI
  app.post("/api/clients/:clientId/generate/:taskType", async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const taskType = req.params.taskType as TaskType;
      const validTaskTypes = Object.values(TaskType);
      if (!validTaskTypes.includes(taskType)) {
        return res.status(400).json({ 
          message: `Invalid task type. Must be one of: ${validTaskTypes.join(', ')}`
        });
      }
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Create a task in "in_progress" state
      const newTask = await storage.createCompanionTask({
        clientId,
        type: taskType,
        status: "in_progress"
      });
      
      // Generate content based on task type
      let content = "";
      
      try {
        switch (taskType) {
          case TaskType.COMPANY_ANALYSIS:
            content = await generateCompanyAnalysis(client);
            break;
          case TaskType.PROPOSAL:
            // Optionally get company analysis if it exists
            const companyAnalysisTasks = await storage.getCompanionTasks(clientId);
            const companyAnalysisTask = companyAnalysisTasks
              .find(t => t.type === TaskType.COMPANY_ANALYSIS && t.status === "completed");
            const companyAnalysis = companyAnalysisTask?.content || undefined;
            content = await generateProposal(client, companyAnalysis);
            break;
          case TaskType.CONTRACT:
            content = await generateContract(client);
            break;
          case TaskType.SITE_MAP:
            content = await generateSiteMap(client);
            break;
          case TaskType.STATUS_UPDATE:
            // Get task status info for the status update
            const tasks = await storage.getCompanionTasks(clientId);
            const taskStatus = {
              completedTasks: tasks.filter(t => t.status === "completed").map(t => t.type),
              inProgressTasks: tasks.filter(t => t.status === "in_progress" && t.id !== newTask.id).map(t => t.type)
            };
            content = await generateStatusUpdate(client, taskStatus);
            break;
        }
        
        // Update the task with the generated content
        const updatedTask = await storage.updateCompanionTask(newTask.id, {
          content,
          status: "completed"
        });
        
        return res.json(updatedTask);
      } catch (error) {
        // If the AI generation fails, update the task status to pending
        await storage.updateCompanionTask(newTask.id, {
          status: "pending",
          content: "Failed to generate content. Please try again."
        });
        
        console.error(`Error generating ${taskType} content:`, error);
        throw error; // Let the outer catch handle the response
      }
    } catch (error) {
      console.error("Error in AI content generation:", error);
      return res.status(500).json({ 
        message: "Failed to generate content. Please check the API key and try again."
      });
    }
  });
  
  return httpServer;
}
