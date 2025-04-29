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
  ListFilter,
  Calendar,
  FileSearch,
  Layers,
  Settings,
  Sparkles,
  Bot,
  TestTube,
  Wrench,
  LineChart,
  Link,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Client, CompanionTask, statusOptions } from "@shared/schema";
import CompanionTaskCard from "./CompanionTaskCard";
import ScheduleDiscoveryDialog from "./ScheduleDiscoveryDialog";
import ProposalDialog from "./ProposalDialog";
import CompanyAnalysisDialog from "./CompanyAnalysisDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define task type information with project phase categorization
const taskTypes = {
  // Discovery phase tasks
  company_analysis: {
    icon: <FileSearch className="h-5 w-5" />,
    label: "Company Analysis",
    description: "Comprehensive business and website analysis",
    iconColor: "bg-blue-50 text-blue-600",
    phase: "Discovery"
  },
  schedule_discovery: {
    icon: <Calendar className="h-5 w-5" />,
    label: "Schedule Discovery Call",
    description: "Email with booking link and company analysis",
    iconColor: "bg-blue-50 text-blue-600",
    phase: "Discovery"
  },
  proposal: {
    icon: <FileText className="h-5 w-5" />,
    label: "Project Proposal",
    description: "Professional project proposal",
    iconColor: "bg-green-50 text-green-600",
    phase: "Discovery"
  },
  
  // Planning phase tasks
  define_scope: {
    icon: <ListFilter className="h-5 w-5" />,
    label: "Define Project Scope",
    description: "Document project requirements and deliverables",
    iconColor: "bg-purple-50 text-purple-600",
    phase: "Planning"
  },
  contract: {
    icon: <Scroll className="h-5 w-5" />,
    label: "Contract",
    description: "Professional service agreement",
    iconColor: "bg-purple-50 text-purple-600",
    phase: "Planning"
  },
  third_party: {
    icon: <Link className="h-5 w-5" />,
    label: "3rd Party Integrations",
    description: "Plan for CRM, payment gateways, analytics and other tools",
    iconColor: "bg-indigo-50 text-indigo-600",
    phase: "Planning"
  },
  
  // Design and Development phase tasks
  site_map: {
    icon: <FolderTree className="h-5 w-5" />,
    label: "Site Map & Content",
    description: "Site structure and content plan",
    iconColor: "bg-amber-50 text-amber-600",
    phase: "Design and Development"
  },
  ai_site_designer: {
    icon: <Sparkles className="h-5 w-5" />,
    label: "AI Site Designer",
    description: "Generate design mockups and UI components",
    iconColor: "bg-amber-50 text-amber-600",
    phase: "Design and Development"
  },
  ai_qa_tool: {
    icon: <TestTube className="h-5 w-5" />,
    label: "AI QA Tool",
    description: "Automated testing and quality assurance",
    iconColor: "bg-red-50 text-red-600",
    phase: "Design and Development"
  },
  
  // Post Launch Management phase tasks
  status_update: {
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Status Update",
    description: "Client status update email",
    iconColor: "bg-pink-50 text-pink-600",
    phase: "Post Launch Management"
  },
  site_maintenance: {
    icon: <Wrench className="h-5 w-5" />,
    label: "Site Maintenance",
    description: "Regular updates and maintenance tasks",
    iconColor: "bg-green-50 text-green-600",
    phase: "Post Launch Management"
  },
  site_optimizer: {
    icon: <LineChart className="h-5 w-5" />,
    label: "Site Optimizer",
    description: "Performance optimization and SEO enhancements",
    iconColor: "bg-orange-50 text-orange-600",
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
  const [isDiscoveryDialogOpen, setIsDiscoveryDialogOpen] = useState(false);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [isCompanyAnalysisDialogOpen, setIsCompanyAnalysisDialogOpen] = useState(false);
  const [proposalTask, setProposalTask] = useState<CompanionTask | undefined>(undefined);
  const [companyAnalysisTask, setCompanyAnalysisTask] = useState<CompanionTask | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<CompanionTask | null>(null);
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
      
      tasks.forEach(task => {
        if (task.content) {
          newExpandedTasks[task.type] = true;
        }
      });
      
      // Don't auto-select any task by default, just expand them
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
  
  // Create mutation for deleting content
  const deleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest("DELETE", `/api/companion-tasks/${taskId}`);
    },
    onSuccess: () => {
      // Clear selected task if it was deleted
      setSelectedTask(null);
      
      // Invalidate the tasks query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      
      toast({
        title: "Content deleted",
        description: "The content has been deleted successfully.",
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete content. Please try again.",
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
  
  // Handle delete request - open confirmation dialog
  const handleDelete = (task: CompanionTask) => {
    // Store the task to delete
    setTaskToDelete(task);
    
    // If we're deleting a task that's currently open in a dialog, close it
    if (task.type === 'proposal' && proposalTask?.id === task.id) {
      setIsProposalDialogOpen(false);
    } else if (task.type === 'company_analysis' && companyAnalysisTask?.id === task.id) {
      setIsCompanyAnalysisDialogOpen(false);
    } else if (task.type === 'schedule_discovery') {
      setIsDiscoveryDialogOpen(false);
    }
    
    // Open the delete confirmation dialog
    setDeleteDialogOpen(true);
  };
  
  // Handle confirmed deletion
  const confirmDelete = () => {
    if (!taskToDelete) return;
    
    deleteMutation.mutate(taskToDelete.id);
    
    // If this was a proposal task, make sure to reset the proposal task state
    // and close any open dialogs
    if (taskToDelete.type === 'proposal' && proposalTask?.id === taskToDelete.id) {
      setProposalTask(undefined);
      setIsProposalDialogOpen(false);
    } else if (taskToDelete.type === 'company_analysis' && companyAnalysisTask?.id === taskToDelete.id) {
      setCompanyAnalysisTask(undefined);
      setIsCompanyAnalysisDialogOpen(false);
    } else if (taskToDelete.type === 'schedule_discovery') {
      setIsDiscoveryDialogOpen(false);
    }
    
    // Close dialog and reset taskToDelete
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
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
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this content?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The content will be permanently deleted.
              {taskToDelete ? (
                <div className="mt-2 p-2 bg-gray-50 rounded border">
                  <div className="font-medium">
                    {taskTypes[taskToDelete.type as keyof typeof taskTypes]?.label}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Generated on {new Date(taskToDelete.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Discovery call scheduling dialog */}
      <ScheduleDiscoveryDialog 
        open={isDiscoveryDialogOpen}
        onOpenChange={setIsDiscoveryDialogOpen}
        client={client}
      />
      
      {/* Project proposal dialog */}
      <ProposalDialog
        open={isProposalDialogOpen}
        onOpenChange={setIsProposalDialogOpen}
        client={client}
        existingTask={proposalTask}
        onTaskGenerated={(task) => {
          // When a new task is generated, set it as the proposal task and open the dialog
          setTimeout(() => {
            setProposalTask(task);
            setIsProposalDialogOpen(true);
          }, 1000);
        }}
      />
      
      {/* Company analysis dialog */}
      <CompanyAnalysisDialog
        open={isCompanyAnalysisDialogOpen}
        onOpenChange={setIsCompanyAnalysisDialogOpen}
        client={client}
        existingTask={companyAnalysisTask}
        onTaskGenerated={(task) => {
          // When a new task is generated, set it as the company analysis task and open the dialog
          setTimeout(() => {
            setCompanyAnalysisTask(task);
            setIsCompanyAnalysisDialogOpen(true);
          }, 1000);
        }}
      />
      
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
        {selectedTask ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => setSelectedTask(null)}
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Back
                </Button>
                <div className={`p-2 rounded-md ${taskTypes[selectedTask.type as keyof typeof taskTypes]?.iconColor}`}>
                  {taskTypes[selectedTask.type as keyof typeof taskTypes]?.icon}
                </div>
                <div>
                  <h3 className="text-lg font-medium">
                    {taskTypes[selectedTask.type as keyof typeof taskTypes]?.label}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Phase: {taskTypes[selectedTask.type as keyof typeof taskTypes]?.phase} • Generated: {new Date(selectedTask.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(selectedTask)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                
                {selectedTask.type === 'company_analysis' ? (
                  <Button 
                    variant="default" 
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      // Open the schedule discovery dialog when this button is clicked
                      setIsDiscoveryDialogOpen(true);
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                    Send to Client
                  </Button>
                ) : null}
              </div>
            </div>
            
            <Separator />
            
            <div 
              className="bg-white rounded-md p-4 max-h-[600px] overflow-y-auto border"
              dangerouslySetInnerHTML={{ __html: selectedTask.content || "" }}
            ></div>
          </div>
        ) : (
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Tasks by Phase</TabsTrigger>
              <TabsTrigger value="content">Generated Content</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="mt-4">
              <div className="space-y-6">
                {/* Phase filter pills */}
                <div className="flex flex-wrap gap-2 pb-2 border-b mb-6">
                  <Button 
                    variant={selectedPhase === null ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setSelectedPhase(null)}
                  >
                    All Tools
                  </Button>
                  
                  {projectPhases.map(phase => {
                    const isCurrentPhase = client.status === phase;
                    const isSelected = selectedPhase === phase;
                    
                    return (
                      <Button 
                        key={phase}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`rounded-full ${isCurrentPhase ? "border-green-200" : ""}`}
                        onClick={() => setSelectedPhase(phase)}
                      >
                        {phase}
                        {isCurrentPhase && <div className="ml-1 w-2 h-2 rounded-full bg-green-500" />}
                      </Button>
                    );
                  })}
                </div>
                
                {/* Display tasks from selected phase or all phases */}
                {(selectedPhase ? [selectedPhase] : projectPhases).map(phase => {
                  const phaseTasks = tasksByPhase[phase] || [];
                  
                  if (phaseTasks.length === 0) return null;
                  
                  const isCurrentPhase = client.status === phase;
                  
                  return (
                    <div key={phase} className="mb-8">
                      <div className="flex items-center mb-4">
                        <h3 className="text-xl font-medium flex items-center gap-2">
                          {phase}
                          {isCurrentPhase && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Current Phase
                            </Badge>
                          )}
                        </h3>
                        <div className="ml-auto h-2 w-24 bg-gray-100 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(100, Math.max(0, phaseTasks.filter(({task}) => task?.content).length / phaseTasks.length * 100))}%` }} 
                          />
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {phaseTasks.filter(({task}) => task?.content).length}/{phaseTasks.length} Complete
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {phaseTasks.map(({ type, task }) => {
                          const taskInfo = taskTypes[type as keyof typeof taskTypes];
                          return (
                            <Card key={type} className="overflow-hidden">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex items-start">
                                  <div className={`p-2 rounded-md ${taskInfo.iconColor} mr-3`}>
                                    {taskInfo.icon}
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-base">{taskInfo.label}</CardTitle>
                                    <CardDescription className="text-xs line-clamp-2">
                                      {taskInfo.description}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <div className="flex justify-end gap-2 mt-3">
                                  <Button 
                                    className="w-full" 
                                    onClick={() => {
                                      if (type === 'schedule_discovery') {
                                        setIsDiscoveryDialogOpen(true);
                                      } else if (type === 'proposal') {
                                        // Open proposal dialog with existing task if available
                                        setProposalTask(task);
                                        setIsProposalDialogOpen(true);
                                      } else if (type === 'company_analysis') {
                                        // Open company analysis dialog with existing task if available
                                        setCompanyAnalysisTask(task);
                                        setIsCompanyAnalysisDialogOpen(true);
                                      } else if (task?.content) {
                                        handleTaskSelect(task);
                                      } else {
                                        handleGenerate(type);
                                      }
                                    }}
                                    disabled={generateMutation.isPending}
                                  >
                                    {type === 'schedule_discovery' 
                                      ? 'Schedule Call'
                                      : type === 'proposal' && task?.content
                                        ? 'Edit Proposal'
                                      : type === 'company_analysis' && task?.content
                                        ? 'View Analysis'
                                      : task?.content 
                                        ? 'View Content' 
                                        : 'Generate'}
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {selectedPhase && tasksByPhase[selectedPhase]?.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="bg-gray-50 rounded-md p-6 flex flex-col items-center">
                      <AlertCircle className="h-10 w-10 text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-700">No tasks in this phase</h3>
                      <p className="text-gray-500 mt-2 max-w-md">
                        There are no tasks available for the {selectedPhase} phase.
                      </p>
                    </div>
                  </div>
                )}
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
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => task && handleDelete(task)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Delete
                                  </Button>
                                  

                                  <Button 
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (type === 'schedule_discovery') {
                                        setIsDiscoveryDialogOpen(true);
                                      } else if (type === 'proposal' && task) {
                                        setProposalTask(task);
                                        setIsProposalDialogOpen(true);
                                      } else if (type === 'company_analysis' && task) {
                                        setCompanyAnalysisTask(task);
                                        setIsCompanyAnalysisDialogOpen(true);
                                      } else if (task) {
                                        setSelectedTask(task);
                                      }
                                    }}
                                  >
                                    {type === 'schedule_discovery' 
                                      ? 'Schedule' 
                                      : type === 'proposal' 
                                        ? 'Edit Proposal' 
                                        : type === 'company_analysis' 
                                          ? 'View Analysis' 
                                          : 'View'}
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            

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
        )}
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