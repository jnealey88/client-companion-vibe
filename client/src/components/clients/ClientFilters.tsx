import { useEffect, useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown } from "lucide-react";
import { 
  statusOptions, 
  industryOptions, 
  projectStatusOptions, 
  sortOptions, 
  ClientFilters as ClientFiltersType 
} from "@shared/schema";

interface ClientFiltersProps {
  filters: ClientFiltersType;
  onFilterChange: (filters: ClientFiltersType) => void;
}

export default function ClientFiltersComponent({
  filters,
  onFilterChange,
}: ClientFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ClientFiltersType>(filters);
  
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  const handleFilterChange = (filterKey: keyof ClientFiltersType, value: string) => {
    const updatedFilters = { ...localFilters, [filterKey]: value };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  
  return (
    <div className="bg-white p-4 rounded-md shadow-sm mb-6 flex flex-wrap items-center justify-between">
      <div className="flex items-center space-x-4 mb-2 md:mb-0">
        <div className="relative">
          <Select
            value={localFilters.projectStatus || "All Projects"}
            onValueChange={(value) => handleFilterChange("projectStatus", value)}
          >
            <SelectTrigger className="bg-gray-50 border border-gray-300 rounded-md w-44">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {projectStatusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        {/* Industry filter hidden */}
        
        <div className="relative">
          <Select
            value={localFilters.status || "All Status"}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="bg-gray-50 border border-gray-300 rounded-md w-44">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Select
            value={localFilters.sort || "Sort by: Recent"}
            onValueChange={(value) => handleFilterChange("sort", value)}
          >
            <SelectTrigger className="bg-gray-50 border border-gray-300 rounded-md w-44">
              <SelectValue placeholder="Sort by: Recent" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sortOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" className="bg-gray-50 border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-100">
          <Filter className="h-4 w-4 mr-2" />
          <span>More Filters</span>
        </Button>
      </div>
    </div>
  );
}
