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
      console.log("EDITOR DEBUG - Content received:", siteMapData.content);
      console.log("EDITOR DEBUG - Content type:", typeof siteMapData.content);
      console.log("EDITOR DEBUG - Content length:", siteMapData.content.length);
      
      // Check if the content is already in JSON format
      if (typeof siteMapData.content === 'string' && 
          (siteMapData.content.startsWith('{') || siteMapData.content.startsWith('[')))
      {
        console.log("EDITOR DEBUG - Detected JSON format content");
        const parsed = JSON.parse(siteMapData.content);
        
        // Check if the parsed content is Editor.js format or our custom JSON format
        if (parsed.time && parsed.blocks) {
          console.log("EDITOR DEBUG - Content is Editor.js format");
        } else if (parsed.siteOverview) {
          console.log("EDITOR DEBUG - Content is site map JSON format");
          
          // Extra debug: Check if sections have the expected properties
          if (parsed.pages && parsed.pages.length > 0 && parsed.pages[0].sections && parsed.pages[0].sections.length > 0) {
            const firstSection = parsed.pages[0].sections[0];
            console.log("EDITOR DEBUG - First section properties:", Object.keys(firstSection));
            console.log("EDITOR DEBUG - layoutSuggestion:", firstSection.layoutSuggestion);
            console.log("EDITOR DEBUG - headingOptions:", firstSection.headingOptions);
            console.log("EDITOR DEBUG - ctaText:", firstSection.ctaText);
          }
        } else {
          console.log("EDITOR DEBUG - Content is JSON but not Editor.js format, converting");
        }
        
        return parsed;
      }
      
      return JSON.parse(siteMapData.content);
    } catch (e) {
      // Return the raw content if not JSON
      console.error("EDITOR DEBUG - Error parsing JSON:", e);
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
            
            {/* Content Guidelines */}
            {parsedContent.contentGuidelines && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-medium mb-3">Content Guidelines</h3>
                
                {/* Tone and Voice */}
                {parsedContent.contentGuidelines.tone && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Tone and Voice</h4>
                    <p className="text-sm text-muted-foreground">{parsedContent.contentGuidelines.tone}</p>
                  </div>
                )}
                
                {/* Call to Action Style */}
                {parsedContent.contentGuidelines.callToAction && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Call-to-Action Style</h4>
                    <div className="p-3 bg-primary/10 rounded-md border border-primary/20 text-sm font-medium text-primary">
                      {parsedContent.contentGuidelines.callToAction}
                    </div>
                  </div>
                )}
                
                {/* Key Messages */}
                {parsedContent.contentGuidelines.keyMessages && parsedContent.contentGuidelines.keyMessages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key Messages</h4>
                    <ul className="pl-5 space-y-2">
                      {parsedContent.contentGuidelines.keyMessages.map((message: string, i: number) => (
                        <li key={i} className="text-sm">{message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="pages-structure">
            <h2 className="text-xl font-semibold mb-4">Pages Structure</h2>
            
            {/* Technical Requirements */}
            {parsedContent.technicalRequirements && (
              <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3 text-[#111]">Technical Requirements</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Interactive Elements */}
                  {parsedContent.technicalRequirements.interactiveElements && parsedContent.technicalRequirements.interactiveElements.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-[#111]">Interactive Elements</h4>
                      <ul className="pl-5 list-disc space-y-2">
                        {parsedContent.technicalRequirements.interactiveElements.map((element: string, index: number) => (
                          <li key={index} className="text-sm">{element}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Integrations */}
                  {parsedContent.technicalRequirements.integrations && parsedContent.technicalRequirements.integrations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-[#111]">Integrations</h4>
                      <ul className="pl-5 list-disc space-y-2">
                        {parsedContent.technicalRequirements.integrations.map((integration: string, index: number) => (
                          <li key={index} className="text-sm">{integration}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Site-wide Design System */}
            {parsedContent.designSystem && (
              <div className="mb-6 border rounded-lg p-4 bg-primary/5">
                <h3 className="text-lg font-semibold mb-3 text-primary">Design System Recommendations</h3>
                
                {/* Color palette */}
                {parsedContent.designSystem.colorPalette && parsedContent.designSystem.colorPalette.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Color Palette</h4>
                    <div className="flex flex-wrap gap-2">
                      {parsedContent.designSystem.colorPalette.map((color: string, index: number) => (
                        <div key={index} className="px-3 py-2 rounded-md bg-white text-sm border">
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Typography */}
                {parsedContent.designSystem.typography && (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {parsedContent.designSystem.typography.headings && (
                      <div className="p-3 bg-white rounded-md border">
                        <h5 className="text-sm font-medium mb-1">Headings</h5>
                        <p className="text-xs text-muted-foreground">{parsedContent.designSystem.typography.headings}</p>
                      </div>
                    )}
                    {parsedContent.designSystem.typography.bodyText && (
                      <div className="p-3 bg-white rounded-md border">
                        <h5 className="text-sm font-medium mb-1">Body Text</h5>
                        <p className="text-xs text-muted-foreground">{parsedContent.designSystem.typography.bodyText}</p>
                      </div>
                    )}
                    {parsedContent.designSystem.typography.buttons && (
                      <div className="p-3 bg-white rounded-md border">
                        <h5 className="text-sm font-medium mb-1">Buttons</h5>
                        <p className="text-xs text-muted-foreground">{parsedContent.designSystem.typography.buttons}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Component Styles and Spacing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parsedContent.designSystem.componentStyles && parsedContent.designSystem.componentStyles.length > 0 && (
                    <div className="p-3 bg-white rounded-md border">
                      <h5 className="text-sm font-medium mb-1">Component Styles</h5>
                      <ul className="text-xs text-muted-foreground pl-5 list-disc space-y-1">
                        {parsedContent.designSystem.componentStyles.map((style: string, index: number) => (
                          <li key={index}>{style}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {parsedContent.designSystem.spacingSystem && (
                    <div className="p-3 bg-white rounded-md border">
                      <h5 className="text-sm font-medium mb-1">Spacing System</h5>
                      <p className="text-xs text-muted-foreground">{parsedContent.designSystem.spacingSystem}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
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
                  
                  {/* Design Suggestions for this Page */}
                  {page.designSuggestions && (
                    <div className="mb-4 mt-2 bg-muted/10 p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-2 text-primary">Design Suggestions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {page.designSuggestions.colorPalette && (
                          <div className="text-xs border rounded-md p-2 bg-white">
                            <span className="font-medium">Color Palette:</span> {page.designSuggestions.colorPalette}
                          </div>
                        )}
                        {page.designSuggestions.typography && (
                          <div className="text-xs border rounded-md p-2 bg-white">
                            <span className="font-medium">Typography:</span> {page.designSuggestions.typography}
                          </div>
                        )}
                        {page.designSuggestions.visualElements && (
                          <div className="text-xs border rounded-md p-2 bg-white">
                            <span className="font-medium">Visual Elements:</span> {page.designSuggestions.visualElements}
                          </div>
                        )}
                        {page.designSuggestions.responsiveConsiderations && (
                          <div className="text-xs border rounded-md p-2 bg-white">
                            <span className="font-medium">Responsive Design:</span> {page.designSuggestions.responsiveConsiderations}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
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
                              <>
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
                                
                                {/* AI-generated layout suggestions */}
                                {section.layoutSuggestion && (
                                  <div className="mt-4 border-t pt-4">
                                    <h6 className="text-sm font-medium mb-2 text-primary">Layout Suggestion</h6>
                                    <p className="text-sm text-muted-foreground">{section.layoutSuggestion}</p>
                                  </div>
                                )}
                                
                                {/* Heading & Subheading Options */}
                                {(section.headingOptions || section.subheadingOptions) && (
                                  <div className="mt-4 border-t pt-4">
                                    {section.headingOptions && section.headingOptions.length > 0 && (
                                      <div className="mb-3">
                                        <h6 className="text-sm font-medium mb-2 text-primary">Heading Options</h6>
                                        <div className="grid gap-2">
                                          {section.headingOptions.map((heading: string, index: number) => (
                                            <div key={index} className="p-2 border rounded bg-muted/30 text-sm">
                                              {heading}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {section.subheadingOptions && section.subheadingOptions.length > 0 && (
                                      <div>
                                        <h6 className="text-sm font-medium mb-2 text-primary">Subheading Options</h6>
                                        <div className="grid gap-2">
                                          {section.subheadingOptions.map((subheading: string, index: number) => (
                                            <div key={index} className="p-2 border rounded bg-muted/30 text-sm">
                                              {subheading}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* CTA Text */}
                                {section.ctaText && section.ctaText.length > 0 && (
                                  <div className="mt-4 border-t pt-4">
                                    <h6 className="text-sm font-medium mb-2 text-primary">Call-to-Action Options</h6>
                                    <div className="grid gap-2">
                                      {section.ctaText.map((cta: string, index: number) => (
                                        <div key={index} className="p-2 border rounded bg-primary/10 text-primary text-sm font-medium">
                                          {cta}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
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
