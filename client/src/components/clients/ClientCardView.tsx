import { Link } from "wouter";
import { Mail, Phone, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatDate, getStatusClass } from "@/lib/utils";
import { Client } from "@shared/schema";

interface ClientCardViewProps {
  clients: Client[];
}

export default function ClientCardView({ clients }: ClientCardViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => {
        return (
          <div key={client.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 rounded-md overflow-hidden">
                    <AvatarFallback className="bg-gray-200">{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.contactName} - {client.contactTitle}</p>
                  </div>
                </div>
                <Badge className={getStatusClass(client.status)}>
                  {client.status}
                </Badge>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                {/* Project information hidden */}
                <div className="col-span-1">
                  <p className="text-sm text-gray-500">Last Contact</p>
                  <p className="text-sm font-medium">{formatDate(client.lastContact)}</p>
                </div>
                {/* Industry information hidden */}
                <div className="col-span-1">
                  <p className="text-sm text-gray-500">Project Value</p>
                  <p className="text-sm font-medium">{formatCurrency(client.projectValue)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-5 py-3 flex justify-between items-center">
              <div className="flex space-x-3">
                <Button variant="ghost" size="icon" className="text-accent hover:text-accent">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-accent hover:text-accent">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-accent hover:text-accent">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
              <Link href={`/clients/${client.id}`}>
                <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
                  <span className="text-sm font-medium">View Details</span>
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
