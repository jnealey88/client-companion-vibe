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
  Timer,
  FileCheck,
  FileX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      const taskType = task.type as keyof typeof taskTypes;
      const timeSaved = taskTypes[taskType]?.timeSaved || 0;
      return total + timeSaved;
    }, 0);
};

interface ClientCompanionProps {
  client: Client;
}

export default function ClientCompanion({ client }: ClientCompanionProps) {
  const [selectedTask, setSelectedTask] = useState<CompanionTask | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [isDiscoveryDialogOpen, setIsDiscoveryDialogOpen] = useState(false);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [isCompanyAnalysisDialogOpen, setIsCompanyAnalysisDialogOpen] = useState(false);
  const [proposalTask, setProposalTask] = useState<CompanionTask | undefined>(undefined);
  const [companyAnalysisTask, setCompanyAnalysisTask] = useState<CompanionTask | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<CompanionTask | null>(null);
  const [generationLocks, setGenerationLocks] = useState<Record<string, boolean>>({});
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
  
  // State to track which task types are currently generating
  const [generatingTasks, setGeneratingTasks] = useState<Record<string, boolean>>({});
  
  // Loading states for task generation
  const [generationProgress, setGenerationProgress] = useState<Record<string, number>>({});
  const [generationStage, setGenerationStage] = useState<Record<string, string>>({});
  
  // Task generation loading stages - each with unique messaging
  const loadingStages: Record<string, string[]> = {
    company_analysis: [
      "Analyzing business information...",
      "Researching industry competitors...",
      "Evaluating target audience data...",
      "Examining SEO and keyword positioning...",
      "Checking website performance metrics...",
      "Analyzing user experience elements...",
      "Creating industry benchmarks...",
      "Identifying business opportunities...",
      "Crafting strategic recommendations...",
      "Finalizing comprehensive analysis..."
    ],
    proposal: [
      "Gathering project requirements...",
      "Evaluating technical needs...",
      "Calculating optimal pricing...",
      "Researching industry benchmarks...",
      "Identifying recommended GoDaddy products...",
      "Calculating hosting requirements...",
      "Estimating development timeline...",
      "Preparing proposal document...",
      "Adding payment options...",
      "Finalizing proposal with recommendations..."
    ],
    site_map: [
      "Analyzing website structure needs...",
      "Evaluating user journey patterns...",
      "Mapping content hierarchies...",
      "Optimizing navigation flows...",
      "Creating sitemap structure...",
      "Finalizing recommendations..."
    ],
    contract: [
      "Reviewing project details...",
      "Creating legal framework...",
      "Adding payment milestones...",
      "Specifying deliverables...",
      "Adding terms and conditions...",
      "Finalizing contract document..."
    ],
    status_update: [
      "Gathering project milestones...",
      "Checking completion status...",
      "Evaluating timeline adherence...",
      "Calculating completion percentage...",
      "Creating visual progress indicators...",
      "Finalizing status report..."
    ],
    default: [
      "Starting process...",
      "Gathering information...",
      "Processing data...",
      "Analyzing results...",
      "Evaluating alternatives...",
      "Creating recommendations...",
      "Finalizing results..."
    ]
  };

  // Create mutation for generating content
  const generateMutation = useMutation<CompanionTask, Error, { clientId: number, taskType: string, [key: string]: any }>({
    mutationFn: async ({ clientId, taskType, ...options }: { clientId: number, taskType: string, [key: string]: any }) => {
      try {
        // Make the API request with any additional options
        const response = await apiRequest(
          "POST", 
          `/api/clients/${clientId}/generate/${taskType}`, 
          options
        );
        
        // Extract JSON data from the response
        const jsonData = await response.json();
        
        // The API should return a full companion task object
        return jsonData as CompanionTask;
      } catch (error) {
        console.error("Error generating task:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Refresh the task list
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
  
  // Handle content generation with discovery notes if applicable
  const handleGenerate = (taskType: string, options: any = {}) => {
    // Check if a generation is already in progress for this task type
    if (generationLocks[taskType]) {
      console.log(`Generation for ${taskType} already in progress, skipping duplicate request`);
      return;
    }
    
    // Lock this task type to prevent duplicate generations
    setGenerationLocks(prev => ({...prev, [taskType]: true}));
    
    // For proposal generation, we might want to include discovery notes
    const mutationParams = { 
      clientId: client.id, 
      taskType,
      ...options
    };
    
    // Start the loading indicator in the task card
    setGeneratingTasks(prev => ({...prev, [taskType]: true}));
    
    // Initialize progress and stage
    setGenerationProgress(prev => ({...prev, [taskType]: 0}));
    
    const stages = loadingStages[taskType] || loadingStages.default;
    setGenerationStage(prev => ({...prev, [taskType]: stages[0]}));
    
    // Use an interval to simulate progress updates until the API call completes
    const intervalId = setInterval(() => {
      setGenerationProgress(prev => {
        const currentProgress = prev[taskType] || 0;
        // Stop at 95% until the actual API call completes
        if (currentProgress >= 95) {
          clearInterval(intervalId);
          return prev;
        }
        
        const newProgress = Math.min(95, currentProgress + 1);
        
        // Update stage based on progress (change message every ~20%)
        if (newProgress % 20 === 0) {
          const stageIndex = Math.floor(newProgress / 20);
          if (stages[stageIndex]) {
            setGenerationStage(prev => ({...prev, [taskType]: stages[stageIndex]}));
          }
        }
        
        return {...prev, [taskType]: newProgress};
      });
    }, 300);
    
    // Function to clean up and release the lock
    const finishGeneration = () => {
      // Release the lock for this task type
      setGenerationLocks(prev => {
        const newState = {...prev};
        delete newState[taskType];
        return newState;
      });
      
      // Clear the loading indicators
      clearInterval(intervalId);
      setGeneratingTasks(prev => {
        const newState = {...prev};
        delete newState[taskType];
        return newState;
      });
    };
    
    // Delay the actual API call slightly to allow the loading UI to appear
    setTimeout(() => {
      generateMutation.mutate(mutationParams, {
        onSuccess: (data: any) => {
          // Complete the progress bar animation
          setGenerationProgress(prev => ({...prev, [taskType]: 100}));
          setGenerationStage(prev => ({...prev, [taskType]: "Complete!"}));
          
          // Keep "Complete!" shown briefly before removing the loading state
          setTimeout(() => {
            finishGeneration();
            
            // If the task was successfully generated, show the appropriate dialog
            if (data && typeof data === 'object') {
              // Make sure we have a valid CompanionTask object
              const taskData = data as CompanionTask;
              
              if (taskType === 'proposal') {
                setProposalTask(taskData);
                setIsProposalDialogOpen(true);
              } else if (taskType === 'company_analysis') {
                setCompanyAnalysisTask(taskData);
                setIsCompanyAnalysisDialogOpen(true); 
              } else if (taskData.content) {
                setSelectedTask(taskData);
              }
            }
          }, 1000);
        },
        onError: (error) => {
          console.error(`Error generating ${taskType}:`, error);
          // Clear this task from tracking on error
          finishGeneration();
          
          toast({
            title: `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} generation failed`,
            description: "There was an error generating the content. Please try again.",
            variant: "destructive"
          });
        }
      });
    }, 500);
  };
  
  // Handle re-generation of content (retry)
  const handleRetry = (taskType: string) => {
    // Use the same handler as generate for retry
    handleGenerate(taskType);
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
                console.error("Error parsing metadata:", e);
              }
            }
            // No valid metadata with notes, generate without notes
            handleGenerate('proposal');
          } else {
            // This is a real task with content, show it in the dialog
            setTimeout(() => {
              setProposalTask(task);
              setIsProposalDialogOpen(true);
            }, 1000);
          }
        }}
      />
      
      {/* Company analysis dialog */}
      <CompanyAnalysisDialog
        open={isCompanyAnalysisDialogOpen}
        onOpenChange={setIsCompanyAnalysisDialogOpen}
        client={client}
        existingTask={companyAnalysisTask}
        onTaskGenerated={(task) => {
          // Check if this is a request to schedule a discovery call
          if (task.type === 'schedule_discovery') {
            // Open the discovery dialog
            setIsDiscoveryDialogOpen(true);
          }
          // Check if this is a new task request (dummy task with no content)
          else if (!task.content && task.type === 'company_analysis') {
            // Generate a new analysis using the in-card loading state
            handleGenerate('company_analysis');
          } else {
            // This is a real task, show it in the dialog
            setTimeout(() => {
              setCompanyAnalysisTask(task);
              setIsCompanyAnalysisDialogOpen(true);
            }, 1000);
          }
        }}
      />
      
      <CardHeader className="bg-white border-b">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-4">
          <div>
            <CardTitle className="flex items-center text-xl">
              <span>Client Companion</span>
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">AI Assistant</Badge>
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              AI-powered workflow assistant that helps you manage client projects efficiently
            </CardDescription>
          </div>
          
          <div className="flex gap-4 items-center">
            {/* Display total time saved */}
            {tasks && tasks.some(task => task.content) && (
              <div className="flex items-center bg-white border border-green-300 rounded-lg shadow-sm px-4 py-3">
                <div className="bg-green-100 text-green-700 p-2 rounded-md mr-3">
                  <Timer className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-green-700 text-lg">
                    {formatTimeSaved(calculateTotalTimeSaved(tasks))}
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    Total time saved with AI
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white border rounded-lg px-4 py-3 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Current phase</div>
              <Badge className={`${getPhaseStatusClass(client.status)} px-3 py-1 text-sm font-medium`}>
                {client.status}
              </Badge>
            </div>
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
                    Schedule Discovery Call
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
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Tasks by Phase
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Generated Content
              </TabsTrigger>
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
                            <Card 
                              key={type} 
                              className={`overflow-hidden shadow-sm transition-all hover:shadow-md 
                                ${task?.content ? "border-green-200 ring-1 ring-green-100" : "border-gray-200 hover:border-gray-300"}`}
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
                                      className={`w-full ${task?.content ? "bg-green-600 hover:bg-green-700" : ""}`}
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