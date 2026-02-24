import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const certificateTypes = [
  { value: "clearance", label: "Barangay Clearance" },
  { value: "residency", label: "Certificate of Residency" },
  { value: "indigency", label: "Certificate of Indigency" },
  { value: "birth", label: "Birth Certificate Request" },
  { value: "marriage", label: "Marriage Certificate Request" },
  { value: "death", label: "Death Certificate Request" },
];

const requestSchema = z.object({
  certificate_type: z.enum(["birth", "marriage", "death", "residency", "indigency", "clearance"]),
  purpose: z.string().min(10, "Please provide a detailed purpose"),
  requestor_name: z.string().min(2, "Name is required"),
  requestor_address: z.string().optional(),
  requestor_contact: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface CertificateRequest {
  id: string;
  certificate_type: string;
  status: string;
  purpose: string;
  created_at: string;
  certificate_number: string | null;
}

const statusConfig = {
  pending: { icon: Clock, color: "bg-warning/10 text-warning", label: "Pending" },
  processing: { icon: AlertCircle, color: "bg-info/10 text-info", label: "Processing" },
  approved: { icon: CheckCircle, color: "bg-accent/10 text-accent", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Rejected" },
  completed: { icon: CheckCircle, color: "bg-primary/10 text-primary", label: "Completed" },
};

export default function Certificates() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<{ first_name: string; last_name: string; address: string } | null>(null);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      certificate_type: "clearance",
      purpose: "",
      requestor_name: "",
      requestor_address: "",
      requestor_contact: "",
    },
  });

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
      // Fetch profile for default values
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, address")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        form.setValue("requestor_name", `${profileData.first_name} ${profileData.last_name}`);
        form.setValue("requestor_address", profileData.address || "");
      }

      // Fetch requests
      const { data: requestsData } = await supabase
        .from("certificate_requests")
        .select("id, certificate_type, status, purpose, created_at, certificate_number")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (requestsData) {
        setRequests(requestsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("certificate_requests").insert({
        user_id: user!.id,
        certificate_type: data.certificate_type,
        purpose: data.purpose,
        requestor_name: data.requestor_name,
        requestor_address: data.requestor_address,
        requestor_contact: data.requestor_contact,
      });

      if (error) throw error;

      toast({ title: "Request submitted", description: "Your certificate request has been submitted successfully." });
      setIsDialogOpen(false);
      form.reset({
        certificate_type: "clearance",
        purpose: "",
        requestor_name: profile ? `${profile.first_name} ${profile.last_name}` : "",
        requestor_address: profile?.address || "",
        requestor_contact: "",
      });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Certificates & Documents</h1>
              <p className="text-muted-foreground mt-1">Request and track your barangay certificates</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Request Certificate</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Certificate Type *</Label>
                    <Select
                      value={form.watch("certificate_type")}
                      onValueChange={(value: any) => form.setValue("certificate_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {certificateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requestor_name">Full Name *</Label>
                    <Input id="requestor_name" {...form.register("requestor_name")} />
                    {form.formState.errors.requestor_name && (
                      <p className="text-sm text-destructive">{form.formState.errors.requestor_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requestor_address">Address</Label>
                    <Input id="requestor_address" {...form.register("requestor_address")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requestor_contact">Contact Number</Label>
                    <Input id="requestor_contact" {...form.register("requestor_contact")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Textarea
                      id="purpose"
                      placeholder="Please specify the purpose of this certificate request..."
                      rows={3}
                      {...form.register("purpose")}
                    />
                    {form.formState.errors.purpose && (
                      <p className="text-sm text-destructive">{form.formState.errors.purpose.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Certificate Types */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {certificateTypes.map((type, index) => (
              <motion.button
                key={type.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  form.setValue("certificate_type", type.value as any);
                  setIsDialogOpen(true);
                }}
                className="p-4 bg-card rounded-xl border border-border hover:shadow-lg hover:-translate-y-1 transition-all text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{type.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Requests List */}
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Your Requests</h2>
            {loadingRequests ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : requests.length > 0 ? (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Purpose</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {requests.map((request) => {
                        const status = statusConfig[request.status as keyof typeof statusConfig];
                        const StatusIcon = status?.icon || Clock;
                        return (
                          <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <span className="font-medium capitalize">
                                  {request.certificate_type.replace("_", " ")}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-muted-foreground max-w-xs truncate">
                              {request.purpose}
                            </td>
                            <td className="px-4 py-4 text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {status?.label}
                              </span>
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
                <h3 className="font-medium text-foreground mb-1">No requests yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by requesting a certificate or document
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
