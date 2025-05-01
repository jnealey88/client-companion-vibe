import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, ThumbsUp, ThumbsDown, Send, Edit, Save, X } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface SiteMapData {
  taskId: number;
  clientId: number;
  clientName: string;
  content: string;
  createdAt: string;
}

export default function SharedSiteMapPage() {
  const [, params] = useRoute("/share/site-map/:shareToken");
  const shareToken = params?.shareToken;
  const { toast } = useToast();
  
  const [siteMapData, setSiteMapData] = useState<SiteMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [clientEmail, setClientEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [approved, setApproved] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Edit mode state
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [savingSection, setSavingSection] = useState<Record<string, boolean>>({});
  
  // Parse site map content if JSON
  const parsedContent = siteMapData?.content ? (() => {
    try {
      return JSON.parse(siteMapData.content);
    } catch (e) {
      // Return the raw content if not JSON
      return null;
    }
  })() : null;
  
  // Fetch the shared site map
  useEffect(() => {
    if (!shareToken) return;
    
    const fetchSharedSiteMap = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/share/site-map/${shareToken}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to load site map");
        }
        
        const data = await response.json();
        setSiteMapData(data);
      } catch (err) {
        console.error("Error fetching shared site map:", err);
        setError(err instanceof Error ? err.message : "Failed to load site map");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedSiteMap();
  }, [shareToken]);
  
  // Function to handle editing a section
  const toggleEditMode = (sectionId: string, initialContent: string) => {
    if (editMode[sectionId]) {
      // If already in edit mode, cancel and reset
      setEditMode(prev => ({ ...prev, [sectionId]: false }));
    } else {
      // Enter edit mode and set initial content
      setEditMode(prev => ({ ...prev, [sectionId]: true }));
      setEditedContent(prev => ({ ...prev, [sectionId]: initialContent }));
    }
  };
  
  // Function to update edited content
  const handleContentChange = (sectionId: string, newContent: string) => {
    setEditedContent(prev => ({ ...prev, [sectionId]: newContent }));
  };
  
  // Function to save section content
  const saveSection = async (pageIdx: number, sectionIdx: number, sectionId: string) => {
    if (!shareToken || !siteMapData) return;
    
    try {
      setSavingSection(prev => ({ ...prev, [sectionId]: true }));
      
      // Create a deep copy of the parsed content
      const updatedContent = JSON.parse(JSON.stringify(parsedContent));
      
      // Update the section content
      if (updatedContent && updatedContent.pages && updatedContent.pages[pageIdx]) {
        const section = updatedContent.pages[pageIdx].sections[sectionIdx];
        
        if (section) {
          // Update the content based on the format
          let content = section.content;
          try {
            // If content is in JSON format, update only the relevant part
            const contentObj = JSON.parse(content);
            
            if (contentObj && contentObj.blocks && Array.isArray(contentObj.blocks)) {
              // Update EditorJS blocks
              contentObj.blocks = [{
                type: "paragraph",
                data: {
                  text: editedContent[sectionId]
                }
              }];
              section.content = JSON.stringify(contentObj);
            } else if (typeof contentObj === 'object') {
              // For other JSON objects, update content property if exists
              if (contentObj.content) {
                contentObj.content = editedContent[sectionId];
                section.content = JSON.stringify(contentObj);
              } else {
                // If no content property, replace with plain text
                section.content = editedContent[sectionId];
              }
            }
          } catch (e) {
            // If content is not JSON, just update the plain text
            section.content = editedContent[sectionId];
          }
          
          // Update word count
          section.wordCount = editedContent[sectionId].split(/\s+/).filter(Boolean).length;
        }
      }
      
      // Call API to update content on the server
      await apiRequest("POST", `/api/share/site-map/${shareToken}/update-content`, {
        content: JSON.stringify(updatedContent)
      });
      
      // Update state with new content
      setSiteMapData({
        ...siteMapData,
        content: JSON.stringify(updatedContent)
      });
      
      // Exit edit mode
      setEditMode(prev => ({ ...prev, [sectionId]: false }));
      
      toast({
        title: "Content updated",
        description: "Your changes have been saved."
      });
    } catch (err) {
      console.error("Error updating section content:", err);
      
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Failed to update content",
        variant: "destructive"
      });
    } finally {
      setSavingSection(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!shareToken) return;
    
    if (!clientEmail) {
      toast({
        title: "Email required",
        description: "Please provide your email address",
        variant: "destructive"
      });
      return;
    }
    
    if (approved === null) {
      toast({
        title: "Approval decision required",
        description: "Please indicate whether you approve this site map",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await apiRequest("POST", `/api/share/site-map/${shareToken}/feedback`, {
        clientEmail,
        feedback,
        approved
      });
      
      setSubmitted(true);
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback"
      });
    } catch (err) {
      console.error("Error submitting feedback:", err);
      
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Failed to submit feedback",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Generate a nice HTML view for the site map content
  const renderSiteMapContent = () => {
    if (!siteMapData) return null;
    
    // If we have parsed JSON content
    if (parsedContent) {
      return (
        <div className="space-y-8 my-6">
          <div className="site-overview bg-muted/30 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Site Overview</h2>
            <p className="text-muted-foreground">{parsedContent.siteOverview?.description}</p>
            
            {parsedContent.siteOverview?.primaryNavigation && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Primary Navigation</h3>
                <div className="flex flex-wrap gap-2">
                  {parsedContent.siteOverview.primaryNavigation.map((item: string, i: number) => (
                    <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="pages-structure">
            <h2 className="text-xl font-semibold mb-4">Pages Structure</h2>
            
            <div className="space-y-4">
              {parsedContent.pages?.map((page: any, i: number) => (
                <div 
                  key={i} 
                  className={`border rounded-lg p-4 ${page.isParent ? 'bg-muted/20' : ''}`}
                  style={{ marginLeft: page.isParent ? 0 : '1.5rem' }}
                >
                  <h3 className="text-lg font-medium">{page.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{page.url}</p>
                  <p className="text-sm mb-2">{page.metaDescription}</p>
                  
                  {page.sections && page.sections.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <h4 className="text-sm font-medium mb-2">Sections</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {page.sections.map((section: any, j: number) => (
                          <div key={j} className="bg-background border rounded p-4 shadow-sm">
                            <h5 className="font-semibold text-base mb-2 text-primary/80">{section.title}</h5>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-muted-foreground mt-1 mb-2">
                                <span className="bg-muted px-2 py-0.5 rounded">
                                  {section.wordCount || 0} words
                                </span>
                                {section.elements && section.elements.length > 0 && (
                                  <span className="ml-2 text-primary-foreground">
                                    {section.elements.join(', ')}
                                  </span>
                                )}
                              </div>
                              
                              {editMode[`${page.id}-${section.id}`] ? (
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => toggleEditMode(`${page.id}-${section.id}`, '')}
                                    variant="outline" 
                                    size="sm"
                                    className="h-8"
                                  >
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => saveSection(i, j, `${page.id}-${section.id}`)}
                                    variant="default" 
                                    size="sm"
                                    className="h-8"
                                    disabled={savingSection[`${page.id}-${section.id}`]}
                                  >
                                    {savingSection[`${page.id}-${section.id}`] ? (
                                      <>
                                        <div className="mr-1 h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="h-3.5 w-3.5 mr-1" />
                                        Save
                                      </>
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  onClick={() => {
                                    // Extract the content to edit
                                    let contentToEdit = '';
                                    try {
                                      const contentObj = JSON.parse(section.content);
                                      if (contentObj && contentObj.blocks && Array.isArray(contentObj.blocks)) {
                                        contentToEdit = contentObj.blocks
                                          .map((block: any) => block.data?.text || '')
                                          .filter(Boolean)
                                          .join('\n\n');
                                      } else if (typeof contentObj === 'string') {
                                        contentToEdit = contentObj;
                                      } else if (contentObj.content) {
                                        contentToEdit = contentObj.content;
                                      } else {
                                        contentToEdit = section.content;
                                      }
                                    } catch {
                                      contentToEdit = section.content;
                                    }
                                    toggleEditMode(`${page.id}-${section.id}`, contentToEdit);
                                  }}
                                  variant="outline" 
                                  size="sm"
                                  className="h-8"
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                            
                            {editMode[`${page.id}-${section.id}`] ? (
                              <div className="mt-2">
                                <Textarea
                                  value={editedContent[`${page.id}-${section.id}`] || ''}
                                  onChange={(e) => handleContentChange(`${page.id}-${section.id}`, e.target.value)}
                                  className="w-full min-h-[200px] font-mono text-sm"
                                  placeholder="Enter section content..."
                                />
                              </div>
                            ) : (
                              <div className="text-sm mt-2 prose prose-sm max-w-none whitespace-pre-line">
                                {(() => {
                                  // Try to extract text content from EditorJS format if applicable
                                  if (typeof section.content === 'string') {
                                    try {
                                      // Check if it's in EditorJS format
                                      const contentObj = JSON.parse(section.content);
                                      if (contentObj && contentObj.blocks && Array.isArray(contentObj.blocks)) {
                                        // Extract text from blocks
                                        return contentObj.blocks
                                          .map((block: any) => {
                                            if (block.data && block.data.text) {
                                              return block.data.text;
                                            }
                                            return '';
                                          })
                                          .filter(Boolean)
                                          .join('\n\n');
                                      }
                                      // If it's JSON but not Editor.js, try to display in a readable format
                                      if (typeof contentObj === 'string') {
                                        return contentObj;
                                      } else if (contentObj.content) {
                                        return contentObj.content;
                                      } else {
                                        return JSON.stringify(contentObj, null, 2);
                                      }
                                    } catch (e) {
                                      // If not valid JSON, return as is
                                      return section.content;
                                    }
                                  }
                                  return 'No content available';
                                })()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback to displaying the raw content
    return (
      <div className="my-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: siteMapData.content }} />
    );
  };
  
  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading site map...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="bg-destructive/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <ThumbsDown className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Site Map Not Available</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="bg-green-50 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">
              Your feedback on the site map for {siteMapData?.clientName} has been submitted.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto py-10">
      <div className="flex flex-col space-y-6">
        {/* Header section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Site Map for {siteMapData?.clientName}
          </h1>
          <p className="text-muted-foreground mt-2">
            Review the proposed site structure and content organization for your website.
          </p>
        </div>
        
        <Separator />
        
        {/* Content section */}
        {renderSiteMapContent()}
        
        <Separator />
        
        {/* Feedback section */}
        <div className="bg-muted/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Feedback</h2>
          <p className="text-muted-foreground mb-6">
            Please provide your feedback on this site map. Your input is valuable for finalizing the website structure.
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Your Email*
                </label>
                <input
                  type="email"
                  id="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-3">
                  Do you approve this site map?*
                </label>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant={approved === true ? "default" : "outline"}
                    className="flex items-center space-x-2"
                    onClick={() => setApproved(true)}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>Approve</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant={approved === false ? "default" : "outline"}
                    className="flex items-center space-x-2"
                    onClick={() => setApproved(false)}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>Needs Changes</span>
                  </Button>
                </div>
              </div>
              
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium mb-1">
                  Additional Comments
                </label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full min-h-[120px]"
                  placeholder="Share any specific feedback or suggested changes"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSubmitFeedback}
              className="w-full md:w-auto"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full"></div>
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center">
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
