import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";

interface Profile {
  first_name: string;
  last_name: string;
  email: string | null;
}

interface RequestStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
}

interface FeedbackStats {
  total: number;
  pending: number;
  resolved: number;
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading, isStaffOrHigher } = useUserRole();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requestStats, setRequestStats] = useState<RequestStats>({ total: 0, pending: 0, processing: 0, completed: 0 });
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({ total: 0, pending: 0, resolved: 0 });
  const [surveyCount, setSurveyCount] = useState(0);
  const [surveyResponseCount, setSurveyResponseCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  const overviewData = [
    { name: "Requests", value: requestStats.total, color: "#4F46E5" },
    { name: "Feedback", value: feedbackStats.total, color: "#0EA5E9" },
    { name: "Users", value: userCount, color: "#14B8A6" },
    { name: "Surveys", value: surveyCount, color: "#F97316" },
  ];

  const requestStatusData = [
    { name: "Pending", value: requestStats.pending, color: "#F59E0B" },
    { name: "Processing", value: requestStats.processing, color: "#0EA5E9" },
    { name: "Completed", value: requestStats.completed, color: "#22C55E" },
  ];

  const feedbackStatusData = [
    { name: "Pending", value: feedbackStats.pending, color: "#F59E0B" },
    { name: "Resolved", value: feedbackStats.resolved, color: "#22C55E" },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && user && !isStaffOrHigher) {
      toast({ title: "Access Denied", description: "You don't have permission to access this page.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [roleLoading, isStaffOrHigher, navigate, user]);

  useEffect(() => {
    if (user && isStaffOrHigher) {
      fetchData();
    }
  }, [user, isStaffOrHigher]);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (profileData) setProfile(profileData);

      // Fetch certificate request stats
      const { data: requests } = await supabase
        .from("certificate_requests")
        .select("status");

      if (requests) {
        setRequestStats({
          total: requests.length,
          pending: requests.filter(r => r.status === "pending").length,
          processing: requests.filter(r => r.status === "processing").length,
          completed: requests.filter(r => r.status === "completed").length,
        });
      }

      // Fetch feedback stats
      const { data: feedback } = await supabase
        .from("feedback")
        .select("status");

      if (feedback) {
        setFeedbackStats({
          total: feedback.length,
          pending: feedback.filter(f => f.status === "pending").length,
          resolved: feedback.filter(f => f.status === "resolved").length,
        });
      }

      // Fetch survey count
      const { count: surveyTotal } = await supabase
        .from("surveys")
        .select("*", { count: "exact", head: true });
      
      setSurveyCount(surveyTotal || 0);

      // Fetch survey response count
      const { count: responseTotal } = await supabase
        .from("survey_responses")
        .select("*", { count: "exact", head: true });
      
      setSurveyResponseCount(responseTotal || 0);

      // Fetch user count
      const { count: userTotal } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      
      setUserCount(userTotal || 0);

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

  if (authLoading || roleLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar userRole={role} onSignOut={handleSignOut} />

      <main className="flex-1">
        <DashboardHeader
          profile={profile}
          userRole={role}
          title="Analytics Dashboard"
          subtitle="Overview of all barangay services and activities"
          onSignOut={handleSignOut}
        />

        <div className="p-6 space-y-8">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Totals</h3>
                <ChartContainer className="h-72" config={{ value: { label: "Total" } }}>
                  <BarChart data={overviewData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fill: "var(--muted-foreground)" }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="value" name="Total">
                      {overviewData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Request Status</h3>
                <ChartContainer
                  className="h-72"
                  config={{
                    Pending: { label: "Pending" },
                    Processing: { label: "Processing" },
                    Completed: { label: "Completed" },
                  }}
                >
                  <BarChart data={requestStatusData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fill: "var(--muted-foreground)" }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="value" name="Requests">
                      {requestStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Feedback & Grievances</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Status Breakdown</h3>
                <ChartContainer
                  className="h-72"
                  config={{
                    Pending: { label: "Pending" },
                    Resolved: { label: "Resolved" },
                  }}
                >
                  <BarChart data={feedbackStatusData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fill: "var(--muted-foreground)" }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="value" name="Feedback">
                      {feedbackStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </section>

          {/* Surveys */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Surveys</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Survey Activity</h3>
                <ChartContainer className="h-72" config={{ value: { label: "Surveys" } }}>
                  <BarChart
                    data={[
                      { name: "Surveys", value: surveyCount, color: "#F97316" },
                      { name: "Responses", value: surveyResponseCount, color: "#14B8A6" },
                    ]}
                    margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fill: "var(--muted-foreground)" }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="value" name="Surveys">
                      {[
                        { name: "Surveys", value: surveyCount, color: "#F97316" },
                        { name: "Responses", value: surveyResponseCount, color: "#14B8A6" },
                      ].map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}