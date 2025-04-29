import { useEffect, useState } from "react";
import { Link } from "wouter";
import { 
  Mail, 
  Phone, 
  MoreVertical, 
  ArrowUp, 
  ArrowDown 
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusClass } from "@/lib/utils";
import { ClientWithProjects } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClientListViewProps {
  clients: ClientWithProjects[];
  onEdit: (client: ClientWithProjects) => void;
  onDelete: (clientId: number) => void;
}

export default function ClientListView({
  clients,
  onEdit,
  onDelete,
}: ClientListViewProps) {
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  useEffect(() => {
    if (selectAll) {
      setSelectedClients(clients.map(client => client.id));
    } else if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    }
  }, [selectAll, clients]);
  
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
  };
  
  const handleSelectClient = (clientId: number) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };
  
  return (
    <div className="bg-white rounded-md shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <Checkbox 
                  checked={selectAll} 
                  onCheckedChange={handleSelectAll}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                Client & Contact
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                Projects
                <button className="ml-1">
                  <ArrowUp className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                Status
                <button className="ml-1">
                  <ArrowUp className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                Last Contact
                <button className="ml-1">
                  <ArrowDown className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client) => {
            const activeProjects = client.projects?.filter(p => p.status === 'active').length || 0;
            const totalProjects = client.projects?.length || 0;
            
            return (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Checkbox 
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => handleSelectClient(client.id)}
                      className="mr-3 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <Avatar className="h-10 w-10 rounded-md overflow-hidden">
                      <AvatarImage src={client.logo || ''} alt={`${client.name} Logo`} />
                      <AvatarFallback className="bg-gray-200">{client.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <Link href={`/clients/${client.id}`}>
                        <a className="font-medium text-gray-900 hover:text-accent">{client.name}</a>
                      </Link>
                      <div className="text-gray-500 text-sm">{client.contactName} - {client.contactTitle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{activeProjects} Active</div>
                  <div className="text-sm text-gray-500">{totalProjects} Total</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getStatusClass(client.status)}>
                    {client.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(client.lastContact)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/clients/${client.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => onDelete(client.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
