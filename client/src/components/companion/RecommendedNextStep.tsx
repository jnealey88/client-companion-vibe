import { useState } from "react";
import { 
  ArrowRight, 
  FileSearch, 
  Calendar, 
  FileText, 
  FolderTree, 
  Scroll, 
  Zap,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Client, CompanionTask } from "@shared/schema";

// We define TaskType enum here since it's not exported from schema
enum TaskType {
  // Discovery phase tasks
  COMPANY_ANALYSIS = "company_analysis",
  SCHEDULE_DISCOVERY = "schedule_discovery",
  PROPOSAL = "proposal",
  
  // Planning phase tasks
  DEFINE_SCOPE = "define_scope",
  CONTRACT = "contract", 
  THIRD_PARTY = "third_party",
  
  // Design and Development phase tasks
  SITE_MAP = "site_map",
  AI_SITE_DESIGNER = "ai_site_designer",
  AI_QA_TOOL = "ai_qa_tool",
  
  // Post Launch Management phase tasks
  STATUS_UPDATE = "status_update",
  SITE_MAINTENANCE = "site_maintenance",
  SITE_OPTIMIZER = "site_optimizer"
}
import { useToast } from "@/hooks/use-toast";

interface RecommendedNextStepProps {
  client: Client;
  tasks: CompanionTask[];
}

// Define the phase progression with tasks for each phase
const phaseProgression = {
  "Discovery": [
    { type: TaskType.COMPANY_ANALYSIS, label: "Company Analysis", description: "Create detailed business analysis" },
    { type: TaskType.SCHEDULE_DISCOVERY, label: "Schedule Discovery", description: "Set up client discovery call" },
    { type: TaskType.PROPOSAL, label: "Project Proposal", description: "Generate project proposal" },
  ],
  "Planning": [
    { type: TaskType.DEFINE_SCOPE, label: "Define Project Scope", description: "Document project requirements" },
    { type: TaskType.CONTRACT, label: "Contract", description: "Create service agreement" },
    { type: TaskType.THIRD_PARTY, label: "3rd Party Integrations", description: "Plan integrations" },
  ],
  "Design and Development": [
    { type: TaskType.SITE_MAP, label: "Site Map & Content", description: "Create site structure" },
    { type: TaskType.AI_SITE_DESIGNER, label: "AI Site Designer", description: "Generate mockups" }, 
    { type: TaskType.AI_QA_TOOL, label: "AI QA Tool", description: "Test site quality" },
  ],
  "Post Launch Management": [
    { type: TaskType.STATUS_UPDATE, label: "Status Update", description: "Send status report" },
    { type: TaskType.SITE_MAINTENANCE, label: "Site Maintenance", description: "Regular updates" },
    { type: TaskType.SITE_OPTIMIZER, label: "Site Optimizer", description: "Optimize performance" },
  ]
};

// Task icons mapping
const taskIcons = {
  [TaskType.COMPANY_ANALYSIS]: <FileSearch className="h-5 w-5" />,
  [TaskType.SCHEDULE_DISCOVERY]: <Calendar className="h-5 w-5" />,
  [TaskType.PROPOSAL]: <FileText className="h-5 w-5" />,
  [TaskType.DEFINE_SCOPE]: <FileSearch className="h-5 w-5" />,
  [TaskType.CONTRACT]: <Scroll className="h-5 w-5" />,
  [TaskType.SITE_MAP]: <FolderTree className="h-5 w-5" />,
};

export default function RecommendedNextStep({ client, tasks }: RecommendedNextStepProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all completed task types
  const completedTaskTypes = tasks
    .filter(task => task.content !== null)
    .map(task => task.type);

  // Determine client's current phase from their status
  const currentPhase = client.status;
  
  // Find the next recommended task
  const getNextRecommendedTask = () => {
    // Get tasks for current phase
    const phaseTasks = phaseProgression[currentPhase as keyof typeof phaseProgression] || [];
    
    // Find first incomplete task in current phase
    const nextTask = phaseTasks.find(task => !completedTaskTypes.includes(task.type));
    
    // If all tasks in current phase are complete, suggest the first incomplete task from the next phase
    if (!nextTask) {
      if (currentPhase === "Discovery") {
        const planningTasks = phaseProgression["Planning"];
        return planningTasks.find(task => !completedTaskTypes.includes(task.type));
      } else if (currentPhase === "Planning") {
        const designTasks = phaseProgression["Design and Development"];
        return designTasks.find(task => !completedTaskTypes.includes(task.type));
      } else if (currentPhase === "Design and Development") {
        const launchTasks = phaseProgression["Post Launch Management"];
        return launchTasks.find(task => !completedTaskTypes.includes(task.type));
      }
    }
    
    return nextTask;
  };

  // Get the recommended next task
  const recommendedTask = getNextRecommendedTask();
  
  // If there's no recommended task (all tasks complete), don't show the component
  if (!recommendedTask) {
    return null;
  }

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      setIsCreating(true);
      
      const newTask = {
        clientId: client.id,
        type: recommendedTask.type,
        status: "pending" as const,
      };
      
      return await apiRequest('POST', '/api/clients/' + client.id + '/companion-tasks', newTask);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      
      // Trigger task generation
      if (data && data.id) {
        generateTaskContent(data.id, recommendedTask.type);
      }
    },
    onError: (error) => {
      setIsCreating(false);
      toast({
        title: "Failed to create task",
        description: "There was an error creating the task. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Generate task content
  const generateTaskContent = async (taskId: number, taskType: string) => {
    try {
      await apiRequest('POST', '/api/clients/' + client.id + '/generate/' + taskType, { taskId });
      
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      setIsCreating(false);
      
      toast({
        title: "Content generation started",
        description: `${recommendedTask.label} is being generated.`,
      });
    } catch (error) {
      setIsCreating(false);
      toast({
        title: "Generation failed",
        description: "There was an error generating the content. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle the action button click
  const handleAction = () => {
    createTaskMutation.mutate();
  };

  // Get the icon for the task
  const taskIcon = taskIcons[recommendedTask.type as keyof typeof taskIcons] || <Zap className="h-5 w-5" />;

  return (
    <Card className="mb-4 border-blue-200 shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-blue-50 to-white overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
              {taskIcon}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Recommended Next Step</h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {currentPhase}
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">{recommendedTask.label}</span>: {recommendedTask.description}
              </p>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            onClick={handleAction}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                Generate
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}