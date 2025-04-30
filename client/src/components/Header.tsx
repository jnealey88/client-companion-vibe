import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/components/auth/AuthStatus";

interface HeaderProps {
  onSearch?: (searchTerm: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };
  
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <Link href="/" className="text-xl font-semibold hover:text-primary">
          Clients
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative w-64">
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 rounded-md"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
        </div>
        
        <Link href="/help" className="text-gray-600 hover:text-gray-900">
          <span>Help Center</span>
        </Link>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-600 hover:text-gray-900"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </Button>
        </div>
        <AuthStatus />
      </div>
    </header>
  );
}
