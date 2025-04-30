import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, RotateCw, Trash2, CheckCircle2 } from "lucide-react";
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
import { useState } from "react";
import { CompanionTask } from "@shared/schema";

interface TaskCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  iconColor: string;
  task?: CompanionTask;
  isGenerating: boolean;
  onGenerate: () => void;
  onSelect: (task: CompanionTask) => void;
  onRetry?: () => void; // Retry functionality
  onDelete?: (task: CompanionTask) => void; // Delete functionality
}

export default function CompanionTaskCard({
  title,
  description,
  icon,
  iconColor,
  task,
  isGenerating,
  onGenerate,
  onSelect,
  onRetry,
  onDelete
}: TaskCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Status variant mapping
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "in_progress": return "warning";
      case "completed": return "success";
      default: return "secondary";
    }
  };
  
  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {title} content. You can regenerate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => task && onDelete && onDelete(task)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className={`flex items-center justify-between p-2 rounded-md hover:bg-gray-50 ${task?.status === "completed" ? "border border-green-200 bg-green-50" : ""}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${iconColor} ${task?.status === "completed" ? "bg-green-100" : ""}`}>
            {task?.status === "completed" ? (
              <div className="relative">
                {icon}
                <CheckCircle2 className="h-4 w-4 text-green-600 absolute -top-1 -right-2" />
              </div>
            ) : (
              icon
            )}
          </div>
          <div>
            <h4 className="font-medium flex items-center gap-1">
              {title}
              {task?.status === "completed" && (
                <span className="text-xs text-green-600 font-normal">(Completed)</span>
              )}
            </h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        
        {task ? (
          <div className="flex items-center gap-1">
            <Badge variant={getStatusVariant(task.status)}
                  className={task.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
              {task.status}
            </Badge>
            
            {task.status === "completed" && (
              <>
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="ml-1"
                    title="Delete this content"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="ml-1"
                    title="Regenerate this analysis"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
            
            <Button 
              variant={task.status === "completed" ? "default" : "ghost"}
              size="sm"
              onClick={() => onSelect(task)}
              disabled={task.status !== "completed"}
              className="ml-1"
            >
              {task.status === "completed" ? (
                <>
                  <span className="mr-1">View</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Generating...</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <span className="text-xs text-muted-foreground">This may take a moment</span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Generate
          </Button>
        )}
      </div>
    </>
  );
}