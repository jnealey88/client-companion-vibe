import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Calendar, Copy, CheckCircle2, Send, MailCheck } from "lucide-react";
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

  const queryClient = useQueryClient();
  
  // Find the schedule discovery task
  const discoveryTask = tasks?.find(
    (t) => t.type === "schedule_discovery"
  );
  
  // Create mutation to update the task status
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/companion-tasks/${id}`, data);
    },
    onSuccess: () => {
      // Invalidate the tasks query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
    },
  });
  
  // Handle sending the email (would connect to email provider in a real app)
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const handleSend = () => {
    setIsSending(true);
    
    // Simulate email sending process
    setTimeout(() => {
      // Show success toast
      toast({
        title: "Email sent successfully!",
        description: `Discovery call invitation sent to ${client.contactName}`,
        variant: "default",
      });
      
      setIsSending(false);
      setEmailSent(true);
      
      // Update the task status to completed if it exists
      if (discoveryTask) {
        updateTaskMutation.mutate({
          id: discoveryTask.id,
          data: {
            status: "completed",
            content: emailContent,
            completedAt: new Date().toISOString(),
          },
        });
      } else {
        // If task doesn't exist yet, we'd create it here
        // For simplicity we're assuming it exists in this implementation
        console.log("Discovery task not found - would create one");
      }
      
      // Close the dialog after a delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    }, 1200); // Simulate a slight delay for the email sending
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
                disabled={isSending || emailSent}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : emailSent ? (
                  <>
                    <MailCheck className="h-4 w-4 mr-1" />
                    Sent
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Single Rich Email Editor */}
          <div className="border rounded-md overflow-hidden">
            {/* WYSIWYG Controls */}
            <div className="flex items-center gap-2 bg-gray-50 p-2 border-b">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    // Apply bold formatting using document.execCommand
                    document.execCommand('bold', false);
                    // Focus back on the contentEditable
                    const editor = document.querySelector('[contenteditable=true]') as HTMLElement;
                    if (editor) {
                      editor.focus();
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
                    // Get the contentEditable div
                    const editor = document.querySelector('[contenteditable=true]') as HTMLElement;
                    if (editor) {
                      // Create and insert a bullet point
                      const selection = window.getSelection();
                      const range = selection?.getRangeAt(0);
                      
                      if (range) {
                        // Create a bullet point element
                        const listItem = document.createElement('li');
                        listItem.style.marginLeft = '20px';
                        listItem.style.marginBottom = '8px';
                        
                        // If there's selected text, move it into the list item
                        if (!range.collapsed) {
                          listItem.appendChild(range.extractContents());
                        }
                        
                        // Insert the list item
                        range.insertNode(listItem);
                        
                        // Move cursor inside the list item
                        range.selectNodeContents(listItem);
                        range.collapse(false); // collapse to end
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                      }
                      
                      // Focus back on the editor
                      editor.focus();
                    }
                  }}
                  title="Bullet List"
                >
                  <span>•</span>
                </Button>
                
                <div className="w-px h-5 bg-gray-200 mx-1"></div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    // Insert Analysis Report Link at cursor position
                    const editor = document.querySelector('[contenteditable=true]') as HTMLElement;
                    if (editor) {
                      document.execCommand('insertText', false, '[Analysis Report Link]');
                      editor.focus();
                      
                      // Trigger the input event to update our state
                      const event = new Event('input', { bubbles: true });
                      editor.dispatchEvent(event);
                    }
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
                    // Insert Booking Calendar Link at cursor position
                    const editor = document.querySelector('[contenteditable=true]') as HTMLElement;
                    if (editor) {
                      document.execCommand('insertText', false, '[Booking Calendar Link]');
                      editor.focus();
                      
                      // Trigger the input event to update our state
                      const event = new Event('input', { bubbles: true });
                      editor.dispatchEvent(event);
                    }
                  }}
                  title="Insert Booking Link"
                >
                  <span className="text-xs">Booking Link</span>
                </Button>
              </div>
            </div>
            
            {/* Rich Content Editor - Simplified Approach */}
            <div className="bg-white">
              <div
                ref={(el) => {
                  // Initial setup when component mounts
                  if (el && !el.innerHTML && emailContent) {
                    // Apply formatting to the initial content
                    const formatted = emailContent
                      .replace(/\n\n/g, '<br><br>')
                      .replace(/\n/g, '<br>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/• (.*?)(?:<br>|$)/g, '<li style="margin-bottom: 8px; margin-left: 20px;">$1</li>')
                      .replace('[Analysis Report Link]', companyAnalysisTask 
                        ? `<a href="/client/${client.id}/analysis/${companyAnalysisTask.id}" style="color: #0066cc; text-decoration: underline; font-weight: 600;">View Business Analysis Report</a>` 
                        : '')
                      .replace('[Booking Calendar Link]', 
                        `<a href="https://calendly.com/yourbusiness/discovery-call" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 8px 0;">Schedule Discovery Call</a>`);
                    
                    el.innerHTML = formatted || '<div style="color: #a0aec0;">Type your email here...</div>';
                  }
                }}
                className="p-4 min-h-[350px] font-sans focus:outline-none"
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(e) => {
                  // Get the raw content from the contentEditable div
                  const content = e.currentTarget.innerHTML;
                  
                  // Convert HTML back to plain text for storing
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = content;
                  const plainText = tempDiv.innerText || tempDiv.textContent || '';
                  
                  // Update our state
                  setEmailContent(plainText);
                  
                  // Format the content for preview
                  let formattedContent = content;
                  
                  // Replace placeholder links with actual links
                  formattedContent = formattedContent.replace('[Analysis Report Link]', companyAnalysisTask 
                    ? `<a href="/client/${client.id}/analysis/${companyAnalysisTask.id}" style="color: #0066cc; text-decoration: underline; font-weight: 600;">View Business Analysis Report</a>` 
                    : '');
                  
                  formattedContent = formattedContent.replace('[Booking Calendar Link]', 
                    `<a href="https://calendly.com/yourbusiness/discovery-call" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 8px 0;">Schedule Discovery Call</a>`);
                    
                  // Update the HTML state to match what we're displaying
                  setEmailHtml(`
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; padding: 5px;">
                      <div style="background-color: white; padding: 15px;">
                        ${formattedContent}
                      </div>
                    </div>
                  `);
                }}
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