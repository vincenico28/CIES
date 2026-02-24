import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  MoreHorizontal,
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { Database } from "@/integrations/supabase/types";

type RequestStatus = Database["public"]["Enums"]["request_status"];

interface Profile {
  first_name: string;
  last_name: string;
  email: string | null;
}

interface CertificateRequest {
  id: string;
  certificate_type: string;
  status: RequestStatus;
  requestor_name: string;
  purpose: string;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  pending: { color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  processing: { color: "bg-info/10 text-info border-info/20", icon: AlertCircle },
  approved: { color: "bg-accent/10 text-accent border-accent/20", icon: CheckCircle },
  rejected: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  completed: { color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle },
};

export default function AdminRequests() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading, isStaffOrHigher } = useUserRole();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (profileData) setProfile(profileData);

      const { data: requestsData } = await supabase
        .from("certificate_requests")
        .select("id, certificate_type, status, requestor_name, purpose, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (requestsData) setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: RequestStatus) => {
    try {
      const { error } = await supabase
        .from("certificate_requests")
        .update({ status: newStatus, processed_by: user!.id, processed_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      toast({ title: "Status Updated", description: `Request status changed to ${newStatus}` });
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update request status", variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
    navigate("/");
  };

  const filteredRequests = filterStatus === "all"
    ? requests
    : requests.filter(r => r.status === filterStatus);

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
          title="Manage Certificate Requests"
          subtitle="Review and process certificate requests from residents"
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
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Showing {filteredRequests.length} of {requests.length} requests
            </span>
          </div>

          {/* Requests Table */}
          {loadingData ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Requestor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRequests.map((request) => {
                      const StatusIcon = statusConfig[request.status]?.icon || Clock;
                      return (
                        <tr key={request.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <span className="font-medium capitalize">{request.certificate_type.replace("_", " ")}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">{request.requestor_name}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-xs">{request.purpose}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={statusConfig[request.status]?.color}>
                              <StatusIcon className="h-3.5 w-3.5 mr-1" />
                              {request.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id, "processing")}>
                                  <AlertCircle className="h-4 w-4 mr-2" /> Mark Processing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id, "approved")}>
                                  <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id, "completed")}>
                                  <CheckCircle className="h-4 w-4 mr-2" /> Complete
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id, "rejected")} className="text-destructive">
                                  <XCircle className="h-4 w-4 mr-2" /> Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No requests found</h3>
              <p className="text-sm text-muted-foreground">
                {filterStatus !== "all" ? "Try changing the filter" : "No certificate requests have been submitted yet"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}