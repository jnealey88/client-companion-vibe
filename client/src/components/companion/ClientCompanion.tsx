import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ClientPerformanceDashboard from "../dashboard/ClientPerformanceDashboard";
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
  Info,
  Zap,
  Lock,
  Search,
  Shield,
  PieChart
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
    description: "Legal agreement with terms and conditions",
    iconColor: "bg-purple-50 text-purple-600",
    phase: "Planning",
    timeSaved: 180 // Time saved in minutes (3 hours)
  },
  third_party: {
    icon: <Link className="h-5 w-5" />,
    label: "Third-Party Services",
    description: "Additional service recommendations",
    iconColor: "bg-purple-50 text-purple-600",
    phase: "Planning",
    timeSaved: 60 // Time saved in minutes (1 hour)
  },
  
  // Design and Development phase tasks
  site_map: {
    icon: <FolderTree className="h-5 w-5" />,
    label: "Site Map",
    description: "Visual representation of website structure",
    iconColor: "bg-amber-50 text-amber-600",
    phase: "Design and Development",
    timeSaved: 90 // Time saved in minutes (1.5 hours)
  },
  ai_site_designer: {
    icon: <MessageCircle className="h-5 w-5" />,
    label: "AI Site Designer",
    description: "AI-assisted website design recommendations",
    iconColor: "bg-amber-50 text-amber-600",
    phase: "Design and Development",
    timeSaved: 120 // Time saved in minutes (2 hours)
  },
  ai_qa_tool: {
    icon: <Bot className="h-5 w-5" />,
    label: "AI QA Tool",
    description: "Quality assurance testing with AI",
    iconColor: "bg-amber-50 text-amber-600",
    phase: "Design and Development",
    timeSaved: 120 // Time saved in minutes (2 hours)
  },
  
  // Post Launch Management phase tasks (will be replaced by dashboard)
  seo_performance: {
    icon: <Search className="h-5 w-5" />,
    label: "SEO Performance",
    description: "Search engine optimization analysis",
    iconColor: "bg-indigo-50 text-indigo-600",
    phase: "Post Launch Management",
    timeSaved: 90 // Time saved in minutes (1.5 hours)
  },
  site_speed: {
    icon: <Zap className="h-5 w-5" />,
    label: "Site Speed",
    description: "Website performance analysis",
    iconColor: "bg-indigo-50 text-indigo-600",
    phase: "Post Launch Management",
    timeSaved: 60 // Time saved in minutes (1 hour)
  },
  security_scan: {
    icon: <Lock className="h-5 w-5" />,
    label: "Security Scan",
    description: "Website security vulnerability assessment",
    iconColor: "bg-indigo-50 text-indigo-600",
    phase: "Post Launch Management",
    timeSaved: 90 // Time saved in minutes (1.5 hours)
  },
  uptime_monitor: {
    icon: <Clock className="h-5 w-5" />,
    label: "Uptime Monitor",
    description: "Website availability monitoring",
    iconColor: "bg-indigo-50 text-indigo-600",
    phase: "Post Launch Management",
    timeSaved: 60 // Time saved in minutes (1 hour)
  }
};

// Project phases in order
const projectPhases = ["Discovery", "Planning", "Design and Development", "Post Launch Management"];

