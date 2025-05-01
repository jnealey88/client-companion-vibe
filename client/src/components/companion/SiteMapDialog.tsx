import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  CheckCircle2, 
  Send, 
  AlertCircle, 
  Trash2, 
  LayoutGrid, 
  Share2, 
  Home,
  FileText,
  Menu,
  ChevronRight,
  Loader2,
  Save,
  RefreshCw,
  FileJson,
  Mail,
  Layers,
  Plus,
  Sparkles,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Client, CompanionTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { EditorJs } from "@/components/ui/editor-js";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// Define response interface for content expansion API
interface ContentExpansionResponse {
  originalContent: string;
  expandedContent: string;
  success: boolean;
}

interface ApiResponse {
  [key: string]: any;
}

// Define interfaces for the structured site map data
interface SiteSection {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  elements: string[];
}

interface SitePageData {
  id: string;
  title: string;
  url: string;
  metaDescription: string;
  isParent: boolean;
  children: string[];
  sections: SiteSection[];
  technicalFeatures: string[];
}

interface SiteOverview {
  title: string;
  description: string;
  primaryNavigation: string[];
  secondaryNavigation: string[];
}

interface ContentGuidelines {
  tone: string;
  callToAction: string;
  keyMessages: string[];
}

interface TechnicalRequirements {
  interactiveElements: string[];
  integrations: string[];
}

interface SiteMapData {
  siteOverview: SiteOverview;
  pages: SitePageData[];
  contentGuidelines: ContentGuidelines;
  technicalRequirements: TechnicalRequirements;
}

interface SiteMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  existingTask?: CompanionTask;
  onTaskGenerated?: (task: CompanionTask) => void;
}

// Function to extract clean section content from nested sitemap JSON
function extractSectionContentForEditor(content: string | undefined): string {
  if (!content) return '';
  
  console.log("EXTRACT SECTION - Examining content:", 
    typeof content === 'string' ? content.substring(0, 50) + "..." : "Not a string");

  // If it's a string, check if it contains JSON
  if (typeof content === 'string') {
    try {
      // Try to parse as JSON to extract content if it's in JSON format
      const parsed = JSON.parse(content);
      
      // Extract text from EditorJS format
      if (parsed && parsed.blocks && Array.isArray(parsed.blocks)) {
        // Extract text content from EditorJS blocks
        return parsed.blocks
          .map((block: any) => {
            if (block.type === 'paragraph' && block.data && block.data.text) {
              return block.data.text;
            }
            return '';
          })
          .filter(Boolean)
          .join('\n\n');
      }
      
      // Handle raw JSON content by looking for specific content fields
      if (parsed) {
        // Try to find content within common property names
        const possibleContentProperties = ['content', 'text', 'description', 'data', 'value'];
        for (const prop of possibleContentProperties) {
          if (parsed[prop] && typeof parsed[prop] === 'string') {
            return parsed[prop];
          }
        }
        
        // If couldn't find a specific content property, convert object to readable text
        if (typeof parsed === 'object') {
          // For sitemap specific content extraction
          if (parsed.siteOverview && parsed.pages) {
            // This appears to be the full sitemap JSON
            // Find specific section content instead of showing entire JSON
            return "Please edit this section with appropriate content.";
          }
          
          // Simple JSON to string (limit length to avoid overwhelming UI)
          const jsonText = JSON.stringify(parsed, null, 2);
          return jsonText.length > 1000 ? jsonText.substring(0, 1000) + '...' : jsonText;
        }
      }
    } catch (e) {
      // It's not valid JSON, treat as plain text
    }
    
    // If parsing failed or it's plain text, return it directly
    return content;
  }
  
  return '';
}

