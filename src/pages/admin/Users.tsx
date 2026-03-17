import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  MoreHorizontal,
  Shield,
  Mail,
  Phone,
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

interface ProfileWithRole {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  suffix: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  civil_status: string | null;
  address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  zip_code: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface Profile {
  first_name: string;
  last_name: string;
  email: string | null;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading, isAdminOrHigher } = useUserRole();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<ProfileWithRole[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ProfileWithRole | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && user && !isAdminOrHigher) {
      toast({ title: "Access Denied", description: "You don't have permission to access this page.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [roleLoading, isAdminOrHigher, navigate, user]);

  useEffect(() => {
    if (user && isAdminOrHigher) {
      fetchData();
    }
  }, [user, isAdminOrHigher]);

  const fetchData = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (profileData) setProfile(profileData);

      // Fetch all profiles
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, middle_name, suffix, email, phone, birth_date, gender, civil_status, address, barangay, city, province, zip_code, avatar_url, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (usersData) setUsers(usersData);

      // Fetch all roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesData) {
        const rolesMap = new Map<string, string>();
        rolesData.forEach((r: UserRole) => rolesMap.set(r.user_id, r.role));
        setUserRoles(rolesMap);
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

  const handleViewProfile = (userData: ProfileWithRole) => {
    setSelectedUser(userData);
    setShowProfileModal(true);
  };

  const handleViewActivity = (userData: ProfileWithRole) => {
    setSelectedUser(userData);
    setShowActivityModal(true);
    fetchUserActivity(userData.user_id);
  };

  const [userActivity, setUserActivity] = useState<{
    certificates: any[];
    feedback: any[];
    surveys: any[];
    loading: boolean;
  }>({ certificates: [], feedback: [], surveys: [], loading: false });

  const filteredUsers = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchUserActivity = async (userId: string) => {
    setUserActivity({ certificates: [], feedback: [], surveys: [], loading: true });
    try {
      // Fetch certificate requests
      const { data: certificateData } = await supabase
        .from("certificate_requests")
        .select("id, certificate_type, status, created_at, updated_at, remarks")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch feedback
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("id, subject, category, status, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch survey responses
      const { data: surveyData } = await supabase
        .from("survey_responses")
        .select("id, survey_id, submitted_at, surveys(title)")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false });

      setUserActivity({
        certificates: certificateData || [],
        feedback: feedbackData || [],
        surveys: surveyData || [],
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching user activity:", error);
      setUserActivity({ certificates: [], feedback: [], surveys: [], loading: false });
    }
  };

  const roleColors: Record<string, string> = {
    resident: "bg-muted text-muted-foreground",
    staff: "bg-info/10 text-info",
    captain: "bg-warning/10 text-warning",
    admin: "bg-accent/10 text-accent",
    super_admin: "bg-primary/10 text-primary",
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
          title="User Management"
          subtitle="Manage user accounts and view user information"
          onSignOut={handleSignOut}
        />

        <div className="p-6 space-y-6">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredUsers.length} of {users.length} users
            </span>
          </div>

          {/* Users Table */}
          {loadingData ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((userData) => {
                      const userRole = userRoles.get(userData.user_id) || "resident";
                      return (
                        <tr key={userData.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {userData.first_name.charAt(0)}{userData.last_name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{userData.first_name} {userData.last_name}</p>
                                <p className="text-sm text-muted-foreground">{userData.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {userData.email && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5" />
                                  {userData.email}
                                </div>
                              )}
                              {userData.phone && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5" />
                                  {userData.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={roleColors[userRole]}>
                              <Shield className="h-3 w-3 mr-1" />
                              {userRole.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(userData.created_at).toLocaleDateString()}
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
                                <DropdownMenuItem onClick={() => handleViewProfile(userData)}>
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewActivity(userData)}>
                                  View Activity
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
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No users found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search term" : "No users have registered yet"}
              </p>
            </div>
          )}
        </div>

        {/* Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Profile - Citizen Registry</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 pb-6 border-b">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-medium text-primary">
                      {selectedUser.first_name.charAt(0)}{selectedUser.last_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">
                      {selectedUser.first_name} 
                      {selectedUser.middle_name && ` ${selectedUser.middle_name}`} 
                      {selectedUser.last_name}
                      {selectedUser.suffix && ` ${selectedUser.suffix}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">{userRoles.get(selectedUser.user_id) || "resident"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Member since {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h4 className="font-semibold text-sm mb-4 text-foreground">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Birth Date</label>
                      <p className="text-sm mt-1">{selectedUser.birth_date ? new Date(selectedUser.birth_date).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Gender</label>
                      <p className="text-sm mt-1 capitalize">{selectedUser.gender || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Civil Status</label>
                      <p className="text-sm mt-1 capitalize">{selectedUser.civil_status || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-sm mb-4 text-foreground">Contact Information</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                      <p className="text-sm mt-1 break-all">{selectedUser.email || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Phone</label>
                      <p className="text-sm mt-1">{selectedUser.phone || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h4 className="font-semibold text-sm mb-4 text-foreground">Address</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Street Address</label>
                      <p className="text-sm mt-1">{selectedUser.address || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Barangay</label>
                      <p className="text-sm mt-1">{selectedUser.barangay || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">City</label>
                      <p className="text-sm mt-1">{selectedUser.city || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Province</label>
                      <p className="text-sm mt-1">{selectedUser.province || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Zip Code</label>
                      <p className="text-sm mt-1">{selectedUser.zip_code || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">System Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-medium text-muted-foreground">User ID</label>
                      <p className="font-mono text-xs break-all mt-1">{selectedUser.user_id}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Profile ID</label>
                      <p className="font-mono text-xs break-all mt-1">{selectedUser.id}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="font-medium text-muted-foreground">Last Updated</label>
                      <p className="text-xs mt-1">{new Date(selectedUser.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <Button onClick={() => setShowProfileModal(false)} className="w-full">
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Activity Modal */}
        <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Activity - {selectedUser?.first_name} {selectedUser?.last_name}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                {userActivity.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {/* Account Activity */}
                    <div>
                      <h4 className="font-semibold text-sm mb-4 text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Account Activity
                      </h4>
                      <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">Account Created</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(selectedUser.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">Last Updated</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(selectedUser.updated_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Requests */}
                    <div>
                      <h4 className="font-semibold text-sm mb-4 text-foreground">
                        Certificate Requests ({userActivity.certificates.length})
                      </h4>
                      {userActivity.certificates.length > 0 ? (
                        <div className="space-y-3">
                          {userActivity.certificates.map((cert: any) => (
                            <div key={cert.id} className="bg-muted/50 rounded-lg p-4 border-l-4 border-blue-500">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-sm font-medium capitalize">{cert.certificate_type?.replace(/_/g, " ")}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(cert.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`text-xs ${
                                  cert.status === "approved" ? "bg-green-500/10 text-green-700" :
                                  cert.status === "pending" ? "bg-yellow-500/10 text-yellow-700" :
                                  cert.status === "rejected" ? "bg-red-500/10 text-red-700" :
                                  "bg-gray-500/10 text-gray-700"
                                }`}>
                                  {cert.status || "unknown"}
                                </Badge>
                              </div>
                              {cert.remarks && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  <span className="font-medium">Remarks:</span> {cert.remarks}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">No certificate requests</p>
                      )}
                    </div>

                    {/* Feedback Submissions */}
                    <div>
                      <h4 className="font-semibold text-sm mb-4 text-foreground">
                        Feedback Submissions ({userActivity.feedback.length})
                      </h4>
                      {userActivity.feedback.length > 0 ? (
                        <div className="space-y-3">
                          {userActivity.feedback.map((fb: any) => (
                            <div key={fb.id} className="bg-muted/50 rounded-lg p-4 border-l-4 border-purple-500">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-sm font-medium">{fb.subject}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <span className="capitalize">{fb.category}</span> • {new Date(fb.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`text-xs ${
                                  fb.status === "resolved" ? "bg-green-500/10 text-green-700" :
                                  fb.status === "in_progress" ? "bg-blue-500/10 text-blue-700" :
                                  fb.status === "new" ? "bg-yellow-500/10 text-yellow-700" :
                                  "bg-gray-500/10 text-gray-700"
                                }`}>
                                  {fb.status || "unknown"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">No feedback submissions</p>
                      )}
                    </div>

                    {/* Survey Responses */}
                    <div>
                      <h4 className="font-semibold text-sm mb-4 text-foreground">
                        Survey Responses ({userActivity.surveys.length})
                      </h4>
                      {userActivity.surveys.length > 0 ? (
                        <div className="space-y-3">
                          {userActivity.surveys.map((survey: any) => (
                            <div key={survey.id} className="bg-muted/50 rounded-lg p-4 border-l-4 border-green-500">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium">{survey.surveys?.title || "Survey"}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Submitted on {new Date(survey.submitted_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">No survey responses</p>
                      )}
                    </div>

                    {/* Activity Summary */}
                    {userActivity.certificates.length === 0 && 
                     userActivity.feedback.length === 0 && 
                     userActivity.surveys.length === 0 && (
                      <div className="bg-muted/50 rounded-lg p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No activities recorded yet. User has not made any requests or submissions.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <Button onClick={() => setShowActivityModal(false)} className="w-full">
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}