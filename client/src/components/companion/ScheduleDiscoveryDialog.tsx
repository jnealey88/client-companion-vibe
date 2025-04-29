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
      
      // Format **bold** text
      htmlVersion = htmlVersion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Replace placeholder links with actual links
      htmlVersion = htmlVersion.replace('[Analysis Report Link]', companyAnalysisTask 
          ? `<a href="${analysisLink}" style="color: #0066cc; text-decoration: underline; font-weight: 600;">View Business Analysis Report</a>` 
          : '');
      
      htmlVersion = htmlVersion.replace('[Booking Calendar Link]', 
        `<a href="${bookingUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 8px 0;">Schedule Discovery Call</a>`);
      
      // Add styled email container with simpler styling for the integrated view
      setEmailHtml(`
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; padding: 5px;">
          <div style="background-color: white; padding: 15px;">
            <p>${htmlVersion}</p>
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
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-sm font-medium">Email to {client.contactName}</h3>
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
          
          {/* WYSIWYG Controls */}
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-t-md border border-b-0">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const selectedText = window.getSelection()?.toString() || '';
                  if (selectedText) {
                    const updatedContent = emailContent.replace(
                      selectedText,
                      `**${selectedText}**`
                    );
                    setEmailContent(updatedContent);
                  }
                }}
                title="Bold"
              >
                <span className="font-bold">B</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  // Add bullet point at cursor position or to selection
                  const textarea = document.querySelector('textarea');
                  const selectionStart = textarea?.selectionStart || 0;
                  const selectionEnd = textarea?.selectionEnd || 0;
                  const selectedText = emailContent.substring(selectionStart, selectionEnd);
                  
                  if (selectedText) {
                    // Add bullets to each line in selection
                    const lines = selectedText.split('\n');
                    const bulletedLines = lines.map(line => `• ${line}`).join('\n');
                    const updatedContent = 
                      emailContent.substring(0, selectionStart) + 
                      bulletedLines + 
                      emailContent.substring(selectionEnd);
                    setEmailContent(updatedContent);
                  } else {
                    // Add a single bullet at cursor position
                    const updatedContent = 
                      emailContent.substring(0, selectionStart) + 
                      '• ' + 
                      emailContent.substring(selectionStart);
                    setEmailContent(updatedContent);
                  }
                }}
                title="Bullet List"
              >
                <span>•</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  const updatedContent = emailContent + '\n[Analysis Report Link]';
                  setEmailContent(updatedContent);
                }}
                title="Insert Analysis Link"
              >
                <span className="text-xs">Analysis Link</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  const updatedContent = emailContent + '\n[Booking Calendar Link]';
                  setEmailContent(updatedContent);
                }}
                title="Insert Booking Link"
              >
                <span className="text-xs">Booking Link</span>
              </Button>
            </div>
            
            <div className="ml-auto">
              <div className="text-xs text-gray-500">
                Live Preview
              </div>
            </div>
          </div>
          
          {/* Combined Editor and Preview */}
          <div className="border rounded-b-md bg-white overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
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
                  
                  // Format **bold** text
                  htmlVersion = htmlVersion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  
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
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; padding: 5px;">
                      <div style="background-color: white; padding: 15px;">
                        <p>${htmlVersion}</p>
                      </div>
                    </div>
                  `);
                }}
                className="h-[350px] resize-none text-sm border-0 rounded-none border-r focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Type your email here..."
              />
              
              <div
                className="h-[350px] overflow-y-auto p-4 border-l"
                dangerouslySetInnerHTML={{ __html: emailHtml }}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
            <div>
              <span className="font-medium">Template Tags:</span>{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded">[Analysis Report Link]</code>{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded">[Booking Calendar Link]</code>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Live email preview</span>
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