export default function SiteMapDialog({
  open,
  onOpenChange,
  client,
  existingTask,
  onTaskGenerated
}: SiteMapDialogProps) {
  // Core state
  const [siteMapContent, setSiteMapContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [isEdited, setIsEdited] = useState<boolean>(false);
  
  // Site map data state
  const [siteMapData, setSiteMapData] = useState<SiteMapData | null>(null);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pages");
  
  // Track which sections are currently being expanded with AI
  const [expandingSections, setExpandingSections] = useState<Record<string, boolean>>({});
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showRegenerate, setShowRegenerate] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>("Analyzing project information...");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Email sharing state
  const [recipientEmail, setRecipientEmail] = useState<string>(client.email || "");
  const [emailSubject, setEmailSubject] = useState<string>(`Website Sitemap for ${client.name} - Please Review`);
  const [emailMessage, setEmailMessage] = useState<string>(`Hi ${client.contactName || "there"},

I've created a detailed sitemap for your website project. This outlines the proposed structure, content, and functionality for your review. 

Please take a look and let me know if you have any questions or suggested changes.

Best regards,
Your Web Professional`);

  // Generation task
  const [generatedTask, setGeneratedTask] = useState<CompanionTask | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get and format the loading stages for this task type
  const loadingStages = [
    "Analyzing project requirements...",
    "Examining industry best practices...",
    "Reviewing proposal details...",
    "Planning site structure...",
    "Creating navigation hierarchy...",
    "Designing page layouts...",
    "Developing content recommendations...",
    "Finalizing sitemap document..."
  ];
  
  // Generate site map mutation
  const generateSiteMapMutation = useMutation({
    mutationFn: async ({ clientId }: { clientId: number }) => {
      setLoading(true);
      setLoadingStage(loadingStages[0]);
      setLoadingProgress(0);
      
      // We want the loading indicator to run for at least a few seconds
      // before actually making the API call, to give the user feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return apiRequest("POST", `/api/clients/${clientId}/generate/site_map`, {});
    },
    onSuccess: (response: any) => {
      console.log("Site map response:", response);
      
      // Finish the loading progress animation
      setLoadingProgress(100);
      setLoadingStage("Site map document complete!");
      
      // Wait a brief moment to show completion before proceeding
      setTimeout(() => {
        // Get proper data from the response
        if (response) {
          let data = response;
          
          // Make sure we have valid data and content
          if (data && typeof data === 'object' && data.content) {
            // Store the newly generated task for reference
            setGeneratedTask(data);
            
            // Set the content state
            setSiteMapContent(data.content);
            setEditedContent(data.content);
            
            // Try to parse the JSON data for structured display
            const parsedData = parseSiteMapData(data.content);
            setSiteMapData(parsedData);
            
            // Set initial active page if we have data
            if (parsedData && parsedData.pages.length > 0) {
              setActivePage(parsedData.pages[0].id);
            }
          } else {
            setError("The generated site map had an invalid format.");
          }
        } else {
          setError("Failed to generate site map. Please try again.");
        }
        
        // End loading state
        setLoading(false);
        setShowRegenerate(true);
      }, 500);
    },
    onError: (error) => {
      console.error("Error generating site map:", error);
      setLoading(false);
      setError("Failed to generate site map. Please try again.");
      setShowRegenerate(true);
      toast({
        title: "Generation failed",
        description: "Failed to generate site map. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Update task content mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: number, content: string }) => {
      setIsSaving(true);
      return apiRequest("PATCH", `/api/companion-tasks/${taskId}`, { content });
    },
    onSuccess: (updatedTask) => {
      setIsSaving(false);
      setIsEdited(false);
      
      // Update the cache with the new task data
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      
      toast({
        title: "Changes saved",
        description: "Your edits to the site map have been saved.",
      });
    },
    onError: () => {
      setIsSaving(false);
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ to, from, subject, html }: { to: string, from: string, subject: string, html: string }) => {
      setIsSending(true);
      return apiRequest("POST", "/api/email/send", { to, from, subject, html });
    },
    onSuccess: () => {
      setIsSending(false);
      toast({
        title: "Email sent",
        description: `Site map sent to ${recipientEmail} for review.`,
      });
    },
    onError: () => {
      setIsSending(false);
      toast({
        title: "Failed to send email",
        description: "There was an error sending the email. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Copy content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(siteMapContent)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Copied to clipboard",
          description: "The site map has been copied to your clipboard.",
        });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive"
        });
      });
  };
  
  // Generate a site map
  const handleGenerate = () => {
    setError(null);
    
    // Close the dialog first to show the in-card loading state
    if (onTaskGenerated && client?.id) {
      // Create a dummy task for the parent to start showing the loading state
      const dummyTask = { 
        id: 0,
        clientId: client.id,
        type: 'site_map',
        status: 'pending',
        content: null,
        createdAt: new Date(),
        completedAt: null
      } as CompanionTask;
      
      // Tell the parent to start its loading state
      onTaskGenerated(dummyTask);
      
      // Continue with the dialog open and start generating
      generateSiteMapMutation.mutate({ clientId: client.id });
    } else {
      onOpenChange(false);
    }
  };
  
  // Generate a unique ID for new items
  const generateUniqueId = (prefix: string): string => {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };
  
  // Add a new page to the site map
  // Page and section dialog states
  const [isAddPageDialogOpen, setIsAddPageDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("New Page");
  const [newPageUrl, setNewPageUrl] = useState("/new-page");
  const [newPageMetaDescription, setNewPageMetaDescription] = useState("This is a new page added to the site map. Update this description.");
  const [newPageIsParent, setNewPageIsParent] = useState(false);
  const [newPageTags, setNewPageTags] = useState<string[]>(["Content page"]);
  const [newPageTagInput, setNewPageTagInput] = useState("");
  
  const [activePageForSection, setActivePageForSection] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState("New Section");
  const [newSectionContent, setNewSectionContent] = useState("Enter the content for this section here.");
  const [newSectionTags, setNewSectionTags] = useState<string[]>(["Content block"]);
  const [newSectionTagInput, setNewSectionTagInput] = useState("");
  
  // Predefined tag suggestions
  const pageTagSuggestions = [
    "Homepage", "About", "Services", "Products", "Contact", 
    "Blog", "FAQ", "Testimonials", "Landing Page", "Portfolio",
    "Login", "Registration", "Account", "Checkout", "E-commerce"
  ];
  
  const sectionTagSuggestions = [
    "Hero Section", "Content Block", "Feature List", "Call to Action", 
    "Image Gallery", "Video", "Testimonial", "Contact Form", 
    "Pricing Table", "Team Members", "Map", "Timeline", "FAQ Accordion"
  ];

  // Helper function to add tags
  const addPageTag = () => {
    if (newPageTagInput.trim() && !newPageTags.includes(newPageTagInput.trim())) {
      setNewPageTags([...newPageTags, newPageTagInput.trim()]);
      setNewPageTagInput("");
    }
  };
  
  const removePageTag = (tag: string) => {
    setNewPageTags(newPageTags.filter(t => t !== tag));
  };
  
  const addSectionTag = () => {
    if (newSectionTagInput.trim() && !newSectionTags.includes(newSectionTagInput.trim())) {
      setNewSectionTags([...newSectionTags, newSectionTagInput.trim()]);
      setNewSectionTagInput("");
    }
  };
  
  const removeSectionTag = (tag: string) => {
    setNewSectionTags(newSectionTags.filter(t => t !== tag));
  };
  
  // Add a suggested tag
  const addSuggestedPageTag = (tag: string) => {
    if (!newPageTags.includes(tag)) {
      setNewPageTags([...newPageTags, tag]);
    }
  };
  
  const addSuggestedSectionTag = (tag: string) => {
    if (!newSectionTags.includes(tag)) {
      setNewSectionTags([...newSectionTags, tag]);
    }
  };
  
  // Show the add page dialog
  const handleAddNewPage = () => {
    if (!siteMapData) return;
    
    // Reset form values
    setNewPageTitle("New Page");
    setNewPageUrl("/new-page");
    setNewPageMetaDescription("This is a new page added to the site map. Update this description.");
    setNewPageIsParent(false);
    setNewPageTags(["Content page"]);
    setNewPageTagInput("");
    
    // Open the dialog
    setIsAddPageDialogOpen(true);
  };
  
  // Create a new page from the dialog input
  const confirmAddNewPage = () => {
    if (!siteMapData) return;
    
    // Create a deep copy of the site map data
    const updatedSiteMapData = JSON.parse(JSON.stringify(siteMapData)) as SiteMapData;
    
    // Format the URL if needed
    let formattedUrl = newPageUrl;
    if (formattedUrl && !formattedUrl.startsWith('/')) {
      formattedUrl = '/' + formattedUrl;
    }
    
    // Create a new page with the user-provided values
    const newPageId = generateUniqueId('page');
    const newPage: SitePageData = {
      id: newPageId,
      title: newPageTitle || "New Page",
      url: formattedUrl || "/new-page",
      metaDescription: newPageMetaDescription || "This is a new page added to the site map.",
      isParent: newPageIsParent,
      children: [],
      sections: [
        {
          id: generateUniqueId('section'),
          title: "Main Content",
          content: "Enter the content for this section here.",
          wordCount: 50,
          elements: newPageTags
        }
      ],
      technicalFeatures: []
    };
    
    // Add the new page to the data
    updatedSiteMapData.pages.push(newPage);
    
    // Update state
    setSiteMapData(updatedSiteMapData);
    setEditedContent(JSON.stringify(updatedSiteMapData, null, 2));
    setActivePage(newPageId);
    setIsEdited(true);
    setIsAddPageDialogOpen(false);
    
    toast({
      title: "Page Added",
      description: `"${newPage.title}" page has been added to the site map.`,
      variant: "default"
    });
  };
  
  // Add a new section to a page
  const handleAddSectionToPage = (pageId: string) => {
    if (!siteMapData) return;
    
    // Reset section form values 
    setNewSectionTitle("New Section");
    setNewSectionContent("Enter the content for this section here.");
    setNewSectionTags(["Content block"]);
    setNewSectionTagInput("");
    
    // Store the target page ID
    setActivePageForSection(pageId);
    
    // Open the section creation dialog
    setIsAddSectionDialogOpen(true);
  };
  
  // Create a new section from dialog input
  const confirmAddNewSection = () => {
    if (!siteMapData || !activePageForSection) return;
    
    // Create a deep copy of the site map data
    const updatedSiteMapData = JSON.parse(JSON.stringify(siteMapData)) as SiteMapData;
    
    // Find the page
    const pageIndex = updatedSiteMapData.pages.findIndex(p => p.id === activePageForSection);
    if (pageIndex === -1) return;
    
    // Calculate word count based on content
    const wordCount = newSectionContent.trim() ? 
      newSectionContent.trim().split(/\s+/).length : 50;
    
    // Create a new section
    const newSection: SiteSection = {
      id: generateUniqueId('section'),
      title: newSectionTitle || "New Section",
      content: newSectionContent || "Enter the content for this new section here.",
      wordCount: wordCount,
      elements: newSectionTags.filter(tag => tag.trim() !== "")
    };
    
    // Add the section to the page
    updatedSiteMapData.pages[pageIndex].sections.push(newSection);
    
    // Update state
    setSiteMapData(updatedSiteMapData);
    setEditedContent(JSON.stringify(updatedSiteMapData, null, 2));
    setIsEdited(true);
    setIsAddSectionDialogOpen(false);
    setActivePageForSection(null);
    
    toast({
      title: "Section Added",
      description: `"${newSection.title}" section has been added to the page.`,
      variant: "default"
    });
  };
  
  // Expand text with AI
  const expandTextWithAI = async (pageId: string, sectionId: string) => {
    if (!siteMapData) return;
    
    // Find the page and section
    const page = siteMapData.pages.find(p => p.id === pageId);
    if (!page) return;
    
    const section = page.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    // Mark this section as expanding
    const sectionKey = `${pageId}_${sectionId}`;
    setExpandingSections(prev => ({ ...prev, [sectionKey]: true }));
    
    try {
      // Show a toast notification that content is being expanded
      toast({
        title: "AI Assistant",
        description: "Expanding content... This may take a few seconds.",
      });
      
      // Get the section content as plain text
      let contentToExpand = section.content;
      
      // Extract text content if it's in Editor.js format (for backward compatibility)
      if (typeof section.content === 'string' && section.content.includes('"blocks"')) {
        try {
          const contentObj = JSON.parse(section.content);
          if (contentObj && contentObj.blocks && Array.isArray(contentObj.blocks)) {
            // Extract text from blocks
            contentToExpand = contentObj.blocks
              .map((block: any) => {
                if (block.data && block.data.text) {
                  return block.data.text;
                }
                return '';
              })
              .filter(Boolean)
              .join('\n\n');
          }
        } catch (e) {
          // If JSON parsing fails, use content as is
          console.log("Failed to parse JSON content, using as plain text");
        }
      }
      
      // Prevent expanding content that's too short
      if (!contentToExpand || contentToExpand.trim().length < 10) {
        toast({
          title: "Content Too Short",
          description: "Please enter more initial content before expanding with AI.",
          variant: "destructive"
        });
        setExpandingSections(prev => ({ ...prev, [sectionKey]: false }));
        return;
      }
      
      // Extract current content and context with enhanced information
      const contextData = {
        pageTitle: page.title,
        sectionTitle: section.title,
        siteName: client.name,
        industry: client.industry,
        siteType: "business website",
        audienceType: "potential customers",
        // Add tags from section elements as context
        elementTypes: section.elements?.join(", ") || ""
      };
      
      console.log("Sending content expansion request with context:", contextData);
      
      // Use the OpenAI API via our existing endpoint with timeout handling
      const requestTimeout = setTimeout(() => {
        if (expandingSections[sectionKey]) {
          toast({
            title: "Taking longer than expected",
            description: "AI expansion is still processing. Please wait...",
          });
        }
      }, 15000);
      
      try {
        const response = await apiRequest("POST", `/api/content/expand`, {
          content: contentToExpand,
          context: contextData,
          isEditorContent: false // Always false since we're using plain text now
        });
        
        clearTimeout(requestTimeout);
        
        // Parse the JSON response
        const responseData = await response.json();
        console.log("Received expansion response:", responseData);
        
        // Handle response parsing with better error reporting
        if (!responseData) {
          throw new Error("Empty response from server");
        }
        
        // Check for expanded content in the response
        if (typeof responseData === 'object') {
          console.log("Response object keys:", Object.keys(responseData));
          
          // First check for expandedContent structure
          if ('expandedContent' in responseData && typeof responseData.expandedContent === 'string') {
            // Use the expanded content directly as plain text
            let expandedContent = responseData.expandedContent;
            
            handleSectionUpdate(pageId, sectionId, expandedContent);
            
            toast({
              title: "Production-Ready Content Created",
              description: "Professional-grade content has been generated and is ready for immediate use.",
              variant: "default"
            });
            return;
          }
          
          // Check if response has originalContent and expandedContent properties (common API format)
          if ('originalContent' in responseData && 'expandedContent' in responseData) {
            let expandedContent = String(responseData.expandedContent);
            handleSectionUpdate(pageId, sectionId, expandedContent);
            
            toast({
              title: "Production-Ready Content Created",
              description: "Professional-grade content has been generated and is ready for immediate use.",
              variant: "default"
            });
            return;
          }
        }
        
        // Secondary check for direct string content (some APIs might just return the content directly)
        if (typeof responseData === 'string' && responseData) {
          const responseText = String(responseData);
          // Only use if longer than the original content and not empty
          if (responseText && responseText.length > section.content.length) {
            handleSectionUpdate(pageId, sectionId, responseText);
            
            toast({
              title: "Production-Ready Content Created",
              description: "Professional-grade content has been generated and is ready for immediate use."
            });
            return;
          }
        }
        
        // Fall back to searching for expanded content in any property of the response
        if (typeof responseData === 'object') {
          // List of common property names that might contain the content
          const possibleContentProperties = [
            'expandedContent', 'expanded_content', 'content', 
            'text', 'result', 'output', 'generated', 'data',
            'response', 'message', 'completion'
          ];
          
          for (const prop of possibleContentProperties) {
            const responseObj = responseData as Record<string, any>;
            if (prop in responseObj && 
                typeof responseObj[prop] === 'string' && 
                responseObj[prop].length > 10) {
              console.log(`Found expanded content in property "${prop}":`, responseObj[prop]);
              handleSectionUpdate(pageId, sectionId, responseObj[prop]);
              
              toast({
                title: "Production-Ready Content Created",
                description: "Professional-grade content has been generated and is ready for immediate use."
              });
              return;
            }
          }
        }
        
        // If we made it here, we couldn't extract content from the response
        console.error("Failed to extract expanded content from response:", responseData);
        toast({
          title: "Content Format Error",
          description: "The AI service returned content in an unexpected format.",
          variant: "destructive"
        });
      } catch (innerError) {
        clearTimeout(requestTimeout);
        throw innerError; // Pass to outer catch block
      }
    } catch (error: any) {
      console.error("Error expanding content:", error);
      toast({
        title: "Expansion Failed",
        description: error?.message || "Failed to expand content. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Reset expanding state regardless of outcome
      const sectionKey = `${pageId}_${sectionId}`;
      setExpandingSections(prev => ({ ...prev, [sectionKey]: false }));
    }
  };
  
  // Handle section content update
  const handleSectionUpdate = (pageId: string, sectionId: string, newContent: string) => {
    if (!siteMapData) {
      console.error("Cannot update section: siteMapData is null");
      return;
    }
    
    // Log section update operation for debugging
    console.log(`Updating section content - Page ID: ${pageId}, Section ID: ${sectionId}`);
    console.log(`Content length: ${newContent?.length || 0} chars`);
    console.log(`Content preview: ${typeof newContent === 'string' ? newContent.substring(0, 50) + '...' : 'Not a string'}`);
    
    // Create a deep copy of the site map data
    const updatedSiteMapData = JSON.parse(JSON.stringify(siteMapData)) as SiteMapData;
    
    // Find the page and section
    const pageIndex = updatedSiteMapData.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) {
      console.error(`Page with ID ${pageId} not found in site map data`);
      return;
    }
    
    const sectionIndex = updatedSiteMapData.pages[pageIndex].sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) {
      console.error(`Section with ID ${sectionId} not found in page ${pageId}`);
      return;
    }
    
    console.log(`Found section at index ${sectionIndex} in page ${pageIndex} (${updatedSiteMapData.pages[pageIndex].title})`);
    
    // Log the current content before updating
    const currentContent = updatedSiteMapData.pages[pageIndex].sections[sectionIndex].content;
    console.log(`Current content length: ${currentContent?.length || 0} chars`);
    console.log(`Current content preview: ${typeof currentContent === 'string' ? currentContent.substring(0, 50) + '...' : 'Not a string'}`);
    
    // Since we're working with plain text now instead of EditorJS format,
    // we can use the content directly
    let processedContent = newContent;
    
    // Calculate word count from the text content
    const wordCount = newContent ? newContent.split(/\s+/).filter(Boolean).length : 50;
    
    // Update the content with plain text
    updatedSiteMapData.pages[pageIndex].sections[sectionIndex].content = processedContent;
    
    // Update word count with the calculated value
    updatedSiteMapData.pages[pageIndex].sections[sectionIndex].wordCount = wordCount > 0 ? wordCount : 50;
    
    // Update state
    setSiteMapData(updatedSiteMapData);
    setEditedContent(JSON.stringify(updatedSiteMapData, null, 2));
    setIsEdited(true);
    console.log("Section content updated successfully");
  };
  
  // Save content changes
  const handleSave = () => {
    if (generatedTask?.id && editedContent !== siteMapContent) {
      updateTaskMutation.mutate({
        taskId: generatedTask.id,
        content: editedContent
      });
    } else {
      setIsEdited(false);
    }
  };
  
  // Handle content changes from the editor
  const handleEditorUpdate = (content: string) => {
    setEditedContent(content);
    setIsEdited(content !== siteMapContent);
    
    // Try to parse the updated content as JSON
    try {
      const updatedData = JSON.parse(content);
      if (updatedData && 
          updatedData.siteOverview && 
          updatedData.pages && 
          Array.isArray(updatedData.pages)) {
        setSiteMapData(updatedData);
      }
    } catch (e) {
      // Not valid JSON, which is fine for the raw editor
      console.log("Content is not valid JSON, continuing with raw editor mode");
    }
  };
  
  // Generate a formatted site map summary for email
  const generateSiteMapSummary = (): string => {
    if (!siteMapData) return editedContent;
    
    let htmlContent = `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Site Overview</h3>
        <p style="color: #555; margin-bottom: 15px;">${siteMapData.siteOverview.description}</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h4 style="color: #333; font-size: 16px; margin: 0 0 10px 0;">Primary Navigation</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">
            ${siteMapData.siteOverview.primaryNavigation.map(item => 
              `<span style="background-color: #e6f7ff; color: #0070f3; padding: 5px 10px; border-radius: 3px; font-size: 14px;">${item}</span>`
            ).join('')}
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Pages Structure</h3>
        <ul style="list-style-type: none; padding: 0;">
          ${siteMapData.pages.map(page => `
            <li style="margin-bottom: 15px; ${page.isParent ? '' : 'margin-left: 20px;'}">
              <div style="padding: 12px; border: 1px solid #e0e0e0; border-radius: 5px; ${page.isParent ? 'background-color: #f9f9f9;' : 'background-color: #fff;'}">
                <h4 style="color: #333; font-size: 16px; margin: 0 0 5px 0;">${page.title}</h4>
                <p style="color: #666; font-size: 14px; margin: 0 0 8px 0;">${page.url}</p>
                <p style="color: #555; font-size: 13px; margin: 0;">${page.metaDescription.substring(0, 100)}${page.metaDescription.length > 100 ? '...' : ''}</p>
                ${page.sections.length > 0 ? `
                  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e0e0e0;">
                    <p style="color: #555; font-size: 13px; margin: 0;">${page.sections.length} sections, including: ${page.sections.slice(0, 3).map(s => s.title).join(', ')}${page.sections.length > 3 ? '...' : ''}</p>
                  </div>
                ` : ''}
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Content Guidelines & Technical Requirements</h3>
        <p style="color: #555; margin-bottom: 10px;"><strong>Tone:</strong> ${siteMapData.contentGuidelines.tone.substring(0, 150)}...</p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">
          ${siteMapData.technicalRequirements.interactiveElements.slice(0, 5).map(item => 
            `<span style="background-color: #f0f0f0; color: #555; padding: 5px 10px; border-radius: 3px; font-size: 13px;">${item}</span>`
          ).join('')}
          ${siteMapData.technicalRequirements.interactiveElements.length > 5 ? `<span style="color: #666; font-size: 13px;">+${siteMapData.technicalRequirements.interactiveElements.length - 5} more</span>` : ''}
        </div>
      </div>
    `;
    
    return htmlContent;
  };

  // Share site map with client via email
  const handleShareWithClient = () => {
    if (!recipientEmail) {
      toast({
        title: "Email required",
        description: "Please provide a valid email address to share the site map.",
        variant: "destructive"
      });
      return;
    }

    // Generate site map content based on whether we have structured data
    const siteMapContent = siteMapData ? generateSiteMapSummary() : editedContent;

    // Prepare a nice HTML email with the site map content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="padding: 20px;">
          <p style="margin-bottom: 20px;">${emailMessage.replace(/\n/g, '<br>')}</p>
          
          <div style="margin-top: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">
            <div style="border-left: 4px solid #0070f3; padding-left: 15px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0 0 5px 0;">Site Map & Content Plan</h2>
              <p style="color: #666; margin: 0;">For ${client.name} - ${client.projectName}</p>
            </div>
            
            <div style="margin-top: 20px;">
              ${siteMapContent}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; font-size: 14px;">This site map is a planning document and subject to revisions based on your feedback.</p>
          </div>
        </div>
      </div>
    `;

    // Send the email
    sendEmailMutation.mutate({
      to: recipientEmail,
      from: "yourname@yourcompany.com", // This should be configured in your SendGrid account
      subject: emailSubject,
      html: emailHtml
    });
  };
  
  // Parse JSON site map data
  const parseSiteMapData = (content: string): SiteMapData | null => {
    try {
      // If the content is the raw JSON structure for the site map, parse it directly
      const data = JSON.parse(content);
      
      // Validate structure
      if (data && 
          data.siteOverview && 
          data.pages && 
          Array.isArray(data.pages) && 
          data.contentGuidelines && 
          data.technicalRequirements) {
          
        // Log the sitemap structure for debugging
        console.log("========== SITEMAP STRUCTURE LOG ==========");
        console.log("SITEMAP OVERVIEW:", {
          pageCount: data.pages.length,
          sectionsByPage: data.pages.map((page: SitePageData) => ({
            pageId: page.id,
            pageTitle: page.title,
            sectionCount: page.sections.length
          }))
        });
        
        console.log("DETAILED SECTION CONTENT CHECK:");
        // Process each page
        data.pages.forEach((page: SitePageData, pageIndex: number) => {
          console.log(`PAGE ${pageIndex + 1}: "${page.title}" (${page.id})`);
          console.log(`  This page has ${page.sections.length} sections`);
          
          // Process sections within each page
          page.sections.forEach((section: SiteSection, sectionIndex: number) => {
            console.log(`  SECTION ${sectionIndex + 1}: "${section.title}"`);
            console.log(`    Content length: ${section.content?.length || 0} chars`);
            console.log(`    Content preview: ${typeof section.content === 'string' ? section.content.substring(0, 50) + '...' : 'Not a string'}`);
            
            // Clean up and process section content
            if (!section.content || typeof section.content !== 'string') {
              // Handle empty or non-string content
              const defaultContent = {
                time: Date.now(),
                blocks: [
                  {
                    type: "paragraph",
                    data: {
                      text: `Content for "${section.title}" section will be added here.`
                    }
                  }
                ],
                version: "2.22.2"
              };
              section.content = JSON.stringify(defaultContent);
              return;
            }
            
            // Check if content contains the full sitemap structure (raw JSON dump)
            if (section.content.includes('"siteOverview"') && 
                section.content.includes('"pages"') && 
                section.content.includes('"contentGuidelines"')) {
              
              console.log("    WARNING: Found full JSON structure in section content, cleaning...");
              
              // Generate unique content based on section title/position
              let defaultText = "This section needs content. Use the AI expansion tool.";
              
              if (section.title.toLowerCase().includes("hero")) {
                defaultText = `Welcome to ${client.name}. We provide exceptional ${client.industry} services.`;
              } else if (section.title.toLowerCase().includes("intro") || section.title.toLowerCase().includes("about")) {
                defaultText = `${client.name} is a leading provider in the ${client.industry} industry.`;
              } else if (section.title.toLowerCase().includes("feature")) {
                defaultText = `Our premium services are designed to meet specific needs in the ${client.industry} sector.`;
              } else if (section.title.toLowerCase().includes("contact")) {
                defaultText = `Get in touch with our team to learn how we can help you.`;
              } else if (sectionIndex === 0) {
                defaultText = `${client.name} provides industry-leading solutions.`;
              } else if (sectionIndex === 1) {
                defaultText = `Our expertise makes us the preferred choice in ${client.industry}.`;
              } else {
                defaultText = `The "${section.title}" section will showcase important information.`;
              }
              
              // Create EditorJs content with the default text
              const editorJsContent = {
                time: Date.now(),
                blocks: [
                  {
                    type: "paragraph",
                    data: {
                      text: defaultText
                    }
                  }
                ],
                version: "2.22.2"
              };
              
              section.content = JSON.stringify(editorJsContent);
              return;
            }
            
            // Check if content is already in EditorJs format
            if (section.content.startsWith('{') && section.content.includes('"blocks"')) {
              try {
                // Validate EditorJs format
                JSON.parse(section.content);
                console.log("    Content is already in valid EditorJs format");
                return;
              } catch (e) {
                console.log("    Content looks like EditorJs but is invalid JSON, will convert");
                // Continue to conversion below
              }
            }
            
            // Convert plain text to EditorJs format
            console.log("    Converting to EditorJs format");
            
            // Handle text with multiple paragraphs
            const paragraphs = section.content.split("\n\n")
              .filter(p => p.trim().length > 0)
              .map(p => ({
                type: "paragraph",
                data: { text: p.trim() }
              }));
            
            // Ensure we have at least one paragraph
            if (paragraphs.length === 0) {
              paragraphs.push({
                type: "paragraph",
                data: { text: section.content.trim() || `Content for ${section.title}` }
              });
            }
            
            const editorJsContent = {
              time: Date.now(),
              blocks: paragraphs,
              version: "2.22.2"
            };
            
            // Update with the EditorJs formatted content
            section.content = JSON.stringify(editorJsContent);
          });
        });
        console.log("=========================================");
        
        return data as SiteMapData;
      }
      return null;
    } catch (e) {
      console.error("Failed to parse site map data:", e);
      return null;
    }
  };
  
  // Handle changing the active page
  const handlePageChange = (pageId: string) => {
    setActivePage(pageId);
  };
  
  // Load existing content when task changes
  useEffect(() => {
    if (existingTask?.content) {
      setSiteMapContent(existingTask.content);
      setEditedContent(existingTask.content);
      setGeneratedTask(existingTask);
      setShowRegenerate(true);
      
      // Try to parse as JSON data
      const parsedData = parseSiteMapData(existingTask.content);
      setSiteMapData(parsedData);
      
      // Set initial active page if we have data
      if (parsedData && parsedData.pages.length > 0) {
        setActivePage(parsedData.pages[0].id);
      }
    } else {
      setSiteMapContent("");
      setEditedContent("");
      setGeneratedTask(null);
      setShowRegenerate(false);
      setSiteMapData(null);
      setActivePage(null);
    }
    
    setIsEdited(false);
    setError(null);
  }, [existingTask]);
  
  // Cleanup on close
  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
    }
  }, [open]);
  
  // Animated loading for each stage
  useEffect(() => {
    if (loading) {
      let currentStageIndex = 0;
      const totalStages = loadingStages.length;
      const intervalTime = 3000; // 3 seconds per stage
      const stepsPerStage = 100 / totalStages;
      
      const progressInterval = setInterval(() => {
        currentStageIndex++;
        setLoadingProgress(Math.min(currentStageIndex * stepsPerStage, 95)); // Cap at 95%
        
        if (currentStageIndex < totalStages) {
          setLoadingStage(loadingStages[currentStageIndex]);
        }
        
        if (currentStageIndex >= totalStages) {
          clearInterval(progressInterval);
        }
      }, intervalTime);
      
      return () => {
        clearInterval(progressInterval);
      };
    }
  }, [loading, loadingStages]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              {generatedTask?.content ? "Website Sitemap" : "Generate Website Sitemap"}
            </DialogTitle>
            <DialogDescription>
              {generatedTask?.content
                ? "Review and edit the website sitemap and content plan below."
                : "Generate a comprehensive website sitemap and content plan based on the client's needs and existing proposal."}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-full max-w-md mx-auto bg-gray-100 rounded-lg p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">Generating Sitemap</h3>
                    <div className="text-xs text-muted-foreground">Creating a detailed sitemap for {client.name}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{loadingStage}</span>
                    <span>{Math.round(loadingProgress)}%</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out" 
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : generatedTask?.content ? (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-1 py-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                  className="h-8 w-8"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                {showRegenerate && (
                  <Button
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="h-8"
                    size="sm"
                  >
                    <LayoutGrid className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8"
                      size="sm"
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      Share with Client
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Share Site Map with Client</h4>
                      <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient Email</Label>
                        <Input 
                          id="recipient"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="client@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                          id="subject"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea 
                          id="message"
                          value={emailMessage}
                          onChange={(e) => setEmailMessage(e.target.value)}
                          rows={5}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleShareWithClient}
                        disabled={isSending}
                      >
                        {isSending ? (
                          <>Sending...</>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Site Map
                          </>
                        )}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {isEdited && (
                <div className="text-xs text-muted-foreground bg-amber-100 px-2 py-1 rounded">
                  Unsaved changes
                </div>
              )}
            </div>
            
            <Separator />
            
            {siteMapData ? (
              <div className="flex flex-col mt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="pages">
                      <FileText className="h-4 w-4 mr-2" />
                      Pages
                    </TabsTrigger>
                    <TabsTrigger value="content">
                      <Menu className="h-4 w-4 mr-2" />
                      Content Guidelines
                    </TabsTrigger>
                    <TabsTrigger value="technical">
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Technical Requirements
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pages" className="mt-4">
                    <div className="site-map-container flex">
                      {/* Pages sidebar */}
                      <div className="site-map-sidebar w-1/4 bg-gray-50 p-4 border-r rounded-l-md max-h-[500px] overflow-y-auto">
                        <div className="mb-4">
                          <h3 className="text-sm font-medium mb-2">Site Structure</h3>
                          <p className="text-xs text-muted-foreground mb-4">
                            {siteMapData.siteOverview.description}
                          </p>
                          <div className="space-y-1">
                            {siteMapData.pages.map((page) => (
                              <Button
                                key={page.id}
                                variant={activePage === page.id ? "default" : "ghost"}
                                className={cn(
                                  "w-full justify-start text-left text-sm",
                                  activePage === page.id ? "" : "text-muted-foreground",
                                  page.isParent ? "font-medium" : "ml-4"
                                )}
                                onClick={() => handlePageChange(page.id)}
                              >
                                {page.isParent ? (
                                  <Home className="h-4 w-4 mr-2" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-2" />
                                )}
                                {page.title}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Add New Page Button */}
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={handleAddNewPage}
                          >
                            <FileText className="h-4 w-4" />
                            <span>Add New Page</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Page content area */}
                      <div className="site-map-content flex-1 p-6 border-l rounded-r-md">
                        {activePage && siteMapData.pages.find(p => p.id === activePage) && (
                          <ScrollArea className="h-[500px] pr-4">
                            {(() => {
                              const page = siteMapData.pages.find(p => p.id === activePage)!;
                              return (
                                <>
                                  <div className="mb-6">
                                    <h2 className="text-xl font-bold mb-1">{page.title}</h2>
                                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                                      <span className="bg-slate-100 px-2 py-1 rounded mr-2">{page.url}</span>
                                      {page.isParent && (
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Parent Page</span>
                                      )}
                                    </div>
                                    <p className="text-sm mb-4">
                                      <span className="font-medium">Meta Description:</span> {page.metaDescription}
                                    </p>
                                  </div>
                                  
                                  <div className="mb-6">
                                    <h3 className="text-md font-semibold border-b pb-2 mb-4">
                                      Page Sections 
                                      <span className="text-xs ml-2 text-muted-foreground">
                                        ({page.sections.length} sections available)
                                      </span>
                                    </h3>
                                    
                                    <div className="space-y-6">
                                      {page.sections.map((section, sectionIndex) => (
                                        <div key={section.id} className="p-4 border rounded-md bg-white shadow-sm">
                                          <h4 className="text-sm font-medium mb-2">
                                            {section.title}
                                            <span className="text-xs ml-2 text-slate-500">
                                              (Section #{sectionIndex + 1})
                                            </span>
                                          </h4>
                                          <div className="text-xs mb-3 flex items-center gap-2">
                                            <span className="bg-slate-100 px-2 py-1 rounded">~{section.wordCount} words</span>
                                            {section.elements.length > 0 && (
                                              <span className="text-xs text-muted-foreground">
                                                {section.elements.length} elements
                                              </span>
                                            )}
                                          </div>
                                          <div className="prose prose-sm max-w-none">
                                            <div className="section-editor-container border rounded p-3 bg-white">
                                              {/* Using plain text instead of Editor.js */}
                                              <Textarea
                                                value={extractSectionContentForEditor(section.content)}
                                                onChange={(e) => handleSectionUpdate(page.id, section.id, e.target.value)}
                                                className="prose max-w-none min-h-[200px] w-full"
                                                placeholder="Enter section content here or use the 'Expand with AI' button to create production-ready content..."
                                              />
                                            </div>
                                            <div className="mt-2 flex justify-between items-center">
                                              <div className="text-xs text-gray-500">
                                                {/* Add content info to help debug section content issues */}
                                                {typeof section.content === 'string' && section.content.startsWith('{') ? 
                                                  <span className="text-green-600">
                                                    <div className="inline-block w-3 h-3 mr-1">✓</div>
                                                    Rich content format
                                                  </span> : 
                                                  <span className="text-yellow-600">
                                                    <div className="inline-block w-3 h-3 mr-1">⚠️</div>
                                                    Plain text format
                                                  </span>
                                                }
                                                <span className="mx-2">•</span>
                                                <span>
                                                  {typeof section.content === 'string' ? 
                                                    `${section.content.length} chars` : 
                                                    'Non-string content'
                                                  }
                                                </span>
                                              </div>
                                              <Button
                                                variant={expandingSections[`${page.id}_${section.id}`] ? "outline" : "default"}
                                                size="sm"
                                                onClick={() => expandTextWithAI(page.id, section.id)}
                                                className={`text-xs ${expandingSections[`${page.id}_${section.id}`] ? "" : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"}`}
                                                disabled={expandingSections[`${page.id}_${section.id}`]}
                                              >
                                                {expandingSections[`${page.id}_${section.id}`] ? (
                                                  <div className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Expanding...
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center">
                                                    <span className="mr-1">✨</span> Expand Text with AI
                                                  </div>
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                          
                                          {section.elements.length > 0 && (
                                            <div className="mt-3 pt-3 border-t">
                                              <h5 className="text-xs font-medium mb-2">Visual Elements</h5>
                                              <div className="flex flex-wrap gap-2">
                                                {section.elements.map((element, i) => (
                                                  <div key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                    {element}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      
                                      {/* Add New Section Button */}
                                      <div className="mt-4 flex justify-center">
                                        <Button
                                          variant="outline"
                                          onClick={() => handleAddSectionToPage(page.id)}
                                          className="text-sm"
                                        >
                                          <span className="mr-2">+</span> Add New Section
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {page.technicalFeatures.length > 0 && (
                                    <div className="mb-6">
                                      <h3 className="text-md font-semibold border-b pb-2 mb-4">Technical Features</h3>
                                      <div className="flex flex-wrap gap-2">
                                        {page.technicalFeatures.map((feature, i) => (
                                          <div key={i} className="bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full">
                                            {feature}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {page.children && page.children.length > 0 && (
                                    <div className="mb-6">
                                      <h3 className="text-md font-semibold border-b pb-2 mb-4">Child Pages</h3>
                                      <div className="grid grid-cols-2 gap-3">
                                        {page.children.map((childId) => {
                                          const childPage = siteMapData.pages.find(p => p.id === childId);
                                          return childPage ? (
                                            <Button
                                              key={childId}
                                              variant="outline"
                                              className="justify-start text-left h-auto py-3"
                                              onClick={() => handlePageChange(childId)}
                                            >
                                              <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                              <div className="flex flex-col items-start">
                                                <span className="font-medium">{childPage.title}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                  {childPage.url}
                                                </span>
                                              </div>
                                            </Button>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </ScrollArea>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="content" className="mt-4">
                    <div className="p-6 border rounded-md bg-white">
                      <div className="mb-6">
                        <h2 className="text-lg font-bold mb-4">Content Guidelines</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 border rounded-md bg-gray-50">
                            <h3 className="text-md font-semibold mb-3">Tone and Voice</h3>
                            <p className="text-sm">{siteMapData.contentGuidelines.tone}</p>
                          </div>
                          
                          <div className="p-4 border rounded-md bg-gray-50">
                            <h3 className="text-md font-semibold mb-3">Call to Action Style</h3>
                            <p className="text-sm">{siteMapData.contentGuidelines.callToAction}</p>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="text-md font-semibold mb-3">Key Messages</h3>
                          <ul className="space-y-2">
                            {siteMapData.contentGuidelines.keyMessages.map((message, i) => (
                              <li key={i} className="text-sm bg-white p-3 border rounded-md">
                                {message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="technical" className="mt-4">
                    <div className="p-6 border rounded-md bg-white">
                      <div className="mb-6">
                        <h2 className="text-lg font-bold mb-4">Technical Requirements</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-md font-semibold mb-3">Interactive Elements</h3>
                            <div className="space-y-2">
                              {siteMapData.technicalRequirements.interactiveElements.map((element, i) => (
                                <div key={i} className="text-sm bg-gray-50 p-3 border rounded-md">
                                  {element}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-md font-semibold mb-3">Integrations</h3>
                            <div className="space-y-2">
                              {siteMapData.technicalRequirements.integrations.map((integration, i) => (
                                <div key={i} className="text-sm bg-gray-50 p-3 border rounded-md">
                                  {integration}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="hidden">
                  <EditorJs
                    content={siteMapContent}
                    onChange={handleEditorUpdate}
                    readOnly={false}
                    className="prose max-w-none"
                  />
                </div>
              </div>
            ) : (
              <div className="editor-container">
                <Textarea
                  value={siteMapContent}
                  onChange={(e) => handleEditorUpdate(e.target.value)}
                  className="prose max-w-none w-full min-h-[400px]"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <LayoutGrid className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No Site Map Generated Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Generate a comprehensive website sitemap with <span className="font-semibold text-blue-600">production-ready content</span> for all pages 
                and sections. The generated content will be polished and can be used immediately without further editing.
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-1">NEW</Badge>
                <span> Enhanced site map now includes complete, professional content for each page section</span>
              </div>
            </div>
            
            <Button onClick={handleGenerate} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <LayoutGrid className="h-4 w-4" />
              Generate Production-Ready Site Map
            </Button>
          </div>
        )}
        
        <DialogFooter className="flex items-center justify-end sm:justify-end flex-row gap-2">
          {generatedTask?.content && isEdited && (
            <Button 
              variant="default" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {generatedTask?.content ? "Close" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Add Page Dialog */}
    <Dialog open={isAddPageDialogOpen} onOpenChange={setIsAddPageDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Page</DialogTitle>
          <DialogDescription>
            Create a new page for the site map with detailed information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pageTitle">Page Title*</Label>
            <Input
              id="pageTitle"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Home Page"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="pageUrl">URL Path*</Label>
            <Input
              id="pageUrl"
              value={newPageUrl}
              onChange={(e) => setNewPageUrl(e.target.value)}
              placeholder="/home"
            />
            <p className="text-xs text-muted-foreground">
              Start with a forward slash (/) for the page path
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="pageMetaDescription">Meta Description</Label>
            <Textarea
              id="pageMetaDescription"
              value={newPageMetaDescription}
              onChange={(e) => setNewPageMetaDescription(e.target.value)}
              placeholder="Brief description of this page for SEO purposes"
              rows={3}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="isParentPage"
              checked={newPageIsParent}
              onCheckedChange={(checked) => 
                setNewPageIsParent(checked === true)
              }
            />
            <Label htmlFor="isParentPage" className="cursor-pointer">
              This is a parent page (has child pages)
            </Label>
          </div>
          
          <div className="grid gap-2">
            <Label>Page Elements/Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {newPageTags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button 
                    type="button" 
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-muted-foreground/20 hover:bg-muted-foreground/30"
                    onClick={() => removePageTag(tag)}
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a page element..."
                value={newPageTagInput}
                onChange={(e) => setNewPageTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPageTag();
                  }
                }}
              />
              <Button type="button" onClick={addPageTag} size="sm">Add</Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Add elements like "Hero Section", "Contact Form", etc.
            </p>
            
            <div className="mt-2">
              <Label className="text-xs mb-2">Suggested Tags:</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {pageTagSuggestions.slice(0, 6).map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => addSuggestedPageTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddPageDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmAddNewPage}>Add Page</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Add Section Dialog */}
    <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
          <DialogDescription>
            Create a new content section for this page.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sectionTitle">Section Title*</Label>
            <Input
              id="sectionTitle"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="About Us"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="sectionContent">Initial Content</Label>
            <Textarea
              id="sectionContent"
              value={newSectionContent}
              onChange={(e) => setNewSectionContent(e.target.value)}
              placeholder="Enter the content for this section here..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              You can expand this content later using AI assistance
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label>Section Elements/Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {newSectionTags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button 
                    type="button" 
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-muted-foreground/20 hover:bg-muted-foreground/30"
                    onClick={() => removeSectionTag(tag)}
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a section element..."
                value={newSectionTagInput}
                onChange={(e) => setNewSectionTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSectionTag();
                  }
                }}
              />
              <Button type="button" onClick={addSectionTag} size="sm">Add</Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Add elements like "Text", "Image", "Video", "Form", etc.
            </p>
            
            <div className="mt-2">
              <Label className="text-xs mb-2">Suggested Tags:</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {sectionTagSuggestions.slice(0, 8).map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => addSuggestedSectionTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddSectionDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmAddNewSection}>Add Section</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}