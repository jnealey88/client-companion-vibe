import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { FileText, Copy, CheckCircle2, Send, AlertCircle, Trash2 } from "lucide-react";
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
import PaymentSummaryWidget from "./PaymentSummaryWidget";
import { formatCurrency } from "@/lib/utils";

interface ProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  existingTask?: CompanionTask;
  onTaskGenerated?: (task: CompanionTask) => void;
}

export default function ProposalDialog({
  open,
  onOpenChange,
  client,
  existingTask,
  onTaskGenerated
}: ProposalDialogProps) {
  // Core state
  const [proposalContent, setProposalContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [discoveryNotes, setDiscoveryNotes] = useState<string>("");
  const [isEdited, setIsEdited] = useState<boolean>(false);
  
  // Refs
  const discoveryNotesRef = useRef<HTMLTextAreaElement>(null);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Loading state
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStage, setLoadingStage] = useState<string>("");
  
  // Task data
  const [generatedTask, setGeneratedTask] = useState<CompanionTask | undefined>(undefined);
  
  // Payment information
  const [projectValue, setProjectValue] = useState<number>(client.projectValue || 5000);
  const [carePlanMonthly, setCarePlanMonthly] = useState<number>(99);
  const [productsMonthly, setProductsMonthly] = useState<number>(29);

  // Hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Loading stage descriptions
  const loadingStages = [
    "Analyzing client requirements...",
    "Researching industry standards...",
    "Calculating project pricing...",
    "Identifying recommended products...",
    "Generating proposal content...",
    "Finalizing your proposal..."
  ];

  // Fetch the task content and metadata if an existing task was provided
  useEffect(() => {
    if (existingTask) {
      if (existingTask.content) {
        setProposalContent(existingTask.content);
        setEditedContent(existingTask.content);
      }
      
      // Extract pricing information from metadata if available
      if (existingTask.metadata) {
        try {
          const metadata = JSON.parse(existingTask.metadata);
          if (metadata.projectTotalFee) {
            setProjectValue(metadata.projectTotalFee);
          }
          if (metadata.carePlanMonthly) {
            setCarePlanMonthly(metadata.carePlanMonthly);
          }
          if (metadata.productsMonthlyTotal) {
            setProductsMonthly(metadata.productsMonthlyTotal);
          }
        } catch (error) {
          console.error('Error parsing task metadata:', error);
        }
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

  // Generate proposal mutation
  const generateProposalMutation = useMutation({
    mutationFn: async ({ clientId, discoveryNotes }: { clientId: number, discoveryNotes: string }) => {
      setLoading(true);
      setLoadingStage(loadingStages[0]);
      setLoadingProgress(0);
      
      // We want the loading indicator to run for at least a few seconds
      // before actually making the API call, to give the user feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // We're passing discovery notes in the request body
      return apiRequest("POST", `/api/clients/${clientId}/generate/proposal`, { discoveryNotes });
    },
    onSuccess: (response: any) => {
      console.log("Proposal response:", response);
      
      // Finish the loading progress animation
      setLoadingProgress(100);
      setLoadingStage("Proposal complete!");
      
      // Wait a brief moment to show completion before proceeding
      setTimeout(() => {
        // Get proper data from the response
        if (response) {
          let data = response;
          
          // Make sure we have valid data and content
          if (data && typeof data === 'object' && data.content) {
            // Store the newly generated task for reference
            setGeneratedTask(data);
            
            // Extract pricing information from metadata if available
            if (data.metadata) {
              try {
                const metadata = JSON.parse(data.metadata);
                console.log("Metadata parsed:", metadata);
                
                if (metadata.projectTotalFee) {
                  setProjectValue(metadata.projectTotalFee);
                }
                if (metadata.carePlanMonthly) {
                  setCarePlanMonthly(metadata.carePlanMonthly);
                }
                if (metadata.productsMonthlyTotal) {
                  setProductsMonthly(metadata.productsMonthlyTotal);
                }
              } catch (e) {
                console.error("Error parsing metadata:", e);
              }
            }
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
          title: "Proposal generated",
          description: "Project proposal has been created successfully.",
        });
      }, 500);
    },
    onError: () => {
      setLoading(false);
      toast({
        title: "Generation failed",
        description: "Failed to generate proposal. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Save edited proposal mutation
  const saveProposalMutation = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: number, content: string }) => {
      setIsSaving(true);
      return apiRequest("PATCH", `/api/companion-tasks/${taskId}`, { content });
    },
    onSuccess: () => {
      setIsSaving(false);
      setProposalContent(editedContent);
      setIsEdited(false);
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      toast({
        title: "Proposal saved",
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

  // Generate a proposal with the discovery notes provided
  const handleGenerate = () => {
    // Get the discovery notes from the form
    const discoveryNotes = discoveryNotesRef.current?.value || '';
    
    // Close the dialog first to show the in-card loading state
    onOpenChange(false);
    
    // If we have an onTaskGenerated callback, use it to notify the parent
    if (onTaskGenerated && client?.id) {
      // Create a dummy task for the parent to start showing the loading state
      const dummyTask = { 
        id: 0,
        clientId: client.id,
        type: 'proposal',
        status: 'pending',
        content: null,
        createdAt: new Date(),
        completedAt: null
      } as CompanionTask;
      
      // Tell the parent to start its loading state
      onTaskGenerated(dummyTask);
      
      // Let the parent component's card show the loading state
      // The actual API call will be handled by the parent
      // through handleGenerate('proposal', {discoveryNotes})
      setTimeout(() => {
        // This is just a notification - we send the dummy task first
        // so the parent component will show the loading state
        // and then we tell it to generate the task with the discovery notes
        if (onTaskGenerated) {
          // Clone dummy task with discoveryNotes
          const taskWithNotes = {
            ...dummyTask,
            metadata: JSON.stringify({discoveryNotes}) // Pass notes in metadata
          };
          
          // This will trigger actual generation through parent's handleGenerate
          onTaskGenerated(taskWithNotes);
        }
      }, 100);
    }
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    // Get just the text content without HTML formatting
    const tempElement = document.createElement("div");
    tempElement.innerHTML = proposalContent;
    const textContent = tempElement.textContent || tempElement.innerText || proposalContent;
    
    navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true);
      toast({
        title: "Proposal copied",
        description: "The proposal text has been copied to your clipboard.",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Handle content editing
  const handleEditorChange = (newContent: string) => {
    setEditedContent(newContent);
    setIsEdited(newContent !== proposalContent);
  };

  // Handle save edited content
  const handleSaveEdit = () => {
    if (existingTask?.id) {
      saveProposalMutation.mutate({
        taskId: existingTask.id,
        content: editedContent
      });
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedContent(proposalContent);
    setIsEdited(false);
  };

  // Handle sending the proposal (would connect to email provider in a real app)
  const handleSend = () => {
    toast({
      title: "Proposal ready to send",
      description: "This would connect to your email provider in a real application.",
    });
    // In a real application, this would send the proposal via an email provider API
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
            <FileText className="h-5 w-5" />
            Project Proposal for {client.name}
          </DialogTitle>
          <DialogDescription>
            Create and customize a professional project proposal for {client.contactName}.
          </DialogDescription>
        </DialogHeader>

        {!existingTask?.content && !loading && (
          <div className="space-y-4 mb-4">
            <div>
              <Label htmlFor="discoveryNotes">Discovery Call Notes (Optional)</Label>
              <Textarea
                id="discoveryNotes"
                placeholder="Enter any notes from your discovery call with the client..."
                value={discoveryNotes}
                onChange={(e) => setDiscoveryNotes(e.target.value)}
                ref={discoveryNotesRef}
                className="h-[150px]"
              />
              <p className="text-sm text-muted-foreground mt-1">
                These notes will be used to personalize the proposal.
              </p>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full"
              disabled={loading}
            >
              Generate Project Proposal
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
              <span>Gathering data</span>
              <span>Review</span>
              <span>Finalization</span>
            </div>
            
            <p className="text-sm text-center text-muted-foreground mt-2">
              We're crafting a professional proposal for {client.name}. 
              This may take a minute as we analyze requirements and calculate pricing.
            </p>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mt-4">
                Feel free to explore other parts of the application while we work on your proposal.
              </p>
            </div>
          </div>
        )}

        {((proposalContent || existingTask?.content) && !loading) && (
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
              
              {/* Main Content Area - Two Columns Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Proposal Content */}
                <div className="md:col-span-2">
                  {/* AI Proposal Content */}
                  <div>
                    <EditorJs
                      content={editedContent}
                      onChange={handleEditorChange}
                      className="prose max-w-none"
                    />
                  </div>
                </div>
                
                {/* Right Column - Payment Summary Widget */}
                <div className="md:col-span-1 md:sticky md:top-4 self-start">
                  <PaymentSummaryWidget 
                    projectValue={projectValue} 
                    carePlanMonthly={carePlanMonthly}
                    productsMonthly={productsMonthly}
                    onPayClick={() => {
                      toast({
                        title: "Payment Feature",
                        description: "This would connect to your payment processor in a real application.",
                      });
                    }}
                  />
                </div>
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
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between items-center gap-2 mt-4">
              <div className="flex gap-2">               
                {existingTask && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // Close the dialog and let the ClientCompanion handle deletion
                      if (existingTask) {
                        onOpenChange(false);
                        // Allow parent component time to handle the delete request
                        setTimeout(() => {
                          toast({
                            title: "Delete from Companion",
                            description: "Use the delete button in the Client Companion to remove this proposal.",
                            variant: "default"
                          });
                        }, 300);
                      }
                    }}
                    className="gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <Button onClick={handleSend} className="gap-1">
                <Send className="h-4 w-4" />
                Send to Client
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}