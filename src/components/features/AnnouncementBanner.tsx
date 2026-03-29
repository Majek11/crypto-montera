import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, AlertTriangle, CheckCircle, Wrench, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AnnouncementType = "info" | "warning" | "success" | "maintenance";

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: AnnouncementType;
}

const typeStyles: Record<AnnouncementType, { icon: any; wrap: string; title: string; icon_cls: string }> = {
    info: { icon: Info, wrap: "bg-blue-400/10 border-blue-400/30", title: "text-blue-400", icon_cls: "text-blue-400" },
    warning: { icon: AlertTriangle, wrap: "bg-amber-400/10 border-amber-400/30", title: "text-amber-400", icon_cls: "text-amber-400" },
    success: { icon: CheckCircle, wrap: "bg-accent-dim border-primary/30", title: "text-primary", icon_cls: "text-primary" },
    maintenance: { icon: Wrench, wrap: "bg-orange-400/10 border-orange-400/30", title: "text-orange-400", icon_cls: "text-orange-400" },
};

const AnnouncementBanner = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    // Track which IDs the user has dismissed THIS session
    const [dismissed, setDismissed] = useState<Set<string>>(() => {
        try {
            const stored = sessionStorage.getItem("dismissed_announcements");
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from("platform_announcements")
                .select("id, title, message, type")
                .eq("is_active", true)
                .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
                .order("created_at", { ascending: false });
            if (data) setAnnouncements(data as Announcement[]);
        };
        fetch();
    }, []);

    const dismiss = (id: string) => {
        const next = new Set(dismissed).add(id);
        setDismissed(next);
        try { sessionStorage.setItem("dismissed_announcements", JSON.stringify([...next])); } catch { }
    };

    const visible = announcements.filter((a) => !dismissed.has(a.id));

    if (visible.length === 0) return null;

    return (
        <div className="space-y-2 mb-6">
            <AnimatePresence>
                {visible.map((ann) => {
                    const s = typeStyles[ann.type] || typeStyles.info;
                    const Icon = s.icon;
                    return (
                        <motion.div
                            key={ann.id}
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${s.wrap}`}
                        >
                            <Icon size={15} className={`${s.icon_cls} shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                                <p className={`font-body text-sm font-semibold ${s.title}`}>{ann.title}</p>
                                <p className="font-body text-xs text-muted-foreground mt-0.5">{ann.message}</p>
                            </div>
                            <button
                                onClick={() => dismiss(ann.id)}
                                className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Dismiss"
                            >
                                <X size={13} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default AnnouncementBanner;
