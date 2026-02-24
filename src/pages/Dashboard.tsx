import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  MessageSquare, 
  FileText, 
  ClipboardList, 
  Bell, 
  LogOut,
  User,
  Home,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Shield,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  first_name: string;
  last_name: string;
  email: string | null;
}

interface CertificateRequest {
  id: string;
  certificate_type: string;
  status: string;
  created_at: string;
}

const quickActions = [
  { icon: FileText, label: "Request Certificate", href: "/certificates", color: "bg-primary/10 text-primary" },
  { icon: MessageSquare, label: "Submit Feedback", href: "/feedback", color: "bg-accent/10 text-accent" },
  { icon: ClipboardList, label: "Take Survey", href: "/surveys", color: "bg-warning/10 text-warning" },
  { icon: Users, label: "Update Profile", href: "/registry", color: "bg-info/10 text-info" },
];

const statusColors = {
  pending: "bg-warning/10 text-warning",
  processing: "bg-info/10 text-info",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
  completed: "bg-primary/10 text-primary",
};

const statusIcons = {
  pending: Clock,
  processing: AlertCircle,
  approved: CheckCircle,
  rejected: AlertCircle,
  completed: CheckCircle,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { role, isStaffOrHigher, isCaptainOrHigher, isAdmin } = useUserRole();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch recent requests
      const { data: requestsData } = await supabase
        .from("certificate_requests")
        .select("id, certificate_type, status, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (requestsData) {
        setRequests(requestsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar userRole={role} onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Welcome back{profile ? `, ${profile.first_name}` : ""}!
              </h1>
              <p className="text-muted-foreground text-sm">
                Here's what's happening with your barangay services
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                <Link to="/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link to="/registry">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Quick Actions */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={action.href}
                      className="flex flex-col items-center p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      <div className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-foreground text-center">{action.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Recent Requests */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">Recent Requests</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/certificates">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            {loadingData ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : requests.length > 0 ? (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {requests.map((request) => {
                    const StatusIcon = statusIcons[request.status as keyof typeof statusIcons] || Clock;
                    return (
                      <div key={request.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground capitalize">
                              {request.certificate_type.replace("_", " ")} Certificate
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[request.status as keyof typeof statusColors]}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {request.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-1">No requests yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by requesting a certificate or document
                </p>
                <Button asChild>
                  <Link to="/certificates">Request Certificate</Link>
                </Button>
              </div>
            )}
          </section>

          {/* Stats Overview */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Total Requests", value: requests.length, icon: FileText, color: "text-primary" },
                { label: "Pending", value: requests.filter(r => r.status === "pending").length, icon: Clock, color: "text-warning" },
                { label: "Completed", value: requests.filter(r => r.status === "completed").length, icon: CheckCircle, color: "text-accent" },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-card rounded-xl border border-border p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${stat.color} opacity-50`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
