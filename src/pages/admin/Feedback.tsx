import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Reply,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

interface Profile {
  first_name: string;
  last_name: string;
  email: string | null;
}

interface Feedback {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string | null;
  response: string | null;
  created_at: string;
}

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  in_progress: { color: "bg-info/10 text-info border-info/20", icon: AlertCircle },
  resolved: { color: "bg-accent/10 text-accent border-accent/20", icon: CheckCircle },
};

const categoryColors: Record<string, string> = {
  suggestion: "bg-info/10 text-info",
  complaint: "bg-warning/10 text-warning",
  grievance: "bg-destructive/10 text-destructive",
  inquiry: "bg-primary/10 text-primary",
};

export default function AdminFeedback() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading, isStaffOrHigher } = useUserRole();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loadingData, setLoadingData] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState("");

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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (profileData) setProfile(profileData);

      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (feedbackData) setFeedbackList(feedbackData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ status: newStatus })
        .eq("id", feedbackId);

      if (error) throw error;

      toast({ title: "Status Updated", description: `Feedback status changed to ${newStatus}` });
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update feedback status", variant: "destructive" });
    }
  };

  const handleReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return;

    try {
      const { error } = await supabase
        .from("feedback")
        .update({ 
          response: replyText, 
          status: "resolved",
          responded_at: new Date().toISOString(),
          assigned_to: user!.id
        })
        .eq("id", selectedFeedback.id);

      if (error) throw error;

      toast({ title: "Response Sent", description: "Your response has been saved" });
      setReplyDialogOpen(false);
      setReplyText("");
      setSelectedFeedback(null);
      fetchData();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({ title: "Error", description: "Failed to send response", variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
    navigate("/");
  };

  const filteredFeedback = filterStatus === "all"
    ? feedbackList
    : feedbackList.filter(f => f.status === filterStatus);

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
          title="Manage Feedback"
          subtitle="Review and respond to resident feedback and grievances"
          onSignOut={handleSignOut}
        />

        <div className="p-6 space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Feedback</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Showing {filteredFeedback.length} of {feedbackList.length} items
            </span>
          </div>

          {/* Feedback List */}
          {loadingData ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredFeedback.length > 0 ? (
            <div className="space-y-4">
              {filteredFeedback.map((feedback) => {
                const StatusIcon = statusConfig[feedback.status]?.icon || Clock;
                return (
                  <div key={feedback.id} className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{feedback.subject}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={categoryColors[feedback.category]}>
                              {feedback.category}
                            </Badge>
                            <Badge variant="outline" className={statusConfig[feedback.status]?.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {feedback.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelectedFeedback(feedback); setReplyDialogOpen(true); }}>
                            <Reply className="h-4 w-4 mr-2" /> Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateFeedbackStatus(feedback.id, "in_progress")}>
                            <AlertCircle className="h-4 w-4 mr-2" /> Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateFeedbackStatus(feedback.id, "resolved")}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark Resolved
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{feedback.message}</p>
                    {feedback.response && (
                      <div className="bg-muted/50 rounded-lg p-4 mt-4">
                        <p className="text-xs text-muted-foreground mb-1">Response:</p>
                        <p className="text-sm">{feedback.response}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                      Submitted on {new Date(feedback.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No feedback found</h3>
              <p className="text-sm text-muted-foreground">
                {filterStatus !== "all" ? "Try changing the filter" : "No feedback has been submitted yet"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Feedback</DialogTitle>
            <DialogDescription>
              {selectedFeedback?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm">{selectedFeedback?.message}</p>
            </div>
            <Textarea
              placeholder="Type your response..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReply}>Send Response</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}