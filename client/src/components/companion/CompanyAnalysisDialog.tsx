import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { FileSearch, Copy, CheckCircle2, Send, AlertCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Client, CompanionTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Loading state
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStage, setLoadingStage] = useState<string>("");
  
  // Hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Loading stage descriptions
  const loadingStages = [
    "Analyzing client business...",
    "Researching industry competitors...",
    "Evaluating target audience...",
    "Analyzing website performance...",
    "Generating keyword recommendations...",
    "Creating comprehensive analysis report..."
  ];

  // Fetch the task content if an existing task was provided
  useEffect(() => {
    if (existingTask && existingTask.content) {
      setAnalysisContent(existingTask.content);
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
      // Finish the loading progress animation
      setLoadingProgress(100);
      setLoadingStage("Analysis complete!");
      
      // Wait a brief moment to show completion before proceeding
      setTimeout(() => {
        // Get proper data from the response
        if (response) {
          // Store the newly generated task for reference
          // Set the content for the dialog
          if (response.content) {
            setAnalysisContent(response.content);
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

  // Handle form submission
  const handleGenerate = () => {
    generateAnalysisMutation.mutate({ clientId: client.id });
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    // Get just the text content without HTML formatting
    const tempElement = document.createElement("div");
    tempElement.innerHTML = analysisContent;
    const textContent = tempElement.textContent || tempElement.innerText || analysisContent;
    
    navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true);
      toast({
        title: "Analysis copied",
        description: "The analysis has been copied to your clipboard.",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
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
            Comprehensive business and website analysis for {client.name}.
          </DialogDescription>
        </DialogHeader>

        {!existingTask?.content && !loading && (
          <div className="space-y-4 mb-4">
            <p className="text-sm text-muted-foreground">
              Generate a comprehensive business analysis for {client.name} including 
              industry position, competitors, target audience, and website performance.
            </p>

            <Button 
              onClick={handleGenerate} 
              className="w-full"
              disabled={loading}
            >
              Generate Company Analysis
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
              We're creating a comprehensive analysis of {client.name}. 
              This may take a minute as we research the industry and analyze the business.
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
            <div className="mt-2">
              <div className="border rounded-md p-6 min-h-[450px]">
                {/* Analysis Content */}
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: analysisContent }} />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <div className="flex flex-1 flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={handleCopy} className="gap-1">
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button onClick={handleSend} className="gap-1">
                  <Send className="h-4 w-4" />
                  Send to Client
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}