import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Edit, CheckCircle2, Send, AlertCircle, Code } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Client, CompanionTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { EditorJs } from "@/components/ui/editor-js";

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
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [proposalContent, setProposalContent] = useState<string>("");
  const [discoveryNotes, setDiscoveryNotes] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEdited, setIsEdited] = useState<boolean>(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      setActiveTab("preview");
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
      setActiveTab("preview");
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
    setActiveTab("preview");
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="edit">Visual Editor</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="border rounded-md p-4 min-h-[400px] mt-2">
                <div className="editor-js-wrapper proposal-preview" dangerouslySetInnerHTML={{ __html: proposalContent }} />
              </TabsContent>
              
              <TabsContent value="edit" className="mt-2">
                {isEdited && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have unsaved changes. Click "Save Changes" when you're done editing.
                    </AlertDescription>
                  </Alert>
                )}
                
                <EditorJs
                  content={editedContent}
                  onChange={handleEditorChange}
                  className="min-h-[400px] mb-4"
                />
                
                <div className="flex gap-2 mt-4">
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
              </TabsContent>
              

            </Tabs>

            <DialogFooter className="flex justify-between items-center gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-1"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy to Clipboard"}
                </Button>
                {activeTab === "preview" && (
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("edit")}
                    className="gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Proposal
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