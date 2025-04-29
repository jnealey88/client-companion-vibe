import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Users, 
  FolderClosed, 
  BarChart, 
  Settings, 
  HelpCircle, 
  ShoppingCart 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <div className="bg-white w-16 flex-shrink-0 border-r border-gray-200">
      <div className="h-full flex flex-col items-center">
        <div className="p-4">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">
            CM
          </div>
        </div>
        
        <nav className="flex-1 w-full">
          <ul className="space-y-4 py-6">
            <li>
              <Link href="/">
                <a className={cn(
                  "sidebar-link",
                  isActive("/") ? "sidebar-link-active" : "sidebar-link-inactive"
                )}>
                  <Home className="h-5 w-5" />
                </a>
              </Link>
            </li>
            <li>
              <Link href="/">
                <a className={cn(
                  "sidebar-link",
                  isActive("/clients") || isActive("/") ? "sidebar-link-active" : "sidebar-link-inactive"
                )}>
                  <Users className="h-5 w-5" />
                </a>
              </Link>
            </li>
            <li>
              <Link href="/projects">
                <a className={cn(
                  "sidebar-link",
                  isActive("/projects") ? "sidebar-link-active" : "sidebar-link-inactive"
                )}>
                  <FolderClosed className="h-5 w-5" />
                </a>
              </Link>
            </li>
            <li>
              <Link href="/reports">
                <a className={cn(
                  "sidebar-link",
                  isActive("/reports") ? "sidebar-link-active" : "sidebar-link-inactive"
                )}>
                  <BarChart className="h-5 w-5" />
                </a>
              </Link>
            </li>
            <li>
              <Link href="/settings">
                <a className={cn(
                  "sidebar-link",
                  isActive("/settings") ? "sidebar-link-active" : "sidebar-link-inactive"
                )}>
                  <Settings className="h-5 w-5" />
                </a>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 mb-4">
          <Link href="/help">
            <a className="sidebar-link sidebar-link-inactive">
              <HelpCircle className="h-5 w-5" />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
