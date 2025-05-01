import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { LightBulbIcon, Clock, Activity, ChevronDown, ChevronUp, Send, Plus } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Client } from '@shared/schema';

interface Recommendation {
  title: string;
  description: string;
  businessImpact: string;
  effort: 'Low' | 'Medium' | 'High';
  implementationTip: string;
}

interface RecommendationsData {
  performanceOptimization: Recommendation[];
  seo: Recommendation[];
  userExperience: Recommendation[];
  conversionOptimization: Recommendation[];
  contentStrategy: Recommendation[];
}

interface RecommendationsPanelProps {
  client: Client;
  siteMetrics: any;
}

type CategoryId = keyof RecommendationsData;

const categoryMap: Record<CategoryId, string> = {
  performanceOptimization: 'Performance Optimization',
  seo: 'Search Engine Optimization',
  userExperience: 'User Experience',
  conversionOptimization: 'Conversion Optimization',
  contentStrategy: 'Content Strategy'
};

/**
 * Component for displaying and selecting AI-generated website recommendations
 */
export default function RecommendationsPanel({ client, siteMetrics }: RecommendationsPanelProps) {
  // State for the recommendations data
  const [selectedRecommendations, setSelectedRecommendations] = useState<Recommendation[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Recommended improvements for ${client.name} website`);
  const [emailIntro, setEmailIntro] = useState(`Hello ${client.contactName},\n\nBased on our analysis of your website, we've identified some key improvements that could help boost your online presence. Here are our recommendations:`);
  
  // State for category expansion
  const [expandedCategories, setExpandedCategories] = useState<Record<CategoryId, boolean>>({
    performanceOptimization: true,
    seo: true,
    userExperience: false,
    conversionOptimization: false,
    contentStrategy: false
  });

  // Query to fetch recommendations
  const { data: recommendationsTaskData, isLoading, isError } = useQuery({
    queryKey: [`/api/clients/${client.id}/companion-tasks`],
    select: (tasks) => tasks.find((task: any) => task.type === 'site_optimizer' && task.status === 'completed')
  });

  // Mutation to generate recommendations
  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/clients/${client.id}/generate/site_optimizer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteMetrics })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      toast({
        title: 'Recommendations Generated',
        description: 'New website improvement recommendations have been generated.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });

  // Email sending mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({
      to,
      subject,
      content
    }: {
      to: string;
      subject: string;
      content: string;
    }) => {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          from: 'your-agency@example.com', // This should be configured based on user settings
          subject,
          html: content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setEmailDialogOpen(false);
      toast({
        title: 'Email Sent',
        description: `Recommendations have been emailed to ${client.email}`,
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });

  // Toggle category expansion
  const toggleCategory = (category: CategoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Toggle recommendation selection
  const toggleRecommendation = (recommendation: Recommendation) => {
    if (selectedRecommendations.some(r => r.title === recommendation.title)) {
      setSelectedRecommendations(prev => prev.filter(r => r.title !== recommendation.title));
    } else {
      setSelectedRecommendations(prev => [...prev, recommendation]);
    }
  };

  // Get recommendations data from task content
  const getRecommendationsData = (): RecommendationsData | null => {
    if (!recommendationsTaskData?.content) return null;
    
    try {
      return JSON.parse(recommendationsTaskData.content);
    } catch (error) {
      console.error('Error parsing recommendations:', error);
      return null;
    }
  };

  // Format recommendations as HTML for email
  const formatRecommendationsEmail = () => {
    if (selectedRecommendations.length === 0) return '';

    const intro = emailIntro.replace(/\n/g, '<br />');
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>${intro}</p>
        <ul style="padding-left: 20px;">
    `;
    
    selectedRecommendations.forEach(rec => {
      html += `
        <li style="margin-bottom: 15px;">
          <strong>${rec.title}</strong><br>
          ${rec.description}<br>
          <span style="color: #0070f3; font-size: 14px;">Impact: ${rec.businessImpact}</span><br>
          <span style="color: #666; font-style: italic; font-size: 14px;">Implementation tip: ${rec.implementationTip}</span>
        </li>
      `;
    });
    
    html += `
        </ul>
        <p>Would you like us to implement any of these improvements? Let me know and I can prepare a plan of action.</p>
        <p>Best regards,<br>Your Web Designer</p>
      </div>
    `;
    
    return html;
  };

  // Handle sending email
  const handleSendEmail = () => {
    if (selectedRecommendations.length === 0) {
      toast({
        title: 'No Recommendations Selected',
        description: 'Please select at least one recommendation to email.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!client.email) {
      toast({
        title: 'No Email Address',
        description: 'The client does not have an email address.',
        variant: 'destructive'
      });
      return;
    }
    
    const emailContent = formatRecommendationsEmail();
    
    sendEmailMutation.mutate({
      to: client.email,
      subject: emailSubject,
      content: emailContent
    });
  };

  // Render effort level badges
  const renderEffortBadge = (effort: string) => {
    let color = '';
    switch (effort) {
      case 'Low':
        color = 'bg-green-100 text-green-800 border-green-200';
        break;
      case 'Medium':
        color = 'bg-amber-100 text-amber-800 border-amber-200';
        break;
      case 'High':
        color = 'bg-red-100 text-red-800 border-red-200';
        break;
      default:
        color = 'bg-blue-100 text-blue-800 border-blue-200';
    }
    
    return (
      <Badge variant="outline" className={color}>
        {effort} Effort
      </Badge>
    );
  };

  // Get recommendations data
  const recommendationsData = getRecommendationsData();
  
  // If loading, show loading state
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-amber-500" />
            <span>Website Recommendations</span>
          </CardTitle>
          <CardDescription>AI-generated improvement suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p className="text-gray-600">Generating recommendations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If error or no recommendations, show button to generate
  if (isError || !recommendationsData) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-amber-500" />
            <span>Website Recommendations</span>
          </CardTitle>
          <CardDescription>AI-generated improvement suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">No recommendations available. Generate AI-powered suggestions to improve the website.</p>
            <Button
              onClick={() => generateRecommendationsMutation.mutate()}
              disabled={generateRecommendationsMutation.isPending}
            >
              {generateRecommendationsMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <LightBulbIcon className="mr-2 h-4 w-4" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-amber-500" />
            <span>Website Recommendations</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateRecommendationsMutation.mutate()}
              disabled={generateRecommendationsMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setEmailDialogOpen(true)}
              disabled={selectedRecommendations.length === 0}
            >
              <Send className="h-4 w-4 mr-1" />
              Email Selected
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Select recommendations to share with your client. {selectedRecommendations.length} selected.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(recommendationsData).map(([category, recommendations]) => {
            const categoryId = category as CategoryId;
            const isExpanded = expandedCategories[categoryId];
            
            return (
              <div key={category} className="border rounded-md">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategory(categoryId)}
                >
                  <h3 className="font-medium text-gray-900">{categoryMap[categoryId]}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {recommendations.filter(rec => 
                        selectedRecommendations.some(r => r.title === rec.title)
                      ).length} of {recommendations.length} selected
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-3 border-t space-y-3">
                    {recommendations.map((recommendation, index) => {
                      const isSelected = selectedRecommendations.some(
                        r => r.title === recommendation.title
                      );
                      
                      return (
                        <div 
                          key={index} 
                          className={`p-3 border rounded-md ${isSelected ? 'border-blue-200 bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              id={`${category}-${index}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleRecommendation(recommendation)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <label 
                                  htmlFor={`${category}-${index}`}
                                  className="font-medium cursor-pointer"
                                >
                                  {recommendation.title}
                                </label>
                                <div className="ml-2">
                                  {renderEffortBadge(recommendation.effort)}
                                </div>
                              </div>
                              
                              <p className="text-gray-700 mt-1 text-sm">{recommendation.description}</p>
                              
                              <div className="mt-2 text-xs flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-blue-700">
                                  <Activity className="h-3.5 w-3.5" />
                                  <span>{recommendation.businessImpact}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-600 italic">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Tip: {recommendation.implementationTip}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Email Recommendations</DialogTitle>
            <DialogDescription>
              Customize your email before sending it to {client.contactName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Introduction</label>
              <Textarea
                value={emailIntro}
                onChange={(e) => setEmailIntro(e.target.value)}
                rows={4}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Recommendations ({selectedRecommendations.length})</label>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-2">
                {selectedRecommendations.map((rec, index) => (
                  <div key={index} className="text-sm p-2 border rounded-md bg-gray-50">
                    <div className="font-medium">{rec.title}</div>
                    <div className="text-gray-700 text-xs">{rec.description}</div>
                  </div>
                ))}
                {selectedRecommendations.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-4">
                    No recommendations selected
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={sendEmailMutation.isPending || selectedRecommendations.length === 0}
            >
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
