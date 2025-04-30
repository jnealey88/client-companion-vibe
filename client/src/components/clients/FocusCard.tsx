import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Info, ArrowRight, CheckCircle, FileSearch, FileText, FolderTree } from "lucide-react";
import { CompanionTask } from "@shared/schema";

interface FocusCardProps {
  clientStatus: string;
  tasks: CompanionTask[] | undefined;
  clientId: number;
  onCompanyAnalysis: () => void;
  onProposal: () => void;
  onSiteMap: () => void;
}

export default function FocusCard({ 
  clientStatus, 
  tasks, 
  clientId,
  onCompanyAnalysis,
  onProposal,
  onSiteMap
}: FocusCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  // Define recommended next actions based on client status and tasks
  const getRecommendedAction = () => {
    // If no tasks exist, recommend starting with Company Analysis
    if (!tasks || tasks.length === 0) {
      return {
        title: "Start with Company Analysis",
        description: "Begin by analyzing the company to understand their business needs and challenges.",
        action: "Run Company Analysis",
        actionFn: onCompanyAnalysis,
        badge: "Recommended First Step",
        icon: <FileSearch className="h-4 w-4 mr-2" />
      };
    }

    // Find completed tasks
    const completedTasks = tasks.filter(task => task.status === "completed" && task.content);
    
    // Check if we have a completed company analysis but no proposal
    const hasCompanyAnalysis = completedTasks.some(task => task.type === "company_analysis");
    const hasProposal = completedTasks.some(task => task.type === "proposal");
    const hasSiteMap = completedTasks.some(task => task.type === "site_map");
    
    if (hasCompanyAnalysis && !hasProposal) {
      return {
        title: "Create a Proposal",
        description: "Use the company analysis to create a compelling proposal for the client.",
        action: "Generate Proposal",
        actionFn: onProposal,
        badge: "Next Step",
        icon: <FileText className="h-4 w-4 mr-2" />
      };
    } 
    
    if (hasProposal && !hasSiteMap) {
      return {
        title: "Create a Site Map",
        description: "Design the website structure based on the approved proposal.",
        action: "Generate Site Map",
        actionFn: onSiteMap,
        badge: "Next Step",
        icon: <FolderTree className="h-4 w-4 mr-2" />
      };
    }

    // Default to company analysis if none exists (this ensures company analysis is always recommended first if nothing has been generated)
    if (!hasCompanyAnalysis) {
      return {
        title: "Start with Company Analysis",
        description: "Begin by analyzing the company to understand their business needs and challenges.",
        action: "Run Company Analysis",
        actionFn: onCompanyAnalysis,
        badge: "Recommended First Step",
        icon: <FileSearch className="h-4 w-4 mr-2" />
      };
    }

    // Default recommendation if we can't determine a specific next step
    return {
      title: "Review Client Status",
      description: "Check the current project phase and determine next actions needed.",
      action: "Explore Tasks",
      actionFn: () => {
        // Focus on the client companion section
        document.getElementById('client-companion-section')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      },
      badge: "Recommended",
      icon: <ArrowRight className="h-4 w-4 mr-2" />
    };
  };

  const recommendation = getRecommendedAction();

  return (
    <Card className="mb-4 border-l-4 border-l-primary shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 rounded-full p-2 mt-0.5">
              <Info className="h-5 w-5 text-primary" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{recommendation.title}</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {recommendation.badge}
                </Badge>
              </div>
              <p className="text-gray-600">{recommendation.description}</p>
              
              <Button 
                className="mt-3 gap-1" 
                size="sm"
                onClick={recommendation.actionFn}
              >
                {recommendation.icon}
                {recommendation.action}
              </Button>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}