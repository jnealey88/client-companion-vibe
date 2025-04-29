import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  updateClientSchema, 
  ClientFilters
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

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

  // Project data is now embedded in client objects

  return httpServer;
}