// Format minutes into a human-readable string (e.g., "3 hr 15 min")
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
  // Check if we should show the dashboard (Post Launch Management phase)
  const isPostLaunchPhase = client.status === "Post Launch Management";

  const [selectedTask, setSelectedTask] = useState<CompanionTask | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(client.status);
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
  
  // Client update mutation for changing phase
  const updateClientMutation = useMutation({
    mutationFn: (clientData: any) => {
      return apiRequest("PATCH", `/api/clients/${client.id}`, clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Client phase advanced",
        description: "Client has been automatically moved to the next phase due to task completion.",
      });
    },
    onError: (error) => {
      console.error("Error advancing client phase:", error);
    }
  });
  
  // Check if all tasks in the current phase are completed
  // If they are, automatically advance the client to the next phase
  useEffect(() => {
    if (!tasks || !client || tasks.length === 0) return;
    
    // Get all tasks for the current phase
    const currentPhase = client.status;
    const currentPhaseTasks = tasks.filter(task => taskTypes[task.type]?.phase === currentPhase);
    
    // If there are no tasks in this phase, don't do anything
    if (!currentPhaseTasks.length) return;
    
    // Check if all tasks in current phase are completed
    const allTasksCompleted = currentPhaseTasks.every(task => task.status === "completed");
    
    if (allTasksCompleted) {
      // Find the index of the current phase in the statusOptions array
      const currentPhaseIndex = statusOptions.findIndex(phase => phase === currentPhase);
      
      // If this is already the last phase or "All Status", don't advance
      if (currentPhaseIndex <= 0 || currentPhaseIndex >= statusOptions.length - 1) return;
      
      // Advance to the next phase
      const nextPhase = statusOptions[currentPhaseIndex + 1];
      
      // Update the client status
      updateClientMutation.mutate({ status: nextPhase });
      
      console.log(`All tasks in ${currentPhase} completed. Advancing to ${nextPhase}.`);
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
    // New post-launch dashboard tasks loading stages
    seo_performance: [
      "Analyzing search engine data...",
      "Checking keyword positions...",
      "Evaluating organic traffic trends...",
      "Calculating search visibility scores...",
      "Identifying keyword opportunities...",
      "Finalizing SEO performance report..."
    ],
    site_speed: [
      "Running page speed tests...",
      "Measuring core web vitals...",
      "Analyzing loading performance...",
      "Checking mobile responsiveness...",
      "Identifying optimization opportunities...",
      "Finalizing performance report..."
    ],
    security_scan: [
      "Running security checks...",
      "Scanning for vulnerabilities...",
      "Testing SSL configuration...",
      "Checking for malware presence...",
      "Evaluating security headers...",
      "Finalizing security report..."
    ],
    uptime_monitor: [
      "Checking website availability...",
      "Measuring response times...",
      "Analyzing uptime history...",
      "Testing server performance...",
      "Identifying reliability issues...",
      "Finalizing uptime report..."
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
        return { ...prev, [taskType]: newProgress };
      });
      
      // Update stage based on progress
      setGenerationStage(prev => {
        const currentProgress = generationProgress[taskType] || 0;
        const stages = loadingStages[taskType] || loadingStages.default;
        const numStages = stages.length;
        const stageIndex = Math.min(numStages - 1, Math.floor(currentProgress / (100 / numStages)));
        return { ...prev, [taskType]: stages[stageIndex] };
      });
    }, 300);
    
    // Start the API call
    generateMutation.mutate(mutationParams, {
      onSuccess: (newTask) => {
        clearInterval(intervalId); // Stop the progress simulation
        
        // Set progress to 100% to show completion
        setGenerationProgress(prev => ({...prev, [taskType]: 100}));
        
        // Clear the generating state after a delay to show the completion animation
        setTimeout(() => {
          // Update tasks and reset states
          setGeneratingTasks(prev => ({...prev, [taskType]: false}));
          setGenerationLocks(prev => ({...prev, [taskType]: false}));
          
          // Handle special tasks
          if (taskType === 'company_analysis') {
            setCompanyAnalysisTask(newTask);
          } else if (taskType === 'proposal') {
            setProposalTask(newTask);
          } else if (taskType === 'define_scope') {
            setProjectScopeTask(newTask);
          } else if (taskType === 'contract') {
            setContractTask(newTask);
          } else if (taskType === 'site_map') {
            setSiteMapTask(newTask);
          }
          
          // If this was a company analysis, open the analysis dialog
          if (taskType === 'company_analysis') {
            setIsCompanyAnalysisDialogOpen(true);
          } else if (taskType === 'proposal') {
            setIsProposalDialogOpen(true);
          } else if (taskType === 'define_scope') {
            setIsProjectScopeDialogOpen(true);
          } else if (taskType === 'contract') {
            setIsContractDialogOpen(true);
          } else if (taskType === 'site_map') {
            setIsSiteMapDialogOpen(true);
          }
        }, 1000);
      },
      onError: () => {
        clearInterval(intervalId); // Stop the progress simulation
        setGeneratingTasks(prev => ({...prev, [taskType]: false}));
        setGenerationLocks(prev => ({...prev, [taskType]: false}));
      }
    });
  };
  
  // Handle task deletion with confirmation
  const handleDelete = (task: CompanionTask) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };
  
  // Get tasks organized by project phase
  const tasksByPhase: Record<string, Array<{type: string, task: CompanionTask | undefined}>> = {};
  
  // Initialize empty arrays for each phase
  projectPhases.forEach(phase => {
    tasksByPhase[phase] = [];
  });
  
  // Sort task types into their respective phases
  Object.entries(taskTypes).forEach(([type, info]) => {
    const phase = info.phase;
    const task = tasks?.find(t => t.type === type);
    
    if (tasksByPhase[phase]) {
      tasksByPhase[phase].push({
        type,
        task
      });
    }
  });

  // Check for completed tasks in each phase
  const phaseHasCompletedTasks: Record<string, boolean> = {};
  Object.entries(tasksByPhase).forEach(([phase, phaseTasks]) => {
    phaseHasCompletedTasks[phase] = phaseTasks.some(({task}) => task?.content);
  });
  
  // Update tasks state when a dialog is closed
  useEffect(() => {
    if (companyAnalysisTask?.id && !isCompanyAnalysisDialogOpen) {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
    }
  }, [companyAnalysisTask, isCompanyAnalysisDialogOpen]);
  
  useEffect(() => {
    if (proposalTask?.id && !isProposalDialogOpen) {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/companion-tasks`] });
    }
  }, [proposalTask, isProposalDialogOpen]);
  
  // Close specific dialogs when selected task changes
  useEffect(() => {
    if (selectedTask) {
      if (selectedTask.type === 'company_analysis' && companyAnalysisTask?.id === selectedTask.id) {
        setIsCompanyAnalysisDialogOpen(false);
      } else if (selectedTask.type === 'proposal' && proposalTask?.id === selectedTask.id) {
        setIsProposalDialogOpen(false);
      } else if (selectedTask.type === 'define_scope' && projectScopeTask?.id === selectedTask.id) {
        setIsProjectScopeDialogOpen(false);
      } else if (selectedTask.type === 'contract' && contractTask?.id === selectedTask.id) {
        setIsContractDialogOpen(false);
      } else if (selectedTask.type === 'site_map' && siteMapTask?.id === selectedTask.id) {
        setIsSiteMapDialogOpen(false);
      }
    }
  }, [selectedTask]);

  return (
    <Card className="h-full shadow-md">
      {/* Confirmation Dialog for deleting content */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this content?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the AI-generated content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (taskToDelete?.id) {
                  deleteMutation.mutate(taskToDelete.id);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Schedule Discovery Call dialog */}
      <ScheduleDiscoveryDialog
        open={isDiscoveryDialogOpen}
        onOpenChange={setIsDiscoveryDialogOpen}
        client={client}
        analysisId={companyAnalysisTask?.id}
        onTaskGenerated={(task) => {
          // Check if this is a new task request (dummy task with no content)
          if (!task.content && task.type === 'schedule_discovery') {
            // Generate a new schedule using the in-card loading state
            handleGenerate('schedule_discovery', { analysisId: companyAnalysisTask?.id });
          } else {
            // This is a real task, show it in the dialog
            setTimeout(() => {
              // Update the selected task
              setSelectedTask(task);
            }, 1000);
          }
        }}
      />
      
      {/* Proposal dialog */}
      <ProposalDialog
        open={isProposalDialogOpen}
        onOpenChange={setIsProposalDialogOpen}
        client={client}
        existingTask={proposalTask}
        companyAnalysisTask={companyAnalysisTask}
        onTaskGenerated={(task) => {
          // Check if this is a new task request (dummy task with no content)
          if (!task.content && task.type === 'proposal') {
            // Generate a new proposal using the in-card loading state
            handleGenerate('proposal', {
              marketResearch: companyAnalysisTask?.content,
            });
          } else {
            // This is a real task, show it in the dialog
            setTimeout(() => {
              setProposalTask(task);
              setIsProposalDialogOpen(true);
            }, 1000);
          }
        }}
      />
      
      {/* Company Analysis dialog */}
      <CompanyAnalysisDialog
        open={isCompanyAnalysisDialogOpen}
        onOpenChange={setIsCompanyAnalysisDialogOpen}
        client={client}
        existingTask={companyAnalysisTask}
        onTaskGenerated={(task) => {
          // Check if this is a new task request (dummy task with no content)
          if (!task.content && task.type === 'company_analysis') {
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
      
      {/* Project Scope dialog */}
      <ProjectScopeDialog
        open={isProjectScopeDialogOpen}
        onOpenChange={setIsProjectScopeDialogOpen}
        client={client}
        existingTask={projectScopeTask}
        proposalTask={proposalTask}
        onTaskGenerated={(task) => {
          // Check if this is a new task request (dummy task with no content)
          if (!task.content && task.type === 'define_scope') {
            // Generate a new project scope using the in-card loading state
            handleGenerate('define_scope', {
              proposalContent: proposalTask?.content,
            });
          } else {
            // This is a real task, show it in the dialog
            setTimeout(() => {
              setProjectScopeTask(task);
              setIsProjectScopeDialogOpen(true);
            }, 1000);
          }
        }}
      />
      
      {/* Contract dialog */}
      <ContractDialog
        open={isContractDialogOpen}
        onOpenChange={setIsContractDialogOpen}
        client={client}
        existingTask={contractTask}
        proposalTask={proposalTask}
        onTaskGenerated={(task) => {
          // Check if this is a new task request (dummy task with no content)
          if (!task.content && task.type === 'contract') {
            // Generate a new contract using the in-card loading state
            handleGenerate('contract');
          } else {
            // This is a real task, show it in the dialog
            setTimeout(() => {
              setContractTask(task);
              setIsContractDialogOpen(true);
            }, 1000);
          }
        }}
      />
      
      {/* Site Map dialog */}
      <SiteMapDialog
        open={isSiteMapDialogOpen}
        onOpenChange={setIsSiteMapDialogOpen}
        client={client}
        existingTask={siteMapTask}
        onTaskGenerated={(task) => {
          // Check if this is a new task request (dummy task with no content)
          if (!task.content && task.type === 'site_map') {
            // Generate a new site map using the in-card loading state
            handleGenerate('site_map');
          } else {
            // This is a real task, show it in the dialog
            setTimeout(() => {
              setSiteMapTask(task);
              setIsSiteMapDialogOpen(true);
            }, 1000);
          }
        }}
      />
      
      <CardHeader className="bg-white border-b">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-4">
          <div>
            <CardTitle className="flex items-center text-xl">
              {isPostLaunchPhase ? (
                <span>Website Performance Dashboard</span>
              ) : (
                <span>Client Companion</span>
              )}
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                {isPostLaunchPhase ? 'Post-Launch Care' : 'AI Assistant'}
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              {isPostLaunchPhase 
                ? "Monitor and manage your client's website performance and security"
                : "AI-powered workflow assistant that helps you manage client projects efficiently"}
            </CardDescription>
          </div>
          
          {!isPostLaunchPhase && tasks && tasks.some(task => task.content) && (
            <div className="flex justify-end items-center">
              <div className="flex items-center bg-white border border-green-300 rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition-all duration-200">
                <div className="bg-green-100 text-green-700 p-2 rounded-md mr-3">
                  <Timer className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-green-700 text-lg">
                    {formatTimeSaved(calculateTotalTimeSaved(tasks))}
                  </div>
                  <div className="text-xs flex gap-1 items-center">
                    <span className="text-green-600 font-medium">Total time saved</span>
                    <div className="relative group">
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                      <div className="absolute hidden group-hover:block right-0 top-full mt-1 p-2 bg-white border border-gray-200 rounded-md shadow-md text-xs text-gray-600 w-64 z-10">
                        <p className="font-medium mb-1">AI tools save valuable time</p>
                        <p className="mb-1">Each completed task saves an estimated amount of manual work time.</p>
                        <div className="flex flex-col gap-1 mt-2 border-t pt-1">
                          {tasks.filter(task => task.content).map(task => {
                            const taskInfo = taskTypes[task.type as keyof typeof taskTypes];
                            if (!taskInfo) return null;
                            return (
                              <div key={task.id} className="flex justify-between">
                                <span className="text-gray-500">{taskInfo.label}:</span>
                                <span className="font-medium">{formatTimeSaved(taskInfo.timeSaved)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isPostLaunchPhase ? (
          <ClientPerformanceDashboard client={client} />
        ) : selectedTask ? (
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
            <div className="border-b mb-4">
              <TabsList className="bg-transparent p-0 border-0 w-auto inline-flex h-auto gap-8">
                <TabsTrigger 
                  value="tasks" 
                  className="px-0 py-3 rounded-none text-base font-medium text-gray-600 data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:shadow-none bg-transparent"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  AI Tools
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
                    <div key={phase} className="mb-8 p-5 rounded-lg bg-white border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-5 pb-3 border-b border-gray-200">
                        <div className="flex flex-col">
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            {phase}
                            {isCurrentPhase && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Current Phase
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm mt-1 text-gray-600">
                            {phase === 'Discovery' ? 'Research and business analysis' :
                             phase === 'Planning' ? 'Project scope and contract details' :
                             phase === 'Design and Development' ? 'Website design and implementation' :
                             'Ongoing website management'}
                          </p>
                        </div>
                        <div className="ml-auto h-2 w-24 bg-gray-100 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(100, Math.max(0, phaseTasks.filter(({task}) => task?.content).length / phaseTasks.length * 100))}%` }} 
                          />
                        </div>
                        <span className="text-xs text-gray-600 ml-2 font-medium">
                          {phaseTasks.filter(({task}) => task?.content).length}/{phaseTasks.length} Complete
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {phaseTasks.map(({ type, task }) => {
                          const taskInfo = taskTypes[type as keyof typeof taskTypes];
                          return (
                            <CompanionTaskCard 
                              key={type}
                              task={task}
                              taskType={type}
                              taskInfo={taskInfo}
                              isGenerating={!!generatingTasks[type]}
                              generationProgress={generationProgress[type] || 0}
                              generationStage={generationStage[type] || ""}
                              onSelect={handleTaskSelect}
                              onGenerate={handleGenerate}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="mt-4">
              {phaseHasCompletedTasks.Discovery || 
               phaseHasCompletedTasks.Planning || 
               phaseHasCompletedTasks["Design and Development"] || 
               phaseHasCompletedTasks["Post Launch Management"] ? (
                <div className="space-y-8">
                  {/* Generated content listing */}
                  {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => {
                    const completedTasks = phaseTasks.filter(({task}) => task?.content);
                    
                    if (completedTasks.length === 0) return null;
                    
                    return (
                      <div key={phase} className="mb-8">
                        <h3 className="text-lg font-medium mb-4 pb-2 border-b">{phase}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {completedTasks.map(({type, task}) => {
                            if (!task) return null;
                            
                            const taskInfo = taskTypes[type as keyof typeof taskTypes];
                            return (
                              <Card 
                                key={task.id} 
                                className="border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all duration-200"
                                onClick={() => handleTaskSelect(task)}
                              >
                                <CardHeader className="p-4 pb-2">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-md ${taskInfo.iconColor}`}>
                                      {taskInfo.icon}
                                    </div>
                                    <div>
                                      <CardTitle className="text-base">
                                        {taskInfo.label}
                                      </CardTitle>
                                      <CardDescription className="text-xs mt-1">
                                        Generated: {new Date(task.createdAt).toLocaleDateString()}
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>Saved {formatTimeSaved(taskInfo.timeSaved || 0)}</span>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="gap-1"
                                    >
                                      {type === 'company_analysis'
                                        ? <><Bot className="h-3.5 w-3.5 mr-1" /> View Analysis</>
                                        : type === 'schedule_discovery'
                                        ? <><Calendar className="h-3.5 w-3.5 mr-1" /> View Email</>
                                        : type === 'proposal'
                                        ? <><LineChart className="h-3.5 w-3.5 mr-1" /> View Proposal</>
                                        : type === 'define_scope'
                                        ? <><ListFilter className="h-3.5 w-3.5 mr-1" /> View Scope</>
                                        : type === 'contract'
                                        ? <><Scroll className="h-3.5 w-3.5 mr-1" /> View Contract</>
                                        : type === 'site_map'
                                        ? <><FolderTree className="h-3.5 w-3.5 mr-1" /> Review</>
                                        : <><FileText className="h-3.5 w-3.5 mr-1" /> View</>}
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
            {isPostLaunchPhase 
              ? "Monitor and optimize your client's website with real-time metrics" 
              : "Powered by AI to save time and help you focus on building great sites"}
          </div>
        </div>
        
        {!isPostLaunchPhase && (
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
        )}
      </CardFooter>
    </Card>
  );
}
