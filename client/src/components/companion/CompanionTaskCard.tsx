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
}

export default function CompanionTaskCard({
  title,
  description,
  icon,
  iconColor,
  task,
  isGenerating,
  onGenerate,
  onSelect
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
        <>
          <Badge variant={getStatusVariant(task.status)}>
            {task.status}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onSelect(task)}
            disabled={task.status !== "completed"}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </>
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