import { useState, useEffect } from "react";
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
  ArrowRight,
  ListFilter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Client, CompanionTask, statusOptions } from "@shared/schema";
import CompanionTaskCard from "./CompanionTaskCard";

// Define task type information with project phase categorization
const taskTypes = {
  company_analysis: {
    icon: <FileText className="h-5 w-5" />,
    label: "Company Analysis",
    description: "Comprehensive business and website analysis",
    iconColor: "bg-blue-50 text-blue-600",
    phase: "Discovery"
  },
  proposal: {
    icon: <Check className="h-5 w-5" />,
    label: "Project Proposal",
    description: "Professional project proposal",
    iconColor: "bg-green-50 text-green-600",
    phase: "Discovery"
  },
  contract: {
    icon: <Scroll className="h-5 w-5" />,
    label: "Contract",
    description: "Professional service agreement",
    iconColor: "bg-purple-50 text-purple-600",
    phase: "Planning"
  },
  site_map: {
    icon: <FolderTree className="h-5 w-5" />,
    label: "Site Map & Content",
    description: "Site structure and content plan",
    iconColor: "bg-amber-50 text-amber-600",
    phase: "Design and Development"
  },
  status_update: {
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Status Update",
    description: "Client status update email",
    iconColor: "bg-pink-50 text-pink-600",
    phase: "Post Launch Management"
  }
};

// Filter out "All Status" from the status options
const projectPhases = statusOptions.filter(status => status !== "All Status");

// Helper function for status badge styling
const getPhaseStatusClass = (status: string): string => {
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case 'discovery':
      return 'bg-blue-100 text-blue-800';
    case 'planning':
      return 'bg-purple-100 text-purple-800';
    case 'design and development':
      return 'bg-amber-100 text-amber-800';
    case 'post launch management':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface ClientCompanionProps {
  client: Client;
}

export default function ClientCompanion({ client }: ClientCompanionProps) {
  const [selectedTask, setSelectedTask] = useState<CompanionTask | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch companion tasks for the client
  const { data: tasks, isLoading } = useQuery<CompanionTask[]>({
    queryKey: [`/api/clients/${client.id}/companion-tasks`],
    enabled: !!client.id
  });
  
  // Initialize expanded task view when data is loaded
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      // Initialize all completed tasks as expanded
      const newExpandedTasks: Record<string, boolean> = {};
      let lastTaskWithContent: CompanionTask | null = null;
      
      tasks.forEach(task => {
        if (task.content) {
          newExpandedTasks[task.type] = true;
          lastTaskWithContent = task; // Track the most recent task with content
        }
      });
      
      // Set the last task with content as selected for viewing
      if (lastTaskWithContent) {
        setSelectedTask(lastTaskWithContent);
      }
      
      setExpandedTasks(newExpandedTasks);
    }
  }, [tasks]);
  
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
  
  // Group tasks by project phase
  const tasksByPhase: Record<string, { type: string, task: CompanionTask | undefined }[]> = {};
  
  // Initialize all phases
  projectPhases.forEach(phase => {
    tasksByPhase[phase] = [];
  });
  
  // Group tasks by their respective phases
  Object.entries(taskTypes).forEach(([type, info]) => {
    const phase = info.phase;
    if (phase && tasksByPhase[phase]) {
      tasksByPhase[phase].push({
        type,
        task: tasksByType[type]
      });
    }
  });
  
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <span>Client Companion</span>
              <Badge variant="outline" className="ml-2">AI Assistant</Badge>
            </CardTitle>
            <CardDescription>
              AI-powered workflow assistant that helps you manage client projects efficiently
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Current phase:</span>
            <Badge className={getPhaseStatusClass(client.status)}>{client.status}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Generated Content</TabsTrigger>
            <TabsTrigger value="tasks">Tasks by Phase</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="mt-4">
            <div className="space-y-6">
              {/* Render tasks by project phase */}
              {projectPhases.map(phase => {
                const phaseTasks = tasksByPhase[phase] || [];
                
                if (phaseTasks.length === 0) return null;
                
                const isCurrentPhase = client.status === phase;
                
                return (
                  <div key={phase} className="mb-6">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium">
                        {phase}
                      </h3>
                      {isCurrentPhase && (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {phaseTasks.map(({ type, task }) => (
                        <CompanionTaskCard
                          key={type}
                          title={taskTypes[type as keyof typeof taskTypes].label}
                          description={taskTypes[type as keyof typeof taskTypes].description}
                          icon={taskTypes[type as keyof typeof taskTypes].icon}
                          iconColor={taskTypes[type as keyof typeof taskTypes].iconColor}
                          task={task}
                          isGenerating={generateMutation.isPending}
                          onGenerate={() => handleGenerate(type)}
                          onRetry={() => handleRetry(type)}
                          onSelect={handleTaskSelect}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="mt-4">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Generated Content Library</h3>
                <Badge variant="outline" className="bg-transparent">
                  {tasks?.filter(task => task.content).length || 0} items
                </Badge>
              </div>
              
              {tasks && tasks.filter(task => task.content).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(tasksByType)
                    .filter(([_, task]) => task?.content)
                    .map(([type, task]) => {
                      const taskInfo = taskTypes[type as keyof typeof taskTypes];
                      
                      return (
                        <Card key={type} className="overflow-hidden">
                          <CardHeader className="bg-gray-50 p-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-md ${taskInfo?.iconColor}`}>
                                  {taskInfo?.icon}
                                </div>
                                <div>
                                  <CardTitle className="text-base">{taskInfo?.label}</CardTitle>
                                  <CardDescription className="text-xs">
                                    Phase: {taskInfo?.phase} • Generated: {new Date(task!.createdAt).toLocaleDateString()}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => {
                                  if (task?.content) {
                                    navigator.clipboard.writeText(task.content);
                                    toast({
                                      title: "Content copied",
                                      description: "The content has been copied to your clipboard."
                                    });
                                  }
                                }}>
                                  Copy
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedTask(selectedTask === task ? null : task!)}
                                >
                                  {selectedTask === task ? 'Hide' : 'View'} 
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="p-4 border-t">
                            <div 
                              className="bg-white rounded-md p-2 max-h-[400px] overflow-y-auto"
                              dangerouslySetInnerHTML={{ __html: task!.content || "" }}
                            ></div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="bg-gray-50 rounded-md p-8 flex flex-col items-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">No content generated yet</h3>
                    <p className="text-gray-500 mt-2 max-w-md">
                      Generate content using the tasks in the Tasks tab to build your content library.
                    </p>
                  </div>
                </div>
              )}
            </div>
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