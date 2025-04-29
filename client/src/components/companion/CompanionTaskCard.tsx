import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, RotateCw } from "lucide-react";
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
  onRetry?: () => void; // New prop for retry functionality
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
  onRetry
}: TaskCardProps) {
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
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      
      {task ? (
        <div className="flex items-center gap-1">
          <Badge variant={getStatusVariant(task.status)}>
            {task.status}
          </Badge>
          
          {task.status === "completed" && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-2"
              title="Regenerate this analysis"
            >
              <RotateCw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onSelect(task)}
            disabled={task.status !== "completed"}
            className="ml-1"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={isGenerating}
          onClick={onGenerate}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RotateCw className="h-4 w-4 mr-2" />
          )}
          Generate
        </Button>
      )}
    </div>
  );
}