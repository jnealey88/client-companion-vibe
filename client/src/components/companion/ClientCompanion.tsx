import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Check, 
  Scroll, 
  FolderTree, 
  MessageCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Client, CompanionTask } from "@shared/schema";
import CompanionTaskCard from "./CompanionTaskCard";

// Define task type information
const taskTypes = {
  company_analysis: {
    icon: <FileText className="h-5 w-5" />,
    label: "Company Analysis",
    description: "Comprehensive business and website analysis",
    iconColor: "bg-blue-50 text-blue-600"
  },
  proposal: {
    icon: <Check className="h-5 w-5" />,
    label: "Project Proposal",
    description: "Professional project proposal",
    iconColor: "bg-green-50 text-green-600"
  },
  contract: {
    icon: <Scroll className="h-5 w-5" />,
    label: "Contract",
    description: "Professional service agreement",
    iconColor: "bg-purple-50 text-purple-600"
  },
  site_map: {
    icon: <FolderTree className="h-5 w-5" />,
    label: "Site Map & Content",
    description: "Site structure and content plan",
    iconColor: "bg-amber-50 text-amber-600"
  },
  status_update: {
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Status Update",
    description: "Client status update email",
    iconColor: "bg-pink-50 text-pink-600"
  }
};

interface ClientCompanionProps {
  client: Client;
}

export default function ClientCompanion({ client }: ClientCompanionProps) {
  const [selectedTask, setSelectedTask] = useState<CompanionTask | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch companion tasks for the client
  const { data: tasks, isLoading } = useQuery<CompanionTask[]>({
    queryKey: [`/api/clients/${client.id}/companion-tasks`],
    enabled: !!client.id,
  });
  
  // Create mutation for generating content
  const generateMutation = useMutation({
    mutationFn: async ({ clientId, taskType }: { clientId: number, taskType: string }) => {
      return apiRequest("POST", `/api/clients/${clientId}/generate/${taskType}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      toast({
        title: "Content generated",
        description: "AI-generated content has been created successfully.",
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Handle task selection
  const handleTaskSelect = (task: CompanionTask) => {
    setSelectedTask(task);
  };
  
  // Handle content generation
  const handleGenerate = (taskType: string) => {
    generateMutation.mutate({ clientId: client.id, taskType });
  };
  
  // Handle re-generation of content (retry)
  const handleRetry = (taskType: string) => {
    // Use the same mutation as generate, but for an existing task
    generateMutation.mutate({ clientId: client.id, taskType });
  };
  
  // Group tasks by type for easier display
  const tasksByType: Record<string, CompanionTask | undefined> = {};
  if (tasks) {
    // Get the latest task of each type
    tasks.forEach(task => {
      if (!tasksByType[task.type] || new Date(task.createdAt) > new Date(tasksByType[task.type]!.createdAt)) {
        tasksByType[task.type] = task;
      }
    });
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Companion</CardTitle>
          <CardDescription>Loading tasks...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>Client Companion</span>
          <Badge variant="outline" className="ml-2">AI Assistant</Badge>
        </CardTitle>
        <CardDescription>
          AI-powered workflow assistant that helps you manage client projects efficiently
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="content">Generated Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="mt-4">
            <div className="space-y-4">
              {/* Company Analysis task */}
              <CompanionTaskCard
                title={taskTypes.company_analysis.label}
                description={taskTypes.company_analysis.description}
                icon={taskTypes.company_analysis.icon}
                iconColor={taskTypes.company_analysis.iconColor}
                task={tasksByType.company_analysis}
                isGenerating={generateMutation.isPending}
                onGenerate={() => handleGenerate("company_analysis")}
                onRetry={() => handleRetry("company_analysis")}
                onSelect={handleTaskSelect}
              />
              
              {/* Proposal task */}
              <CompanionTaskCard
                title={taskTypes.proposal.label}
                description={taskTypes.proposal.description}
                icon={taskTypes.proposal.icon}
                iconColor={taskTypes.proposal.iconColor}
                task={tasksByType.proposal}
                isGenerating={generateMutation.isPending}
                onGenerate={() => handleGenerate("proposal")}
                onRetry={() => handleRetry("proposal")}
                onSelect={handleTaskSelect}
              />
              
              {/* Contract task */}
              <CompanionTaskCard
                title={taskTypes.contract.label}
                description={taskTypes.contract.description}
                icon={taskTypes.contract.icon}
                iconColor={taskTypes.contract.iconColor}
                task={tasksByType.contract}
                isGenerating={generateMutation.isPending}
                onGenerate={() => handleGenerate("contract")}
                onRetry={() => handleRetry("contract")}
                onSelect={handleTaskSelect}
              />
              
              {/* Site Map task */}
              <CompanionTaskCard
                title={taskTypes.site_map.label}
                description={taskTypes.site_map.description}
                icon={taskTypes.site_map.icon}
                iconColor={taskTypes.site_map.iconColor}
                task={tasksByType.site_map}
                isGenerating={generateMutation.isPending}
                onGenerate={() => handleGenerate("site_map")}
                onRetry={() => handleRetry("site_map")}
                onSelect={handleTaskSelect}
              />
              
              {/* Status Update task */}
              <CompanionTaskCard
                title={taskTypes.status_update.label}
                description={taskTypes.status_update.description}
                icon={taskTypes.status_update.icon}
                iconColor={taskTypes.status_update.iconColor}
                task={tasksByType.status_update}
                isGenerating={generateMutation.isPending}
                onGenerate={() => handleGenerate("status_update")}
                onRetry={() => handleRetry("status_update")}
                onSelect={handleTaskSelect}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="mt-4">
            {selectedTask ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-gray-100">
                      {taskTypes[selectedTask.type as keyof typeof taskTypes]?.icon}
                    </div>
                    <h3 className="text-lg font-medium">
                      {taskTypes[selectedTask.type as keyof typeof taskTypes]?.label}
                    </h3>
                  </div>
                  <Badge variant="outline">
                    {new Date(selectedTask.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                <Separator />
                
                <div 
                  className="bg-white rounded-md p-4 max-h-[600px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedTask.content || "" }}
                ></div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedTask(null)}>
                    Back to Tasks
                  </Button>
                  <Button onClick={() => {
                    if (selectedTask.content) {
                      navigator.clipboard.writeText(selectedTask.content || "");
                      toast({
                        title: "Content copied",
                        description: "The content has been copied to your clipboard."
                      });
                    }
                  }}>
                    Copy Content
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="bg-gray-50 rounded-md p-8 flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No content selected</h3>
                  <p className="text-gray-500 mt-2 max-w-md">
                    Generate and select a task from the Tasks tab to view its content here.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-sm text-gray-500">
          Powered by AI to save time and help you focus on building great sites
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-transparent">
            <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
            Tasks saved automatically
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}