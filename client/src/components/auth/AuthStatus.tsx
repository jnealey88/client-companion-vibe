import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function AuthStatus() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="flex items-center gap-2">
      <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
      <span>Loading...</span>
    </div>;
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        {user?.profileImageUrl && (
          <img 
            src={user.profileImageUrl} 
            alt={user.username || "User"} 
            className="h-8 w-8 rounded-full"
          />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user?.username}</span>
          <a 
            href="/api/logout" 
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Log out
          </a>
        </div>
      </div>
    );
  }

  return (
    <a href="/api/login">
      <Button size="sm">Log in</Button>
    </a>
  );
}