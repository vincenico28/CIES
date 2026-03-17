import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, MapPin, Calendar, Save, FileText, AlertCircle, CheckCircle, Clock, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  first_name: z.string().min(2, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(2, "Last name is required"),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  civil_status: z.string().optional(),
  address: z.string().optional(),
  barangay: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  zip_code: z.string().optional(),
  id_type: z.string().optional(),
  id_number: z.string().optional(),
  id_expiry_date: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Registry() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [idVerificationStatus, setIdVerificationStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(null);
  const [showIdPreview, setShowIdPreview] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      suffix: "",
      email: "",
      phone: "",
      birth_date: "",
      gender: "",
      civil_status: "",
      address: "",
      barangay: "",
      city: "",
      province: "",
      zip_code: "",
      id_type: "",
      id_number: "",
      id_expiry_date: "",
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (data && !error) {
        form.reset({
          first_name: data.first_name || "",
          middle_name: data.middle_name || "",
          last_name: data.last_name || "",
          suffix: data.suffix || "",
          email: data.email || "",
          phone: data.phone || "",
          birth_date: data.birth_date || "",
          gender: data.gender || "",
          civil_status: data.civil_status || "",
          address: data.address || "",
          barangay: data.barangay || "",
          city: data.city || "",
          province: data.province || "",
          zip_code: data.zip_code || "",
          id_type: data.id_type || "",
          id_number: data.id_number || "",
          id_expiry_date: data.id_expiry_date || "",
        });
        setIdVerificationStatus(data.id_verification_status as "pending" | "approved" | "rejected" | null);
        setIdDocumentUrl(data.id_document_url);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user!.id);

      if (error) throw error;

      toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIdUpload = async (file: File) => {
    if (!user) return;

    setIsUploadingId(true);
    try {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        toast({ variant: "destructive", title: "Invalid file type", description: "Please upload an image (JPG, PNG, GIF) or PDF." });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Please upload a file smaller than 5MB." });
        return;
      }

      const timestamp = Date.now();
      const fileName = `${user.id}/id_${timestamp}_${file.name}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(fileName);

      // Update profile with ID document URL and reset verification status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          id_document_url: urlData.publicUrl,
          id_verification_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setIdDocumentUrl(urlData.publicUrl);
      setIdVerificationStatus("pending");
      setIdFile(null);

      toast({ title: "ID uploaded", description: "Your ID has been uploaded and is pending review." });
    } catch (error) {
      console.error("Error uploading ID:", error);
      toast({ variant: "destructive", title: "Upload failed", description: "Failed to upload your ID document." });
    } finally {
      setIsUploadingId(false);
    }
  };

  if (loading || loadingProfile) {
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
      <div className="container py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Citizen Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal information and contact details
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-lg font-semibold">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" {...form.register("first_name")} />
                  {form.formState.errors.first_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input id="middle_name" {...form.register("middle_name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" {...form.register("last_name")} />
                  {form.formState.errors.last_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input id="suffix" placeholder="Jr., Sr., III" {...form.register("suffix")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Birth Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="birth_date" type="date" className="pl-10" {...form.register("birth_date")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={form.watch("gender")}
                    onValueChange={(value) => form.setValue("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="civil_status">Civil Status</Label>
                  <Select
                    value={form.watch("civil_status")}
                    onValueChange={(value) => form.setValue("civil_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="separated">Separated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-accent" />
                </div>
                <h2 className="font-display text-lg font-semibold">Contact Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="email" type="email" className="pl-10" {...form.register("email")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="phone" type="tel" className="pl-10" placeholder="+63 900 000 0000" {...form.register("phone")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-info" />
                </div>
                <h2 className="font-display text-lg font-semibold">Address</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" placeholder="House No., Street Name" {...form.register("address")} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barangay">Barangay</Label>
                    <Input id="barangay" {...form.register("barangay")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City/Municipality</Label>
                    <Input id="city" {...form.register("city")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Input id="province" {...form.register("province")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input id="zip_code" {...form.register("zip_code")} />
                  </div>
                </div>
              </div>
            </div>

            {/* ID Verification Section */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
                <h2 className="font-display text-lg font-semibold">Valid ID Verification</h2>
              </div>

              {/* Verification Status Alert */}
              {idVerificationStatus && (
                <Alert className={`border-l-4 ${
                  idVerificationStatus === "approved"
                    ? "border-l-green-500 bg-green-50"
                    : idVerificationStatus === "rejected"
                    ? "border-l-red-500 bg-red-50"
                    : "border-l-yellow-500 bg-yellow-50"
                }`}>
                  <div className="flex items-start gap-3">
                    {idVerificationStatus === "approved" && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />}
                    {idVerificationStatus === "rejected" && <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}
                    {idVerificationStatus === "pending" && <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
                    <div className="space-y-1">
                      <p className="font-semibold text-sm capitalize">
                        {idVerificationStatus === "approved" && "ID Verified"}
                        {idVerificationStatus === "rejected" && "ID Rejected"}
                        {idVerificationStatus === "pending" && "Pending Review"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {idVerificationStatus === "approved" && "Your ID has been verified. You can now access all services."}
                        {idVerificationStatus === "rejected" && "Your ID was rejected. Please upload a valid ID."}
                        {idVerificationStatus === "pending" && "Your ID is under review. You'll be notified once verification is complete."}
                      </p>
                    </div>
                  </div>
                </Alert>
              )}

              {/* ID Type and Number Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_type">ID Type</Label>
                  <Select
                    value={form.watch("id_type")}
                    onValueChange={(value) => form.setValue("id_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national_id">National ID (PhilID)</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="voters_id">Voter's ID</SelectItem>
                      <SelectItem value="senior_id">Senior Citizen ID</SelectItem>
                      <SelectItem value="barangay_id">Barangay ID</SelectItem>
                      <SelectItem value="sss_id">SSS ID</SelectItem>
                      <SelectItem value="tin_id">TIN ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_number">ID Number</Label>
                  <Input id="id_number" {...form.register("id_number")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_expiry_date">ID Expiry Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="id_expiry_date" type="date" className="pl-10" {...form.register("id_expiry_date")} />
                </div>
              </div>

              {/* ID Document Upload */}
              <div className="space-y-3 border-t pt-6">
                <Label>Upload ID Document</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-4">
                  {idDocumentUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">ID Document Uploaded</span>
                      </div>
                      <Dialog open={showIdPreview} onOpenChange={setShowIdPreview}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Document
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>ID Document</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-[70vh] overflow-auto">
                            {idDocumentUrl.endsWith(".pdf") ? (
                              <iframe
                                src={idDocumentUrl}
                                className="w-full h-[600px]"
                              />
                            ) : (
                              <img src={idDocumentUrl} alt="ID Document" className="w-full" />
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <p className="text-xs text-muted-foreground">
                        Status: <Badge variant={idVerificationStatus === "approved" ? "default" : idVerificationStatus === "rejected" ? "destructive" : "secondary"}>
                          {idVerificationStatus || "pending"}
                        </Badge>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Drag and drop your ID here</p>
                        <p className="text-xs text-muted-foreground">or click to browse</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIdFile(file);
                            handleIdUpload(file);
                          }
                        }}
                        disabled={isUploadingId}
                        className="hidden"
                        id="id_upload"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => document.getElementById("id_upload")?.click()}
                        disabled={isUploadingId}
                      >
                        {isUploadingId ? "Uploading..." : "Select File"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Accepted formats: JPG, PNG, GIF, PDF (Max 5MB)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                <Save className="h-5 w-5 mr-2" />
                {isSubmitting ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </MainLayout>
  );
}
