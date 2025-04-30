import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the client management platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center pt-4 pb-2">
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to sign in with your Replit account
            </p>
            <Button 
              onClick={handleLogin} 
              className="w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <LogIn className="h-4 w-4" />
              <span>Sign in with Replit</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-muted-foreground">
          <p>Secure authentication powered by Replit</p>
        </CardFooter>
      </Card>
    </div>
  );
}