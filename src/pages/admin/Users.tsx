import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  MoreHorizontal,
  Shield,
  Mail,
  Phone,
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
  email: string | null;
  phone: string | null;
  created_at: string;
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
        .select("id, user_id, first_name, last_name, email, phone, created_at")
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

  const filteredUsers = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>View Activity</DropdownMenuItem>
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
      </main>
    </div>
  );
}