import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from 'next-themes';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Registry from "./pages/Registry";
import Certificates from "./pages/Certificates";
import Feedback from "./pages/Feedback";
import Surveys from "./pages/Surveys";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
// Admin pages
import AdminAnalytics from "./pages/admin/Analytics";
import AdminRequests from "./pages/admin/Requests";
import AdminFeedback from "./pages/admin/Feedback";
import AdminSurveys from "./pages/admin/Surveys";
import AdminUsers from "./pages/admin/Users";
import AdminRoles from "./pages/admin/Roles";
import AdminIDVerification from "./pages/admin/IDVerification";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system">
      <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/surveys" element={<Surveys />} />
            <Route path="/notifications" element={<Notifications />} />
            {/* Admin Routes */}
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/requests" element={<AdminRequests />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="/admin/surveys" element={<AdminSurveys />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/roles" element={<AdminRoles />} />
            <Route path="/admin/id-verification" element={<AdminIDVerification />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
