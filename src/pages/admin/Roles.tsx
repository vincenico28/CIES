import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Search,
  MoreHorizontal,
  UserCog,
  ChevronUp,
  ChevronDown,
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProfileWithRole {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface UserRoleData {
  id: string;
  user_id: string;
  role: AppRole;
}

interface Profile {
  first_name: string;
  last_name: string;
  email: string | null;
}

const roleHierarchy: AppRole[] = ["resident", "staff", "captain", "admin", "super_admin"];

export default function AdminRoles() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading, isAdminOrHigher, isSuperAdmin } = useUserRole();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<ProfileWithRole[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, UserRoleData>>(new Map());
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

      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, email")
        .order("first_name", { ascending: true });

      if (usersData) setUsers(usersData);

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("id, user_id, role");

      if (rolesData) {
        const rolesMap = new Map<string, UserRoleData>();
        rolesData.forEach((r) => rolesMap.set(r.user_id, r));
        setUserRoles(rolesMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    const existingRole = userRoles.get(userId);
    
    // Prevent non-super_admin from assigning super_admin role
    if (newRole === "super_admin" && !isSuperAdmin) {
      toast({ title: "Access Denied", description: "Only Super Admins can assign this role", variant: "destructive" });
      return;
    }

    try {
      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole, assigned_by: user!.id })
          .eq("id", existingRole.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole, assigned_by: user!.id });

        if (error) throw error;
      }

      toast({ title: "Role Updated", description: `User role changed to ${newRole.replace("_", " ")}` });
      fetchData();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
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
          title="Role Management"
          subtitle="Assign and manage user roles and permissions"
          onSignOut={handleSignOut}
        />

        <div className="p-6 space-y-6">
          {/* Role Legend */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-medium text-foreground mb-3">Role Hierarchy</h3>
            <div className="flex flex-wrap gap-2">
              {roleHierarchy.map((r, index) => (
                <div key={r} className="flex items-center gap-2">
                  <Badge variant="outline" className={roleColors[r]}>
                    <Shield className="h-3 w-3 mr-1" />
                    {r.replace("_", " ")}
                  </Badge>
                  {index < roleHierarchy.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

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
          </div>

          {/* Users List */}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Current Role</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((userData) => {
                      const userRoleData = userRoles.get(userData.user_id);
                      const currentRole = userRoleData?.role || "resident";
                      const isCurrentUser = userData.user_id === user?.id;

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
                                <p className="font-medium">
                                  {userData.first_name} {userData.last_name}
                                  {isCurrentUser && <span className="text-muted-foreground ml-2">(You)</span>}
                                </p>
                                <p className="text-sm text-muted-foreground">{userData.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={roleColors[currentRole]}>
                              <Shield className="h-3 w-3 mr-1" />
                              {currentRole.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isCurrentUser}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {roleHierarchy.map((r) => (
                                  <DropdownMenuItem
                                    key={r}
                                    onClick={() => updateUserRole(userData.user_id, r)}
                                    disabled={r === currentRole || (r === "super_admin" && !isSuperAdmin)}
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    {r.replace("_", " ")}
                                    {r === currentRole && " (current)"}
                                  </DropdownMenuItem>
                                ))}
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
              <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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