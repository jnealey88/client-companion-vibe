import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Send, AlertCircle, Trash2, LayoutGrid, Share2 } from "lucide-react";
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
              ${editedContent}
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
  
  // Load existing content when task changes
  useEffect(() => {
    if (existingTask?.content) {
      setSiteMapContent(existingTask.content);
      setEditedContent(existingTask.content);
      setGeneratedTask(existingTask);
      setShowRegenerate(true);
    } else {
      setSiteMapContent("");
      setEditedContent("");
      setGeneratedTask(null);
      setShowRegenerate(false);
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
            
            <div className="editor-js-container">
              <EditorJs
                content={siteMapContent}
                onChange={handleEditorUpdate}
                readOnly={false}
                className="prose max-w-none"
              />
            </div>
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