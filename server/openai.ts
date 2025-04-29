import OpenAI from "openai";
import axios from "axios";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// DataForSEO API credentials
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

// Google PageSpeed API
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Define task types for client companion
export enum TaskType {
  COMPANY_ANALYSIS = "company_analysis",
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

// Function to get keyword data from DataForSEO
async function getKeywordData(keyword: string): Promise<any> {
  try {
    // DataForSEO API endpoint
    const url = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced";
    
    // Request body with the keyword and parameters
    const data = [
      {
        keyword: keyword,
        language_code: "en",
        location_code: 2840, // USA
        device: "desktop",
        os: "windows"
      }
    ];
    
    // Make request to DataForSEO API
    const response = await axios.post(url, data, {
      auth: {
        username: DATAFORSEO_LOGIN as string,
        password: DATAFORSEO_PASSWORD as string
      },
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (response.data && response.data.tasks && response.data.tasks.length > 0) {
      return response.data.tasks[0].result;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching keyword data from DataForSEO:", error);
    return null;
  }
}

// Function to get website performance data using Google PageSpeed API
async function getWebsitePerformance(url: string): Promise<any> {
  try {
    if (!url) {
      return null;
    }
    
    // Clean URL if needed
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    // Make request to Google PageSpeed API
    const response = await axios.get(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${GOOGLE_API_KEY}`
    );
    
    if (response.data && response.data.lighthouseResult) {
      const metrics = response.data.lighthouseResult.audits;
      const categories = response.data.lighthouseResult.categories;
      
      return {
        performance: categories.performance?.score * 100 || 0,
        accessibility: categories.accessibility?.score * 100 || 0,
        bestPractices: categories['best-practices']?.score * 100 || 0,
        seo: categories.seo?.score * 100 || 0,
        firstContentfulPaint: metrics['first-contentful-paint']?.displayValue || 'N/A',
        largestContentfulPaint: metrics['largest-contentful-paint']?.displayValue || 'N/A',
        speedIndex: metrics['speed-index']?.displayValue || 'N/A',
        totalBlockingTime: metrics['total-blocking-time']?.displayValue || 'N/A',
        issues: []
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching website performance data:", error);
    return null;
  }
}

// Function to extract keywords from AI analysis
async function extractKeywords(text: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are a keyword extraction specialist. Extract the 5 most important keywords or keyphrases from the text. Return only the keywords as a JSON array with no additional text or explanation." 
        },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.keywords || [];
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return [];
  }
}

// Initial function for Company Analysis
async function generateInitialAnalysis(clientInfo: any): Promise<string> {
  const prompt = `Create a professional company analysis for a client in the ${clientInfo.industry} industry. 
  The client name is "${clientInfo.name}" and they are working on a project called "${clientInfo.projectName}".
  If available, include details from their website: ${clientInfo.websiteUrl || "N/A"}.
  The analysis should include:
  - Business overview
  - Key competitors in their market
  - Target audience analysis
  - Industry challenges they are facing
  - Initial SEO strategy recommendations
  - Suggested keywords they should focus on (list 5 specific keywords)
  
  Format the response as a professional business document with sections and bullet points where appropriate.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Failed to generate initial company analysis.";
  } catch (error) {
    console.error("Error generating initial analysis:", error);
    throw new Error("Failed to generate company analysis");
  }
}

// Function to generate comprehensive company analysis with integrated data
export async function generateCompanyAnalysis(clientInfo: any): Promise<string> {
  try {
    console.log("Generating initial company analysis...");
    // Step 1: Generate initial analysis with OpenAI
    const initialAnalysis = await generateInitialAnalysis(clientInfo);
    
    // Step 2: Extract keywords from the analysis
    console.log("Extracting keywords...");
    const keywords = await extractKeywords(initialAnalysis);
    
    // Step 3: Get keyword data from DataForSEO for each keyword
    console.log("Getting keyword data...");
    const keywordDataPromises = keywords.map(keyword => getKeywordData(keyword));
    const keywordDataResults = await Promise.all(keywordDataPromises);
    
    // Step 4: Get website performance data
    console.log("Getting website performance data...");
    const websitePerformance = clientInfo.websiteUrl ? 
      await getWebsitePerformance(clientInfo.websiteUrl) : null;
    
    // Step 5: Integrate all data into final analysis
    console.log("Generating final comprehensive analysis...");
    
    // Format keyword data for prompt
    const keywordDataFormatted = keywords.map((keyword, index) => {
      const data = keywordDataResults[index];
      if (data && data[0] && data[0].items) {
        const searchVolume = data[0].search_volume || "Unknown";
        const topResults = data[0].items.slice(0, 3).map((item: any) => item.title).join(", ");
        return `- "${keyword}": Search volume: ${searchVolume}, Top results include: ${topResults}`;
      }
      return `- "${keyword}": No detailed data available`;
    }).join("\n");
    
    // Format performance data for prompt
    let performanceDataFormatted = "No website performance data available.";
    if (websitePerformance) {
      performanceDataFormatted = `
        Performance score: ${websitePerformance.performance}/100
        Accessibility score: ${websitePerformance.accessibility}/100
        SEO score: ${websitePerformance.seo}/100
        First Contentful Paint: ${websitePerformance.firstContentfulPaint}
        Largest Contentful Paint: ${websitePerformance.largestContentfulPaint}
        Speed Index: ${websitePerformance.speedIndex}
        Total Blocking Time: ${websitePerformance.totalBlockingTime}
      `;
    }
    
    // Final integration prompt
    const finalPrompt = `
      Create a comprehensive, visual-friendly company analysis report for ${clientInfo.name} in the ${clientInfo.industry} industry.
      
      Use this initial analysis as a foundation:
      ${initialAnalysis}
      
      Integrate this keyword data:
      ${keywordDataFormatted}
      
      Include this website performance information:
      ${performanceDataFormatted}
      
      The final report should be well-structured with these sections:
      1. Business Overview
      2. Competitors Analysis
      3. Target Audience Profile
      4. Industry Challenges
      5. Keyword Analysis & SEO Strategy
      6. Website Performance Assessment
      7. Strategic Recommendations
      
      Format as a professional, visually organized report with sections, bullet points, and data visualization descriptions where appropriate.
      Make specific, actionable recommendations based on all the data integrated above.
    `;
    
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: finalPrompt }],
      max_tokens: 2000,
    });
    
    return finalResponse.choices[0].message.content || "Failed to generate company analysis.";
  } catch (error) {
    console.error("Error in company analysis generation pipeline:", error);
    throw new Error("Failed to generate complete company analysis");
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