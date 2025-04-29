import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  Info
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ClientCompanion from "@/components/companion/ClientCompanion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency, formatDate, getStatusClass } from "@/lib/utils";
import { Client, CompanionTask } from "@shared/schema";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id ? parseInt(params.id) : null;
  const [clientInfoOpen, setClientInfoOpen] = useState(false);
  
  const { data: client, isLoading, isError } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });
  
  // Fetch companion tasks for the client
  const { data: tasks } = useQuery<CompanionTask[]>({
    queryKey: [`/api/clients/${clientId}/companion-tasks`],
    enabled: !!clientId,
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
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <Link href="/">
                <Button variant="ghost" className="px-0 text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Clients
                </Button>
              </Link>
              
              <div className="flex gap-3 items-center">
                <Badge className={`${getStatusClass(client.status)}`}>
                  {client.status}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => setClientInfoOpen(!clientInfoOpen)}
                >
                  <Info className="h-4 w-4" />
                  Client Info
                  {clientInfoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 items-center">
              <Avatar className="h-16 w-16 rounded-md">
                <AvatarFallback className="bg-gray-200 text-lg">{client.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{client.name}</h1>
                <p className="text-gray-500">{client.industry} • {client.projectName}</p>
              </div>
            </div>
            
            <Collapsible open={clientInfoOpen} onOpenChange={setClientInfoOpen} className="w-full">
              <CollapsibleContent>
                <Card className="mb-6">
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
                        
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500">Industry</p>
                            <p className="font-medium">{client.industry}</p>
                          </div>
                        </div>
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
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Client
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Client Companion - Main content area with full width */}
            <ClientCompanion client={client} />
          </div>
        </main>
      </div>
    </div>
  );
}


