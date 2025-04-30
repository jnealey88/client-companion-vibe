import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetail from "@/pages/ClientDetail";
import LoginPage from "@/pages/LoginPage";
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
      <Route path="/login">
        {() => <LoginPage />}
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
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
