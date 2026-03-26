import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth-modal";
import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ProjectDetail from "@/pages/project-detail";
import Profile from "@/pages/profile";
import Contributors from "@/pages/contributors";
import Discover from "@/pages/discover";
import Pitches from "@/pages/pitches";
import PitchDetail from "@/pages/pitch-detail";
import AuthCallback from "@/pages/auth-callback";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthenticatedRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/project/:id" component={ProjectDetail} />
        <Route path="/profile" component={Profile} />
        <Route path="/contributors" component={Contributors} />
        <Route path="/discover" component={Discover} />
        <Route path="/pitches" component={Pitches} />
        <Route path="/pitch/:id" component={PitchDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // OAuth callback page — accessible without being signed in
  if (location === "/auth/callback") {
    return <AuthCallback />;
  }

  if (!user) {
    return (
      <>
        <Landing />
        <AuthModal />
      </>
    );
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppContent />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
