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
  // Discovery phase tasks
  COMPANY_ANALYSIS = "company_analysis",
  SCHEDULE_DISCOVERY = "schedule_discovery",
  PROPOSAL = "proposal",
  
  // Planning phase tasks
  DEFINE_SCOPE = "define_scope",
  CONTRACT = "contract", 
  THIRD_PARTY = "third_party",
  
  // Design and Development phase tasks
  SITE_MAP = "site_map",
  AI_SITE_DESIGNER = "ai_site_designer",
  AI_QA_TOOL = "ai_qa_tool",
  
  // Post Launch Management phase tasks
  STATUS_UPDATE = "status_update",
  SITE_MAINTENANCE = "site_maintenance",
  SITE_OPTIMIZER = "site_optimizer"
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

// Function to get keyword data from DataForSEO using the Keyword Data API
async function getKeywordData(keyword: string): Promise<any> {
  try {
    if (!keyword) {
      console.log("No keyword provided");
      return null;
    }
    
    // Skip API call if no API credentials available
    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      console.log("DataForSEO credentials not found, skipping API call");
      return null;
    }
    
    // Maximum number of retry attempts
    const maxRetries = 2;
    let retryCount = 0;
    let lastError: Error | null = null;
    
    // Start retry loop
    while (retryCount <= maxRetries) {
      try {
        console.log(`Fetching keyword data for: ${keyword}${retryCount > 0 ? ` (Retry ${retryCount})` : ''}`);
        
        // DataForSEO Keyword Data API endpoint
        const url = "https://api.dataforseo.com/v3/keywords_data/google/search_volume/live";
        
        // Request body with the keyword and parameters
        const data = [{
          "keywords": [keyword],
          "location_name": "United States",
          "language_name": "English"
        }];
        
        // Create base64 encoded credentials
        const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
        
        // Make request to DataForSEO API with Basic Auth in headers
        const response = await axios.post(url, data, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`
          }
        });
        
        // Log response status for debugging
        console.log("DataForSEO search volume response status:", response.status);
        
        // Check for API errors in the response body (DataForSEO uses status_code)
        if (response.data && response.data.status_code !== 20000) {
          if (response.data.status_code === 40101) {
            console.error("DataForSEO Authentication Error:", response.data.status_message);
            // No point in retrying auth errors
            return null;
          }
          
          throw new Error(`DataForSEO API returned error: ${response.data.status_code} - ${response.data.status_message}`);
        }
        
        // Check for valid data structure and return results
        if (response.data && response.data.tasks && response.data.tasks.length > 0) {
          console.log("Received keyword data from DataForSEO");
          return response.data.tasks[0].result;
        } else {
          console.warn(`No results found for keyword: ${keyword}`);
          return null;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Error fetching keyword data (Attempt ${retryCount + 1}/${maxRetries + 1}):`, lastError.message);
        
        // Only retry if we haven't reached the max retry count
        if (retryCount < maxRetries) {
          // Exponential backoff: 1s, 2s
          const delay = 1000 * Math.pow(2, retryCount);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
        } else {
          console.error(`Max retries reached for keyword: ${keyword}`);
          break;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in DataForSEO keyword data function:", error);
    return null;
  }
}

// Function to check SERP data for a keyword using DataForSEO
async function checkSerpData(keyword: string, websiteUrl: string): Promise<any> {
  try {
    if (!keyword || !websiteUrl) {
      console.log("Missing keyword or website URL for SERP check");
      return null;
    }
    
    // Skip API call if no API credentials available
    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      console.log("DataForSEO credentials not found, skipping SERP API call");
      return null;
    }
    
    // Maximum number of retry attempts
    const maxRetries = 2;
    let retryCount = 0;
    let lastError: Error | null = null;
    
    // Clean website URL for domain check
    let domain = websiteUrl;
    if (domain.startsWith('http://')) domain = domain.substring(7);
    if (domain.startsWith('https://')) domain = domain.substring(8);
    if (domain.startsWith('www.')) domain = domain.substring(4);
    if (domain.includes('/')) domain = domain.split('/')[0];
    
    // Start retry loop
    while (retryCount <= maxRetries) {
      try {
        console.log(`Checking SERP data for keyword "${keyword}" and website ${websiteUrl}${retryCount > 0 ? ` (Retry ${retryCount})` : ''}`);
        
        // DataForSEO SERP API endpoint
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
        
        // Create base64 encoded credentials
        const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
        
        // Make request to DataForSEO API with Basic Auth in headers
        const response = await axios.post(url, data, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`
          }
        });
        
        // Log response status for debugging
        console.log("DataForSEO SERP response status:", response.status);
        
        // Check for API errors in the response body (DataForSEO uses status_code)
        if (response.data && response.data.status_code !== 20000) {
          if (response.data.status_code === 40101) {
            console.error("DataForSEO Authentication Error in SERP API:", response.data.status_message);
            // No point in retrying auth errors
            return null;
          }
          
          throw new Error(`DataForSEO SERP API returned error: ${response.data.status_code} - ${response.data.status_message}`);
        }
        
        // Process SERP data when available
        if (response.data && response.data.tasks && response.data.tasks.length > 0 && 
            response.data.tasks[0].result && response.data.tasks[0].result.length > 0) {
          
          const results = response.data.tasks[0].result[0];
          
          // Check if client's domain appears in the results and at what position
          let clientPosition = null;
          if (results.items) {
            for (let i = 0; i < results.items.length; i++) {
              const item = results.items[i];
              if (item.domain && item.domain.includes(domain)) {
                clientPosition = item.rank_position;
                break;
              }
            }
          }
          
          // Build and return the SERP data structure
          return {
            keywordDifficulty: results.se_results?.keyword_difficulty || "Unknown",
            searchVolume: results.se_results?.search_volume || "Unknown", 
            clientPosition: clientPosition,
            totalResults: results.se_results?.total_count || "Unknown",
            topCompetitors: results.items ? results.items.slice(0, 3).map((item: any) => ({
              domain: item.domain,
              position: item.rank_position,
              title: item.title
            })) : []
          };
        } else {
          console.warn(`No SERP results found for keyword: ${keyword}`);
          return null;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Error checking SERP data (Attempt ${retryCount + 1}/${maxRetries + 1}):`, lastError.message);
        
        // Only retry if we haven't reached the max retry count
        if (retryCount < maxRetries) {
          // Exponential backoff: 1s, 2s
          const delay = 1000 * Math.pow(2, retryCount);
          console.log(`Retrying SERP check in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
        } else {
          console.error(`Max retries reached for SERP check: ${keyword}`);
          break;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in DataForSEO SERP data function:", error);
    return null;
  }
}

// Function to get website performance data using Google PageSpeed API
async function getWebsitePerformance(url: string): Promise<any> {
  try {
    if (!url) {
      console.log("No URL provided for PageSpeed analysis");
      return null;
    }
    
    // Clean URL if needed
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    console.log(`Getting PageSpeed data for URL: ${url}`);
    
    // Make request to Google PageSpeed API
    const response = await axios.get(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${GOOGLE_API_KEY}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`
    );
    
    console.log("PageSpeed API response status:", response.status);
    
    if (response.data && response.data.lighthouseResult) {
      const metrics = response.data.lighthouseResult.audits;
      const categories = response.data.lighthouseResult.categories;
      
      // Log the available categories to debug
      console.log("PageSpeed categories available:", Object.keys(categories));
      
      // Extract scores with detailed logging and round to integers
      const performanceScore = Math.round(categories.performance?.score * 100) || 0;
      const accessibilityScore = Math.round(categories.accessibility?.score * 100) || 0; 
      const bestPracticesScore = Math.round(categories['best-practices']?.score * 100) || 0;
      const pagespeedSeoScore = Math.round(categories.seo?.score * 100) || 0;
      
      console.log("PageSpeed scores:", {
        performance: performanceScore,
        accessibility: accessibilityScore,
        bestPractices: bestPracticesScore,
        seo: pagespeedSeoScore
      });
      
      // Extract key performance metrics
      const coreMetrics = {
        firstContentfulPaint: metrics['first-contentful-paint']?.displayValue || 'N/A',
        largestContentfulPaint: metrics['largest-contentful-paint']?.displayValue || 'N/A',
        cumulativeLayoutShift: metrics['cumulative-layout-shift']?.displayValue || 'N/A',
        totalBlockingTime: metrics['total-blocking-time']?.displayValue || 'N/A',
        speedIndex: metrics['speed-index']?.displayValue || 'N/A',
        interactive: metrics['interactive']?.displayValue || 'N/A'
      };
      
      console.log("Core web vitals:", coreMetrics);
      
      // Collect specific issues from the audits
      const issues = [];
      
      // Performance issues
      if (performanceScore < 90) {
        if (metrics['render-blocking-resources'] && metrics['render-blocking-resources'].score < 0.9) {
          issues.push("Reduce render-blocking resources");
        }
        if (metrics['unused-javascript'] && metrics['unused-javascript'].score < 0.9) {
          issues.push("Remove unused JavaScript");
        }
        if (metrics['unminified-css'] && metrics['unminified-css'].score < 0.9) {
          issues.push("Minify CSS files");
        }
        if (metrics['uses-responsive-images'] && metrics['uses-responsive-images'].score < 0.9) {
          issues.push("Properly size images");
        }
      }
      
      // Accessibility issues  
      if (accessibilityScore < 90) {
        if (metrics['color-contrast'] && metrics['color-contrast'].score < 0.9) {
          issues.push("Improve color contrast");
        }
        if (metrics['document-title'] && metrics['document-title'].score < 0.9) {
          issues.push("Add a proper document title");
        }
        if (metrics['html-has-lang'] && metrics['html-has-lang'].score < 0.9) {
          issues.push("Add HTML lang attribute");
        }
      }
      
      // Best practices issues
      if (bestPracticesScore < 90) {
        if (metrics['no-document-write'] && metrics['no-document-write'].score < 0.9) {
          issues.push("Avoid document.write()");
        }
        if (metrics['uses-https'] && metrics['uses-https'].score < 0.9) {
          issues.push("Ensure HTTPS usage");
        }
      }
      
      // SEO issues
      if (pagespeedSeoScore < 90) {
        if (metrics['meta-description'] && metrics['meta-description'].score < 0.9) {
          issues.push("Add meta descriptions");
        }
        if (metrics['link-text'] && metrics['link-text'].score < 0.9) {
          issues.push("Use descriptive link text");
        }
      }
      
      const result = {
        performance: performanceScore,
        accessibility: accessibilityScore,
        bestPractices: bestPracticesScore,
        pagespeedSeo: pagespeedSeoScore, // Renamed to clarify it's from PageSpeed
        ...coreMetrics,
        issues: issues
      };
      
      return result;
    } else {
      console.log("PageSpeed API response did not contain expected data");
      return null;
    }
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
          content: `You are an expert SEO keyword research specialist. Extract exactly 12 high-value keywords or keyphrases from the text that would generate traffic and conversions for the business.

Your keywords should include:
- 4 head terms (1-2 words with higher search volume)
- 4 mid-tail terms (2-3 words with moderate search volume)
- 4 long-tail terms (3-5 words with specific intent and lower competition)

For each category, prioritize:
1. Commercially valuable terms (purchase intent, solution-seeking)
2. Keywords that match user search intent
3. Industry-specific terms that show expertise
4. Competitor-ranking opportunities

IMPORTANT: Ensure keywords are actual search phrases people would type into Google, not internal jargon or made-up terms.

Return ONLY a JSON object with a 'keywords' array containing the keywords as strings.
Format: {"keywords": ["keyword1", "keyword2", ...]}. Do not include any other fields or format.` 
        },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    let keywords = result.keywords || [];
    
    // Ensure we have at least 5 keywords
    if (keywords.length < 5) {
      // Extract important words from the text as a fallback
      const words = text.split(/\s+/);
      const commonWords = new Set(['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'or', 'as', 'if', 'then', 'else', 'when', 'up', 'down', 'in', 'out', 'no', 'yes', 'so', 'such', 'than', 'that', 'which', 'who', 'whom', 'this', 'these', 'those', 'am', 'will', 'shall']);
      
      // Extract meaningful words (longer than 4 chars and not in common words)
      const meaningfulWords = words.filter(word => word.length > 4 && !commonWords.has(word.toLowerCase()));
      
      // Get the most frequent meaningful words
      const wordCount = meaningfulWords.reduce<Record<string, number>>((acc, word) => {
        const lowerWord = word.toLowerCase();
        acc[lowerWord] = (acc[lowerWord] || 0) + 1;
        return acc;
      }, {});
      
      // Sort by frequency and get the top ones
      const additionalKeywords = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word)
        .slice(0, 8 - keywords.length);
      
      keywords = [...keywords, ...additionalKeywords];
    }
    
    // Keep up to 12 keywords for a more comprehensive analysis
    return keywords.slice(0, 12);
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return ["error extracting keywords"];
  }
}

// Initial function for Company Analysis
async function generateInitialAnalysis(clientInfo: any): Promise<string> {
  // Extract the most relevant business information
  const businessName = clientInfo.name;
  const businessDescription = clientInfo.projectDescription || "No description provided"; // Will use field as-is now, and update to businessDescription later
  const websiteUrl = clientInfo.websiteUrl || "N/A";
  const industry = clientInfo.industry;
  
  const prompt = `Create an in-depth company analysis for "${businessName}" that a web designer will use to learn about their client's business and create a professional deliverable.

Important client information:
- Business name: ${businessName}
- Business description: ${businessDescription}
- Website URL: ${websiteUrl}
- Industry: ${industry}

IMPORTANT: Focus ONLY on the specific business information provided above. The analysis must be specific to this client, not generic industry information.

The analysis should include:
- Detailed business overview based on the business description (NOT generic industry information)
- Key competitors likely faced by this specific business based on their description
- Target audience analysis specifically for this business
- Challenges specific to this business based on their description
- Initial SEO strategy recommendations tailored for their specific business
- Suggested keywords they should focus on (list exactly 5 specific keywords that are most relevant to this business)

When suggesting keywords, focus on terms that:
1. Reflect the client's specific business offerings
2. Match their target audience's search intent
3. Have balance between competition difficulty and search volume
4. Include a mix of short and long-tail keywords
5. Are directly relevant to their business description

Format the response as a professional business document with clear sections and bullet points where appropriate, suitable for creating a client deliverable.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10000,
    });

    return response.choices[0].message.content || "Failed to generate initial company analysis.";
  } catch (error) {
    console.error("Error generating initial analysis:", error);
    throw new Error("Failed to generate company analysis");
  }
}

// Define the structure for the visual company analysis
interface CompanyAnalysisOutput {
  businessOverview: {
    summary: string;
    keyPoints: string[];
    industryPosition: string;
  };
  competitorsAnalysis: {
    mainCompetitors: { name: string; strengths: string; weaknesses: string }[];
    competitiveAdvantage: string;
  };
  targetAudience: {
    demographics: string;
    psychographics: string;
    painPoints: string[];
    goals: string[];
  };
  industryChallenges: {
    currentChallenges: string[];
    futureThreats: string[];
    opportunities: string[];
  };
  keywordAnalysis: {
    recommendedKeywords: { keyword: string; volume: string; difficulty: string; clientPosition?: string; recommendation: string }[];
    seoStrategy: string;
  };
  websitePerformance: {
    overallScore: number;
    performanceMetrics: {
      performance: number;
      accessibility: number;
      seo: number; // This is populated with pagespeedSeo but named seo in the report
      bestPractices: number;
    };
    loadingSpeed: string;
    mobileUsability: string;
    improvementAreas: string[];
  };
  recommendations: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
    priorityActions: string;
  };
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
    
    // Step 3: Get keyword data from DataForSEO and check SERP data
    console.log("Getting keyword data and SERP analysis...");
    
    // Make parallel requests to both APIs for each keyword
    const keywordDataPromises = keywords.map(keyword => getKeywordData(keyword));
    const serpDataPromises = clientInfo.websiteUrl ? 
      keywords.map(keyword => checkSerpData(keyword, clientInfo.websiteUrl)) : 
      keywords.map(() => Promise.resolve(null));
    
    // Wait for all API calls to complete
    const [keywordDataResults, serpDataResults] = await Promise.all([
      Promise.all(keywordDataPromises),
      Promise.all(serpDataPromises)
    ]);
    
    // Step 4: Get website performance data
    console.log("Getting website performance data...");
    const websitePerformance = clientInfo.websiteUrl ? 
      await getWebsitePerformance(clientInfo.websiteUrl) : null;
    
    // Step 5: Generate structured analysis using OpenAI
    console.log("Generating final comprehensive analysis...");
    
    // Format keyword data for prompt with both search volume and SERP data
    const keywordDataFormatted = keywords.map((keyword, index) => {
      const volumeData = keywordDataResults[index];
      const serpData = serpDataResults[index];
      
      // Default data
      let keywordInfo = {
        keyword: keyword,
        volume: "Unknown",
        // Removed difficulty as it's consistently unreliable
        clientPosition: "Not ranked",
        recommendation: "Needs research"
      };
      
      // Add volume data if available
      if (volumeData && volumeData[0] && volumeData[0].search_volume) {
        keywordInfo.volume = volumeData[0].search_volume.toString();
      }
      
      // Calculate keyword difficulty even when DataForSEO doesn't provide it
      const calculateKeywordDifficulty = (keyword: string, volume?: string): number => {
        // If we have DataForSEO data, use it
        if (serpData && serpData.keywordDifficulty !== undefined) {
          return serpData.keywordDifficulty;
        }
        
        // Otherwise, use our algorithm to calculate an estimated difficulty
        let difficulty = 50; // Start with a neutral score (medium difficulty)
        
        // 1. Adjust based on keyword length (longer keywords are usually less competitive)
        const wordCount = keyword.split(/\s+/).length;
        difficulty -= (wordCount - 1) * 5; // Reduce difficulty by 5 for each additional word
        
        // 2. Adjust based on search volume (higher volume = higher competition)
        const numericVolume = volume ? parseInt(volume.replace(/,/g, '')) : 0;
        if (numericVolume > 0) {
          if (numericVolume > 10000) difficulty += 20;
          else if (numericVolume > 5000) difficulty += 15;
          else if (numericVolume > 1000) difficulty += 10;
          else if (numericVolume > 500) difficulty += 5;
          else if (numericVolume < 100) difficulty -= 10;
        }
        
        // 3. Adjust based on keyword specificity and commercial intent
        const commercialTerms = ['buy', 'price', 'purchase', 'shop', 'cost', 'review', 'best', 'top', 'cheap', 'discount'];
        const hasCommercialIntent = commercialTerms.some(term => keyword.toLowerCase().includes(term));
        if (hasCommercialIntent) difficulty += 10;
        
        // 4. Adjust for long-tail specificity
        if (keyword.length > 20) difficulty -= 5;
        
        // Ensure difficulty stays within 0-100 range
        return Math.max(0, Math.min(100, difficulty));
      };
      
      // Add SERP data if available
      if (serpData) {
        // Set client position if available
        keywordInfo.clientPosition = serpData.clientPosition ? 
          `Ranked #${serpData.clientPosition}` : "Not in top 100";
        
        // Generate recommendation based on position data
        if (serpData.clientPosition && serpData.clientPosition <= 10) {
          keywordInfo.recommendation = "Maintain position";
        } else if (serpData.clientPosition && serpData.clientPosition <= 30) {
          keywordInfo.recommendation = "Optimize content";
        } else {
          keywordInfo.recommendation = "Create targeted content";
        }
      } else {
        // No SERP data available, use volume to determine recommendation
        const volumeNum = keywordInfo.volume !== "Unknown" ? 
          parseInt(keywordInfo.volume.replace(/,/g, '')) : 0;
        
        if (volumeNum > 5000) {
          keywordInfo.recommendation = "High-value target, create optimized content";
        } else if (volumeNum > 1000) {
          keywordInfo.recommendation = "Good opportunity, create relevant content";
        } else {
          keywordInfo.recommendation = "Consider targeting this keyword";
        }
      }
      
      return keywordInfo;
    });
    
    // Format performance data for prompt - clearly separate from DataForSEO SEO data
    const performanceData = websitePerformance ? {
      performance: websitePerformance.performance,
      accessibility: websitePerformance.accessibility,
      bestPractices: websitePerformance.bestPractices,
      pagespeedSeo: websitePerformance.pagespeedSeo, // Renamed to make distinction clear
      firstContentfulPaint: websitePerformance.firstContentfulPaint,
      largestContentfulPaint: websitePerformance.largestContentfulPaint,
      cumulativeLayoutShift: websitePerformance.cumulativeLayoutShift,
      totalBlockingTime: websitePerformance.totalBlockingTime,
      speedIndex: websitePerformance.speedIndex,
      interactive: websitePerformance.interactive,
      issues: websitePerformance.issues || []
    } : null;
    
    // Create a structured prompt for JSON output
    const structuredPrompt = `
      As an expert business analyst, create a comprehensive visual company analysis report for ${clientInfo.name} in the ${clientInfo.industry} industry.
      
      Initial business analysis:
      ${initialAnalysis}
      
      Keyword data: ${JSON.stringify(keywordDataFormatted)}
      
      Website performance data: ${JSON.stringify(performanceData)}
      
      Return a JSON object that follows this exact structure. Fill all fields with appropriate content based on the provided information:
      {
        "businessOverview": {
          "summary": "Brief overview of the business and its position",
          "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
          "industryPosition": "Analysis of position in the industry"
        },
        "competitorsAnalysis": {
          "mainCompetitors": [
            {"name": "Competitor 1", "strengths": "Their strengths", "weaknesses": "Their weaknesses"},
            {"name": "Competitor 2", "strengths": "Their strengths", "weaknesses": "Their weaknesses"}
          ],
          "competitiveAdvantage": "The client's competitive advantage"
        },
        "targetAudience": {
          "demographics": "Description of demographic characteristics",
          "psychographics": "Description of psychographic characteristics",
          "painPoints": ["Pain point 1", "Pain point 2"],
          "goals": ["Goal 1", "Goal 2"]
        },
        "industryChallenges": {
          "currentChallenges": ["Challenge 1", "Challenge 2"],
          "futureThreats": ["Threat 1", "Threat 2"],
          "opportunities": ["Opportunity 1", "Opportunity 2"]
        },
        "keywordAnalysis": {
          "recommendedKeywords": [
            {"keyword": "Keyword 1", "volume": "Volume data", "recommendation": "Specific recommendation"},
            {"keyword": "Keyword 2", "volume": "Volume data", "recommendation": "Specific recommendation"}
          ],
          "seoStrategy": "Brief SEO strategy overview"
        },
        "websitePerformance": {
          "overallScore": ${performanceData ? Math.round((performanceData.performance + performanceData.accessibility + performanceData.pagespeedSeo + performanceData.bestPractices) / 4) : 0},
          "performanceMetrics": {
            "performance": ${performanceData?.performance || 0},
            "accessibility": ${performanceData?.accessibility || 0},
            "seo": ${performanceData?.pagespeedSeo || 0}, // Using pagespeedSeo here
            "bestPractices": ${performanceData?.bestPractices || 0}
          },
          "loadingSpeed": "${performanceData ? 'First Contentful Paint: ' + performanceData.firstContentfulPaint + ', Largest Contentful Paint: ' + performanceData.largestContentfulPaint + ', Time to Interactive: ' + performanceData.interactive : 'No data available'}",
          "mobileUsability": "${performanceData ? 'The website has ' + (performanceData.pagespeedSeo > 80 ? 'good' : 'areas for improvement in') + ' mobile usability according to PageSpeed Insights' : 'No data available'}",
          "improvementAreas": ${performanceData && performanceData.issues && performanceData.issues.length > 0 
            ? JSON.stringify(performanceData.issues) 
            : performanceData 
              ? `[
                  ${performanceData.performance < 90 ? `"Improve page performance (current score: ${performanceData.performance}%)"` : ""},
                  ${performanceData.accessibility < 90 ? `"Enhance accessibility features (current score: ${performanceData.accessibility}%)"` : ""},
                  ${performanceData.pagespeedSeo < 90 ? `"Optimize technical SEO elements (current score: ${performanceData.pagespeedSeo}%)"` : ""},
                  ${performanceData.bestPractices < 90 ? `"Address web best practices (current score: ${performanceData.bestPractices}%)"` : ""}
                ].filter(item => item !== "")`
              : "[]"}
        },
        "recommendations": {
          "shortTerm": ["Short-term action 1", "Short-term action 2"],
          "mediumTerm": ["Medium-term action 1", "Medium-term action 2"],
          "longTerm": ["Long-term action 1", "Long-term action 2"],
          "priorityActions": "The most important actions to take"
        }
      }
      
      Make all content specific to the client, industry, and data provided. Use realistic, actionable insights.
    `;
    
    // Get the structured analysis from OpenAI
    const structuredResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the mini model for efficiency
      messages: [{ role: "user", content: structuredPrompt }],
      response_format: { type: "json_object" }, // Ensure we get a proper JSON response
      max_tokens: 10000,
    });
    
    // Parse the JSON response
    const analysisJson = JSON.parse(structuredResponse.choices[0].message.content || "{}");
    
    // Convert the JSON to an HTML report format for better visualization
    const htmlReport = generateHtmlReport(analysisJson, clientInfo);
    
    return htmlReport;
  } catch (error) {
    console.error("Error in company analysis generation pipeline:", error);
    throw new Error("Failed to generate complete company analysis");
  }
}

