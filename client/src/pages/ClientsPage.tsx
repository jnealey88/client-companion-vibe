import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ClientManagementHeader from "@/components/clients/ClientManagementHeader";
import ClientFiltersComponent from "@/components/clients/ClientFilters";
import ClientListView from "@/components/clients/ClientListView";
import ClientCardView from "@/components/clients/ClientCardView";
import AddClientDialog from "@/components/clients/AddClientDialog";
import { ClientFilters as ClientFiltersType, Client } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ClientsPage() {
  const [view, setView] = useState<'list' | 'card'>('list');
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [filters, setFilters] = useState<ClientFiltersType>({
    projectStatus: 'All Projects',
    industry: 'All Industries',
    status: 'All Status',
    sort: 'Sort by: Recent',
    search: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const { data: clients = [], isLoading, isError } = useQuery({
    queryKey: ['/api/clients', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.industry) queryParams.append('industry', filters.industry);
      if (filters.projectStatus) queryParams.append('projectStatus', filters.projectStatus);
      if (filters.sort) queryParams.append('sort', filters.sort);
      
      const response = await fetch(`/api/clients?${queryParams.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      return response.json();
    }
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const paginatedClients = clients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleFilterChange = (newFilters: ClientFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  const handleSearch = (searchTerm: string) => {
    setFilters({ ...filters, search: searchTerm });
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleDeleteClient = (clientId: number) => {
    setClientToDelete(clientId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteClient = async () => {
    if (clientToDelete) {
      try {
        await apiRequest('DELETE', `/api/clients/${clientToDelete}`);
        
        toast({
          title: 'Client Deleted',
          description: 'The client has been successfully deleted.',
        });
        
        // Invalidate and refetch clients
        queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete the client. Please try again.',
          variant: 'destructive',
        });
      }
    }
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };
  
  const handleEditClient = (client: Client) => {
    // This would typically open an edit dialog
    toast({
      title: 'Edit Client',
      description: `You are editing ${client.name}`,
    });
  };
  
  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
          <span className="font-medium">
            {Math.min(currentPage * itemsPerPage, clients.length)}
          </span>{' '}
          of <span className="font-medium">{clients.length}</span> results
        </div>
        
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={currentPage === index + 1}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onSearch={handleSearch} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <ClientManagementHeader 
            onAddClick={() => setAddClientDialogOpen(true)}
            onViewChange={setView}
            currentView={view}
          />
          
          <ClientFiltersComponent 
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-lg text-gray-500">Loading clients...</p>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-lg text-red-500">Error loading clients. Please try again.</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-md shadow-sm">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-500">Try adjusting your filters or add a new client.</p>
              </div>
            </div>
          ) : (
            <>
              {view === 'list' ? (
                <ClientListView 
                  clients={paginatedClients} 
                  onEdit={handleEditClient}
                  onDelete={handleDeleteClient}
                />
              ) : (
                <ClientCardView clients={paginatedClients} />
              )}
              
              {renderPagination()}
            </>
          )}
        </main>
      </div>
      
      <AddClientDialog 
        open={addClientDialogOpen}
        onOpenChange={setAddClientDialogOpen}
        onClientAdded={() => queryClient.invalidateQueries({ queryKey: ['/api/clients'] })}
      />
      
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteClient} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
