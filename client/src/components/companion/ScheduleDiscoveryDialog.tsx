import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, Copy, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Client, CompanionTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ScheduleDiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export default function ScheduleDiscoveryDialog({
  open,
  onOpenChange,
  client,
}: ScheduleDiscoveryDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailContent, setEmailContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch existing company analysis task
  const { data: tasks } = useQuery<CompanionTask[]>({
    queryKey: [`/api/clients/${client.id}/companion-tasks`],
    enabled: !!client.id && open,
  });

  // Find the latest company analysis task
  const companyAnalysisTask = tasks?.find(
    (t) => t.type === "company_analysis" && t.status === "completed"
  );

  // Generate schedule discovery email
  const generateDiscoveryMutation = useMutation({
    mutationFn: async ({ clientId }: { clientId: number }) => {
      return apiRequest("POST", `/api/clients/${clientId}/generate/schedule_discovery`);
    },
    onSuccess: (data: any) => {
      setEmailContent(data.content);
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Failed to generate discovery email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle generate email button click
  const handleGenerateEmail = () => {
    generateDiscoveryMutation.mutate({ clientId: client.id });
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    if (emailContent) {
      // Extract the plain text from the HTML content
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = emailContent;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      
      navigator.clipboard.writeText(textContent).then(() => {
        setCopied(true);
        toast({
          title: "Email copied",
          description: "The email has been copied to your clipboard.",
        });
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle>Schedule Discovery Call with {client.name}</DialogTitle>
          <DialogDescription>
            Generate an email template for scheduling a discovery call with{" "}
            {client.contactName}. The email will include a reference to the
            company analysis and a booking link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!emailContent && !generateDiscoveryMutation.isPending ? (
            <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-gray-50">
              <Calendar className="h-12 w-12 text-primary mb-2" />
              <h3 className="text-lg font-medium mb-1">Ready to Schedule</h3>
              <p className="text-sm text-center text-gray-500 mb-4">
                Generate an email template for scheduling a discovery call with{" "}
                {client.name}. The email will include:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-4">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Personalized greeting to {client.contactName}
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Reference to your company analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Booking link for scheduling the call
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Professional email formatting
                </li>
              </ul>
              <Button 
                onClick={handleGenerateEmail}
                className="w-full md:w-auto"
                disabled={!companyAnalysisTask}
              >
                <Mail className="mr-2 h-4 w-4" />
                Generate Email Template
              </Button>
              {!companyAnalysisTask && (
                <p className="text-sm text-orange-500 mt-2">
                  Note: You need to generate a company analysis first before scheduling a call.
                </p>
              )}
            </div>
          ) : generateDiscoveryMutation.isPending ? (
            <div className="flex flex-col items-center justify-center p-12 border rounded-md">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-gray-500">
                Generating email template...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Email Template</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy to Clipboard
                    </>
                  )}
                </Button>
              </div>
              <div
                className="border rounded-md p-4 bg-white overflow-y-auto max-h-[400px]"
                dangerouslySetInnerHTML={{ __html: emailContent || "" }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}