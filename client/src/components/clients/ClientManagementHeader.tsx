import { Button } from "@/components/ui/button";
import { 
  Plus, 
  List, 
  LayoutGrid 
} from "lucide-react";

interface ClientManagementHeaderProps {
  onAddClick: () => void;
  onViewChange: (view: 'list' | 'card') => void;
  currentView: 'list' | 'card';
}

export default function ClientManagementHeader({
  onAddClick,
  onViewChange,
  currentView,
}: ClientManagementHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-bold">All Clients</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your client relationships</p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          className="bg-primary hover:bg-gray-800 text-white"
          onClick={onAddClick}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>Add Client</span>
        </Button>
        
        <div className="flex items-center border border-gray-300 rounded-md">
          <Button
            type="button"
            variant="ghost"
            className={`px-3 py-2 ${currentView === 'list' ? 'bg-accent text-white' : 'bg-white text-gray-600'} rounded-l-md`}
            onClick={() => onViewChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`px-3 py-2 ${currentView === 'card' ? 'bg-accent text-white' : 'bg-white text-gray-600'} rounded-r-md`}
            onClick={() => onViewChange('card')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
