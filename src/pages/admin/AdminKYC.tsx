import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Eye, Clock, FileText, ImageIcon, ZoomIn, ZoomOut, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import type { KycVerification, Profile } from "@/types";

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-muted text-muted-foreground", label: "Pending" },
  submitted: { color: "bg-amber-400/10 text-amber-400", label: "Submitted" },
  under_review: { color: "bg-blue-400/10 text-blue-400", label: "Under Review" },
  approved: { color: "bg-accent-dim text-primary", label: "Approved" },
  rejected: { color: "bg-destructive/10 text-destructive", label: "Rejected" },
};

// ─── Document Viewer ──────────────────────────────────────────────────────────

const DocumentViewer = ({
  url,
  label,
  onClose,
}: {
  url: string;
  label: string;
  onClose: () => void;
}) => {
  const [zoom, setZoom] = useState(1);
  const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) || url.startsWith("blob:");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-card border border-border rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {isImage ? <ImageIcon size={16} className="text-primary" /> : <FileText size={16} className="text-primary" />}
            <span className="font-heading font-bold text-sm text-foreground">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="font-mono text-xs text-muted-foreground w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
              </>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Download"
            >
              <Download size={14} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-60px)] flex items-center justify-center bg-background/50 p-4">
          {isImage ? (
            <img
              src={url}
              alt={label}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s ease" }}
              className="max-w-full rounded-lg shadow-xl"
            />
          ) : (
            <iframe
              src={url}
              title={label}
              className="w-full h-[70vh] rounded-lg border border-border"
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── KYC Document Card ────────────────────────────────────────────────────────

const DocButton = ({
  url,
  label,
  onClick,
}: {
  url: string | null;
  label: string;
  onClick: () => void;
}) => {
  if (!url) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-muted-foreground text-xs font-body">
        <FileText size={13} />
        {label}: <span className="italic">Not uploaded</span>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-accent-dim text-xs font-body text-foreground transition-colors group"
    >
      <ImageIcon size={13} className="text-primary" />
      {label}
      <Eye size={12} className="ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminKYC = () => {
  const { user } = useAuth();
  const [kycList, setKycList] = useState<KycVerification[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewer, setViewer] = useState<{ url: string; label: string } | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    kyc: KycVerification | null;
    action: "approve" | "reject" | null;
  }>({ open: false, kyc: null, action: null });
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /** Get a signed URL for a private Supabase storage file */
  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 3600);
    return data?.signedUrl ?? path;
  };

  const openDocument = async (rawUrl: string | null, label: string) => {
    if (!rawUrl) return;
    // If it's already a full URL (public), use as-is; otherwise get signed URL
    const url = rawUrl.startsWith("http") ? rawUrl : await getSignedUrl(rawUrl);
    setViewer({ url, label });
  };

  const fetchKYC = async () => {
    const { data, error } = await supabase
      .from("kyc_verifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { toast.error("Failed to load KYC submissions"); setLoading(false); return; }
    if (data) {
      setKycList(data);
      const userIds = [...new Set(data.map((k) => k.user_id))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("*").in("user_id", userIds);
        if (profs) {
          const map: Record<string, Profile> = {};
          profs.forEach((p) => (map[p.user_id] = p as Profile));
          setProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchKYC(); }, []);

  const openReview = (kyc: KycVerification, action: "approve" | "reject") => {
    setReviewNotes("");
    setReviewDialog({ open: true, kyc, action });
  };

  const submitReview = async () => {
    if (!reviewDialog.kyc || !reviewDialog.action) return;
    setSubmitting(true);

    const status = reviewDialog.action === "approve" ? "approved" : "rejected";
    const { error } = await supabase
      .from("kyc_verifications")
      .update({
        status: status as KycVerification["status"],
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
      })
      .eq("id", reviewDialog.kyc.id);

    if (error) toast.error(error.message);
    else {
      toast.success(`KYC ${status} successfully`);
      // Also create a notification for the user
      await supabase.from("notifications").insert({
        user_id: reviewDialog.kyc.user_id,
        title: status === "approved" ? "✅ KYC Approved" : "❌ KYC Rejected",
        message: status === "approved"
          ? "Your identity verification has been approved. You now have full access."
          : `Your KYC was rejected. ${reviewNotes ? `Reason: ${reviewNotes}` : "Please re-submit with valid documents."}`,
        type: status === "approved" ? "success" : "error",
      });
      setReviewDialog({ open: false, kyc: null, action: null });
      fetchKYC();
    }
    setSubmitting(false);
  };

  const filters = ["all", "submitted", "under_review", "approved", "rejected"];
  const filtered = kycList.filter((k) => filter === "all" || k.status === filter);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">KYC Review</h1>
          <p className="font-body text-sm text-muted-foreground">
            Review identity verifications — click any submission to view documents
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-1 flex-wrap mb-6">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium capitalize transition-all ${filter === f ? "bg-accent-dim text-primary" : "text-muted-foreground hover:text-foreground bg-secondary"
                }`}
            >
              {f === "all" ? `All (${kycList.length})` : `${f.replace("_", " ")} (${kycList.filter((k) => k.status === f).length})`}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg h-24 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Clock size={40} className="text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="font-heading font-bold text-lg text-foreground mb-1">No submissions</p>
            <p className="font-body text-sm text-muted-foreground">
              No KYC submissions match the current filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((kyc, i) => {
              const profile = profiles[kyc.user_id];
              const config = statusConfig[kyc.status] || statusConfig.pending;
              const isExpanded = expandedId === kyc.id;
              const hasDocuments = kyc.document_url || kyc.selfie_url;

              return (
                <motion.div
                  key={kyc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:border-border-light transition-colors"
                >
                  {/* Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                    {/* User info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-primary font-heading font-bold text-sm">
                          {(profile?.display_name || "U")[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">
                          {profile?.display_name || "Unknown User"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{profile?.email}</p>
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                          Submitted: {new Date(kyc.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Doc type + status */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <p className="font-body text-xs text-muted-foreground mb-0.5">Document</p>
                        <p className="font-mono text-xs text-foreground capitalize">
                          {kyc.document_type || "Not specified"}
                        </p>
                      </div>
                      <span className={`font-mono text-xs px-2 py-0.5 rounded-pill ${config.color}`}>
                        {config.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {hasDocuments && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs h-8"
                          onClick={() => setExpandedId(isExpanded ? null : kyc.id)}
                        >
                          <Eye size={12} />
                          {isExpanded ? "Hide" : "View"} Docs
                        </Button>
                      )}
                      {(kyc.status === "submitted" || kyc.status === "under_review") && (
                        <>
                          <Button
                            size="sm"
                            variant="hero"
                            className="gap-1 text-xs h-8"
                            onClick={() => openReview(kyc, "approve")}
                          >
                            <Check size={12} /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1 text-xs h-8"
                            onClick={() => openReview(kyc, "reject")}
                          >
                            <X size={12} /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded document preview */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border px-5 py-4 bg-background/30 overflow-hidden"
                      >
                        <p className="font-body text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                          Uploaded Documents
                        </p>
                        <div className="flex gap-3 flex-wrap">
                          <DocButton
                            url={kyc.document_url}
                            label="ID Document"
                            onClick={() => openDocument(kyc.document_url, "ID Document")}
                          />
                          <DocButton
                            url={kyc.selfie_url}
                            label="Selfie / Liveness"
                            onClick={() => openDocument(kyc.selfie_url, "Selfie / Liveness")}
                          />
                        </div>
                        {kyc.review_notes && (
                          <p className="font-body text-xs text-muted-foreground mt-3 p-3 bg-card rounded-lg border border-border">
                            📝 Review note: {kyc.review_notes}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-screen document viewer */}
      <AnimatePresence>
        {viewer && <DocumentViewer url={viewer.url} label={viewer.label} onClose={() => setViewer(null)} />}
      </AnimatePresence>

      {/* Review dialog */}
      <AnimatePresence>
        {reviewDialog.open && reviewDialog.kyc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setReviewDialog({ open: false, kyc: null, action: null })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
            >
              <div className="bg-card border border-border rounded-xl p-6 shadow-2xl">
                <h2 className="font-heading font-bold text-lg text-foreground mb-1">
                  {reviewDialog.action === "approve" ? "✅ Approve KYC" : "❌ Reject KYC"}
                </h2>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  {reviewDialog.action === "approve"
                    ? "The user will be notified their KYC is approved and gain full access."
                    : "Provide a reason so the user understands what to fix and re-submit."}
                </p>
                <Label className="font-body text-sm text-muted-foreground">
                  {reviewDialog.action === "approve" ? "Optional note for user" : "Rejection reason (shown to user)"}
                </Label>
                <Textarea
                  className="mt-1.5 font-body text-sm"
                  rows={3}
                  placeholder={
                    reviewDialog.action === "approve"
                      ? "e.g. All documents verified successfully."
                      : "e.g. Photo is blurry — please re-upload a clear image."
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setReviewDialog({ open: false, kyc: null, action: null })}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={reviewDialog.action === "approve" ? "hero" : "destructive"}
                    className="flex-1"
                    onClick={submitReview}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : reviewDialog.action === "approve" ? "Approve" : "Reject"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminKYC;
