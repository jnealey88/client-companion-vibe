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
  Edit 
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatDate, getStatusClass } from "@/lib/utils";
import { ClientWithProjects, Project } from "@shared/schema";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id ? parseInt(params.id) : null;
  
  const { data: client, isLoading, isError } = useQuery<ClientWithProjects>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });
  
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: [`/api/projects?clientId=${clientId}`],
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
  
  // Grouping projects by status
  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const pendingProjects = projects.filter(p => p.status === 'pending');
  const onHoldProjects = projects.filter(p => p.status === 'on hold');
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="px-0 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Clients
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <div className="lg:w-1/3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Avatar className="h-16 w-16 rounded-md mr-4">
                        <AvatarImage src={client.logo || ''} alt={`${client.name} Logo`} />
                        <AvatarFallback className="bg-gray-200 text-lg">{client.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-2xl">{client.name}</CardTitle>
                        <Badge className={`mt-2 ${getStatusClass(client.status)}`}>
                          {client.status}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
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
                    
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Total Value</p>
                        <p className="font-medium">{formatCurrency(client.totalValue)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Last Contact</p>
                        <p className="font-medium">{formatDate(client.lastContact)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-2">
                    <Button className="flex-1">
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:w-2/3">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Projects</CardTitle>
                      <CardDescription>Manage client projects</CardDescription>
                    </div>
                    <Button>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Add Project
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4">
                      <TabsTrigger value="all">All ({projects.length})</TabsTrigger>
                      <TabsTrigger value="active">Active ({activeProjects.length})</TabsTrigger>
                      <TabsTrigger value="completed">Completed ({completedProjects.length})</TabsTrigger>
                      <TabsTrigger value="pending">Pending ({pendingProjects.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all">
                      {isLoadingProjects ? (
                        <p className="text-center py-4">Loading projects...</p>
                      ) : projects.length === 0 ? (
                        <p className="text-center py-4 text-gray-500">No projects found for this client.</p>
                      ) : (
                        <div className="grid gap-4">
                          {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="active">
                      {activeProjects.length === 0 ? (
                        <p className="text-center py-4 text-gray-500">No active projects found.</p>
                      ) : (
                        <div className="grid gap-4">
                          {activeProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="completed">
                      {completedProjects.length === 0 ? (
                        <p className="text-center py-4 text-gray-500">No completed projects found.</p>
                      ) : (
                        <div className="grid gap-4">
                          {completedProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="pending">
                      {pendingProjects.length === 0 ? (
                        <p className="text-center py-4 text-gray-500">No pending projects found.</p>
                      ) : (
                        <div className="grid gap-4">
                          {pendingProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="border rounded-md p-4 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg">{project.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{project.description}</p>
        </div>
        <Badge className={getStatusClass(project.status)}>
          {project.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div>
          <p className="text-sm text-gray-500">Start Date</p>
          <p className="font-medium">{formatDate(project.startDate)}</p>
        </div>
        {project.endDate && (
          <div>
            <p className="text-sm text-gray-500">End Date</p>
            <p className="font-medium">{formatDate(project.endDate)}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500">Value</p>
          <p className="font-medium">{formatCurrency(project.value)}</p>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <Button variant="outline" size="sm">View Details</Button>
      </div>
    </div>
  );
}
