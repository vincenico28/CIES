import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MoreHorizontal,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

interface IDVerificationRecord {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  id_type: string | null;
  id_number: string | null;
  id_expiry_date: string | null;
  id_document_url: string | null;
  id_verification_status: "pending" | "approved" | "rejected" | null;
  created_at: string;
  updated_at: string;
}

export default function AdminIDVerification() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading, isAdminOrHigher } = useUserRole();
  const { toast } = useToast();

  const [records, setRecords] = useState<IDVerificationRecord[]>([]);
  const [profile, setProfile] = useState<{ first_name: string; last_name: string; email: string | null } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<IDVerificationRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdminOrHigher) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [roleLoading, isAdminOrHigher, navigate, toast]);

  useEffect(() => {
    if (user && isAdminOrHigher) {
      fetchProfile();
      fetchRecords();
    }
  }, [user, isAdminOrHigher]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (data && !error) {
        setProfile(data as { first_name: string; last_name: string; email: string | null });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Filter records that have ID documents
      const recordsWithIds = data.filter((record) => record.id_document_url);

      setRecords(recordsWithIds as IDVerificationRecord[]);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast({
        title: "Error",
        description: "Failed to load ID verification records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (record: IDVerificationRecord) => {
    setProcessingId(record.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          id_verification_status: "approved",
          id_verified_by: user?.id,
          id_verified_at: new Date().toISOString(),
          id_rejection_reason: null,
        })
        .eq("id", record.id);

      if (error) throw error;

      toast({
        title: "ID Approved",
        description: `${record.first_name} ${record.last_name}'s ID has been approved.`,
      });

      fetchRecords();
    } catch (error) {
      console.error("Error approving ID:", error);
      toast({
        title: "Error",
        description: "Failed to approve ID.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (record: IDVerificationRecord) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a rejection reason.",
        variant: "destructive",
      });
      return;
    }

    setProcessingId(record.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          id_verification_status: "rejected",
          id_verified_by: user?.id,
          id_verified_at: new Date().toISOString(),
          id_rejection_reason: rejectionReason,
        })
        .eq("id", record.id);

      if (error) throw error;

      toast({
        title: "ID Rejected",
        description: `${record.first_name} ${record.last_name}'s ID has been rejected.`,
      });

      setRejectionReason("");
      setShowRejectDialog(false);
      fetchRecords();
    } catch (error) {
      console.error("Error rejecting ID:", error);
      toast({
        title: "Error",
        description: "Failed to reject ID.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRecords = records.filter((record) => {
    const query = searchQuery.toLowerCase();
    return (
      record.first_name.toLowerCase().includes(query) ||
      record.last_name.toLowerCase().includes(query) ||
      (record.email && record.email.toLowerCase().includes(query)) ||
      (record.id_number && record.id_number.toLowerCase().includes(query))
    );
  });

  const pendingCount = records.filter((r) => r.id_verification_status === "pending").length;
  const approvedCount = records.filter((r) => r.id_verification_status === "approved").length;
  const rejectedCount = records.filter((r) => r.id_verification_status === "rejected").length;

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
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
          title="ID Verification"
          subtitle="Review and verify citizen ID documents"
          onSignOut={handleSignOut}
        />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">ID Verification</h1>
              <p className="text-muted-foreground">Review and verify citizen ID documents</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or ID number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Records Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Citizen Name</th>
                    <th className="px-6 py-3 text-left font-medium">Email</th>
                    <th className="px-6 py-3 text-left font-medium">ID Type</th>
                    <th className="px-6 py-3 text-left font-medium">ID Number</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-left font-medium">Submitted</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                        No ID documents to review
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/50">
                        <td className="px-6 py-4 font-medium">
                          {record.first_name} {record.last_name}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{record.email || "—"}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {record.id_type ? record.id_type.replace(/_/g, " ") : "—"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{record.id_number || "—"}</td>
                        <td className="px-6 py-4">
                          {record.id_verification_status === "pending" && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {record.id_verification_status === "approved" && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {record.id_verification_status === "rejected" && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(record.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowPreview(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Document
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {record.id_verification_status !== "approved" && (
                                <DropdownMenuItem
                                  onClick={() => handleApprove(record)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  {processingId === record.id ? "Approving..." : "Approve"}
                                </DropdownMenuItem>
                              )}
                              {record.id_verification_status !== "rejected" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Document Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>ID Document - {selectedRecord?.first_name} {selectedRecord?.last_name}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-auto">
              {selectedRecord?.id_document_url?.endsWith(".pdf") ? (
                <iframe
                  src={selectedRecord.id_document_url}
                  className="w-full h-[600px]"
                />
              ) : (
                <img src={selectedRecord?.id_document_url || ""} alt="ID Document" className="w-full" />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject ID Document</AlertDialogTitle>
              <AlertDialogDescription>
                Provide a reason for rejecting {selectedRecord?.first_name}'s ID document.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejection_reason">Rejection Reason</Label>
                <Textarea
                  id="rejection_reason"
                  placeholder="e.g., Document expired, Poor image quality, Invalid ID type, etc."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="resize-none h-24"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedRecord && handleReject(selectedRecord)}
                disabled={processingId !== null || !rejectionReason.trim()}
                className="bg-destructive hover:bg-destructive/90"
              >
                {processingId ? "Processing..." : "Reject"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
