import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { FileText, Copy, CheckCircle2, Send, AlertCircle, Trash2, FileSearch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Client, CompanionTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { EditorJs } from "@/components/ui/editor-js";

interface CompanyAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  existingTask?: CompanionTask;
  onTaskGenerated?: (task: CompanionTask) => void;
}

export default function CompanyAnalysisDialog({
  open,
  onOpenChange,
  client,
  existingTask,
  onTaskGenerated
}: CompanyAnalysisDialogProps) {
  // Core state
  const [analysisContent, setAnalysisContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [isEdited, setIsEdited] = useState<boolean>(false);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Loading state
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStage, setLoadingStage] = useState<string>("");
  
  // Task data
  const [generatedTask, setGeneratedTask] = useState<CompanionTask | undefined>(undefined);
  
  // Hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Loading stage descriptions
  const loadingStages = [
    "Analyzing client information...",
    "Researching industry competitors...",
    "Identifying target audience...",
    "Analyzing website performance...",
    "Examining SEO positioning...",
    "Generating business recommendations...",
    "Finalizing company analysis..."
  ];

  // Fetch the task content if an existing task was provided
  useEffect(() => {
    if (existingTask) {
      if (existingTask.content) {
        setAnalysisContent(existingTask.content);
        setEditedContent(existingTask.content);
      }
    }
  }, [existingTask]);

  // Use interval for fake loading progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (loading) {
      // Start the loading stage rotation
      let stageIndex = 0;
      let progressValue = 0;
      
      setLoadingStage(loadingStages[0]);
      setLoadingProgress(0);
      
      interval = setInterval(() => {
        // Increment progress
        progressValue += 1;
        
        // Change loading stage text every ~20%
        if (progressValue % 20 === 0 && stageIndex < loadingStages.length - 1) {
          stageIndex++;
          setLoadingStage(loadingStages[stageIndex]);
        }
        
        // Ensure we never go above 95% before completion
        // The final 5% will be completed when the API call finishes
        if (progressValue <= 95) {
          setLoadingProgress(progressValue);
        }
      }, 500); // Update every 500ms
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loading, loadingStages]);

  // Generate company analysis mutation
  const generateAnalysisMutation = useMutation({
    mutationFn: async ({ clientId }: { clientId: number }) => {
      setLoading(true);
      setLoadingStage(loadingStages[0]);
      setLoadingProgress(0);
      
      // We want the loading indicator to run for at least a few seconds
      // before actually making the API call, to give the user feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return apiRequest("POST", `/api/clients/${clientId}/generate/company_analysis`);
    },
    onSuccess: (response: any) => {
      console.log("Analysis response:", response);
      
      // Finish the loading progress animation
      setLoadingProgress(100);
      setLoadingStage("Analysis complete!");
      
      // Wait a brief moment to show completion before proceeding
      setTimeout(() => {
        // Get proper data from the response
        if (response) {
          let data = response;
          
          // Make sure we have valid data and content
          if (data && typeof data === 'object' && data.content) {
            // Store the newly generated task for reference
            setGeneratedTask(data);
          } else if (typeof data === 'string') {
            // If data is a string, it's just the content
            // Do nothing special
          } else {
            console.error("Unexpected response format:", data);
            toast({
              title: "Warning",
              description: "Received unexpected response format from server.",
              variant: "destructive"
            });
          }
        }
        
        // Hide the loading indicator
        setLoading(false);
        
        // Get the task ID from the response
        const taskId = response?.id;
        
        // IMPORTANT: Close the dialog immediately
        onOpenChange(false);
        
        // Update the client companion tasks list
        queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
        
        // A small delay before redirecting to allow the toast to show
        setTimeout(() => {
          // If we have a successfully generated task, notify the parent that they should open it
          if (taskId && onTaskGenerated) {
            onTaskGenerated(response);
          }
        }, 500);
        
        toast({
          title: "Analysis generated",
          description: "Company analysis has been created successfully.",
        });
      }, 500);
    },
    onError: () => {
      setLoading(false);
      toast({
        title: "Generation failed",
        description: "Failed to generate company analysis. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Save edited analysis mutation
  const saveAnalysisMutation = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: number, content: string }) => {
      setIsSaving(true);
      return apiRequest("PATCH", `/api/companion-tasks/${taskId}`, { content });
    },
    onSuccess: () => {
      setIsSaving(false);
      setAnalysisContent(editedContent);
      setIsEdited(false);
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      toast({
        title: "Analysis saved",
        description: "Your edits have been saved successfully.",
      });
    },
    onError: () => {
      setIsSaving(false);
      toast({
        title: "Save failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive"
      });
    }
  });

  // With the new in-card loading state, we don't need to generate from the dialog
  // This handleGenerate function is kept for compatibility but should not be used anymore
  const handleGenerate = () => {
    // The generation should now happen in the parent component using the in-card loading state
    console.log('Generation should be handled by the parent component');
    onOpenChange(false);
  };

  // Handle content editing
  const handleEditorChange = (newContent: string) => {
    setEditedContent(newContent);
    setIsEdited(newContent !== analysisContent);
  };

  // Handle save edited content
  const handleSaveEdit = () => {
    if (existingTask?.id) {
      saveAnalysisMutation.mutate({
        taskId: existingTask.id,
        content: editedContent
      });
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedContent(analysisContent);
    setIsEdited(false);
  };

  // Handle sending the analysis (would connect to email provider in a real app)
  const handleSend = () => {
    toast({
      title: "Analysis ready to send",
      description: "This would connect to your email provider in a real application.",
    });
    // In a real application, this would send the analysis via an email provider API
  };

  // Cleanup function when dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    // If closing the dialog
    if (!isOpen) {
      // Reset states if needed
      setLoading(false);
      setIsSaving(false);
      
      // Call the parent's handler
      onOpenChange(isOpen);
    } else {
      onOpenChange(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Company Analysis for {client.name}
          </DialogTitle>
          <DialogDescription>
            Comprehensive business analysis and website performance evaluation for {client.name}.
          </DialogDescription>
        </DialogHeader>

        {!existingTask?.content && !loading && (
          <div className="space-y-4 mb-4">
            <p className="text-sm text-muted-foreground">
              We'll generate a detailed company analysis using available information about {client.name}. 
              This includes business overview, competitor analysis, target audience, 
              industry challenges, keyword analysis, website performance, and strategic recommendations.
            </p>

            <Button 
              onClick={() => {
                // Close the dialog first
                onOpenChange(false);
                
                // Allow a brief delay for the dialog to close, then tell parent to generate
                setTimeout(() => {
                  // If parent provided a callback, tell it to generate a company analysis
                  if (client && client.id && onTaskGenerated) {
                    // Execute this from ClientCompanion component
                    const dummyTask = { 
                      type: 'company_analysis',
                      clientId: client.id,
                      content: null
                    } as any;
                    onTaskGenerated(dummyTask);
                  }
                }, 300);
              }} 
              className="w-full"
              disabled={loading}
            >
              Close and Generate in Card
            </Button>
          </div>
        )}
        
        {/* Informative Loading State */}
        {loading && (
          <div className="space-y-4 mb-4 py-2">
            <div className="text-center text-lg font-medium text-primary">{loadingStage}</div>
            
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Research</span>
              <span>Analysis</span>
              <span>Recommendations</span>
            </div>
            
            <p className="text-sm text-center text-muted-foreground mt-2">
              We're analyzing {client.name}'s business and creating a detailed report. 
              This may take a minute as we research competitors and evaluate performance metrics.
            </p>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mt-4">
                Feel free to explore other parts of the application while we work on your analysis.
              </p>
            </div>
          </div>
        )}

        {((analysisContent || existingTask?.content) && !loading) && (
          <>
            <div className="border rounded-md p-6 min-h-[450px] mt-2">
              {isEdited && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You have unsaved changes. Click "Save Changes" when you're done editing.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Analysis Content */}
              <div>
                <EditorJs
                  content={editedContent}
                  onChange={handleEditorChange}
                  className="prose max-w-none"
                />
              </div>
              
              {isEdited && (
                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={handleSaveEdit}
                    disabled={!isEdited || isSaving}
                    className="flex-1"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={!isEdited || isSaving}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            This analysis will help identify opportunities for {client.name}'s website improvement.
          </p>
          
          {!loading && existingTask?.content && (
            <div className="flex gap-2">
              {!isEdited && (
                <Button 
                  variant="outline" 
                  onClick={handleSend}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
              )}
              
              <Button 
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}