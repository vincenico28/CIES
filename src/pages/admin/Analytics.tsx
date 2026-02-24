import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  ClipboardList,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";

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

  if (authLoading || roleLoading) {
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
          {/* Overview Stats */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard label="Total Requests" value={requestStats.total} icon={FileText} color="text-primary" index={0} />
              <StatsCard label="Pending Requests" value={requestStats.pending} icon={Clock} color="text-warning" index={1} />
              <StatsCard label="Total Feedback" value={feedbackStats.total} icon={MessageSquare} color="text-accent" index={2} />
              <StatsCard label="Total Users" value={userCount} icon={Users} color="text-info" index={3} />
            </div>
          </section>

          {/* Certificate Request Stats */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Certificate Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard label="Total" value={requestStats.total} icon={FileText} color="text-primary" index={0} />
              <StatsCard label="Pending" value={requestStats.pending} icon={Clock} color="text-warning" index={1} />
              <StatsCard label="Processing" value={requestStats.processing} icon={AlertCircle} color="text-info" index={2} />
              <StatsCard label="Completed" value={requestStats.completed} icon={CheckCircle} color="text-accent" index={3} />
            </div>
          </section>

          {/* Feedback Stats */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Feedback & Grievances</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard label="Total" value={feedbackStats.total} icon={MessageSquare} color="text-primary" index={0} />
              <StatsCard label="Pending" value={feedbackStats.pending} icon={Clock} color="text-warning" index={1} />
              <StatsCard label="Resolved" value={feedbackStats.resolved} icon={CheckCircle} color="text-accent" index={2} />
            </div>
          </section>

          {/* Surveys */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Surveys</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard label="Total Surveys" value={surveyCount} icon={ClipboardList} color="text-primary" index={0} />
              <StatsCard label="Total Responses" value={surveyResponseCount} icon={CheckCircle} color="text-accent" index={1} />
              <StatsCard label="Growth" value="+12%" icon={TrendingUp} color="text-warning" index={2} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}