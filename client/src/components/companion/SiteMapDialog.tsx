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
  ChevronRight
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

// Define response interface for content expansion API
interface ContentExpansionResponse {
  originalContent: string;
  expandedContent: string;
  success: boolean;
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
  const handleAddNewPage = () => {
    if (!siteMapData) return;
    
    // Create a deep copy of the site map data
    const updatedSiteMapData = JSON.parse(JSON.stringify(siteMapData)) as SiteMapData;
    
    // Create a new page with default values
    const newPageId = generateUniqueId('page');
    const newPage: SitePageData = {
      id: newPageId,
      title: "New Page",
      url: "/new-page",
      metaDescription: "This is a new page added to the site map. Update this description.",
      isParent: false,
      children: [],
      sections: [
        {
          id: generateUniqueId('section'),
          title: "Main Content",
          content: "Enter the content for this section here.",
          wordCount: 50,
          elements: ["Content block"]
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
    
    toast({
      title: "Page Added",
      description: "New page added to site map. You can now edit its details.",
    });
  };
  
  // Add a new section to a page
  const handleAddSectionToPage = (pageId: string) => {
    if (!siteMapData) return;
    
    // Create a deep copy of the site map data
    const updatedSiteMapData = JSON.parse(JSON.stringify(siteMapData)) as SiteMapData;
    
    // Find the page
    const pageIndex = updatedSiteMapData.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;
    
    // Create a new section
    const newSection: SiteSection = {
      id: generateUniqueId('section'),
      title: "New Section",
      content: "Enter the content for this new section here.",
      wordCount: 50,
      elements: []
    };
    
    // Add the section to the page
    updatedSiteMapData.pages[pageIndex].sections.push(newSection);
    
    // Update state
    setSiteMapData(updatedSiteMapData);
    setEditedContent(JSON.stringify(updatedSiteMapData, null, 2));
    setIsEdited(true);
    
    toast({
      title: "Section Added",
      description: "New section added to the page.",
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
    
    // Show loading state
    toast({
      title: "Expanding Content",
      description: "Using AI to expand the section content...",
    });
    
    try {
      // Use the OpenAI API via our existing endpoint
      const response = await apiRequest<ContentExpansionResponse>("POST", `/api/content/expand`, {
        content: section.content,
        context: {
          pageTitle: page.title,
          sectionTitle: section.title,
          siteName: client.name,
          industry: client.industry
        }
      });
      
      if (response && response.expandedContent) {
        // Update the section content with the expanded text
        handleSectionUpdate(pageId, sectionId, response.expandedContent);
        
        toast({
          title: "Content Expanded",
          description: "Section content has been expanded with AI assistance.",
        });
      } else {
        throw new Error("Invalid response from AI service");
      }
    } catch (error) {
      console.error("Error expanding content:", error);
      toast({
        title: "Expansion Failed",
        description: "Failed to expand content. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle section content update
  const handleSectionUpdate = (pageId: string, sectionId: string, newContent: string) => {
    if (!siteMapData) return;
    
    // Create a deep copy of the site map data
    const updatedSiteMapData = JSON.parse(JSON.stringify(siteMapData)) as SiteMapData;
    
    // Find the page and section
    const pageIndex = updatedSiteMapData.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;
    
    const sectionIndex = updatedSiteMapData.pages[pageIndex].sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;
    
    // Update the content
    updatedSiteMapData.pages[pageIndex].sections[sectionIndex].content = newContent;
    
    // Update state
    setSiteMapData(updatedSiteMapData);
    setEditedContent(JSON.stringify(updatedSiteMapData, null, 2));
    setIsEdited(true);
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
      const data = JSON.parse(content);
      
      // Validate structure
      if (data && 
          data.siteOverview && 
          data.pages && 
          Array.isArray(data.pages) && 
          data.contentGuidelines && 
          data.technicalRequirements) {
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
                                    <h3 className="text-md font-semibold border-b pb-2 mb-4">Page Sections</h3>
                                    <div className="space-y-6">
                                      {page.sections.map((section) => (
                                        <div key={section.id} className="p-4 border rounded-md bg-white shadow-sm">
                                          <h4 className="text-sm font-medium mb-2">{section.title}</h4>
                                          <div className="text-xs mb-3 flex items-center gap-2">
                                            <span className="bg-slate-100 px-2 py-1 rounded">~{section.wordCount} words</span>
                                            {section.elements.length > 0 && (
                                              <span className="text-xs text-muted-foreground">
                                                {section.elements.length} elements
                                              </span>
                                            )}
                                          </div>
                                          <div className="prose prose-sm max-w-none">
                                            <Textarea 
                                              value={section.content}
                                              onChange={(e) => handleSectionUpdate(page.id, section.id, e.target.value)}
                                              className="min-h-[100px] resize-y"
                                              placeholder="Enter section content here..."
                                            />
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
                                  
                                  {page.children.length > 0 && (
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
              <div className="editor-js-container">
                <EditorJs
                  content={siteMapContent}
                  onChange={handleEditorUpdate}
                  readOnly={false}
                  className="prose max-w-none"
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
                Generate a comprehensive website sitemap and content plan that outlines page structure, 
                navigation, and content recommendations based on the client's requirements.
              </p>
            </div>
            
            <Button onClick={handleGenerate} className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Generate Site Map
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
  );
}