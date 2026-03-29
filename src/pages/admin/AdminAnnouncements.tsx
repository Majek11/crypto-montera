import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Megaphone, Plus, Trash2, ToggleLeft, ToggleRight,
    Info, AlertTriangle, CheckCircle, Wrench, Clock, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";

type AnnouncementType = "info" | "warning" | "success" | "maintenance";

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: AnnouncementType;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
}

const typeConfig: Record<AnnouncementType, { label: string; icon: any; color: string; bg: string; border: string }> = {
    info: { label: "Info", icon: Info, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
    warning: { label: "Warning", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
    success: { label: "Success", icon: CheckCircle, color: "text-primary", bg: "bg-accent-dim", border: "border-primary/30" },
    maintenance: { label: "Maintenance", icon: Wrench, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
};

const emptyForm = { title: "", message: "", type: "info" as AnnouncementType, expires_at: "" };

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchAnnouncements = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("platform_announcements")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) toast.error("Failed to load announcements");
        else setAnnouncements((data ?? []) as Announcement[]);
        setLoading(false);
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) {
            toast.error("Title and message are required");
            return;
        }
        setSaving(true);
        const payload: any = {
            title: form.title.trim(),
            message: form.message.trim(),
            type: form.type,
            is_active: true,
        };
        if (form.expires_at) payload.expires_at = new Date(form.expires_at).toISOString();

        const { error } = await supabase.from("platform_announcements").insert(payload);
        if (error) toast.error(error.message);
        else {
            toast.success("Announcement published to all users");
            setForm(emptyForm);
            setShowForm(false);
            fetchAnnouncements();
        }
        setSaving(false);
    };

    const toggleActive = async (ann: Announcement) => {
        setTogglingId(ann.id);
        const { error } = await supabase
            .from("platform_announcements")
            .update({ is_active: !ann.is_active })
            .eq("id", ann.id);
        if (error) toast.error(error.message);
        else {
            setAnnouncements((prev) =>
                prev.map((a) => (a.id === ann.id ? { ...a, is_active: !a.is_active } : a))
            );
            toast.success(ann.is_active ? "Announcement hidden from users" : "Announcement shown to users");
        }
        setTogglingId(null);
    };

    const deleteAnnouncement = async (id: string) => {
        setDeletingId(id);
        const { error } = await supabase.from("platform_announcements").delete().eq("id", id);
        if (error) toast.error(error.message);
        else {
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
            toast.success("Announcement deleted");
        }
        setDeletingId(null);
    };

    const isExpired = (ann: Announcement) =>
        ann.expires_at ? new Date(ann.expires_at) < new Date() : false;

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 max-w-4xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-heading font-bold text-3xl text-foreground mb-1 flex items-center gap-3">
                            <Megaphone size={26} className="text-primary" />
                            Platform Announcements
                        </h1>
                        <p className="font-body text-sm text-muted-foreground">
                            Broadcast messages to all users on their dashboard
                        </p>
                    </div>
                    <Button variant="hero" className="gap-2" onClick={() => setShowForm((v) => !v)}>
                        <Plus size={15} /> New Announcement
                    </Button>
                </motion.div>

                {/* Create Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-6"
                        >
                            <form
                                onSubmit={handleCreate}
                                className="bg-card border border-primary/20 rounded-xl p-6 space-y-4"
                            >
                                <h2 className="font-heading font-bold text-base text-foreground">Create New Announcement</h2>

                                {/* Type selector */}
                                <div>
                                    <Label className="font-body text-sm text-muted-foreground mb-2 block">Announcement Type</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {(Object.entries(typeConfig) as [AnnouncementType, any][]).map(([key, cfg]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setForm((f) => ({ ...f, type: key }))}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-body font-medium transition-all ${form.type === key
                                                        ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                                                        : "border-border text-muted-foreground hover:border-border-light"
                                                    }`}
                                            >
                                                <cfg.icon size={13} />
                                                {cfg.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <Label className="font-body text-sm text-muted-foreground">Title *</Label>
                                        <Input
                                            value={form.title}
                                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                            placeholder="e.g. Scheduled Maintenance"
                                            className="mt-1.5 bg-input border-border text-foreground"
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label className="font-body text-sm text-muted-foreground">Message *</Label>
                                        <Textarea
                                            value={form.message}
                                            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                                            placeholder="Write the message users will see on their dashboard..."
                                            className="mt-1.5 bg-input border-border text-foreground"
                                            rows={3}
                                            maxLength={500}
                                        />
                                    </div>
                                    <div>
                                        <Label className="font-body text-sm text-muted-foreground">
                                            Expires At <span className="text-muted-foreground/50">(optional)</span>
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            value={form.expires_at}
                                            onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                                            className="mt-1.5 bg-input border-border text-foreground"
                                        />
                                        <p className="font-body text-xs text-muted-foreground mt-1">Leave empty to show indefinitely</p>
                                    </div>
                                </div>

                                {/* Preview */}
                                {form.title && (
                                    <div>
                                        <p className="font-body text-xs text-muted-foreground mb-2">Preview:</p>
                                        {(() => {
                                            const cfg = typeConfig[form.type];
                                            const Icon = cfg.icon;
                                            return (
                                                <div className={`flex items-start gap-3 border rounded-lg px-4 py-3 ${cfg.bg} ${cfg.border}`}>
                                                    <Icon size={15} className={`${cfg.color} shrink-0 mt-0.5`} />
                                                    <div>
                                                        <p className={`font-body text-sm font-semibold ${cfg.color}`}>{form.title}</p>
                                                        {form.message && <p className="font-body text-xs text-muted-foreground mt-0.5">{form.message}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                                    <Button type="submit" variant="hero" disabled={saving} className="gap-2">
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
                                        {saving ? "Publishing..." : "Publish to All Users"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Announcements List */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-card border border-border rounded-xl h-24 animate-pulse" />
                        ))}
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-12 text-center">
                        <Megaphone size={40} className="text-muted-foreground mx-auto mb-4 opacity-30" />
                        <p className="font-heading font-bold text-lg text-foreground mb-1">No announcements yet</p>
                        <p className="font-body text-sm text-muted-foreground">Create your first announcement to broadcast a message to all users.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {announcements.map((ann, i) => {
                            const cfg = typeConfig[ann.type] || typeConfig.info;
                            const Icon = cfg.icon;
                            const expired = isExpired(ann);
                            return (
                                <motion.div
                                    key={ann.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className={`bg-card border rounded-xl p-5 transition-opacity ${!ann.is_active || expired ? "opacity-60" : "opacity-100"} border-border`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                            <Icon size={16} className={cfg.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <p className="font-heading font-bold text-sm text-foreground">{ann.title}</p>
                                                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-pill ${cfg.bg} ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                                {!ann.is_active && (
                                                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-pill bg-secondary text-muted-foreground">Hidden</span>
                                                )}
                                                {expired && (
                                                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-pill bg-destructive/10 text-destructive flex items-center gap-1">
                                                        <Clock size={9} /> Expired
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-body text-sm text-muted-foreground line-clamp-2">{ann.message}</p>
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                <span className="font-mono text-[10px] text-muted-foreground">
                                                    Created {new Date(ann.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                                                </span>
                                                {ann.expires_at && (
                                                    <span className="font-mono text-[10px] text-muted-foreground">
                                                        Expires {new Date(ann.expires_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Controls */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => toggleActive(ann)}
                                                disabled={togglingId === ann.id}
                                                className="flex items-center gap-1.5 font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                title={ann.is_active ? "Hide from users" : "Show to users"}
                                            >
                                                {togglingId === ann.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : ann.is_active ? (
                                                    <ToggleRight size={20} className="text-primary" />
                                                ) : (
                                                    <ToggleLeft size={20} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => deleteAnnouncement(ann.id)}
                                                disabled={deletingId === ann.id}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                title="Delete announcement"
                                            >
                                                {deletingId === ann.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminAnnouncements;
