import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { FileText, Copy, CheckCircle2, Trash2, ListFilter } from "lucide-react";
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
import { EditorJs } from "@/components/ui/editor-js";

interface ProjectScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  existingTask?: CompanionTask;
  onTaskGenerated?: (task: CompanionTask) => void;
}

export default function ProjectScopeDialog({
  open,
  onOpenChange,
  client,
  existingTask,
  onTaskGenerated
}: ProjectScopeDialogProps) {
  // Core state
  const [scopeContent, setScopeContent] = useState<string>("");
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
    "Analyzing project information...",
    "Extracting requirements from proposal...",
    "Defining functional specifications...",
    "Creating deliverables list...",
    "Establishing project phases...",
    "Defining roles and responsibilities...",
    "Creating scope change process...",
    "Finalizing project scope document..."
  ];
  
  // Generate scope document mutation
  const generateScopeMutation = useMutation({
    mutationFn: async ({ clientId }: { clientId: number }) => {
      setLoading(true);
      setLoadingStage(loadingStages[0]);
      setLoadingProgress(0);
      
      // We want the loading indicator to run for at least a few seconds
      // before actually making the API call, to give the user feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return apiRequest("POST", `/api/clients/${clientId}/generate/define_scope`, {});
    },
    onSuccess: (response: any) => {
      console.log("Project scope response:", response);
      
      // Finish the loading progress animation
      setLoadingProgress(100);
      setLoadingStage("Project scope document complete!");
      
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
            setScopeContent(data.content);
            setEditedContent(data.content);
          } else {
            setError("The generated project scope document had an invalid format.");
          }
        } else {
          setError("Failed to generate project scope document. Please try again.");
        }
        
        // End loading state
        setLoading(false);
        setShowRegenerate(true);
      }, 500);
    },
    onError: (error) => {
      console.error("Error generating project scope:", error);
      setLoading(false);
      setError("Failed to generate project scope document. Please try again.");
      setShowRegenerate(true);
      toast({
        title: "Generation failed",
        description: "Failed to generate project scope document. Please try again.",
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
        description: "Your edits to the project scope document have been saved.",
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
    navigator.clipboard.writeText(scopeContent)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Copied to clipboard",
          description: "The project scope document has been copied to your clipboard.",
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
  
  // Generate a project scope document
  const handleGenerate = () => {
    setError(null);
    
    // Close the dialog first to show the in-card loading state
    if (onTaskGenerated && client?.id) {
      // Create a dummy task for the parent to start showing the loading state
      const dummyTask = { 
        id: 0,
        clientId: client.id,
        type: 'define_scope',
        status: 'pending',
        content: null,
        createdAt: new Date(),
        completedAt: null
      } as CompanionTask;
      
      // Tell the parent to start its loading state
      onTaskGenerated(dummyTask);
      
      // Continue with the dialog open and start generating
      generateScopeMutation.mutate({ clientId: client.id });
    } else {
      onOpenChange(false);
    }
  };
  
  // Save content changes
  const handleSave = () => {
    if (generatedTask?.id && editedContent !== scopeContent) {
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
    setIsEdited(content !== scopeContent);
  };
  
  // Delete the task
  const handleDelete = () => {
    // You would implement task deletion here
    onOpenChange(false);
  };
  
  // Load existing content when task changes
  useEffect(() => {
    if (existingTask?.content) {
      setScopeContent(existingTask.content);
      setEditedContent(existingTask.content);
      setGeneratedTask(existingTask);
      setShowRegenerate(true);
    } else {
      setScopeContent("");
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
            <ListFilter className="h-5 w-5" />
            {generatedTask?.content ? "Project Scope Document" : "Generate Project Scope Document"}
          </DialogTitle>
          <DialogDescription>
            {generatedTask?.content
              ? "Review and edit the detailed project scope document below."
              : "Generate a detailed project scope document based on the existing proposal."}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out" 
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">{loadingStage}</p>
          </div>
        ) : generatedTask?.content ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="min-h-[400px] flex flex-col flex-1 overflow-hidden">
              <EditorJs
                content={scopeContent}
                onChange={handleEditorUpdate}
                readOnly={false}
                autofocus={true}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="text-center space-y-2">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-lg font-medium">No Project Scope Document Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Generate a comprehensive scope document that outlines requirements, deliverables, and 
                project phases based on the existing proposal.
              </p>
            </div>
            
            <Button onClick={handleGenerate}>
              <ListFilter className="h-4 w-4 mr-2" />
              Generate Project Scope Document
            </Button>
          </div>
        )}
        
        <DialogFooter className="flex items-center justify-between sm:justify-between flex-row gap-2">
          <div className="flex items-center gap-2">
            {generatedTask?.content && (
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
            
            {showRegenerate && (
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={loading}
              >
                Regenerate
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
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
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}