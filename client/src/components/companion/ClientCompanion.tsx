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
  Trash2,
  Clock,
  Timer
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

// Define task type information with project phase categorization and time savings
const taskTypes = {
  // Discovery phase tasks
  company_analysis: {
    icon: <FileSearch className="h-5 w-5" />,
    label: "Company Analysis",
    description: "Comprehensive business and website analysis",
    iconColor: "bg-blue-50 text-blue-600",
    phase: "Discovery",
    timeSaved: 180 // Time saved in minutes (3 hours)
  },
  schedule_discovery: {
    icon: <Calendar className="h-5 w-5" />,
    label: "Schedule Discovery Call",
    description: "Email with booking link and company analysis",
    iconColor: "bg-blue-50 text-blue-600",
    phase: "Discovery",
    timeSaved: 45 // Time saved in minutes (45 min)
  },
  proposal: {
    icon: <FileText className="h-5 w-5" />,
    label: "Project Proposal",
    description: "Professional project proposal",
    iconColor: "bg-green-50 text-green-600",
    phase: "Discovery",
    timeSaved: 240 // Time saved in minutes (4 hours)
  },
  
  // Planning phase tasks
  define_scope: {
    icon: <ListFilter className="h-5 w-5" />,
    label: "Define Project Scope",
    description: "Document project requirements and deliverables",
    iconColor: "bg-purple-50 text-purple-600",
    phase: "Planning",
    timeSaved: 120 // Time saved in minutes (2 hours)
  },
  contract: {
    icon: <Scroll className="h-5 w-5" />,
    label: "Contract",
    description: "Professional service agreement",
    iconColor: "bg-purple-50 text-purple-600",
    phase: "Planning",
    timeSaved: 90 // Time saved in minutes (1.5 hours)
  },
  third_party: {
    icon: <Link className="h-5 w-5" />,
    label: "3rd Party Integrations",
    description: "Plan for CRM, payment gateways, analytics and other tools",
    iconColor: "bg-indigo-50 text-indigo-600",
    phase: "Planning",
    timeSaved: 60 // Time saved in minutes (1 hour)
  },
  
  // Design and Development phase tasks
  site_map: {
    icon: <FolderTree className="h-5 w-5" />,
    label: "Site Map & Content",
    description: "Site structure and content plan",
    iconColor: "bg-amber-50 text-amber-600",
    phase: "Design and Development",
    timeSaved: 150 // Time saved in minutes (2.5 hours)
  },
  ai_site_designer: {
    icon: <Sparkles className="h-5 w-5" />,
    label: "AI Site Designer",
    description: "Generate design mockups and UI components",
    iconColor: "bg-amber-50 text-amber-600",
    phase: "Design and Development",
    timeSaved: 300 // Time saved in minutes (5 hours)
  },
  ai_qa_tool: {
    icon: <TestTube className="h-5 w-5" />,
    label: "AI QA Tool",
    description: "Automated testing and quality assurance",
    iconColor: "bg-red-50 text-red-600",
    phase: "Design and Development",
    timeSaved: 180 // Time saved in minutes (3 hours)
  },
  
  // Post Launch Management phase tasks
  status_update: {
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Status Update",
    description: "Client status update email",
    iconColor: "bg-pink-50 text-pink-600",
    phase: "Post Launch Management",
    timeSaved: 60 // Time saved in minutes (1 hour)
  },
  site_maintenance: {
    icon: <Wrench className="h-5 w-5" />,
    label: "Site Maintenance",
    description: "Regular updates and maintenance tasks",
    iconColor: "bg-green-50 text-green-600",
    phase: "Post Launch Management",
    timeSaved: 120 // Time saved in minutes (2 hours)
  },
  site_optimizer: {
    icon: <LineChart className="h-5 w-5" />,
    label: "Site Optimizer",
    description: "Performance optimization and SEO enhancements",
    iconColor: "bg-orange-50 text-orange-600",
    phase: "Post Launch Management",
    timeSaved: 240 // Time saved in minutes (4 hours)
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

// Helper function to format time saved in a human-readable format
const formatTimeSaved = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
};

// Calculate total time saved across all completed tasks
const calculateTotalTimeSaved = (tasks: CompanionTask[] | undefined): number => {
  if (!tasks) return 0;
  
  return tasks
    .filter(task => task.content) // Only count completed tasks
    .reduce((total, task) => {
      // Get the time saved for this task type
      const timeSaved = taskTypes[task.type as keyof typeof taskTypes]?.timeSaved || 0;
      return total + timeSaved;
    }, 0);
};

interface ClientCompanionProps {
  client: Client;
  tasks?: CompanionTask[];
}

export default function ClientCompanion({ client, tasks }: ClientCompanionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for task management and UI
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<CompanionTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<CompanionTask | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDiscoveryDialogOpen, setIsDiscoveryDialogOpen] = useState(false);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [proposalTask, setProposalTask] = useState<CompanionTask | null>(null);
  const [isCompanyAnalysisDialogOpen, setIsCompanyAnalysisDialogOpen] = useState(false);
  const [companyAnalysisTask, setCompanyAnalysisTask] = useState<CompanionTask | null>(null);
  
  // Generation states
  const [generatingTasks, setGeneratingTasks] = useState<Record<string, boolean>>({});
  const [generationProgress, setGenerationProgress] = useState<Record<string, number>>({});
  const [generationStage, setGenerationStage] = useState<Record<string, string>>({});

  // Group tasks by phase for organization
  const tasksByPhase = tasks ? tasks.reduce((acc, task) => {
    const taskType = task.type;
    const phase = taskTypes[taskType as keyof typeof taskTypes]?.phase;
    
    if (phase) {
      if (!acc[phase]) {
        acc[phase] = [];
      }
      
      // Add task to the phase
      acc[phase].push({ task, type: taskType });
    }
    
    return acc;
  }, {} as Record<string, { task: CompanionTask, type: string }[]>) : {};
  
  // Group tasks by type for content library
  const tasksByType = tasks ? tasks.reduce((acc, task) => {
    acc[task.type] = task;
    return acc;
  }, {} as Record<string, CompanionTask>) : {};
  
  // Mutation for deleting tasks
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/companion-tasks/${id}`, 'DELETE');
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      toast({
        title: "Task Deleted",
        description: "The task has been permanently deleted.",
      });
      setTaskToDelete(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete task: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for creating new tasks
  const createTaskMutation = useMutation({
    mutationFn: async ({ type, metadata }: { type: string, metadata?: any }) => {
      const response = await apiRequest(`/api/clients/${client.id}/generate/${type}`, 'POST', metadata || {});
      
      return response as unknown as CompanionTask;
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      
      // Clear the generating state for this task type
      setGeneratingTasks(prev => ({ ...prev, [newTask.type]: false }));
      setGenerationProgress(prev => ({ ...prev, [newTask.type]: 0 }));
      
      toast({
        title: "Content Generated",
        description: `The ${taskTypes[newTask.type as keyof typeof taskTypes]?.label} has been created.`,
      });
      
      // If it's a company analysis, open the dialog to view it
      if (newTask.type === 'company_analysis') {
        setCompanyAnalysisTask(newTask);
        setIsCompanyAnalysisDialogOpen(true);
      }
      
      // If it's a proposal, open the dialog to view it
      if (newTask.type === 'proposal') {
        setProposalTask(newTask);
        setIsProposalDialogOpen(true);
      }
    },
    onError: (error: Error) => {
      // Clear generating state for all tasks on error
      setGeneratingTasks({});
      setGenerationProgress({});
      
      toast({
        title: "Error",
        description: `Failed to generate content: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle task generation
  const handleGenerate = (type: string, metadata?: any) => {
    // Prevent duplicate generation
    if (generatingTasks[type]) return;
    
    // Set the task as generating
    setGeneratingTasks(prev => ({ ...prev, [type]: true }));
    
    // Simulate progress updates - in production this could be real-time via websockets
    // Start with researching (0-30%)
    setGenerationProgress(prev => ({ ...prev, [type]: 0 }));
    setGenerationStage(prev => ({ ...prev, [type]: "Researching..." }));
    
    const researchInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const current = prev[type] || 0;
        if (current < 30) {
          return { ...prev, [type]: current + 2 };
        } else {
          clearInterval(researchInterval);
          return prev;
        }
      });
    }, 100);
    
    // After 3s, move to analyzing (30-60%)
    setTimeout(() => {
      setGenerationStage(prev => ({ ...prev, [type]: "Analyzing data..." }));
      const analyzeInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const current = prev[type] || 0;
          if (current >= 30 && current < 60) {
            return { ...prev, [type]: current + 2 };
          } else {
            clearInterval(analyzeInterval);
            return prev;
          }
        });
      }, 100);
    }, 3000);
    
    // After 6s, move to generating content (60-95%)
    setTimeout(() => {
      setGenerationStage(prev => ({ ...prev, [type]: "Generating content..." }));
      const contentInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const current = prev[type] || 0;
          if (current >= 60 && current < 95) {
            return { ...prev, [type]: current + 1 };
          } else {
            clearInterval(contentInterval);
            return prev;
          }
        });
      }, 100);
    }, 6000);
    
    // After 9s, do the actual generation
    setTimeout(() => {
      setGenerationStage(prev => ({ ...prev, [type]: "Finalizing..." }));
      createTaskMutation.mutate({ type, metadata });
    }, 9000);
  };
  
  // Handler for deleting tasks
  const handleDelete = (task: CompanionTask) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };
  
  // Handler for task selection
  const handleTaskSelect = (task: CompanionTask) => {
    setSelectedTask(task);
  };
  
  // Confirm deletion of a task
  const confirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id);
    }
  };
  
  return (
    <Card className="w-full overflow-hidden shadow-sm">
      <CardHeader className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-md">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Client Companion</CardTitle>
            <CardDescription>
              AI-powered tools to help you manage your client projects more efficiently
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {tasks === undefined ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="tasks" className="w-full px-6 pt-4">
            <div className="border-b mb-4">
              <TabsList className="bg-transparent p-0 h-auto gap-6">
                <TabsTrigger 
                  value="tasks" 
                  className="px-0 py-3 rounded-none text-base font-medium text-gray-600 data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:shadow-none bg-transparent"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Tasks by Phase
                </TabsTrigger>
                <TabsTrigger 
                  value="content" 
                  className="px-0 py-3 rounded-none text-base font-medium text-gray-600 data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:shadow-none bg-transparent"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generated Content
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="tasks" className="mt-4">
              <div className="space-y-6">
                {/* Phase filter pills */}
                <div className="flex flex-wrap gap-3 pb-4 mb-6 border-b">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex h-8 items-center px-3 text-sm font-medium text-gray-500">Filter by:</div>
                    <Button 
                      variant={selectedPhase === null ? "default" : "outline"}
                      size="sm"
                      className="rounded-full shadow-sm flex items-center gap-1.5 px-4 h-8 text-sm"
                      onClick={() => setSelectedPhase(null)}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      All Tools
                    </Button>
                    
                    {projectPhases.map(phase => {
                      const isCurrentPhase = client.status === phase;
                      const isSelected = selectedPhase === phase;
                      
                      let phaseIcon;
                      if (phase === "Discovery") phaseIcon = <FileSearch className="h-3.5 w-3.5" />;
                      else if (phase === "Planning") phaseIcon = <ListFilter className="h-3.5 w-3.5" />;
                      else if (phase === "Design and Development") phaseIcon = <FolderTree className="h-3.5 w-3.5" />;
                      else if (phase === "Post Launch Management") phaseIcon = <Settings className="h-3.5 w-3.5" />;
                      
                      return (
                        <Button 
                          key={phase}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`rounded-full shadow-sm flex items-center gap-1.5 px-4 h-8 text-sm
                            ${isCurrentPhase ? "border-green-200" : ""}`}
                          onClick={() => setSelectedPhase(phase)}
                        >
                          {phaseIcon}
                          {phase}
                          {isCurrentPhase && (
                            <span className="ml-1 relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
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
                            <Card 
                              key={type} 
                              className={`overflow-hidden shadow-sm transition-all duration-300 ease-in-out
                                ${task?.content 
                                  ? "border-green-200 ring-1 ring-green-100 hover:shadow-md hover:shadow-green-50/50" 
                                  : "border-gray-200 hover:border-gray-300 hover:shadow-md hover:transform hover:-translate-y-1"}`}
                            >
                              <CardHeader className={`p-4 pb-2 ${task?.content ? "bg-green-50" : ""}`}>
                                <div className="flex items-start">
                                  <div className={`p-2.5 rounded-md ${task?.content ? "bg-green-100 text-green-700" : taskInfo.iconColor} mr-3 relative`}>
                                    {taskInfo.icon}
                                    {task?.content && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                        <Check className="h-3 w-3 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start w-full">
                                      <CardTitle className="text-base flex items-center gap-2">
                                        {taskInfo.label}
                                        {task?.content && (
                                          <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-sm">Completed</span>
                                        )}
                                      </CardTitle>
                                      {task?.content && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {formatTimeSaved(taskInfo.timeSaved)} saved
                                        </Badge>
                                      )}
                                    </div>
                                    <CardDescription className="text-xs line-clamp-2 mt-1 text-gray-600">
                                      {taskInfo.description}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <div className="flex flex-col gap-2 mt-3">
                                  {/* Loading state with progress */}
                                  {generatingTasks[type] && (
                                    <div className="space-y-2 p-3 border rounded-md bg-white">
                                      <div className="text-sm font-medium text-center text-primary">
                                        {generationStage[type] || "Generating..."}
                                      </div>
                                      
                                      <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div 
                                          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out" 
                                          style={{ 
                                            width: `${generationProgress[type] || 0}%` 
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>Research</span>
                                        <span>Analysis</span>
                                        <span>Completion</span>
                                      </div>
                                      
                                      <p className="text-xs text-center text-gray-600 mt-1">
                                        {/* Type-specific loading messages */}
                                        {type === 'company_analysis' 
                                          ? "Analyzing business data and website performance..."
                                          : type === 'proposal'
                                            ? "Creating proposal with pricing recommendations..."
                                            : "Generating content, please wait..."}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Button - only show if not currently generating */}
                                  {!generatingTasks[type] && (
                                    <Button 
                                      className={`w-full shadow-sm transition-all duration-300 ${
                                        task?.content 
                                          ? "bg-green-600 hover:bg-green-700 hover:shadow" 
                                          : "hover:border-gray-400 hover:shadow"
                                      }`}
                                      variant={task?.content ? "default" : "outline"}
                                      onClick={() => {
                                        if (type === 'schedule_discovery') {
                                          setIsDiscoveryDialogOpen(true);
                                        } else if (type === 'proposal') {
                                          if (task?.content) {
                                            // Open existing proposal in the dialog
                                            setProposalTask(task);
                                            setIsProposalDialogOpen(true);
                                          } else {
                                            // For new proposals, always show the dialog to collect notes first
                                            setIsProposalDialogOpen(true);
                                          }
                                        } else if (type === 'company_analysis' && task?.content) {
                                          // Open company analysis dialog only for existing tasks
                                          setCompanyAnalysisTask(task);
                                          setIsCompanyAnalysisDialogOpen(true);
                                        } else if (task?.content) {
                                          // View any other type of content
                                          handleTaskSelect(task);
                                        } else if (type === 'company_analysis') {
                                          // Generate company analysis with in-card loading
                                          handleGenerate(type);
                                        } else {
                                          // Generate other content types with in-card loading
                                          handleGenerate(type);
                                        }
                                      }}
                                      disabled={Object.keys(generatingTasks).length > 0}
                                    >
                                      {task?.content && (
                                        <CheckCircle className="h-4 w-4 mr-2 text-white" />
                                      )}
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
                                  )}
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
                          <Card 
                            key={type} 
                            className="overflow-hidden shadow-sm border border-gray-200 transition-all duration-300 ease-in-out hover:shadow-md hover:transform hover:-translate-y-1"
                          >
                            <CardHeader className="bg-white p-4 border-b border-gray-100">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2.5 rounded-md ${taskInfo?.iconColor} relative`}>
                                    {taskInfo?.icon}
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  </div>
                                  <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                      {taskInfo?.label}
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium text-xs">
                                        Completed
                                      </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                      Phase: <span className="font-medium">{taskInfo?.phase}</span> • Generated: {new Date(task!.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10 border-gray-200 shadow-sm transition-all duration-300 hover:shadow"
                                    onClick={() => task && handleDelete(task)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Delete
                                  </Button>
                                  
                                  <Button 
                                    variant="default"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 shadow-sm transition-all duration-300 hover:shadow"
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
                                      ? <><Calendar className="h-3.5 w-3.5 mr-1" /> Schedule</> 
                                      : type === 'proposal' 
                                        ? <><FileText className="h-3.5 w-3.5 mr-1" /> Edit Proposal</> 
                                        : type === 'company_analysis' 
                                          ? <><FileSearch className="h-3.5 w-3.5 mr-1" /> View Analysis</> 
                                          : <><FileText className="h-3.5 w-3.5 mr-1" /> View</>}
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
                    <div className="bg-white rounded-lg p-8 flex flex-col items-center border border-gray-200 shadow-sm">
                      <div className="bg-gray-50 p-6 rounded-full mb-6">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-700 mb-2">No content generated yet</h3>
                      <p className="text-gray-500 mt-2 max-w-md">
                        Generate content using the tools in the Tasks tab to build your content library.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-6 shadow-sm hover:shadow"
                        onClick={() => {
                          const tasksTab = document.querySelector('[data-value="tasks"]') as HTMLElement;
                          if (tasksTab) tasksTab.click();
                        }}
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        Go to Tasks
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4 pb-4 flex justify-between items-center bg-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-full">
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Powered by AI to save time and help you focus on building great sites
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50 border-green-100 text-green-700 flex items-center gap-1 shadow-sm">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Tasks saved automatically
          </Badge>
          {tasks && calculateTotalTimeSaved(tasks) > 0 && (
            <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-700 flex items-center gap-1 shadow-sm">
              <Timer className="h-3 w-3 text-blue-500" />
              {formatTimeSaved(calculateTotalTimeSaved(tasks))} saved total
            </Badge>
          )}
        </div>
      </CardFooter>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
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
          // Check if this is a new task request (dummy task with no content)
          if (!task.content && task.type === 'proposal') {
            // Check if there are discovery notes in the metadata
            if (task.metadata) {
              try {
                // Try to parse discovery notes from metadata
                const metadata = JSON.parse(task.metadata);
                if (metadata.discoveryNotes) {
                  // Start in-card loading with discovery notes
                  handleGenerate('proposal', { discoveryNotes: metadata.discoveryNotes });
                  return;
                }
              } catch (e) {
                console.error("Error parsing metadata", e);
              }
            }
            
            // If no discovery notes or parsing failed, just generate without notes
            handleGenerate('proposal');
          }
        }}
      />
      
      {/* Company analysis dialog */}
      <CompanyAnalysisDialog
        open={isCompanyAnalysisDialogOpen}
        onOpenChange={setIsCompanyAnalysisDialogOpen}
        client={client}
        task={companyAnalysisTask}
      />
      
      {/* Task content viewer */}
      {selectedTask && (
        <CompanionTaskCard 
          task={selectedTask} 
          client={client}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </Card>
  );
}