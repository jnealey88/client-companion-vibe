import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Clock, 
  Building, 
  User, 
  Briefcase, 
  DollarSign, 
  Edit,
  Globe,
  ChevronRight,
  ChevronDown,
  Info,
  FileSearch,
  ArrowRight,
  Zap,
  AlertCircle,
  Check,
  Rocket
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ClientCompanion from "../components/companion/ClientCompanion";
import GoDaddyProductsManager from "../components/godaddy/GoDaddyProductsManager";
import RecommendedNextStep from "../components/companion/RecommendedNextStep";
import CarePlanWrapper from "../components/care-plan/CarePlanWrapper";
import EditClientDialog from "../components/clients/EditClientDialog";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { formatCurrency, formatDate, getStatusClass } from "../lib/utils";
import { Client, CompanionTask } from "@shared/schema";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id ? parseInt(params.id) : null;
  const [clientInfoOpen, setClientInfoOpen] = useState(false);
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: client, isLoading, isError } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });
  
  // Fetch companion tasks for the client
  const { data: tasks } = useQuery<CompanionTask[]>({
    queryKey: [`/api/clients/${clientId}/companion-tasks`],
    enabled: !!clientId,
  });
  
  // Mutation to update client status to Post Launch Management
  const updateClientStatusMutation = useMutation({
    mutationFn: async () => {
      if (!client || !clientId) return null;
      return apiRequest(`/api/clients/${clientId}`, {
        method: 'PATCH',
        data: {
          status: 'Post Launch Management'
        }
      });
    },
    onSuccess: () => {
      // Invalidate and refetch client data
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            <div className="flex justify-center items-center h-full">
              <p className="text-lg text-gray-500">Loading client details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (isError || !client) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Client not found</h3>
                <p className="text-gray-500 mb-4">The client you're looking for doesn't exist or has been removed.</p>
                <Link href="/">
                  <Button>Return to Clients</Button>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <Link href="/">
                <Button variant="ghost" className="px-0 text-gray-500 hover:text-gray-700 hover:bg-transparent">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Clients
                </Button>
              </Link>
              
              <div className="flex gap-3 items-center">
                <Badge variant="outline" className={`${getStatusClass(client.status)} border px-3 py-1.5 text-sm font-medium`}>
                  {client.status}
                </Badge>
                {client.status !== 'Post Launch Management' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 border-gray-200 bg-white hover:bg-gray-50"
                    onClick={() => updateClientStatusMutation.mutate()}
                    disabled={updateClientStatusMutation.isPending}
                  >
                    <Rocket className="h-4 w-4 mr-1" />
                    {updateClientStatusMutation.isPending ? 'Updating...' : 'Move to Post Launch'}
                    {updateClientStatusMutation.isPending && <span className="ml-2 animate-spin">⟳</span>}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 border-gray-200 bg-white hover:bg-gray-50"
                  onClick={() => setClientInfoOpen(!clientInfoOpen)}
                >
                  <Info className="h-4 w-4" />
                  Client Info
                  {clientInfoOpen ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          
            <div className="flex items-center gap-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="relative">
                <Avatar className="h-20 w-20 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                    {client.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 h-5 w-5 rounded-full border-2 border-white"></div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                    <div className="flex items-center text-gray-600 mt-1">
                      <User className="h-4 w-4 mr-1.5 text-gray-500" />
                      <span className="text-sm font-medium">{client.contactName}</span>
                      <span className="text-sm text-gray-500 ml-1">· {client.contactTitle}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full flex items-center gap-1 border-gray-200 bg-white hover:bg-gray-50 px-4 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>Email</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full flex items-center gap-1 border-gray-200 bg-white hover:bg-gray-50 px-4 transition-colors"
                    >
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>Call</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            
            <Collapsible open={clientInfoOpen} onOpenChange={setClientInfoOpen} className="w-full">
              <CollapsibleContent>
                <Card className="mb-3">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500">Contact Person</p>
                            <p className="font-medium">{client.contactName}</p>
                            <p className="text-sm text-gray-500">{client.contactTitle}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{client.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">{client.phone}</p>
                          </div>
                        </div>
                        
                        {/* Industry hidden as requested */}
                      </div>
                      
                      <div className="space-y-4">
                        {client.websiteUrl && (
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 text-gray-500 mr-2" />
                            <div>
                              <p className="text-sm text-gray-500">Website</p>
                              <a 
                                href={client.websiteUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:underline"
                              >
                                {client.websiteUrl}
                              </a>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500">Project Value</p>
                            <p className="font-medium">{formatCurrency(client.projectValue)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <Button size="sm">
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditClientDialogOpen(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Client
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Recommended Next Step Card above Client Companion */}
            <RecommendedNextStep client={client} tasks={tasks || []} />
            
            {/* Care Plan Dashboard for Post Launch Management phase */}
            <CarePlanWrapper client={client} tasks={tasks || []} />
            
            {/* Two-column layout for Client Companion (2/3) and GoDaddy Products (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Client Companion takes 2/3 of the width */}
              <div className="lg:col-span-2">
                <ClientCompanion client={client} />
              </div>
              
              {/* GoDaddy Products Management takes 1/3 of the width */}
              <div className="lg:col-span-1">
                <GoDaddyProductsManager client={client} />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Edit Client Dialog */}
      {client && (
        <EditClientDialog 
          client={client} 
          open={editClientDialogOpen} 
          onOpenChange={setEditClientDialogOpen} 
        />
      )}
    </div>
  );
}
