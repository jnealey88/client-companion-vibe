import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Send, AlertCircle, Trash2, Scroll } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  existingTask?: CompanionTask;
  onTaskGenerated?: (task: CompanionTask) => void;
}

export default function ContractDialog({
  open,
  onOpenChange,
  client,
  existingTask,
  onTaskGenerated
}: ContractDialogProps) {
  // Core state
  const [contractContent, setContractContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [isEdited, setIsEdited] = useState<boolean>(false);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showRegenerate, setShowRegenerate] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>("Analyzing project information...");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Generation task
  const [generatedTask, setGeneratedTask] = useState<CompanionTask | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get and format the loading stages for this task type
  const loadingStages = [
    "Reviewing project details...",
    "Creating legal framework...",
    "Adding payment milestones...",
    "Specifying deliverables...",
    "Adding terms and conditions...",
    "Finalizing contract document..."
  ];
  
  // Generate contract mutation
  const generateContractMutation = useMutation({
    mutationFn: async ({ clientId }: { clientId: number }) => {
      setLoading(true);
      setLoadingStage(loadingStages[0]);
      setLoadingProgress(0);
      
      // We want the loading indicator to run for at least a few seconds
      // before actually making the API call, to give the user feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return apiRequest("POST", `/api/clients/${clientId}/generate/contract`, {});
    },
    onSuccess: (response: any) => {
      console.log("Contract response:", response);
      
      // Finish the loading progress animation
      setLoadingProgress(100);
      setLoadingStage("Contract document complete!");
      
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
            setContractContent(data.content);
            setEditedContent(data.content);
          } else {
            setError("The generated contract had an invalid format.");
          }
        } else {
          setError("Failed to generate contract. Please try again.");
        }
        
        // End loading state
        setLoading(false);
        setShowRegenerate(true);
      }, 500);
    },
    onError: (error) => {
      console.error("Error generating contract:", error);
      setLoading(false);
      setError("Failed to generate contract. Please try again.");
      setShowRegenerate(true);
      toast({
        title: "Generation failed",
        description: "Failed to generate contract. Please try again.",
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
        description: "Your edits to the contract have been saved.",
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

  // Copy content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(contractContent)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Copied to clipboard",
          description: "The contract has been copied to your clipboard.",
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
  
  // Generate a contract
  const handleGenerate = () => {
    setError(null);
    
    // Close the dialog first to show the in-card loading state
    if (onTaskGenerated && client?.id) {
      // Create a dummy task for the parent to start showing the loading state
      const dummyTask = { 
        id: 0,
        clientId: client.id,
        type: 'contract',
        status: 'pending',
        content: null,
        createdAt: new Date(),
        completedAt: null
      } as CompanionTask;
      
      // Tell the parent to start its loading state
      onTaskGenerated(dummyTask);
      
      // Continue with the dialog open and start generating
      generateContractMutation.mutate({ clientId: client.id });
    } else {
      onOpenChange(false);
    }
  };
  
  // Save content changes
  const handleSave = () => {
    if (generatedTask?.id && editedContent !== contractContent) {
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
    setIsEdited(content !== contractContent);
  };
  
  // Delete the task
  const handleDelete = () => {
    // You would implement task deletion here
    onOpenChange(false);
  };
  
  // Load existing content when task changes
  useEffect(() => {
    if (existingTask?.content) {
      setContractContent(existingTask.content);
      setEditedContent(existingTask.content);
      setGeneratedTask(existingTask);
      setShowRegenerate(true);
    } else {
      setContractContent("");
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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scroll className="h-5 w-5" />
            {generatedTask?.content ? "Services Contract" : "Generate Services Contract"}
          </DialogTitle>
          <DialogDescription>
            {generatedTask?.content
              ? "Review and edit the services contract below."
              : "Generate a professional services contract based on the existing proposal."}
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
                    <Scroll className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">Generating Contract</h3>
                    <div className="text-xs text-muted-foreground">Creating a legal document for {client.name}</div>
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
          <div className="flex-1 overflow-hidden flex flex-col">
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
                    <Scroll className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                )}
              </div>
              {isEdited && (
                <div className="text-xs text-muted-foreground bg-amber-100 px-2 py-1 rounded">
                  Unsaved changes
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="min-h-[400px] flex flex-col flex-1 overflow-hidden">
              <EditorJs
                content={contractContent}
                onChange={handleEditorUpdate}
                readOnly={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Scroll className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No Contract Generated Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Generate a professional services contract that includes scope of work, payment terms, 
                timelines, and legal protections based on the existing proposal.
              </p>
            </div>
            
            <Button onClick={handleGenerate} className="gap-2">
              <Scroll className="h-4 w-4" />
              Generate Contract
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