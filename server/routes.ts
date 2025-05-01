import type { Express, Request, Response, NextFunction } from "express";
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
  generateCompanyAnalysis,
  generateProposal,
  generateContract,
  generateProjectScope,
  generateSiteMap,
  generateStatusUpdate,
  generateScheduleDiscovery,
  generateSiteRecommendations,
  expandSectionContent,
  TaskType
} from "./openai";
import { sendEmail, EmailParams } from "./sendgrid";
import { setupAuth } from "./auth";

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  setupAuth(app);
  
  const httpServer = createServer(app);

  // ===== User-Client Association Routes =====
  
  // Associate a client with the authenticated user
  app.post("/api/user/clients/:clientId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const userId = (req.user as any).id;
      await storage.addClientToUser(userId, clientId);
      
      return res.status(201).json({ message: "Client associated with user" });
    } catch (error) {
      console.error("Error associating client with user:", error);
      return res.status(500).json({ message: "Failed to associate client with user" });
    }
  });
  
  // Get all clients for the authenticated user
  app.get("/api/user/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const clients = await storage.getUserClients(userId);
      return res.json(clients);
    } catch (error) {
      console.error("Error fetching user's clients:", error);
      return res.status(500).json({ message: "Failed to fetch user's clients" });
    }
  });
  
  // ===== Client Routes =====
  
  // Get all clients with filters
  app.get("/api/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user's ID
      const userId = (req.user as any).id;
      
      // Get clients associated with this user
      const userClients = await storage.getUserClients(userId);
      
      // Apply filters if any (alternatively we could modify the getUserClients method to accept filters)
      const filters: ClientFilters = {
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        industry: req.query.industry as string | undefined,
        projectStatus: req.query.projectStatus as string | undefined,
        sort: req.query.sort as string | undefined
      };
      
      let filteredClients = userClients;
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredClients = filteredClients.filter(client => 
          client.name.toLowerCase().includes(searchLower) || 
          (client.contactName && client.contactName.toLowerCase().includes(searchLower)) ||
          (client.email && client.email.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply status filter
      if (filters.status && filters.status !== "All Status") {
        filteredClients = filteredClients.filter(client => 
          client.status === filters.status
        );
      }
      
      // Apply industry filter
      if (filters.industry && filters.industry !== "All Industries") {
        filteredClients = filteredClients.filter(client => 
          client.industry === filters.industry
        );
      }
      
      // Apply project status filter
      if (filters.projectStatus && filters.projectStatus !== "All Projects") {
        const statusMap: Record<string, string> = {
          "Active Projects": "active",
          "Completed Projects": "completed",
          "Pending Projects": "pending"
        };
        
        const projectStatusValue = statusMap[filters.projectStatus];
        if (projectStatusValue) {
          filteredClients = filteredClients.filter(client => 
            client.projectStatus === projectStatusValue
          );
        }
      }
      
      // Apply sorting
      if (filters.sort) {
        switch (filters.sort) {
          case "Name (A-Z)":
            filteredClients.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "Name (Z-A)":
            filteredClients.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case "Value (High-Low)":
            filteredClients.sort((a, b) => (b.projectValue || 0) - (a.projectValue || 0));
            break;
          case "Value (Low-High)":
            filteredClients.sort((a, b) => (a.projectValue || 0) - (b.projectValue || 0));
            break;
          // Default is "Sort by: Recent" which is already the default order
        }
      }
      
      return res.json(filteredClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      return res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Get client by ID
  app.get("/api/clients/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Verify that this client belongs to the authenticated user
      const userId = (req.user as any).id;
      const userClients = await storage.getUserClients(userId);
      const clientBelongsToUser = userClients.some(c => c.id === client.id);
      
      if (!clientBelongsToUser) {
        return res.status(403).json({ message: "You don't have access to this client" });
      }
      
      return res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      return res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  // Create new client
  app.post("/api/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validationResult = insertClientSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const newClient = await storage.createClient(validationResult.data);
      
      // Associate the client with the authenticated user
      try {
        const userId = (req.user as any).id;
        await storage.addClientToUser(userId, newClient.id);
        console.log(`Client ${newClient.id} associated with user ${userId}`);
      } catch (associationError) {
        console.error("Error associating client with user:", associationError);
        // Don't fail the request if association fails
      }
      
      // Automatically create and generate company analysis task for the new client
      try {
        // First create the task
        const newTask = await storage.createCompanionTask({
          clientId: newClient.id,
          type: "company_analysis",
          status: "pending"
        });
        
        // Then generate content for it (async, don't wait for completion)
        generateCompanyAnalysis(newClient)
          .then(async (content) => {
            if (content) {
              await storage.updateCompanionTask(newTask.id, {
                content,
                status: "completed"
              });
              console.log(`Auto-generated company analysis for client ${newClient.id}`);
            }
          })
          .catch(err => {
            console.error(`Error auto-generating company analysis for client ${newClient.id}:`, err);
          });
          
      } catch (analysisError) {
        // Log error but don't fail client creation if analysis fails
        console.error("Error setting up auto analysis for new client:", analysisError);
      }
      
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
            const proposalAnalysisTasks = await storage.getCompanionTasks(clientId);
            const proposalAnalysisTask = proposalAnalysisTasks
              .find(t => t.type === TaskType.COMPANY_ANALYSIS && t.status === "completed");
            const companyAnalysis = proposalAnalysisTask?.content || undefined;
            
            // Get discovery notes if they were provided in the request body
            const discoveryNotes = req.body?.discoveryNotes || undefined;
            
            // Generate proposal content and pricing data
            const proposalResponse = await generateProposal(client, companyAnalysis, discoveryNotes);
            
            // At this point, proposalResponse should be an object with content and pricingData
            if (typeof proposalResponse === 'object' && proposalResponse.content) {
              // Set the content for the task
              content = proposalResponse.content;
              
              // If we have pricing data, set up the metadata
              if (proposalResponse.pricingData) {
                const projectTotalFee = proposalResponse.pricingData.projectTotalFee || client.projectValue || 0;
                
                // Update the task with content and metadata in one operation
                await storage.updateCompanionTask(newTask.id, {
                  content,
                  metadata: JSON.stringify({
                    projectTotalFee: projectTotalFee,
                    carePlanMonthly: proposalResponse.pricingData.carePlanMonthly || 0,
                    productsMonthlyTotal: proposalResponse.pricingData.productsMonthlyTotal || 0
                  }),
                  status: "completed"
                });
                
                // Update the client's project value if a price was extracted
                if (projectTotalFee > 0 && projectTotalFee !== client.projectValue) {
                  try {
                    await storage.updateClient(clientId, {
                      projectValue: projectTotalFee
                    });
                    console.log(`Updated client ${clientId} project value to ${projectTotalFee}`);
                  } catch (error) {
                    console.error(`Failed to update client project value: ${error}`);
                  }
                }
                
                // Get the updated task and return it
                const updatedTask = await storage.getCompanionTask(newTask.id);
                return res.json(updatedTask);
              }
            } else {
              // Handle the case where the response is a string (for backward compatibility)
              content = proposalResponse as string;
            }
            break;
          case TaskType.DEFINE_SCOPE:
            // Find a completed proposal to use for generating the scope document
            const scopeProposalTasks = await storage.getCompanionTasks(clientId);
            const scopeProposalTask = scopeProposalTasks
              .find(t => t.type === TaskType.PROPOSAL && t.status === "completed");
            
            // Generate scope document using the proposal content if available
            content = await generateProjectScope(client, scopeProposalTask?.content || undefined);
            break;
            
          case TaskType.CONTRACT:
            // Find a completed proposal to use for generating the contract
            const contractProposalTasks = await storage.getCompanionTasks(clientId);
            const contractProposalTask = contractProposalTasks
              .find(t => t.type === TaskType.PROPOSAL && t.status === "completed");
            
            // Generate contract using the proposal content if available
            content = await generateContract(client, contractProposalTask?.content || undefined);
            break;
          case TaskType.SITE_MAP:
            // Find a completed proposal to use for generating the site map
            const siteMapProposalTasks = await storage.getCompanionTasks(clientId);
            const siteMapProposalTask = siteMapProposalTasks
              .find(t => t.type === TaskType.PROPOSAL && t.status === "completed");
            
            // Generate site map using the proposal content if available
            content = await generateSiteMap(client, siteMapProposalTask?.content || undefined);
            break;
          case TaskType.SCHEDULE_DISCOVERY:
            // Get the company analysis ID to reference in the email
            const discoveryAnalysisTasks = await storage.getCompanionTasks(clientId);
            const analysisTask = discoveryAnalysisTasks
              .find(t => t.type === TaskType.COMPANY_ANALYSIS && t.status === "completed");
            content = await generateScheduleDiscovery(client, analysisTask?.id);
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
            
          case TaskType.SITE_OPTIMIZER:
            // Generate AI recommendations based on site metrics
            // Extract site metrics from request body if provided, or build default metrics
            const siteMetrics = req.body?.siteMetrics || {
              performance: {
                score: 86,
                firstContentfulPaint: "1.2s",
                largestContentfulPaint: "2.8s",
                cumulativeLayoutShift: "0.12"
              },
              accessibility: { score: 92 },
              seo: {
                score: 88,
                ranking: 12,
                keywords: ["web development", "web design", "digital marketing"],
                monthlyVisits: 3200,
                growthRate: 18.5
              },
              bestPractices: { score: 78 },
              security: { issues: 0, lastScan: new Date().toISOString() },
              maintenance: {
                pluginsToUpdate: 2,
                lastBackupDate: new Date().toISOString()
              }
            };
            
            // Generate recommendations using OpenAI
            const recommendations = await generateSiteRecommendations(client, siteMetrics);
            content = JSON.stringify(recommendations, null, 2);
            break;
        }
        
        // For all task types, update the content and status
        // Include metadata if it was prepared earlier
        const updateObject: any = {
          content,
          status: "completed"
        };
        
        // If we have metadata assigned to newTask (from proposals), include it
        if (newTask.metadata) {
          updateObject.metadata = newTask.metadata;
        }
        
        const updatedTask = await storage.updateCompanionTask(newTask.id, updateObject);
        
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
  
  // ===== Site Map Sharing Routes =====
  
  // Create a share token for a site map
  app.post("/api/site-maps/:taskId/share", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Verify task exists and is a site map
      const task = await storage.getCompanionTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.type !== 'site_map') {
        return res.status(400).json({ message: "Only site maps can be shared" });
      }
      
      // Create or get existing share token
      let shareToken = task.shareToken;
      if (!shareToken) {
        shareToken = await storage.createShareToken(taskId);
      }
      
      // Return the share URL
      const shareUrl = `${req.protocol}://${req.get('host')}/share/site-map/${shareToken}`;
      return res.json({ shareToken, shareUrl });
    } catch (error) {
      console.error("Error creating share token:", error);
      return res.status(500).json({ message: "Failed to create share token" });
    }
  });
  
  // Get a shared site map by token (public route, no authentication required)
  app.get("/api/share/site-map/:shareToken", async (req: Request, res: Response) => {
    try {
      const { shareToken } = req.params;
      if (!shareToken) {
        return res.status(400).json({ message: "Share token is required" });
      }
      
      // Find the task by share token
      const task = await storage.getTaskByShareToken(shareToken);
      if (!task) {
        return res.status(404).json({ message: "Site map not found or link expired" });
      }
      
      // Get the client information
      const client = await storage.getClient(task.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client information not available" });
      }
      
      // Return the site map content and client info
      return res.json({
        taskId: task.id,
        clientId: task.clientId,
        clientName: client.name,
        content: task.content,
        createdAt: task.createdAt
      });
    } catch (error) {
      console.error("Error fetching shared site map:", error);
      return res.status(500).json({ message: "Failed to retrieve shared site map" });
    }
  });
  
  // Submit feedback for a shared site map
  app.post("/api/share/site-map/:shareToken/update-content", async (req: Request, res: Response) => {
    try {
      const { shareToken } = req.params;
      const { content } = req.body;
      
      // Validate content
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // Find the site map using the share token
      const shareInfo = await storage.getSiteMapByShareToken(shareToken);
      
      if (!shareInfo) {
        return res.status(404).json({ message: "Site map not found" });
      }
      
      // Update the task content
      const updatedTask = await storage.updateCompanionTaskContent(shareInfo.taskId, content);
      
      if (!updatedTask) {
        return res.status(500).json({ message: "Failed to update content" });
      }
      
      return res.status(200).json({ message: "Content updated successfully" });
    } catch (error) {
      console.error("Error updating site map content:", error);
      return res.status(500).json({ message: "Server error updating content" });
    }
  });

  app.post("/api/share/site-map/:shareToken/feedback", async (req: Request, res: Response) => {
    try {
      const { shareToken } = req.params;
      const { clientEmail, feedback, approved } = req.body;
      
      if (!shareToken) {
        return res.status(400).json({ message: "Share token is required" });
      }
      
      if (!clientEmail) {
        return res.status(400).json({ message: "Client email is required" });
      }
      
      // Find the task by share token
      const task = await storage.getTaskByShareToken(shareToken);
      if (!task) {
        return res.status(404).json({ message: "Site map not found or link expired" });
      }
      
      // Submit the feedback
      await storage.submitSiteMapFeedback(
        task.id,
        clientEmail,
        feedback || "",
        !!approved
      );
      
      return res.json({ message: "Feedback submitted successfully" });
    } catch (error) {
      console.error("Error submitting site map feedback:", error);
      return res.status(500).json({ message: "Failed to submit feedback" });
    }
  });
  
  // ===== Email Routes =====
  
  // Send email route
  app.post("/api/email/send", async (req: Request, res: Response) => {
    try {
      const { to, from, subject, text, html } = req.body;
      
      // Validate required fields
      if (!to || !from || !subject || (!text && !html)) {
        return res.status(400).json({ 
          message: "Missing required fields. Please provide to, from, subject, and either text or html content." 
        });
      }
      
      // Send the email
      const emailParams: EmailParams = {
        to,
        from,
        subject,
        text,
        html
      };
      
      const success = await sendEmail(emailParams);
      
      if (success) {
        return res.status(200).json({ message: "Email sent successfully" });
      } else {
        return res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ message: "An error occurred while sending email" });
    }
  });
  
  // Content expansion endpoint for AI-powered text enhancement
  app.post("/api/content/expand", async (req: Request, res: Response) => {
    try {
      const { content, context, isEditorContent } = req.body;
      
      if (!content) {
        return res.status(400).json({ 
          message: "Content is required", 
          success: false,
          originalContent: "",
          expandedContent: ""
        });
      }
      
      // Validate content length
      if (content.length < 10) {
        return res.status(400).json({ 
          message: "Content is too short to expand. Please provide more initial content.", 
          success: false,
          originalContent: content,
          expandedContent: content
        });
      }
      
      // Create a complete context object with the Editor.js format flag
      const enhancedContext = {
        ...(context || {}),
        isEditorContent: Boolean(isEditorContent)
      };
      
      console.log("Expanding content with context:", JSON.stringify(enhancedContext));
      console.log("Original content length:", content.length);
      console.log("Using Editor.js format:", Boolean(isEditorContent));
      
      // Add a timeout for the OpenAI call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Content expansion timed out after 60 seconds")), 60000);
      });
      
      // Expand the content using OpenAI with timeout handling
      const expandContentPromise = expandSectionContent(content, enhancedContext);
      const expandedContent = await Promise.race([expandContentPromise, timeoutPromise]) as string;
      
      // Validate the expanded content
      if (!expandedContent || expandedContent.length <= content.length) {
        console.warn("Expansion returned shorter or same length content");
        return res.json({ 
          message: "Content could not be meaningfully expanded",
          originalContent: content,
          expandedContent: content,
          success: false
        });
      }
      
      // Log the successful result for debugging
      console.log("OpenAI expansion result length:", expandedContent.length);
      console.log("Expansion ratio:", (expandedContent.length / content.length).toFixed(2) + "x");
      
      // Return a standardized response with detailed success information
      return res.json({ 
        originalContent: content,
        expandedContent: expandedContent,
        success: true,
        message: "Content expanded successfully",
        expansionRatio: expandedContent.length / content.length
      });
    } catch (error) {
      console.error("Error expanding content:", error);
      
      // Determine the right error message and status
      let errorMessage = "Failed to expand content";
      let statusCode = 500;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error types
        if (errorMessage.includes("timeout")) {
          statusCode = 504; // Gateway Timeout
        } else if (errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
          statusCode = 429; // Too Many Requests
        }
      }
      
      // Include more details about the error in the response
      // Get the original content from the request body if available
      const originalContent = req.body?.content || "";
        
      return res.status(statusCode).json({ 
        message: errorMessage, 
        error: error instanceof Error ? error.message : "Unknown error",
        originalContent: originalContent,
        expandedContent: originalContent,
        success: false
      });
    }
  });

  return httpServer;
}
