import { useState, useEffect } from "react";
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
}

export default function ProposalDialog({
  open,
  onOpenChange,
  client,
  existingTask
}: ProposalDialogProps) {
  const [proposalContent, setProposalContent] = useState<string>("");
  const [discoveryNotes, setDiscoveryNotes] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEdited, setIsEdited] = useState<boolean>(false);
  
  // Payment information (these would come from the backend in a real app)
  const [projectValue, setProjectValue] = useState<number>(client.projectValue || 5000);
  const [carePlanMonthly, setCarePlanMonthly] = useState<number>(99);
  const [productsMonthly, setProductsMonthly] = useState<number>(29);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch the task content if an existing task was provided
  useEffect(() => {
    if (existingTask?.content) {
      setProposalContent(existingTask.content);
      setEditedContent(existingTask.content);
    }
  }, [existingTask]);

  // Generate proposal mutation
  const generateProposalMutation = useMutation({
    mutationFn: async ({ clientId, discoveryNotes }: { clientId: number, discoveryNotes: string }) => {
      setLoading(true);
      // We're passing discovery notes in the request body
      return apiRequest("POST", `/api/clients/${clientId}/generate/proposal`, { discoveryNotes });
    },
    onSuccess: (data: any) => {
      setProposalContent(data.content);
      setEditedContent(data.content);
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      toast({
        title: "Proposal generated",
        description: "Project proposal has been created successfully.",
      });
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

  // Handle form submission
  const handleGenerate = () => {
    generateProposalMutation.mutate({ 
      clientId: client.id,
      discoveryNotes
    });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

        {!existingTask?.content && (
          <div className="space-y-4 mb-4">
            <div>
              <Label htmlFor="discoveryNotes">Discovery Call Notes (Optional)</Label>
              <Textarea
                id="discoveryNotes"
                placeholder="Enter any notes from your discovery call with the client..."
                value={discoveryNotes}
                onChange={(e) => setDiscoveryNotes(e.target.value)}
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
              {loading ? (
                <>Generating Proposal...</>
              ) : (
                <>Generate Project Proposal</>
              )}
            </Button>
          </div>
        )}

        {(proposalContent || existingTask?.content) && (
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
              
              {/* Editor Content (Proposal) */}
              <div className="border-b pb-8 mb-8">
                <EditorJs
                  content={editedContent}
                  onChange={handleEditorChange}
                  className="min-h-[450px] mb-4"
                />
              </div>
              
              {/* Payment Summary Widget */}
              <div className="border-t pt-8 mt-8">
                <h3 className="text-xl font-bold mb-4">Project Investment Summary</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      This proposal includes a comprehensive breakdown of your investment. The total project cost covers all deliverables outlined above, while the optional care plan and recommended products ensure your ongoing success.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="flex items-center gap-1 text-sm bg-muted px-3 py-1 rounded-full">
                        <span className="font-medium">One-time:</span> {formatCurrency(projectValue)}
                      </div>
                      {carePlanMonthly > 0 && (
                        <div className="flex items-center gap-1 text-sm bg-muted px-3 py-1 rounded-full">
                          <span className="font-medium">Care Plan:</span> {formatCurrency(carePlanMonthly)}/mo
                        </div>
                      )}
                      {productsMonthly > 0 && (
                        <div className="flex items-center gap-1 text-sm bg-muted px-3 py-1 rounded-full">
                          <span className="font-medium">GoDaddy:</span> {formatCurrency(productsMonthly)}/mo
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <p className="mb-2 font-medium">What's included:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>One-time fee covers all implementation and setup costs</li>
                        <li>Care plan provides ongoing maintenance, security and updates</li>
                        <li>GoDaddy products include domain, hosting and SSL certificate</li>
                        <li>Free email and phone support for the duration of the project</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="md:col-span-1">
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
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-1"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy to Clipboard"}
                </Button>
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