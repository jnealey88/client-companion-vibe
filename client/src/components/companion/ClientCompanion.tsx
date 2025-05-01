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
  }
};

export default function ClientCompanion({ client }: { client: Client }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Client Companion</CardTitle>
      </CardHeader>
      <CardContent>
        {client.status === 'Post Launch Management' ? (
          <Tabs defaultValue="content" className="w-full">
            <div className="border-b mb-4">
              <TabsList className="bg-transparent p-0 border-0 w-auto inline-flex h-auto">
                <TabsTrigger 
                  value="content" 
                  className="px-0 py-3 rounded-none text-base font-medium text-gray-600 data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:shadow-none bg-transparent"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generated Content
                </TabsTrigger>
              </TabsList>
            </div>
          
            <TabsContent value="content" className="mt-4">
              <div className="text-center p-20">
                <p>Content tab for post-launch clients</p>
              </div>
            </TabsContent>
          </Tabs>
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
              <div className="text-center p-20">
                <p>AI Tools tab content for regular clients</p>
              </div>
            </TabsContent>
          
            <TabsContent value="content" className="mt-4">
              <div className="text-center p-20">
                <p>Generated Content tab for regular clients</p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter>
        <p>Footer content</p>
      </CardFooter>
    </Card>
  );
}