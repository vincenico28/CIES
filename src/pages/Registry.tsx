import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, MapPin, Calendar, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Registry() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

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
        });
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
      const { error } = await supabase
        .from("profiles")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user!.id);

      if (error) throw error;

      toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setIsSubmitting(false);
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
