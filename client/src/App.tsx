import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetail from "@/pages/ClientDetail";
import AuthPage from "@/pages/auth-page";
import SharedSiteMapPage from "@/pages/SharedSiteMapPage";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <ProtectedRoute path="/" component={ClientsPage} />}
      </Route>
      <Route path="/clients/:id">
        {() => <ProtectedRoute path="/clients/:id" component={ClientDetail} />}
      </Route>
      <Route path="/auth">
        {() => <AuthPage />}
      </Route>
      <Route path="/share/site-map/:shareToken">
        {() => <SharedSiteMapPage />}
      </Route>
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