// Function to convert the JSON analysis to HTML for better visualization
function generateHtmlReport(analysisData: any, clientInfo: any): string {
  try {
    // Format the date
    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}`;
    
    // Removed difficulty formatting functions as we no longer display difficulty
    
    // Format the search volume
    const getVolumeLabel = (volume: string) => {
      if (volume === 'Unknown') return 'Unknown';
      const volumeNum = parseInt(volume.replace(/,/g, ''));
      if (volumeNum >= 10000) return 'High';
      if (volumeNum >= 1000) return 'Medium';
      return 'Low';
    };
    
    // Format the search volume color
    const getVolumeColor = (volume: string) => {
      if (volume === 'Unknown') return '#9E9E9E'; // Gray for unknown
      const volumeNum = parseInt(volume.replace(/,/g, ''));
      if (volumeNum >= 10000) return '#4CAF50'; // Green for high
      if (volumeNum >= 1000) return '#FFC107'; // Amber for medium
      return '#F44336'; // Red for low
    };
    
    // Generate the performance score color
    const getScoreColor = (score: number) => {
      if (score >= 90) return '#4CAF50'; // Green for good
      if (score >= 50) return '#FFC107'; // Amber for needs improvement
      return '#F44336'; // Red for poor
    };
    
    // Calculate the overall score from performance metrics
    const calculateOverallScore = () => {
      if (!analysisData.websitePerformance || !analysisData.websitePerformance.performanceMetrics) {
        return 0;
      }
      
      const metrics = analysisData.websitePerformance.performanceMetrics;
      // Weight the scores - SEO and performance are most important
      const weightedScore = (
        metrics.performance * 0.35 + 
        metrics.seo * 0.35 + 
        metrics.accessibility * 0.15 + 
        metrics.bestPractices * 0.15
      );
      
      return Math.round(weightedScore);
    };
    
    const overallScore = analysisData.websitePerformance ? 
      (analysisData.websitePerformance.overallScore || calculateOverallScore()) : 0;
    
    // Function to convert array to HTML list
    const arrayToList = (arr: string[]) => {
      if (!arr || arr.length === 0) return "<p>No data available</p>";
      return "<ul>" + arr.map((item: string) => `<li>${item}</li>`).join("") + "</ul>";
    };
    
    // Create enhanced keyword analysis visualization
    const keywordTable = () => {
      if (!analysisData.keywordAnalysis.recommendedKeywords || analysisData.keywordAnalysis.recommendedKeywords.length === 0) {
        return `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
                  <p>No keyword data available. This could be due to API connectivity issues.</p>
                </div>`;
      }
      
      // Helper function to generate volume indicator
      const getVolumeIndicator = (volume: string) => {
        if (volume === "Unknown" || !volume) return "";
        
        const volumeNum = parseInt(volume.replace(/,/g, ""));
        
        if (isNaN(volumeNum)) return "";
        
        if (volumeNum > 10000) {
          return `<span style="display: inline-block; width: 50px; text-align: center; background-color: #4CAF50; color: white; padding: 3px; border-radius: 3px; font-size: 12px;">HIGH</span>`;
        } else if (volumeNum > 1000) {
          return `<span style="display: inline-block; width: 50px; text-align: center; background-color: #FFC107; color: black; padding: 3px; border-radius: 3px; font-size: 12px;">MED</span>`;
        } else {
          return `<span style="display: inline-block; width: 50px; text-align: center; background-color: #F44336; color: white; padding: 3px; border-radius: 3px; font-size: 12px;">LOW</span>`;
        }
      };
      
      // Removed difficulty indicator function as we no longer show difficulty
      
      // Helper function to get action badge
      const getActionBadge = (recommendation: string) => {
        if (!recommendation || recommendation === "Research") return "";
        
        if (recommendation.includes("Maintain")) {
          return `<span style="display: inline-block; background-color: #2ecc71; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin-left: 5px;">MAINTAIN</span>`;
        } else if (recommendation.includes("Optimize")) {
          return `<span style="display: inline-block; background-color: #3498db; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin-left: 5px;">OPTIMIZE</span>`;
        } else if (recommendation.includes("Create")) {
          return `<span style="display: inline-block; background-color: #e74c3c; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin-left: 5px;">CREATE</span>`;
        }
        
        return "";
      };
      
      // Helper function to visualize ranking position
      const getRankingVisualization = (position: string) => {
        if (!position || position === "Unknown" || position.includes("Not")) {
          return `<div style="width: 200px; height: 20px; background-color: #f2f2f2; border-radius: 10px; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; text-align: center; line-height: 20px; font-size: 12px;">Not Ranked</div>
                  </div>`;
        }
        
        const rankNum = parseInt(position.replace("Ranked #", ""));
        
        if (isNaN(rankNum)) return "";
        
        let color = "#e74c3c"; // Red (bad rank)
        let width = "100%";
        
        if (rankNum <= 3) {
          color = "#27ae60"; // Green (excellent rank)
          width = "20%";
        } else if (rankNum <= 10) {
          color = "#2ecc71"; // Light green (good rank)
          width = "40%";
        } else if (rankNum <= 20) {
          color = "#f39c12"; // Orange (ok rank)
          width = "60%";
        } else if (rankNum <= 50) {
          color = "#e67e22"; // Dark orange (poor rank)
          width = "80%";
        }
        
        return `<div style="width: 200px; height: 20px; background-color: #f2f2f2; border-radius: 10px; overflow: hidden;">
                  <div style="width: ${width}; height: 100%; background-color: ${color}; border-radius: 10px 0 0 10px; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; text-align: center; line-height: 20px; color: white; font-weight: bold; text-shadow: 0 0 2px rgba(0,0,0,0.5); font-size: 12px;">${position}</div>
                  </div>
                </div>`;
      };
      
      return `
        <div style="margin-top: 15px;">
          ${analysisData.keywordAnalysis.recommendedKeywords.map((kw: any) => {
            return `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <h4 style="margin: 0; color: #2c3e50; font-size: 18px;">${kw.keyword} ${getActionBadge(kw.recommendation)}</h4>
                  <div>
                    ${getVolumeIndicator(kw.volume)}
                  </div>
                </div>
                
                <div style="display: flex; flex-wrap: wrap; margin-bottom: 10px;">
                  <div style="flex: 1; min-width: 200px;">
                    <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 5px;">Search Volume</div>
                    <div style="font-weight: bold; color: #2c3e50;">${kw.volume || "Data Unavailable"}</div>
                  </div>
                </div>
                
                <div style="margin-top: 15px;">
                  <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 5px;">Ranking Position</div>
                  ${getRankingVisualization(kw.clientPosition)}
                </div>
                
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd;">
                  <h5 style="margin: 0 0 5px 0; color: #3498db;">Recommendation</h5>
                  <p style="margin: 0; color: #2c3e50;">${kw.recommendation || "Perform keyword research to determine opportunity"}</p>
                </div>
              </div>
            `;
          }).join("")}
        </div>
        
        <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin-top: 20px; display: flex; align-items: center;">
          <div style="flex-shrink: 0; margin-right: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div>
            <div style="font-weight: bold; color: #2c3e50; margin-bottom: 5px;">Data Source Information</div>
            <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
              Keyword data is sourced from DataForSEO API. 
              "Not Ranked" means the client's website does not appear in the top 100 search results for this keyword.
            </p>
          </div>
        </div>
      `;
    };
    
    // Create enhanced competitor analysis visualization
    const competitorTable = () => {
      if (!analysisData.competitorsAnalysis.mainCompetitors || analysisData.competitorsAnalysis.mainCompetitors.length === 0) {
        return `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
                  <p>No competitor data available</p>
                </div>`;
      }
      
      return `
        <div style="margin-top: 15px;">
          ${analysisData.competitorsAnalysis.mainCompetitors.map((comp: any) => `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; color: #2c3e50; font-size: 18px; border-left: 4px solid #3498db; padding-left: 10px;">${comp.name}</h4>
                <div>
                  <span style="display: inline-block; background-color: #3498db; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">COMPETITOR</span>
                </div>
              </div>
              
              <div style="display: flex; flex-wrap: wrap; margin-top: 15px;">
                <div style="flex: 1; min-width: 250px; margin-right: 20px; margin-bottom: 15px;">
                  <div style="background-color: #e8f6f3; padding: 15px; border-radius: 5px; height: 100%;">
                    <h5 style="margin: 0 0 10px 0; color: #27ae60; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Strengths
                    </h5>
                    <p style="margin: 0; color: #2c3e50;">${comp.strengths}</p>
                  </div>
                </div>
                
                <div style="flex: 1; min-width: 250px;">
                  <div style="background-color: #fef5f5; padding: 15px; border-radius: 5px; height: 100%;">
                    <h5 style="margin: 0 0 10px 0; color: #e74c3c; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Weaknesses
                    </h5>
                    <p style="margin: 0; color: #2c3e50;">${comp.weaknesses}</p>
                  </div>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    };
    
    // Enhanced website performance visualization
    const performanceMetrics = () => {
      // Defensive check to ensure metrics object exists
      if (!analysisData.websitePerformance || !analysisData.websitePerformance.performanceMetrics) {
        console.log("Performance metrics data is missing");
        return `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
                  <p>Performance metrics data is unavailable</p>
                </div>`;
      }
      
      // Safety check - log metrics for debugging
      const metrics = analysisData.websitePerformance.performanceMetrics;
      console.log("Rendering metrics:", metrics);
      
      // Use default values if metrics are missing to prevent rendering issues
      const performance = metrics.performance || 0;
      const accessibility = metrics.accessibility || 0;
      const seo = metrics.seo || 0;
      const bestPractices = metrics.bestPractices || 0;
      
      // Helper function to render score gauge
      const renderGauge = (score: number, label: string, info: string = '') => {
        const color = getColorForScore(score);
        const scoreGrade = score >= 90 ? 'Excellent' : (score >= 70 ? 'Good' : 'Poor');
        
        return `
          <div style="flex: 1; min-width: 220px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 15px; text-align: center;">
            <div style="position: relative; width: 100px; height: 100px; margin: 0 auto 15px auto;">
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; 
                   background: conic-gradient(${color} ${score}%, #e0e0e0 0%);"></div>
              <div style="position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; background-color: white; border-radius: 50%; 
                   display: flex; justify-content: center; align-items: center; flex-direction: column;">
                <div style="font-size: 24px; font-weight: bold; color: ${color};">${score}%</div>
                <div style="font-size: 12px; color: #7f8c8d;">${scoreGrade}</div>
              </div>
            </div>
            <div style="font-weight: bold; margin-bottom: 5px; color: #2c3e50;">${label}</div>
            ${info ? `<div style="font-size: 12px; color: #7f8c8d;">${info}</div>` : ''}
          </div>
        `;
      };
      
      return `
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="margin-bottom: 20px;">
            <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 5px;">Data Source</div>
            <div style="display: flex; align-items: center;">
              <img src="https://www.gstatic.com/images/branding/product/2x/pagespeed_64dp.png" width="24" height="24" 
                   style="margin-right: 8px;">
              <span style="font-weight: bold; color: #2c3e50;">Google PageSpeed Insights</span>
            </div>
          </div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 20px;">
            ${renderGauge(performance, 'Performance', 'Loading speed')}
            ${renderGauge(accessibility, 'Accessibility', 'For all users')}
            ${renderGauge(seo, 'Technical SEO', 'Search optimization')}
            ${renderGauge(bestPractices, 'Best Practices', 'Web standards')}
          </div>
          
          <div style="margin-top: 20px; background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                   stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div style="font-weight: bold; color: #2c3e50;">What Do These Scores Mean?</div>
            </div>
            <p style="margin: 0; color: #7f8c8d; font-size: 14px; line-height: 1.5;">
              These scores indicate how well your website performs according to Google's standards. Higher scores mean better performance, which can lead to improved user experience and potentially better search rankings.
            </p>
          </div>
        </div>
      `;
    };
    
    // Get color based on score
    const getColorForScore = (score: number) => {
      if (score >= 90) return "#4CAF50"; // Green
      if (score >= 70) return "#FFC107"; // Yellow
      return "#F44336"; // Red
    };

    // Generate the full HTML report
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-top: 0;">Company Analysis Report</h1>
          <h2 style="color: #3498db;">${clientInfo.name}</h2>
          <p style="color: #7f8c8d;">Industry: ${clientInfo.industry}</p>
          <p style="color: #7f8c8d;">Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Business Overview Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Business Overview</h2>
          <p>${analysisData.businessOverview.summary}</p>
          <h3 style="color: #3498db;">Key Points</h3>
          ${arrayToList(analysisData.businessOverview.keyPoints)}
          <h3 style="color: #3498db;">Industry Position</h3>
          <p>${analysisData.businessOverview.industryPosition}</p>
        </div>
        
        <!-- Competitors Analysis Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Competitors Analysis</h2>
          <h3 style="color: #3498db;">Main Competitors</h3>
          ${competitorTable()}
          <h3 style="color: #3498db;">Competitive Advantage</h3>
          <p>${analysisData.competitorsAnalysis.competitiveAdvantage}</p>
        </div>
        
        <!-- Target Audience Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Target Audience</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; min-width: 300px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #3498db; margin-top: 0;">Demographics</h3>
              <p>${analysisData.targetAudience.demographics}</p>
            </div>
            <div style="flex: 1; min-width: 300px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #3498db; margin-top: 0;">Psychographics</h3>
              <p>${analysisData.targetAudience.psychographics}</p>
            </div>
          </div>
          <h3 style="color: #3498db;">Pain Points</h3>
          ${arrayToList(analysisData.targetAudience.painPoints)}
          <h3 style="color: #3498db;">Goals</h3>
          ${arrayToList(analysisData.targetAudience.goals)}
        </div>
        
        <!-- Industry Challenges Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Industry Challenges & Opportunities</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div style="flex: 1; min-width: 300px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #e74c3c; margin-top: 0;">Current Challenges</h3>
              ${arrayToList(analysisData.industryChallenges.currentChallenges)}
            </div>
            <div style="flex: 1; min-width: 300px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #f39c12; margin-top: 0;">Future Threats</h3>
              ${arrayToList(analysisData.industryChallenges.futureThreats)}
            </div>
            <div style="flex: 1; min-width: 300px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #2ecc71; margin-top: 0;">Opportunities</h3>
              ${arrayToList(analysisData.industryChallenges.opportunities)}
            </div>
          </div>
        </div>
        
        <!-- Keyword Analysis Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Keyword Analysis & SEO Strategy</h2>
          <h3 style="color: #3498db;">Recommended Keywords</h3>
          ${keywordTable()}
          <h3 style="color: #3498db;">SEO Strategy</h3>
          <p>${analysisData.keywordAnalysis.seoStrategy}</p>
        </div>
        
        <!-- Website Performance Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Website Performance Assessment</h2>
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; width: 150px; height: 150px; border-radius: 50%; position: relative; background: conic-gradient(${getColorForScore(analysisData.websitePerformance.overallScore)} ${analysisData.websitePerformance.overallScore}%, #e0e0e0 0);">
              <div style="position: absolute; top: 10px; right: 10px; bottom: 10px; left: 10px; border-radius: 50%; background-color: white; display: flex; justify-content: center; align-items: center;">
                <div>
                  <div style="font-size: 36px; font-weight: bold; color: #2c3e50;">${analysisData.websitePerformance.overallScore}</div>
                  <div style="font-size: 14px; color: #7f8c8d;">Overall Score</div>
                </div>
              </div>
            </div>
          </div>
          <h3 style="color: #3498db;">Google PageSpeed Insights Metrics</h3>
          ${performanceMetrics()}
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
            <div style="flex: 1; min-width: 300px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #3498db; margin-top: 0;">Loading Speed</h3>
              <p>${analysisData.websitePerformance.loadingSpeed}</p>
            </div>
            <div style="flex: 1; min-width: 300px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #3498db; margin-top: 0;">Mobile Usability</h3>
              <p>${analysisData.websitePerformance.mobileUsability}</p>
            </div>
          </div>
          <h3 style="color: #3498db;">Areas for Improvement</h3>
          ${arrayToList(analysisData.websitePerformance.improvementAreas)}
        </div>
        
        <!-- Recommendations Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Strategic Recommendations</h2>
          <div style="background-color: #fcf3cf; padding: 15px; border-left: 5px solid #f1c40f; margin-bottom: 20px;">
            <h3 style="color: #f39c12; margin-top: 0;">Priority Actions</h3>
            <p>${analysisData.recommendations.priorityActions}</p>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div style="flex: 1; min-width: 300px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #2ecc71; margin-top: 0;">Short-term Actions</h3>
              ${arrayToList(analysisData.recommendations.shortTerm)}
            </div>
            <div style="flex: 1; min-width: 300px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #3498db; margin-top: 0;">Medium-term Actions</h3>
              ${arrayToList(analysisData.recommendations.mediumTerm)}
            </div>
            <div style="flex: 1; min-width: 300px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #9b59b6; margin-top: 0;">Long-term Actions</h3>
              ${arrayToList(analysisData.recommendations.longTerm)}
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d;">
          <p>This report was automatically generated based on industry data, website analysis, and market research. The recommendations are intended as a starting point for your digital strategy.</p>
        </div>
      </div>
    `;
    
    return html;
  } catch (error) {
    console.error("Error generating HTML report:", error);
    return "Failed to generate visual report. Error converting data to visual format.";
  }
}

export async function generateProposal(clientInfo: any, marketResearch?: string, discoveryNotes?: string): Promise<string> {
  // Extract strategic recommendations from market research if available
  let strategicRecommendations = "";
  if (marketResearch) {
    // Try to extract the strategic recommendations section
    const recommendationsMatch = marketResearch.match(/Strategic Recommendations([\s\S]*?)(?=<\/div>\s*<div|$)/i);
    if (recommendationsMatch && recommendationsMatch[1]) {
      strategicRecommendations = recommendationsMatch[1].trim();
    } else {
      // If we can't find the section, use a portion of the market research
      strategicRecommendations = marketResearch.substring(0, 500) + "...";
    }
  }

  // Calculate recommended project value based on client's industry and project description
  let basePrice = clientInfo.projectValue || 5000; // Use client's value as starting point or default to 5000
  
  // Determine project complexity based on description and industry
  let complexity = "medium";
  const description = (clientInfo.projectDescription || "").toLowerCase();
  
  if (
    description.includes("e-commerce") || 
    description.includes("payment") || 
    description.includes("booking") || 
    description.includes("reservation") ||
    description.includes("member") ||
    description.includes("portal") ||
    description.includes("dashboard") ||
    description.includes("custom") ||
    clientInfo.industry === "E-commerce" ||
    clientInfo.industry === "Finance"
  ) {
    complexity = "high";
    if (basePrice < 7500) basePrice = 7500;
  } else if (
    description.includes("blog") || 
    description.includes("simple") || 
    description.includes("basic") ||
    description.includes("landing page")
  ) {
    complexity = "low";
    if (basePrice > 3500) basePrice = 3500;
  }
  
  // Recommended price range
  const lowRange = Math.round(basePrice * 0.9);
  const highRange = Math.round(basePrice * 1.2);
  
  // Recommended GoDaddy products based on project needs
  const recommendedProducts = [];
  
  // Basic needs for all websites
  recommendedProducts.push({
    name: "GoDaddy Domain Registration",
    description: "Secure your business domain name",
    price: "$20/year"
  });
  
  recommendedProducts.push({
    name: "GoDaddy Business Hosting",
    description: "Fast, reliable hosting for your professional website",
    price: "$15-30/month"
  });
  
  if (complexity === "high" || description.includes("e-commerce") || description.includes("shop") || description.includes("store")) {
    recommendedProducts.push({
      name: "GoDaddy E-commerce Plan",
      description: "Complete online store solution with payment processing",
      price: "$25-45/month"
    });
  }
  
  if (description.includes("email") || description.includes("newsletter") || description.includes("marketing")) {
    recommendedProducts.push({
      name: "GoDaddy Email Marketing",
      description: "Professional email marketing tools to grow your business",
      price: "$10-20/month"
    });
  }
  
  if (complexity !== "low") {
    recommendedProducts.push({
      name: "GoDaddy Website Security",
      description: "SSL certificate and malware protection",
      price: "$5-10/month"
    });
  }
  
  // Convert products to formatted string
  const productsText = recommendedProducts.map(p => 
    `- ${p.name}: ${p.description} (${p.price})`
  ).join("\\n");

  const prompt = `Create a professional project proposal for ${clientInfo.name} to generate a winning proposal for client approval. The project is "${clientInfo.projectName}" with the following description: "${clientInfo.projectDescription || "No detailed description available"}".

Client Information:
- Business Name: ${clientInfo.name}
- Website URL: ${clientInfo.websiteUrl || "No website URL provided"}
- Project Name: ${clientInfo.projectName}

${discoveryNotes ? "During our discovery call, I took these notes:\n" + discoveryNotes + "\n\n" : ""}

${strategicRecommendations ? "Based on our market research, we've identified these strategic recommendations for your business:\n" + strategicRecommendations + "\n\n" : ""}

For this project, we recommend a budget of $${lowRange} - $${highRange} based on the requirements and industry standards.

We also recommend the following GoDaddy products for this project: ${productsText}

## Proposal Sections

Format the proposal as a professional HTML business proposal with clear sections, styling, and visual elements. Make it visually appealing with a professional design. 

1. **Cover Page:**
   - [Agency Logo]
   - Web Design Proposal for ${clientInfo.name}
   - Prepared by [Your Name] on [Date], Proposal # [ID]

2. **Executive Summary:**
   - Brief overview of the project and client needs (≤ 75 words)


3. **Objectives & Success Metrics:**
   - Objective, KPI & Target, Business Impact
     

4. **Project Scope & Deliverables:**
   - Phase, Key Activities, Tangible Deliverables
 

5. **Timeline & Milestones:**
   - Week, Milestone


6. **Investment & Pricing:**
   - You'll provide a quote/dollar amounts based on the client's industry and project needs in the following items.
   - Total Project Fee: $ [Amount]
   - Stage, % Due, Amount
   - Signing: 50%, $ …
   - Design approval: 25%, $ …
   - Pre-launch: 25%, $ …
   - Optional Care Plan: $ [Monthly] – hosting, updates, backups, SEO tweaks.
   - ROI Snapshot: Example: One extra sale per week at $ [AvgOrder] pays for the site in [X] months.

7. **Why Choose Us:**
   - Our unique value proposition.

8. **GoDaddy Product Recommendations:**
   - List of recommended GoDaddy products with descriptions and pricing

9. **Social Proof:**


10. **Next Steps:**
    - Sign the acceptance below.
    - Pay the 50% deposit (secure link).
    - Book the kickoff call (calendar link).
    - We’ll hold your start date for seven days.

11. **Acceptance:**
    - I, [Client Name], authorize [Agency] to proceed as outlined.

# Output Format

The proposal should be delivered as an HTML document with section headers and formatted text. Include placeholders for [Agency Logo], [Your Name], [Date], [Client Name], etc., and ensure that placeholders for financial and metric data (e.g., $ [Amount], [AvgOrder], [X]) are clearly defined.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10000,
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
  
  Client Information:
  - Business Name: ${clientInfo.name}
  - Website URL: ${clientInfo.websiteUrl || "No website URL provided"}
  - Industry: ${clientInfo.industry || "Not specified"}
  - Project Name: ${clientInfo.projectName}
  
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
      max_tokens: 10000,
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
  
  Client Information:
  - Business Name: ${clientInfo.name}
  - Website URL: ${clientInfo.websiteUrl || "No website URL provided"}
  - Industry: ${clientInfo.industry || "Not specified"}
  - Project Name: ${clientInfo.projectName}
  
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
      max_tokens: 10000,
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
  
  Client Information:
  - Business Name: ${clientInfo.name}
  - Website URL: ${clientInfo.websiteUrl || "No website URL provided"}
  - Industry: ${clientInfo.industry || "Not specified"}
  - Project Name: ${clientInfo.projectName}
  
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
      max_tokens: 10000,
    });

    return response.choices[0].message.content || "Failed to generate status update.";
  } catch (error) {
    console.error("Error generating status update:", error);
    throw new Error("Failed to generate status update email");
  }
}

// Generate an email for scheduling a discovery call with the client
// Includes references to the company analysis that was already generated
export async function generateScheduleDiscovery(clientInfo: any, analysisId?: number): Promise<string> {
  const clientName = clientInfo.name;
  const contactName = clientInfo.contactName;
  const projectName = clientInfo.projectName;
  
  // Default booking URL - in a real app, this would come from your configuration
  const bookingUrl = "https://calendly.com/yourbusiness/discovery-call";
  
  // Create a reference link to the company analysis if an ID was provided
  const analysisLinkHtml = analysisId 
    ? `<p style="margin-bottom: 20px;">I've also prepared a complimentary <a href="/client-portal/analysis/${analysisId}" style="color: #0066cc; text-decoration: underline;">business analysis report</a> for you to review before our call. This will give you a sense of our initial findings and help frame our discussion.</p>`
    : '';

  const prompt = `Create a professional email template for scheduling a discovery call with a new client named ${clientName} regarding their project "${projectName}".

  Client Information:
  - Business Name: ${clientInfo.name}
  - Website URL: ${clientInfo.websiteUrl || "No website URL provided"}
  - Industry: ${clientInfo.industry || "Not specified"}
  - Contact Name: ${contactName}
  - Project Name: ${projectName}

  The email should:
  - Have a clear, professional subject line
  - Start with a warm, personalized greeting to ${contactName}
  - Thank them for their interest in your web design/development services
  - Briefly mention that you've analyzed their business and prepared a complimentary report (which they can access via the link that will be included)
  - Suggest scheduling a discovery call to discuss their project needs in detail
  - Include a placeholder for a booking link: [BOOKING_URL]
  - Mention that the call will help you understand their goals, timelines, and budget
  - End with a professional closing
  
  Format the response as an HTML email that I can send directly. Make it visually appealing with proper spacing, paragraphs, and minimal styling.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8000,
    });

    // Get the generated content
    let emailContent = response.choices[0].message.content || "Failed to generate email content.";
    
    // Replace the booking URL placeholder with the actual URL
    emailContent = emailContent.replace('[BOOKING_URL]', bookingUrl);
    
    // Add the analysis link paragraph after the first paragraph (after the greeting)
    if (analysisId) {
      const firstParagraphEnd = emailContent.indexOf('</p>') + 4;
      if (firstParagraphEnd > 4) {
        emailContent = 
          emailContent.substring(0, firstParagraphEnd) + 
          analysisLinkHtml + 
          emailContent.substring(firstParagraphEnd);
      }
    }

    return emailContent;
  } catch (error) {
    console.error("Error generating discovery call email:", error);
    throw new Error("Failed to generate discovery call email");
  }
}