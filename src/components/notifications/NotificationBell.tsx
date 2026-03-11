import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const typeColors: Record<string, string> = {
  success: "bg-primary/20 text-primary",
  warning: "bg-amber-400/20 text-amber-400",
  error: "bg-destructive/20 text-destructive",
  info: "bg-blue-400/20 text-blue-400",
};

const typeEmoji: Record<string, string> = {
  success: "✅",
  warning: "⚠️",
  error: "❌",
  info: "ℹ️",
};

// Request browser push notification permission
async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// Fire a browser notification
function fireBrowserNotification(title: string, body: string, type: string) {
  if (Notification.permission !== "granted") return;
  const emoji = typeEmoji[type] || "";
  new Notification(`${emoji} ${title}`, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "montera-notification",
  });
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Check push permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
  };

  useEffect(() => {
    fetchNotifications();
    if (!user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          fetchNotifications();
          // Fire browser notification if permission granted
          const n = payload.new as Notification;
          if (n && document.visibilityState === "hidden") {
            fireBrowserNotification(n.title, n.message, n.type);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    fetchNotifications();
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  };

  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    setPushEnabled(granted);
    if (!granted) {
      alert("Please allow notifications in your browser settings to enable push alerts.");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-mono font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-card border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-heading font-bold text-sm text-foreground">Notifications</span>
          <div className="flex items-center gap-2">
            {!pushEnabled && "Notification" in window && (
              <button
                onClick={handleEnablePush}
                className="font-body text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title="Enable browser push notifications"
              >
                <BellOff size={12} /> Enable
              </button>
            )}
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="font-body text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell size={24} className="mx-auto text-muted-foreground mb-2 opacity-50" />
              <p className="font-body text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/30 hover:bg-card-hover transition-colors ${!n.is_read ? "bg-accent-dim/20" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? "bg-primary" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground font-medium truncate">{n.title}</p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded capitalize ${typeColors[n.type] || typeColors.info}`}>
                    {n.type}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
