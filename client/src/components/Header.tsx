import { useState } from "react";
import { Link } from "wouter";
import { 
  Search, 
  Bell, 
  ShoppingCart 
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateAvatarFallback } from "@/lib/utils";

interface HeaderProps {
  onSearch?: (searchTerm: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
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
        <h1 className="text-xl font-semibold">Clients</h1>
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
        
        <Link href="/help">
          <a className="text-gray-600 hover:text-gray-900">
            <span>Help Center</span>
          </a>
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
        
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://github.com/shadcn.png" alt="Profile" />
          <AvatarFallback>{generateAvatarFallback("User Profile")}</AvatarFallback>
        </Avatar>
        
        <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
          <ShoppingCart className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
