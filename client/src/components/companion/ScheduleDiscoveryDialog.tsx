import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, Copy, CheckCircle2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  const [emailContent, setEmailContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [emailHtml, setEmailHtml] = useState<string>("");

  // Fetch existing company analysis task
  const { data: tasks } = useQuery<CompanionTask[]>({
    queryKey: [`/api/clients/${client.id}/companion-tasks`],
    enabled: !!client.id && open,
  });

  // Find the latest company analysis task
  const companyAnalysisTask = tasks?.find(
    (t) => t.type === "company_analysis" && t.status === "completed"
  );

  // Generate default email content when the dialog opens
  useEffect(() => {
    if (open && client) {
      // Default booking URL - in a real app, this would come from your configuration
      const bookingUrl = "https://calendly.com/yourbusiness/discovery-call";
      
      // Create the default email content
      const analysisLink = companyAnalysisTask 
        ? `/client/${client.id}/analysis/${companyAnalysisTask.id}`
        : "";
      
      const defaultEmail = `Dear ${client.contactName},

Thank you for your interest in our web design services for ${client.name}. I'd like to schedule a discovery call to discuss your project needs and how we can help bring your vision to life.

${companyAnalysisTask ? `I've prepared a complimentary business analysis report that you can review before our call: [Analysis Report Link]` : ''}

During our call, we'll discuss:
• Your business goals and objectives
• Website functionality requirements
• Design preferences and branding needs
• Timeline and budget considerations
• Next steps in the process

Please use the link below to schedule a time that works best for you:
[Booking Calendar Link]

I look forward to speaking with you and learning more about ${client.name}.

Best regards,
Your Name
Web Design Consultant`;

      setEmailContent(defaultEmail);
      
      // Create HTML version for preview with improved formatting
      let htmlVersion = defaultEmail;
      
      // Format bullet points properly
      htmlVersion = htmlVersion.replace(/• (.*?)(?:\n|$)/g, '<li>$1</li>');
      
      // Replace double line breaks with paragraph breaks
      htmlVersion = htmlVersion.replace(/\n\n/g, '</p><p>');
      
      // Replace remaining single line breaks with <br>
      htmlVersion = htmlVersion.replace(/\n/g, '<br>');
      
      // Find and wrap the bullet list in a ul element with styling
      htmlVersion = htmlVersion.replace(/<li>(.*?)<\/li>(?:<br>)*<li>/g, '<li>$1</li><li>');
      if (htmlVersion.includes('<li>')) {
        htmlVersion = htmlVersion.replace(/<p>(.*?)<li>/g, '<p>$1<ul style="margin: 10px 0; padding-left: 30px;"><li style="margin-bottom: 8px;">');
        htmlVersion = htmlVersion.replace(/<\/li>(<br>)*<\/p>/g, '</li></ul></p>');
        // Add styling to all list items
        htmlVersion = htmlVersion.replace(/<li>(.*?)<\/li>/g, '<li style="margin-bottom: 8px;">$1</li>');
      }
      
      // Replace placeholder links with actual links
      htmlVersion = htmlVersion.replace('[Analysis Report Link]', companyAnalysisTask 
          ? `<a href="${analysisLink}" style="color: #0066cc; text-decoration: underline; font-weight: 600;">View Business Analysis Report</a>` 
          : '');
      
      htmlVersion = htmlVersion.replace('[Booking Calendar Link]', 
        `<a href="${bookingUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 8px 0;">Schedule Discovery Call</a>`);
      
      // Add styled email container
      setEmailHtml(`
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; border-radius: 8px; padding: 20px; border: 1px solid #eaeaea;">
          <div style="background-color: white; border-radius: 6px; padding: 25px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <p>${htmlVersion}</p>
          </div>
          <div style="text-align: center; font-size: 12px; color: #999; margin-top: 15px;">
            This is a preview of how your email will appear to the recipient
          </div>
        </div>
      `);
    }
  }, [open, client, companyAnalysisTask]);

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(emailContent).then(() => {
      setCopied(true);
      toast({
        title: "Email copied",
        description: "The email has been copied to your clipboard.",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Handle sending the email (would connect to email provider in a real app)
  const handleSend = () => {
    toast({
      title: "Email ready to send",
      description: "This would connect to your email provider in a real application.",
    });
    // In a real application, this would send the email via an email provider API
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Discovery Call with {client.name}</DialogTitle>
          <DialogDescription>
            Customize this email template for scheduling a discovery call with{" "}
            {client.contactName}. The template includes a reference to the
            company analysis and a booking link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Email Content</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-1 h-8"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    className="flex items-center gap-1 h-8"
                  >
                    <Send className="h-4 w-4" /> Send
                  </Button>
                </div>
              </div>
              <Textarea
                value={emailContent}
                onChange={(e) => {
                  setEmailContent(e.target.value);
                  
                  // Update HTML preview with improved formatting
                  let htmlVersion = e.target.value;
                  
                  // Format bullet points properly
                  htmlVersion = htmlVersion.replace(/• (.*?)(?:\n|$)/g, '<li>$1</li>');
                  
                  // Replace double line breaks with paragraph breaks
                  htmlVersion = htmlVersion.replace(/\n\n/g, '</p><p>');
                  
                  // Replace remaining single line breaks with <br>
                  htmlVersion = htmlVersion.replace(/\n/g, '<br>');
                  
                  // Find and wrap the bullet list in a ul element with styling
                  htmlVersion = htmlVersion.replace(/<li>(.*?)<\/li>(?:<br>)*<li>/g, '<li>$1</li><li>');
                  if (htmlVersion.includes('<li>')) {
                    htmlVersion = htmlVersion.replace(/<p>(.*?)<li>/g, '<p>$1<ul style="margin: 10px 0; padding-left: 30px;"><li style="margin-bottom: 8px;">');
                    htmlVersion = htmlVersion.replace(/<\/li>(<br>)*<\/p>/g, '</li></ul></p>');
                    // Add styling to all list items
                    htmlVersion = htmlVersion.replace(/<li>(.*?)<\/li>/g, '<li style="margin-bottom: 8px;">$1</li>');
                  }
                  
                  // Replace placeholder links with actual links
                  htmlVersion = htmlVersion.replace('[Analysis Report Link]', companyAnalysisTask 
                      ? `<a href="/client/${client.id}/analysis/${companyAnalysisTask.id}" style="color: #0066cc; text-decoration: underline; font-weight: 600;">View Business Analysis Report</a>` 
                      : '');
                  
                  htmlVersion = htmlVersion.replace('[Booking Calendar Link]', 
                    `<a href="https://calendly.com/yourbusiness/discovery-call" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 8px 0;">Schedule Discovery Call</a>`);
                  
                  // Add styled email container
                  setEmailHtml(`
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; border-radius: 8px; padding: 20px; border: 1px solid #eaeaea;">
                      <div style="background-color: white; border-radius: 6px; padding: 25px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        <p>${htmlVersion}</p>
                      </div>
                      <div style="text-align: center; font-size: 12px; color: #999; margin-top: 15px;">
                        This is a preview of how your email will appear to the recipient
                      </div>
                    </div>
                  `);
                }}
                className="h-[350px] resize-none font-mono text-sm"
                placeholder="Email content..."
              />
              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Template Tags:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code>[Analysis Report Link]</code> - Will be replaced with a link to your company analysis</li>
                  <li><code>[Booking Calendar Link]</code> - Will be replaced with your booking calendar link</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Preview</h3>
                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                  <Calendar className="h-3 w-3" /> Email Preview
                </div>
              </div>
              <div
                className="border rounded-md p-4 bg-white overflow-y-auto h-[400px]"
                dangerouslySetInnerHTML={{ __html: emailHtml }}
              />
            </div>
          </div>
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