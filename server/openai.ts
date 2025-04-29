import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define task types for client companion
export enum TaskType {
  MARKET_RESEARCH = "market_research",
  PROPOSAL = "proposal",
  CONTRACT = "contract", 
  SITE_MAP = "site_map",
  STATUS_UPDATE = "status_update"
}

// Define interfaces for companion tasks
export interface CompanionTask {
  id: number;
  clientId: number;
  type: TaskType;
  status: "pending" | "in_progress" | "completed";
  content: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// Functions to generate content using OpenAI
export async function generateMarketResearch(clientInfo: any): Promise<string> {
  const prompt = `Create a professional market research report for a client in the ${clientInfo.industry} industry. 
  The client name is "${clientInfo.name}" and they are working on a project called "${clientInfo.projectName}".
  If available, include details from their website: ${clientInfo.websiteUrl || "N/A"}.
  The report should include:
  - Industry overview and market trends
  - Competitive landscape analysis
  - Target audience insights
  - Opportunities and challenges
  - Recommendations for digital strategy
  
  Format the response as a professional business document with sections and bullet points where appropriate.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Failed to generate market research.";
  } catch (error) {
    console.error("Error generating market research:", error);
    throw new Error("Failed to generate market research report");
  }
}

export async function generateProposal(clientInfo: any, marketResearch?: string): Promise<string> {
  const prompt = `Create a professional project proposal for ${clientInfo.name} in the ${clientInfo.industry} industry. 
  The project is "${clientInfo.projectName}" with the following description: "${clientInfo.projectDescription || "No detailed description available"}".
  The proposal value is approximately ${clientInfo.projectValue}.
  
  ${marketResearch ? "Please incorporate insights from this market research: " + marketResearch.substring(0, 500) + "..." : ""}
  
  The proposal should include:
  - Project understanding and objectives
  - Proposed approach and methodology
  - Deliverables and timeline
  - Pricing and payment terms
  - Next steps
  
  Format as a professional business proposal with clear sections and formatting.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Failed to generate proposal.";
  } catch (error) {
    console.error("Error generating proposal:", error);
    throw new Error("Failed to generate project proposal");
  }
}

export async function generateContract(clientInfo: any): Promise<string> {
  const prompt = `Create a professional web design/development services contract for ${clientInfo.name}.
  The project is "${clientInfo.projectName}" with value approximately ${clientInfo.projectValue}.
  
  The contract should include:
  - Parties involved (use placeholder for the agency name)
  - Scope of work
  - Timeline and deliverables
  - Payment terms and schedule
  - Intellectual property rights
  - Termination clauses
  - Standard legal protections
  
  Format as a formal legal document that could be used as a starting point for a real contract.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Failed to generate contract.";
  } catch (error) {
    console.error("Error generating contract:", error);
    throw new Error("Failed to generate contract");
  }
}

export async function generateSiteMap(clientInfo: any): Promise<string> {
  const prompt = `Create a detailed website sitemap and content plan for ${clientInfo.name} in the ${clientInfo.industry} industry.
  The project is "${clientInfo.projectName}".
  
  Include:
  - Main page structure and navigation
  - Key content sections with descriptions
  - Recommended content for each page (placeholder intro text for main sections)
  - Recommendations for features and functionality
  
  Provide this in a structured format that would be useful for website planning.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Failed to generate site map.";
  } catch (error) {
    console.error("Error generating site map:", error);
    throw new Error("Failed to generate site map and content plan");
  }
}

export async function generateStatusUpdate(clientInfo: any, taskStatus: any): Promise<string> {
  // Create a context about what tasks have been completed
  const completedTasksText = taskStatus && taskStatus.completedTasks ? 
    `Completed tasks: ${taskStatus.completedTasks.join(", ")}. ` : 
    "No tasks have been completed yet. ";
  
  const inProgressTasksText = taskStatus && taskStatus.inProgressTasks ? 
    `Tasks in progress: ${taskStatus.inProgressTasks.join(", ")}. ` : 
    "No tasks are currently in progress. ";

  const prompt = `Create a professional project status update email for ${clientInfo.name} regarding their project "${clientInfo.projectName}".
  
  Current project status: ${clientInfo.projectStatus}
  ${completedTasksText}
  ${inProgressTasksText}
  
  The email should:
  - Provide a friendly, professional greeting
  - Summarize current project status and recent progress
  - Outline what's coming next
  - Ask for any information or feedback needed to move forward
  - End with a professional closing
  
  Write this as if it's coming from a web design/development professional to their client.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Failed to generate status update.";
  } catch (error) {
    console.error("Error generating status update:", error);
    throw new Error("Failed to generate status update email");
  }
}