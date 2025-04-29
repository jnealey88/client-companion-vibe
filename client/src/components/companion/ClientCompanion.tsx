import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Check, 
  Scroll, 
  FolderTree, 
  MessageCircle,
  RotateCw,
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

// Define task type icons
const taskTypeIcons = {
  market_research: <FileText className="h-5 w-5" />,
  proposal: <Check className="h-5 w-5" />,
  contract: <Scroll className="h-5 w-5" />,
  site_map: <FolderTree className="h-5 w-5" />,
  status_update: <MessageCircle className="h-5 w-5" />
};

// Define task type labels
const taskTypeLabels = {
  market_research: "Market Research",
  proposal: "Project Proposal",
  contract: "Contract",
  site_map: "Site Map & Content",
  status_update: "Status Update"
};

// Define task status badge variants
const statusVariants = {
  pending: "secondary",
  in_progress: "warning",
  completed: "success"
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
      return apiRequest(`/api/clients/${clientId}/generate/${taskType}`, "POST");
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
              {/* Market Research task */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-blue-50 text-blue-600">
                    {taskTypeIcons.market_research}
                  </div>
                  <div>
                    <h4 className="font-medium">{taskTypeLabels.market_research}</h4>
                    <p className="text-sm text-gray-500">Industry insights and market analysis</p>
                  </div>
                </div>
                
                {tasksByType.market_research ? (
                  <>
                    <Badge variant={statusVariants[tasksByType.market_research.status as keyof typeof statusVariants]}>
                      {tasksByType.market_research.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleTaskSelect(tasksByType.market_research!)}
                      disabled={tasksByType.market_research.status !== "completed"}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={generateMutation.isPending}
                    onClick={() => handleGenerate("market_research")}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                )}
              </div>
              
              {/* Proposal task */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-50 text-green-600">
                    {taskTypeIcons.proposal}
                  </div>
                  <div>
                    <h4 className="font-medium">{taskTypeLabels.proposal}</h4>
                    <p className="text-sm text-gray-500">Professional project proposal</p>
                  </div>
                </div>
                
                {tasksByType.proposal ? (
                  <>
                    <Badge variant={statusVariants[tasksByType.proposal.status as keyof typeof statusVariants]}>
                      {tasksByType.proposal.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleTaskSelect(tasksByType.proposal!)}
                      disabled={tasksByType.proposal.status !== "completed"}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={generateMutation.isPending}
                    onClick={() => handleGenerate("proposal")}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                )}
              </div>
              
              {/* Contract task */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-purple-50 text-purple-600">
                    {taskTypeIcons.contract}
                  </div>
                  <div>
                    <h4 className="font-medium">{taskTypeLabels.contract}</h4>
                    <p className="text-sm text-gray-500">Professional service agreement</p>
                  </div>
                </div>
                
                {tasksByType.contract ? (
                  <>
                    <Badge variant={statusVariants[tasksByType.contract.status as keyof typeof statusVariants]}>
                      {tasksByType.contract.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleTaskSelect(tasksByType.contract!)}
                      disabled={tasksByType.contract.status !== "completed"}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={generateMutation.isPending}
                    onClick={() => handleGenerate("contract")}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                )}
              </div>
              
              {/* Site Map task */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-50 text-amber-600">
                    {taskTypeIcons.site_map}
                  </div>
                  <div>
                    <h4 className="font-medium">{taskTypeLabels.site_map}</h4>
                    <p className="text-sm text-gray-500">Site structure and content plan</p>
                  </div>
                </div>
                
                {tasksByType.site_map ? (
                  <>
                    <Badge variant={statusVariants[tasksByType.site_map.status as keyof typeof statusVariants]}>
                      {tasksByType.site_map.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleTaskSelect(tasksByType.site_map!)}
                      disabled={tasksByType.site_map.status !== "completed"}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={generateMutation.isPending}
                    onClick={() => handleGenerate("site_map")}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                )}
              </div>
              
              {/* Status Update task */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-pink-50 text-pink-600">
                    {taskTypeIcons.status_update}
                  </div>
                  <div>
                    <h4 className="font-medium">{taskTypeLabels.status_update}</h4>
                    <p className="text-sm text-gray-500">Client status update email</p>
                  </div>
                </div>
                
                {tasksByType.status_update ? (
                  <>
                    <Badge variant={statusVariants[tasksByType.status_update.status as keyof typeof statusVariants]}>
                      {tasksByType.status_update.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleTaskSelect(tasksByType.status_update!)}
                      disabled={tasksByType.status_update.status !== "completed"}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={generateMutation.isPending}
                    onClick={() => handleGenerate("status_update")}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="mt-4">
            {selectedTask ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-gray-100">
                      {taskTypeIcons[selectedTask.type as keyof typeof taskTypeIcons]}
                    </div>
                    <h3 className="text-lg font-medium">
                      {taskTypeLabels[selectedTask.type as keyof typeof taskTypeLabels]}
                    </h3>
                  </div>
                  <Badge variant="outline">
                    {new Date(selectedTask.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="bg-gray-50 rounded-md p-4 whitespace-pre-line max-h-[500px] overflow-y-auto">
                  {selectedTask.content}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedTask(null)}>
                    Back to Tasks
                  </Button>
                  <Button onClick={() => {
                    if (selectedTask.content) {
                      navigator.clipboard.writeText(selectedTask.content);
                      toast({
                        title: "Content copied",
                        description: "The content has been copied to your clipboard.",
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