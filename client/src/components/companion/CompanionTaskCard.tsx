import { useState } from "react";
import { Client, CompanionTask } from "@shared/schema";
import { X, FileText, Code, ArrowRight, Clock, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeSaved } from "@/lib/utils";

type TaskType = "company_analysis" | "proposal" | "contract" | "site_map" | "status_update" | "schedule_discovery";

// Map task types to icons and colors
const taskTypeInfo: Record<string, { icon: JSX.Element, color: string, label: string, timeSaved: number }> = {
  company_analysis: { 
    icon: <FileText className="h-5 w-5" />, 
    color: "text-blue-600", 
    label: "Company Analysis",
    timeSaved: 180 // 3 hours
  },
  proposal: { 
    icon: <FileText className="h-5 w-5" />, 
    color: "text-green-600", 
    label: "Project Proposal",
    timeSaved: 240 // 4 hours
  },
  contract: { 
    icon: <FileText className="h-5 w-5" />, 
    color: "text-purple-600", 
    label: "Contract",
    timeSaved: 90 // 1.5 hours
  },
  site_map: { 
    icon: <FileText className="h-5 w-5" />, 
    color: "text-amber-600", 
    label: "Site Map",
    timeSaved: 150 // 2.5 hours
  },
  status_update: { 
    icon: <FileText className="h-5 w-5" />, 
    color: "text-pink-600", 
    label: "Status Update",
    timeSaved: 60 // 1 hour
  },
  schedule_discovery: { 
    icon: <FileText className="h-5 w-5" />, 
    color: "text-blue-600", 
    label: "Schedule Discovery Call",
    timeSaved: 45 // 45 minutes
  }
};

// Format time saved 
const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
};

interface TaskCardProps {
  task: CompanionTask;
  client: Client;
  onClose: () => void;
}

export default function CompanionTaskCard({ task, client, onClose }: TaskCardProps) {
  const [isContentVisible, setIsContentVisible] = useState(true);
  
  // Get task info based on task type
  const taskInfo = taskTypeInfo[task.type as TaskType] || {
    icon: <FileText className="h-5 w-5" />,
    color: "text-gray-600",
    label: "Task",
    timeSaved: 60
  };
  
  // Handle task content
  const renderTaskContent = () => {
    if (!task.content) {
      return <div className="text-center text-gray-500 p-6">No content available for this task.</div>;
    }
    
    // Check if content is HTML (for tasks like company_analysis)
    if (task.content.startsWith("<!DOCTYPE html>") || task.content.startsWith("<html>")) {
      return (
        <div className="border rounded-md overflow-hidden">
          <iframe
            srcDoc={task.content}
            title={`${taskInfo.label} Content`}
            className="w-full h-[60vh] border-0"
          />
        </div>
      );
    }
    
    // If it's JSON, try to format it nicely
    if (task.content.startsWith("{") || task.content.startsWith("[")) {
      try {
        const parsedJson = JSON.parse(task.content);
        return (
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(parsedJson, null, 2)}
          </pre>
        );
      } catch (e) {
        // If parsing fails, just show as text
      }
    }
    
    // Default to plain text
    return (
      <div className="prose max-w-none bg-white p-4 rounded-md">
        {task.content.split("\n").map((line, i) => (
          <p key={i} className={line === "" ? "h-4" : ""}>{line}</p>
        ))}
      </div>
    );
  };
  
  return (
    <Dialog open={isContentVisible} onOpenChange={setIsContentVisible}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-md bg-${taskInfo.color.replace('text-', '')}-50`}>
                {taskInfo.icon}
              </div>
              <div>
                <DialogTitle className="text-xl">{taskInfo.label}</DialogTitle>
                <DialogDescription className="mt-1">
                  Generated for {client.name} • {new Date(task.createdAt).toLocaleDateString()}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeSaved(taskInfo.timeSaved)} saved
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className={`mt-4 ${task.type === 'company_analysis' ? 'px-0' : 'px-4'}`}>
          {renderTaskContent()}
        </div>
        
        <DialogFooter className="flex justify-between items-center border-t pt-3 mt-6">
          <div className="text-sm text-gray-500 flex items-center gap-1.5">
            <Timer className="h-4 w-4" />
            <span>Time saved: <span className="font-medium">{formatTime(taskInfo.timeSaved)}</span></span>
          </div>
          
          <Button className="bg-green-600 hover:bg-green-700" onClick={onClose}>
            Close <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}