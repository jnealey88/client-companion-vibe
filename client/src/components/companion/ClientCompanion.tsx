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
  Info
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
import ProjectScopeDialog from "./ProjectScopeDialog";
import ContractDialog from "./ContractDialog";
import SiteMapDialog from "./SiteMapDialog";
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
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [isDiscoveryDialogOpen, setIsDiscoveryDialogOpen] = useState(false);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [isCompanyAnalysisDialogOpen, setIsCompanyAnalysisDialogOpen] = useState(false);
  const [isProjectScopeDialogOpen, setIsProjectScopeDialogOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isSiteMapDialogOpen, setIsSiteMapDialogOpen] = useState(false);
  const [proposalTask, setProposalTask] = useState<CompanionTask | undefined>(undefined);
  const [companyAnalysisTask, setCompanyAnalysisTask] = useState<CompanionTask | undefined>(undefined);
  const [projectScopeTask, setProjectScopeTask] = useState<CompanionTask | undefined>(undefined);
  const [contractTask, setContractTask] = useState<CompanionTask | undefined>(undefined);
  const [siteMapTask, setSiteMapTask] = useState<CompanionTask | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<CompanionTask | null>(null);
  const [generationLocks, setGenerationLocks] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  // State to track which task types are currently generating
  const [generatingTasks, setGeneratingTasks] = useState<Record<string, boolean>>({});
  
  // Loading states for task generation
  const [generationProgress, setGenerationProgress] = useState<Record<string, number>>({});
  const [generationStage, setGenerationStage] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();
  
  // Fetch companion tasks for the client
  const { data: tasks, isLoading } = useQuery<CompanionTask[]>({
    queryKey: [`/api/clients/${client.id}/companion-tasks`],
    enabled: !!client.id
  });
  
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
    define_scope: [
      "Analyzing project information...",
      "Extracting requirements from proposal...",
      "Defining functional specifications...",
      "Creating deliverables list...",
      "Establishing project phases...",
      "Defining roles and responsibilities...",
      "Creating scope change process...",
      "Finalizing project scope document..."
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
    
    // Execute the actual API call
    generateMutation.mutate(
      mutationParams, 
      {
        onSuccess: (data) => {
          // Stop the loading animation
          clearInterval(intervalId);
          
          // Complete the progress bar animation
          setGenerationProgress(prev => ({...prev, [taskType]: 100}));
          setGenerationStage(prev => ({...prev, [taskType]: "Complete!"}));
          
          // Wait a brief moment at 100% before removing the loading indicator
          setTimeout(() => {
            // Remove the loading indicator
            setGeneratingTasks(prev => {
              const newPrev = {...prev};
              delete newPrev[taskType];
              return newPrev;
            });
            
            // Unlock this task type
            setGenerationLocks(prev => {
              const newPrev = {...prev};
              delete newPrev[taskType];
              return newPrev;
            });
            
            // For specific task types, update the task in state
            if (taskType === 'company_analysis') {
              setCompanyAnalysisTask(data);
              setIsCompanyAnalysisDialogOpen(true);
            } else if (taskType === 'proposal') {
              setProposalTask(data);
              setIsProposalDialogOpen(true);
            } else if (taskType === 'define_scope') {
              setProjectScopeTask(data);
              setIsProjectScopeDialogOpen(true);
            } else if (taskType === 'contract') {
              setContractTask(data);
              setIsContractDialogOpen(true);
            } else if (taskType === 'site_map') {
              setSiteMapTask(data);
              setIsSiteMapDialogOpen(true);
            } else {
              // For other task types, select the task to show its content
              setSelectedTask(data);
            }
          }, 500);
        },
        onError: () => {
          // Stop the loading animation
          clearInterval(intervalId);
          
          // Remove the loading indicator immediately on error
          setGeneratingTasks(prev => {
            const newPrev = {...prev};
            delete newPrev[taskType];
            return newPrev;
          });
          
          // Unlock this task type
          setGenerationLocks(prev => {
            const newPrev = {...prev};
            delete newPrev[taskType];
            return newPrev;
          });
        }
      }
    );
  };
  
  // Add event listeners for Focus Card actions
  useEffect(() => {
    // Event listener for company analysis generation from the FocusCard
    const handleCompanyAnalysisEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.clientId === client.id) {
        // Switch to the tasks tab if needed
        const tasksTab = document.querySelector('[data-value="tasks"]') as HTMLElement;
        if (tasksTab) tasksTab.click();
        
        // Generate company analysis
        handleGenerate('company_analysis');
      }
    };
    
    // Event listener for proposal generation from the FocusCard
    const handleProposalEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.clientId === client.id) {
        // Switch to the tasks tab if needed
        const tasksTab = document.querySelector('[data-value="tasks"]') as HTMLElement;
        if (tasksTab) tasksTab.click();
        
        // For proposals, we open the dialog first
        setIsProposalDialogOpen(true);
      }
    };
    
    // Event listener for site map generation from the FocusCard
    const handleSiteMapEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.clientId === client.id) {
        // Switch to the tasks tab if needed
        const tasksTab = document.querySelector('[data-value="tasks"]') as HTMLElement;
        if (tasksTab) tasksTab.click();
        
        // Generate site map
        handleGenerate('site_map');
      }
    };
    
    // Add the event listeners
    document.addEventListener('generate-company-analysis', handleCompanyAnalysisEvent);
    document.addEventListener('generate-proposal', handleProposalEvent);
    document.addEventListener('generate-site-map', handleSiteMapEvent);
    
    // Clean up event listeners on component unmount
    return () => {
      document.removeEventListener('generate-company-analysis', handleCompanyAnalysisEvent);
      document.removeEventListener('generate-proposal', handleProposalEvent);
      document.removeEventListener('generate-site-map', handleSiteMapEvent);
    };
  }, [client.id, handleGenerate]); // Include handleGenerate in the dependencies
  
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
      
      setExpandedTasks(newExpandedTasks);
      
      // Also, set tasks that have content directly based on type
      tasks.forEach(task => {
        if (task.content) {
          if (task.type === 'company_analysis') {
            setCompanyAnalysisTask(task);
          } else if (task.type === 'proposal') {
            setProposalTask(task);
          } else if (task.type === 'define_scope') {
            setProjectScopeTask(task);
          } else if (task.type === 'contract') {
            setContractTask(task);
          } else if (task.type === 'site_map') {
            setSiteMapTask(task);
          }
        }
      });
    }
  }, [tasks]);
  
  const handleTaskSelect = (task: CompanionTask) => {
    setSelectedTask(task);
    
    // If it's a specific task that has a dedicated dialog, open that dialog
    if (task.type === 'company_analysis') {
      setCompanyAnalysisTask(task);
      setIsCompanyAnalysisDialogOpen(true);
    } else if (task.type === 'proposal') {
      setProposalTask(task);
      setIsProposalDialogOpen(true);
    } else if (task.type === 'define_scope') {
      setProjectScopeTask(task);
      setIsProjectScopeDialogOpen(true);
    } else if (task.type === 'contract') {
      setContractTask(task);
      setIsContractDialogOpen(true);
    } else if (task.type === 'site_map') {
      setSiteMapTask(task);
      setIsSiteMapDialogOpen(true);
    } else if (task.type === 'schedule_discovery') {
      setIsDiscoveryDialogOpen(true);
    }
  };
  
  const handleDelete = (task: CompanionTask) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };
  
  // Task deletion mutation
  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/companion-tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
      toast({
        title: "Task deleted",
        description: "The task has been removed.",
        variant: "default"
      });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: () => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete the task. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Group tasks by project phase
  const tasksByPhase = (tasks ?? []).reduce<Record<string, CompanionTask[]>>((acc, task) => {
    const taskTypeKey = task.type as keyof typeof taskTypes;
    const phase = taskTypes[taskTypeKey]?.phase || "Other";
    
    if (!acc[phase]) {
      acc[phase] = [];
    }
    
    acc[phase].push(task);
    return acc;
  }, {});
  
  // Calculate total time saved
  const totalTimeSaved = calculateTotalTimeSaved(tasks);
  
  // Toggle task expansion
  const toggleExpanded = (taskType: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskType]: !prev[taskType]
    }));
  };
  
  // Apply filters based on selected phase
  const filteredTasks = selectedPhase
    ? (tasks ?? []).filter(task => {
        const taskTypeKey = task.type as keyof typeof taskTypes;
        return taskTypes[taskTypeKey]?.phase === selectedPhase;
      })
    : tasks ?? [];
  
  return (
    <Card id="client-companion-section" className="bg-white shadow-sm mb-8">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">Client Companion</CardTitle>
            <CardDescription>AI-powered tools to streamline client projects</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 rounded px-2.5 py-1 text-sm font-medium">
              <Clock className="h-4 w-4" />
              <span>Time saved: {formatTimeSaved(totalTimeSaved)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="tasks" className="w-full">
        <div className="px-6 border-b">
          <TabsList className="border-0 px-0">
            <TabsTrigger value="tasks" data-value="tasks" className="px-4 py-2">AI Tasks</TabsTrigger>
            <TabsTrigger value="insights" className="px-4 py-2">Project Insights</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="tasks" className="space-y-4 mt-0">
          <CardContent className="pt-6 pb-2">
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Phase filters */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedPhase === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPhase(null)}
                      className="text-xs px-3 py-1 h-auto"
                    >
                      All Phases
                    </Button>
                    
                    {projectPhases.map(phase => (
                      <Button
                        key={phase}
                        variant={selectedPhase === phase ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPhase(phase)}
                        className={`text-xs px-3 py-1 h-auto ${selectedPhase === phase ? '' : getPhaseStatusClass(phase)}`}
                      >
                        {phase}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Task cards by section */}
                  {Object.entries(taskTypes)
                    .filter(([_, typeInfo]) => !selectedPhase || typeInfo.phase === selectedPhase)
                    .map(([taskType, typeInfo]) => {
                      // Find task if it exists
                      const task = filteredTasks.find(t => t.type === taskType);
                      const isGenerating = generatingTasks[taskType];
                      const progress = generationProgress[taskType] || 0;
                      const stage = generationStage[taskType] || '';
                      const isExpanded = expandedTasks[taskType];
                      
                      return (
                        <CompanionTaskCard
                          key={taskType}
                          task={task}
                          taskType={taskType as any}
                          typeInfo={typeInfo}
                          isGenerating={isGenerating}
                          progress={progress}
                          stage={stage}
                          isExpanded={isExpanded}
                          onGenerate={() => {
                            if (taskType === 'proposal') {
                              // For proposal, we want to open the dialog first
                              setIsProposalDialogOpen(true);
                            } else if (taskType === 'define_scope') {
                              // For project scope, we want to open the dialog first
                              setIsProjectScopeDialogOpen(true);
                            } else if (taskType === 'contract') {
                              // For contract, we want to open the dialog first
                              setIsContractDialogOpen(true);
                            } else if (taskType === 'site_map') {
                              // For site map, we want to generate directly
                              handleGenerate(taskType);
                            } else if (taskType === 'schedule_discovery') {
                              // For discovery scheduling, open the dialog
                              setIsDiscoveryDialogOpen(true);
                            } else {
                              // For other tasks, generate directly
                              handleGenerate(taskType);
                            }
                          }}
                          onSelect={task ? () => handleTaskSelect(task) : undefined}
                          onDelete={task ? () => handleDelete(task) : undefined}
                          onToggleExpand={() => toggleExpanded(taskType)}
                        />
                      );
                    })}
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4 mt-0">
          <CardContent className="pt-6 pb-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-lg font-semibold mb-2">Project Status</h3>
                <p className="text-sm text-muted-foreground mb-4">Current phase: <Badge className={getPhaseStatusClass(client.status)}>{client.status}</Badge></p>
                
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Project Progress</span>
                      <span>75%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  
                  {/* Timeline */}
                  <div className="space-y-3">
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <div className="w-0.5 h-full bg-gray-200"></div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Discovery</h4>
                        <p className="text-xs text-muted-foreground">Completed on April 10, 2025</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <div className="w-0.5 h-full bg-gray-200"></div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Planning</h4>
                        <p className="text-xs text-muted-foreground">Completed on April 17, 2025</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <div className="w-0.5 h-full bg-gray-200"></div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Design and Development</h4>
                        <p className="text-xs text-muted-foreground">In progress - Expected completion May 15, 2025</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Post Launch Management</h4>
                        <p className="text-xs text-muted-foreground">Starting May 16, 2025</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-lg font-semibold mb-3">Time Efficiency Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">The Client Companion has saved you <span className="font-medium text-green-600">{formatTimeSaved(totalTimeSaved)}</span> on this project so far.</p>
                
                <div className="space-y-3">
                  {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => {
                    const phaseTimeSaved = phaseTasks
                      .filter(task => task.content)
                      .reduce((total, task) => {
                        const taskTypeKey = task.type as keyof typeof taskTypes;
                        const timeSaved = taskTypes[taskTypeKey]?.timeSaved || 0;
                        return total + timeSaved;
                      }, 0);
                    
                    if (phaseTimeSaved === 0) return null;
                    
                    return (
                      <div key={phase} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge className={getPhaseStatusClass(phase)}>{phase}</Badge>
                          <span className="text-sm font-medium">{formatTimeSaved(phaseTimeSaved)} saved</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round((phaseTimeSaved / totalTimeSaved) * 100)}% of total</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      {/* Modals and Dialogs */}
      <CompanyAnalysisDialog
        open={isCompanyAnalysisDialogOpen}
        onOpenChange={setIsCompanyAnalysisDialogOpen}
        task={companyAnalysisTask}
        client={client}
      />
      
      <ScheduleDiscoveryDialog
        open={isDiscoveryDialogOpen}
        onOpenChange={setIsDiscoveryDialogOpen}
        client={client}
        analysisTaskId={companyAnalysisTask?.id}
        onGenerate={() => handleGenerate('schedule_discovery', { analysisId: companyAnalysisTask?.id })}
      />
      
      <ProposalDialog
        open={isProposalDialogOpen}
        onOpenChange={setIsProposalDialogOpen}
        task={proposalTask}
        client={client}
        onGenerate={(discoveryNotes) => handleGenerate('proposal', { discoveryNotes })}
      />
      
      <ProjectScopeDialog
        open={isProjectScopeDialogOpen}
        onOpenChange={setIsProjectScopeDialogOpen}
        task={projectScopeTask}
        client={client}
        proposalTask={proposalTask}
        onGenerate={() => handleGenerate('define_scope', { proposalContent: proposalTask?.content })}
      />
      
      <ContractDialog
        open={isContractDialogOpen}
        onOpenChange={setIsContractDialogOpen}
        task={contractTask}
        client={client}
        proposalTask={proposalTask}
        onGenerate={() => handleGenerate('contract', { proposalContent: proposalTask?.content })}
      />
      
      <SiteMapDialog
        open={isSiteMapDialogOpen}
        onOpenChange={setIsSiteMapDialogOpen}
        task={siteMapTask}
        client={client}
        proposalTask={proposalTask}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {taskToDelete ? taskTypes[taskToDelete.type as keyof typeof taskTypes]?.label : ''} task and its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => taskToDelete && deleteMutation.mutate(taskToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Task"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}