import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, Info, CheckCircle, Megaphone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_audience: string;
  is_read_by: string[] | null;
  created_at: string;
  expires_at: string | null;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  alert: { icon: AlertTriangle, color: "bg-warning/10 text-warning" },
  announcement: { icon: Megaphone, color: "bg-primary/10 text-primary" },
  info: { icon: Info, color: "bg-info/10 text-info" },
  event: { icon: Calendar, color: "bg-accent/10 text-accent" },
  success: { icon: CheckCircle, color: "bg-accent/10 text-accent" },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error) {
        // Filter out expired notifications
        const validNotifications = data.filter(n => 
          !n.expires_at || new Date(n.expires_at) > new Date()
        );
        setNotifications(validNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    const currentReadBy = notification.is_read_by || [];
    if (currentReadBy.includes(user.id)) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read_by: [...currentReadBy, user.id] })
      .eq("id", notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read_by: [...currentReadBy, user.id] }
            : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadNotifications = notifications.filter(
      n => !n.is_read_by?.includes(user.id)
    );

    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }

    toast({
      title: "All notifications marked as read",
    });
  };

  const isRead = (notification: Notification) => {
    return notification.is_read_by?.includes(user?.id || "") || false;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !isRead(n);
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter(n => !isRead(n)).length;

  const categories = [
    { label: "All", value: "all", count: notifications.length },
    { label: "Unread", value: "unread", count: unreadCount },
    { label: "Alerts", value: "alert", count: notifications.filter(n => n.type === "alert").length },
    { label: "Announcements", value: "announcement", count: notifications.filter(n => n.type === "announcement").length },
    { label: "Events", value: "event", count: notifications.filter(n => n.type === "event").length },
  ];

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
      <div className="container py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Notifications & Alerts</h1>
              <p className="text-muted-foreground mt-1">
                Stay updated with community announcements and important notices
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={activeFilter === category.value ? "default" : "outline"}
                size="sm"
                className="shrink-0"
                onClick={() => setActiveFilter(category.value)}
              >
                {category.label}
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  activeFilter === category.value ? "bg-primary-foreground/20" : "bg-muted"
                }`}>
                  {category.count}
                </span>
              </Button>
            ))}
          </div>

          {/* Notifications List */}
          {loadingNotifications ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification, index) => {
                const config = typeConfig[notification.type] || typeConfig.info;
                const Icon = config.icon;
                const read = isRead(notification);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => markAsRead(notification.id)}
                    className={`bg-card rounded-xl border p-5 transition-all hover:shadow-md cursor-pointer ${
                      read ? "border-border" : "border-primary/30 bg-primary/5"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`h-12 w-12 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className={`font-semibold ${!read ? "text-primary" : "text-foreground"}`}>
                              {notification.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!read && (
                            <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-muted-foreground">
                            {getRelativeTime(notification.created_at)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${config.color}`}>
                            {notification.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {activeFilter === "all" 
                  ? "You're all caught up! Check back later for updates."
                  : "No notifications match this filter."}
              </p>
            </div>
          )}

          {/* Notification Settings */}
          <div className="bg-muted/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Notification Preferences</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Notifications are managed by your barangay administrators. Contact the barangay hall for notification preferences.
            </p>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
