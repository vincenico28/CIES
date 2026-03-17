import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  FileText,
  MessageSquare,
  ClipboardList,
  Bell,
  LogOut,
  Settings,
  Shield,
  BarChart3,
  UserCog,
  IdCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  roles?: AppRole[];
}

const navItems: NavItem[] = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "My Profile", href: "/registry" },
  { icon: FileText, label: "Certificates", href: "/certificates" },
  { icon: MessageSquare, label: "Feedback", href: "/feedback" },
  { icon: ClipboardList, label: "Surveys", href: "/surveys" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  // Staff and higher only
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics", roles: ["staff", "captain", "admin", "super_admin"] },
  { icon: FileText, label: "Manage Requests", href: "/admin/requests", roles: ["staff", "captain", "admin", "super_admin"] },
  { icon: MessageSquare, label: "Manage Feedback", href: "/admin/feedback", roles: ["staff", "captain", "admin", "super_admin"] },
  { icon: ClipboardList, label: "Manage Surveys", href: "/admin/surveys", roles: ["staff", "captain", "admin", "super_admin"] },
  { icon: IdCard, label: "ID Verification", href: "/admin/id-verification", roles: ["staff", "captain", "admin", "super_admin"] },
  // Admin only
  { icon: UserCog, label: "User Management", href: "/admin/users", roles: ["admin", "super_admin"] },
  { icon: Shield, label: "Role Management", href: "/admin/roles", roles: ["admin", "super_admin"] },
  { icon: Settings, label: "Settings", href: "/admin/settings", roles: ["super_admin"] },
];

interface DashboardSidebarProps {
  userRole: AppRole;
  onSignOut: () => void;
}

export function DashboardSidebar({ userRole, onSignOut }: DashboardSidebarProps) {
  const location = useLocation();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <aside className="w-64 flex flex-col shadow-xl border-r border-white/10"
      style={{ background: 'linear-gradient(180deg, hsl(217 91% 18%) 0%, hsl(217 91% 12%) 100%)' }}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
            <Home className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-display text-lg font-bold text-white block">BarangayConnect</span>
            <span className="text-xs text-white/60 capitalize font-medium">{userRole.replace("_", " ")}</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-white/15 text-white shadow-md border border-white/20"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-sky-400' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_hsl(199_89%_48%)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 rounded-xl py-3"
          onClick={onSignOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}